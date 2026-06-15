import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugifyTitle, enrichBlogPostSync } from "@/lib/blog";
import { normalizeBlogContent } from "@/lib/blog-content";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

const createBlogSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(150).trim().optional(),
  excerpt: z.string().max(500).optional().nullable(),
  coverImage: z.string().optional().nullable(),
  content: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.blogPost.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

// GET /api/admin/blogs — list all blog posts
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;
  const adminCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (adminCheck) return adminCheck;

  const status = request.nextUrl.searchParams.get("status");
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || "10")));
  const skip = (page - 1) * limit;

  const where = status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : undefined;

  const [posts, total, totalAll, publishedCount, draftCount] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true } },
      },
    }),
    prisma.blogPost.count({ where }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { status: "DRAFT" } }),
  ]);

  const enriched = posts.map((post) => enrichBlogPostSync(post));

  const stats = {
    total: totalAll,
    published: publishedCount,
    draft: draftCount,
  };

  return NextResponse.json({
    posts: enriched,
    stats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}

// POST /api/admin/blogs — create a new blog post
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;
  const adminCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (adminCheck) return adminCheck;

  const body = await request.json();
  const parsed = createBlogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { title, excerpt, coverImage, content, status } = parsed.data;
  const baseSlug = slugifyTitle(parsed.data.slug || title);
  const slug = await ensureUniqueSlug(baseSlug);
  const nextStatus = status || "DRAFT";

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt: excerpt?.trim() || null,
      coverImage: coverImage || null,
      content: normalizeBlogContent(content || { type: "doc", content: [] }) as Prisma.InputJsonValue,
      status: nextStatus,
      authorId: authResult.userId,
      publishedAt: nextStatus === "PUBLISHED" ? new Date() : null,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "CREATE_BLOG_POST",
      entity: "BlogPost",
      entityId: post.id,
      metadata: { title: post.title, slug: post.slug, status: post.status },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
    },
  });

  return NextResponse.json({ post: enrichBlogPostSync(post) }, { status: 201 });
}
