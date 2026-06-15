import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublishedPostEngagementMeta } from "@/lib/blog-engagement";

// POST /api/blogs/[slug]/like — toggle like (auth required)
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

  const { engagement, existingLikeId, postId } = meta;

  if (existingLikeId) {
    await prisma.blogLike.delete({ where: { id: existingLikeId } });
    return NextResponse.json({
      likesCount: Math.max(0, engagement.likesCount - 1),
      commentsCount: engagement.commentsCount,
      sharesCount: engagement.sharesCount,
      likedByMe: false,
    });
  }

  await prisma.blogLike.create({
    data: {
      blogPostId: postId,
      userId: authResult.userId,
    },
  });

  return NextResponse.json({
    likesCount: engagement.likesCount + 1,
    commentsCount: engagement.commentsCount,
    sharesCount: engagement.sharesCount,
    likedByMe: true,
  });
}
