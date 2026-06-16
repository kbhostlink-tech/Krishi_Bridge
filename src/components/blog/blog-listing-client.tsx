"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Pagination } from "@/components/ui/pagination";
import { ArrowRight, CalendarDays, FileText, User2 } from "lucide-react";
import { formatBlogDate, getBlogPageCopy } from "@/lib/blog-page-content";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  author: { name: string };
};

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 9;

function PostMeta({
  post,
  locale,
}: {
  post: BlogPost;
  locale: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-sage-500">
      <span className="inline-flex items-center gap-1">
        <CalendarDays className="h-3 w-3" />
        {formatBlogDate(post.publishedAt, locale)}
      </span>
      <span className="inline-flex items-center gap-1">
        <User2 className="h-3 w-3" />
        {post.author.name}
      </span>
    </div>
  );
}

function PostCard({
  post,
  locale,
  readArticleLabel,
}: {
  post: BlogPost;
  locale: string;
  readArticleLabel: string;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#ddd4c4] bg-white shadow-sm transition-all hover:border-[#c9b98f]/60 hover:shadow-md"
    >
      <div className="relative h-36 overflow-hidden border-b border-[#ece4d4] bg-[#faf6ee]">
        {post.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#f0e9dc]">
            <FileText className="h-8 w-8 text-sage-300" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <PostMeta post={post} locale={locale} />
        <h2 className="mt-2 line-clamp-2 font-heading text-[15px] font-semibold leading-snug text-sage-900 transition-colors group-hover:text-[#405742]">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-sage-600">{post.excerpt}</p>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-1 border-t border-[#f0e9dc] pt-3 text-[11px] font-medium text-[#405742]">
          {readArticleLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function BlogListingClient() {
  const locale = useLocale();
  const copy = getBlogPageCopy(locale);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/blogs?page=${page}&limit=${PAGE_SIZE}`, { cache: "no-store" });
        if (!res.ok) throw new Error(copy.loadError);
        const data = await res.json();
        if (cancelled) return;
        setPosts(data.posts ?? []);
        setPagination(data.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : copy.loadError);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, copy.loadError]);

  return (
    <div className="min-h-screen bg-linen">
      <section className="bg-sand py-12 sm:py-16 lg:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-terracotta">{copy.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-heading text-3xl font-semibold leading-tight text-sage-950 sm:text-4xl lg:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-sage-700 sm:text-lg">{copy.summary}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-sage-100 bg-white shadow-sm">
                <div className="h-36 animate-pulse border-b border-sage-100 bg-sage-50" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-24 animate-pulse rounded bg-sage-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-sage-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-sage-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-medium text-red-800">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              {copy.tryAgain}
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-sage-100 bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto mb-4 h-10 w-10 text-sage-300" />
            <p className="text-lg font-medium text-sage-900">{copy.noArticles}</p>
            <p className="mt-2 text-sm text-sage-500">{copy.noArticlesHint}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  locale={locale}
                  readArticleLabel={copy.readArticle}
                />
              ))}
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
              className="border-t border-sage-100 pt-2"
            />
          </div>
        )}
      </section>
    </div>
  );
}
