"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BlogEditorForm } from "@/components/blog/blog-editor-form";
import { toast } from "sonner";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageUrl?: string | null;
  content: Record<string, unknown>;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export default function EditBlogPage() {
  const params = useParams<{ blogId: string }>();
  const { accessToken, isLoading: authLoading } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPost = useCallback(async () => {
    if (!accessToken || !params.blogId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/blogs/${params.blogId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPost(data.post);
    } catch {
      toast.error("Failed to load blog post");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, params.blogId]);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    fetchPost();
  }, [authLoading, accessToken, fetchPost]);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-sage-100" />;
  }

  if (!post) {
    return (
      <div className="rounded-2xl border border-sage-100 bg-white p-8 text-center">
        <p className="text-sage-900">Blog post not found.</p>
      </div>
    );
  }

  return <BlogEditorForm mode="edit" blogId={post.id} initialPost={post} />;
}
