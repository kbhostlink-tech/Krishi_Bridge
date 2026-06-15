import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getPublishedPostEngagementMeta } from "@/lib/blog-engagement";

// GET /api/blogs/[slug]/engagement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getAuthUser(request);
  const meta = await getPublishedPostEngagementMeta(slug, user?.userId);

  if (!meta) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  return NextResponse.json({
    blogPostId: meta.postId,
    ...meta.engagement,
  });
}
