import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { enrichBlogPostSync } from "@/lib/blog";
import { getPublishedBlogBySlug, getBlogEngagement, getBlogCommentsByPostId } from "@/lib/blog-engagement";
import { BlogContent } from "@/components/blog/blog-content";
import { BlogEngagement } from "@/components/blog/blog-engagement";
import { ArrowLeft, CalendarDays, User2 } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

function formatDate(value: Date | string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogBySlug(slug);

  if (!post) {
    return { title: "Blog | Krishibridge" };
  }

  return {
    title: `${post.title} | Krishibridge Blog`,
    description: post.excerpt || post.title,
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await getPublishedBlogBySlug(slug);
  if (!post) notFound();

  const enriched = enrichBlogPostSync(post);
  const [engagement, comments] = await Promise.all([
    getBlogEngagement(post.id),
    getBlogCommentsByPostId(post.id),
  ]);

  return (
    <article className="min-h-screen bg-linen">
      {/* Unified hero — cover image + title in one block */}
      <header className="relative overflow-hidden">
        {enriched.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enriched.coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sage-950/95 via-sage-900/70 to-sage-900/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#2d4630_0%,#1a2a1c_100%)]" />
        )}

        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-sage-200">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="text-white/40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <User2 className="h-4 w-4" />
              {post.author.name}
            </span>
          </div>

          <h1 className="mt-5 font-heading text-3xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-sage-200 sm:text-lg">
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </header>

      {/* Content flows directly from hero — single reading column */}
      <div className="relative z-10 mx-auto -mt-8 max-w-3xl px-4 pb-16 sm:-mt-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#ddd4c4] bg-white px-5 py-8 shadow-lg sm:px-10 sm:py-12">
          <BlogContent content={post.content as Record<string, unknown>} />

          {engagement ? (
            <div className="mt-10 border-t border-[#ece4d4] pt-8">
              <BlogEngagement
                slug={slug}
                title={post.title}
                initialEngagement={engagement}
                initialComments={comments.map((comment) => ({
                  id: comment.id,
                  body: comment.body,
                  createdAt: comment.createdAt.toISOString(),
                  user: comment.user,
                }))}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
