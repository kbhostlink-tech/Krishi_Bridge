import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichBlogPost } from "@/lib/blog";

// GET /api/blogs/[slug] — public blog post detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { name: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  return NextResponse.json({ post: await enrichBlogPost(post) });
}
