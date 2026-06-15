"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  createdAt: string;
  coverImageUrl?: string | null;
  author: { name: string };
};

type Stats = {
  total: number;
  published: number;
  draft: number;
};

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-stone-200 text-stone-700",
};

export default function AdminBlogsPage() {
  const { accessToken } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, draft: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken]
  );

  const fetchPosts = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/blogs?page=${page}&limit=${PAGE_SIZE}`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data.posts);
      setStats(data.stats);
      setPagination(data.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
    } catch {
      toast.error("Failed to load blog posts");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, headers, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const deletePost = async (post: BlogPost) => {
    const ok = await confirmDialog({
      title: "Delete blog post?",
      description: `This will permanently delete "${post.title}".`,
      confirmLabel: "Delete",
      tone: "warning",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/blogs/${post.id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) {
        toast.error("Failed to delete blog post");
        return;
      }
      toast.success("Blog post deleted");
      if (posts.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchPosts();
      }
    } catch {
      toast.error("Failed to delete blog post");
    }
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-sage-100" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-sage-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-sage-900">Blog Management</h1>
          <p className="mt-1 text-sm text-sage-500">
            Create, edit, and publish articles for the public blog.
          </p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="flex items-center gap-2 rounded-full bg-sage-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-800"
        >
          <Plus className="h-4 w-4" />
          New blog post
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          { label: "Total posts", value: stats.total },
          { label: "Published", value: stats.published },
          { label: "Drafts", value: stats.draft },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-sage-100 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <p className="font-heading text-xl font-bold text-sage-900">{stat.value}</p>
              <p className="text-xs text-sage-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 ? (
        <Card className="rounded-2xl border-sage-100 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-sage-300" />
            <p className="font-medium text-sage-900">No blog posts yet</p>
            <p className="mt-1 text-sm text-sage-500">Create your first article to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="rounded-2xl border-sage-100 shadow-sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-4">
                  {post.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImageUrl}
                      alt=""
                      className="h-16 w-24 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-[#f5efe3]">
                      <FileText className="h-6 w-6 text-sage-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-sage-900">{post.title}</h2>
                      <Badge className={STATUS_STYLES[post.status]}>{post.status}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-sage-500">
                      /blog/{post.slug} · by {post.author.name}
                    </p>
                    {post.excerpt ? (
                      <p className="mt-1 line-clamp-1 text-sm text-stone-600">{post.excerpt}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {post.status === "PUBLISHED" ? (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="rounded-full border border-[#ddd4c4] px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-[#f8f4ec]"
                    >
                      View
                    </Link>
                  ) : null}
                  <Link
                    href={`/admin/blogs/${post.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#405742] bg-[#405742] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2f422e]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => deletePost(post)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
