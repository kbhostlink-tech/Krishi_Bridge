import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugifyTitle, enrichBlogPostSync } from "@/lib/blog";
import { normalizeBlogContent } from "@/lib/blog-content";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

const updateBlogSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  slug: z.string().min(1).max(150).trim().optional(),
  excerpt: z.string().max(500).optional().nullable(),
  coverImage: z.string().optional().nullable(),
  content: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

async function ensureUniqueSlug(baseSlug: string, excludeId: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.blogPost.findFirst({
      where: { slug, NOT: { id: excludeId } },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

// GET /api/admin/blogs/[blogId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;
  const adminCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (adminCheck) return adminCheck;

  const { blogId } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id: blogId },
    include: { author: { select: { id: true, name: true } } },
  });

  if (!post) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  return NextResponse.json({ post: enrichBlogPostSync(post) });
}

// PATCH /api/admin/blogs/[blogId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;
  const adminCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (adminCheck) return adminCheck;

  const { blogId } = await params;
  const existing = await prisma.blogPost.findUnique({ where: { id: blogId } });
  if (!existing) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateBlogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const data: Prisma.BlogPostUpdateInput = {};

  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.excerpt !== undefined) data.excerpt = parsed.data.excerpt?.trim() || null;
  if (parsed.data.coverImage !== undefined) data.coverImage = parsed.data.coverImage;
  if (parsed.data.content !== undefined) {
    data.content = normalizeBlogContent(parsed.data.content) as Prisma.InputJsonValue;
  }

  if (parsed.data.slug !== undefined) {
    data.slug = await ensureUniqueSlug(slugifyTitle(parsed.data.slug), blogId);
  }

  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status;
    if (parsed.data.status === "PUBLISHED" && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
    if (parsed.data.status === "DRAFT") {
      data.publishedAt = null;
    }
  }

  const post = await prisma.blogPost.update({
    where: { id: blogId },
    data,
    include: { author: { select: { id: true, name: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "UPDATE_BLOG_POST",
      entity: "BlogPost",
      entityId: post.id,
      metadata: { title: post.title, slug: post.slug, status: post.status },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
    },
  });

  return NextResponse.json({ post: enrichBlogPostSync(post) });
}

// DELETE /api/admin/blogs/[blogId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;
  const adminCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (adminCheck) return adminCheck;

  const { blogId } = await params;
  const existing = await prisma.blogPost.findUnique({ where: { id: blogId } });
  if (!existing) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  await prisma.blogPost.delete({ where: { id: blogId } });

  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "DELETE_BLOG_POST",
      entity: "BlogPost",
      entityId: blogId,
      metadata: { title: existing.title, slug: existing.slug },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
    },
  });

  return NextResponse.json({ success: true });
}
