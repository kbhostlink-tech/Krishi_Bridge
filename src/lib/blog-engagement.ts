import { prisma } from "@/lib/prisma";

export type BlogEngagementStats = {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedByMe: boolean;
};

export async function getPublishedBlogBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { name: true } },
    },
  });
}

/** Single-query engagement snapshot by post id. */
export async function getBlogEngagement(
  blogPostId: string,
  userId?: string | null
): Promise<BlogEngagementStats | null> {
  const post = await prisma.blogPost.findUnique({
    where: { id: blogPostId },
    select: {
      sharesCount: true,
      _count: { select: { likes: true, comments: true } },
      ...(userId
        ? {
            likes: {
              where: { userId },
              select: { id: true },
              take: 1,
            },
          }
        : {}),
    },
  });

  if (!post) return null;

  const likedByMe =
    userId && "likes" in post ? (post.likes as { id: string }[]).length > 0 : false;

  return {
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    sharesCount: post.sharesCount,
    likedByMe,
  };
}

type PublishedPostEngagementMeta = {
  postId: string;
  engagement: BlogEngagementStats;
  existingLikeId: string | null;
};

/** Resolve slug + engagement + current user's like in one query. */
export async function getPublishedPostEngagementMeta(
  slug: string,
  userId?: string | null
): Promise<PublishedPostEngagementMeta | null> {
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      sharesCount: true,
      _count: { select: { likes: true, comments: true } },
      ...(userId
        ? {
            likes: {
              where: { userId },
              select: { id: true },
              take: 1,
            },
          }
        : {}),
    },
  });

  if (!post) return null;

  const userLike =
    userId && "likes" in post ? (post.likes as { id: string }[])[0] : undefined;

  return {
    postId: post.id,
    existingLikeId: userLike?.id ?? null,
    engagement: {
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post.sharesCount,
      likedByMe: Boolean(userLike),
    },
  };
}

export async function getPublishedBlogComments(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  if (!post) return null;
  return post.comments;
}

export async function getBlogCommentsByPostId(blogPostId: string) {
  return prisma.blogComment.findMany({
    where: { blogPostId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });
}
