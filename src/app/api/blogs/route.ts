import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichBlogPostSync } from "@/lib/blog";

// GET /api/blogs — public list of published blog posts
export async function GET(request: NextRequest) {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || "12")));
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    }),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
  ]);

  const enriched = posts.map((post) => enrichBlogPostSync(post));

  return NextResponse.json({
    posts: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
