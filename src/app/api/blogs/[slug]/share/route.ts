import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/blogs/[slug]/share — track a share
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, sharesCount: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  await prisma.blogPost.update({
    where: { id: post.id },
    data: { sharesCount: { increment: 1 } },
  });

  return NextResponse.json({ sharesCount: post.sharesCount + 1 });
}
