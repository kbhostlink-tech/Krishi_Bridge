"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Pagination } from "@/components/ui/pagination";
import { ArrowRight, CalendarDays, FileText, User2 } from "lucide-react";

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

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function PostMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-sage-500">
      <span className="inline-flex items-center gap-1">
        <CalendarDays className="h-3 w-3" />
        {formatDate(post.publishedAt)}
      </span>
      <span className="inline-flex items-center gap-1">
        <User2 className="h-3 w-3" />
        {post.author.name}
      </span>
    </div>
  );
}

function PostCard({ post }: { post: BlogPost }) {
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
        <PostMeta post={post} />
        <h2 className="mt-2 line-clamp-2 font-heading text-[15px] font-semibold leading-snug text-sage-900 transition-colors group-hover:text-[#405742]">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-sage-600">{post.excerpt}</p>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-1 border-t border-[#f0e9dc] pt-3 text-[11px] font-medium text-[#405742]">
          Read article
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function BlogListingClient() {
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
        if (!res.ok) throw new Error("Failed to load blog posts");
        const data = await res.json();
        if (cancelled) return;
        setPosts(data.posts ?? []);
        setPagination(data.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load blog posts");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page]);

  const gridPosts = posts;

  return (
    <div className="min-h-screen bg-linen">
      <section className="border-b border-[#ddd4c4] bg-[linear-gradient(180deg,#fffdf8,#f5efe3)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b6d4d]">Krishibridge Blog</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-[-0.03em] text-sage-900 sm:text-5xl">
            Insights from the field and the market
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-sage-600">
            Trade updates, commodity stories, and platform news from across the Himalayan exchange corridor.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-[#ddd4c4] bg-white">
                <div className="h-36 animate-pulse border-b border-[#ece4d4] bg-[#f0e9dc]" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#f5efe3]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[#f5efe3]" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[#f5efe3]" />
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
              Try again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-[#ddd4c4] bg-white p-12 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-sage-300" />
            <p className="text-lg font-medium text-sage-900">No articles published yet</p>
            <p className="mt-2 text-sm text-sage-500">Check back soon for new content.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
              className="border-t border-[#ddd4c4] pt-2"
            />
          </div>
        )}
      </section>
    </div>
  );
}
