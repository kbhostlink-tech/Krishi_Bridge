import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getPublishedBlogComments,
  getPublishedPostEngagementMeta,
} from "@/lib/blog-engagement";
import { z } from "zod";

const commentSchema = z.object({
  body: z.string().min(1).max(2000).trim(),
});

// GET /api/blogs/[slug]/comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const comments = await getPublishedBlogComments(slug);

  if (!comments) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  return NextResponse.json({ comments });
}

// POST /api/blogs/[slug]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { slug } = await params;
  const meta = await getPublishedPostEngagementMeta(slug, authResult.userId);

  if (!meta) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid comment" },
      { status: 400 }
    );
  }

  const comment = await prisma.blogComment.create({
    data: {
      blogPostId: meta.postId,
      userId: authResult.userId,
      body: parsed.data.body,
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json(
    {
      comment,
      engagement: {
        likesCount: meta.engagement.likesCount,
        commentsCount: meta.engagement.commentsCount + 1,
        sharesCount: meta.engagement.sharesCount,
        likedByMe: meta.engagement.likedByMe,
      },
    },
    { status: 201 }
  );
}
