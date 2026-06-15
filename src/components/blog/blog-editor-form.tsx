"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/blog/rich-text-editor";
import { ArrowLeft, ImagePlus, Loader2, Save, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";

type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageUrl?: string | null;
  content: Record<string, unknown>;
  status: BlogStatus;
};

const EMPTY_CONTENT = { type: "doc", content: [] };

type BlogEditorFormProps = {
  mode: "create" | "edit";
  blogId?: string;
  initialPost?: BlogPost;
};

export function BlogEditorForm({ mode, blogId, initialPost }: BlogEditorFormProps) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [title, setTitle] = useState(initialPost?.title || "");
  const [slug, setSlug] = useState(initialPost?.slug || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [status, setStatus] = useState<BlogStatus>(initialPost?.status || "DRAFT");
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || "");
  const [coverPreview, setCoverPreview] = useState(initialPost?.coverImageUrl || "");
  const [content, setContent] = useState<Record<string, unknown>>(
    (initialPost?.content as Record<string, unknown>) || EMPTY_CONTENT
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  useEffect(() => {
    if (initialPost) {
      setTitle(initialPost.title);
      setSlug(initialPost.slug);
      setExcerpt(initialPost.excerpt || "");
      setStatus(initialPost.status);
      setCoverImage(initialPost.coverImage || "");
      setCoverPreview(initialPost.coverImageUrl || "");
      setContent((initialPost.content as Record<string, unknown>) || EMPTY_CONTENT);
    }
  }, [initialPost]);

  const headers = useCallback(
    () => ({
      Authorization: `Bearer ${accessToken}`,
    }),
    [accessToken]
  );

  const uploadImage = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/blogs/upload-image", {
        method: "POST",
        headers: headers(),
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Image upload failed");
      }
      const data = await res.json();
      return { url: data.url as string, key: data.key as string };
    },
    [headers]
  );

  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/blogs/upload-image", {
        method: "POST",
        headers: headers(),
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Cover upload failed");
      }
      const data = await res.json();
      setCoverImage(data.key);
      setCoverPreview(data.previewUrl || data.url);
      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cover upload failed");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const savePost = async (nextStatus?: BlogStatus) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);
    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim() || null,
      coverImage: coverImage || null,
      content,
      status: nextStatus || status,
    };

    try {
      const url = mode === "create" ? "/api/admin/blogs" : `/api/admin/blogs/${blogId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: {
          ...headers(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save blog post");
      }

      const data = await res.json();
      toast.success(mode === "create" ? "Blog post created" : "Blog post saved");

      if (mode === "create") {
        router.push(`/admin/blogs/${data.post.id}/edit`);
      } else if (nextStatus) {
        setStatus(nextStatus);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save blog post");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/blogs"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blogs
          </Link>
          <h1 className="font-heading text-2xl font-bold text-sage-900">
            {mode === "create" ? "Create blog post" : "Edit blog post"}
          </h1>
          <p className="mt-1 text-sm text-sage-500">
            Write and format your article with headings, images, lists, and more.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => savePost("DRAFT")}
            className="inline-flex items-center gap-2 rounded-full border border-[#ddd4c4] bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-[#f8f4ec] disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save draft
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => savePost("PUBLISHED")}
            className="inline-flex items-center gap-2 rounded-full bg-sage-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-800 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter blog title"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated-from-title"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Content</Label>
                <div className="mt-1.5">
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    onUploadImage={uploadImage}
                    placeholder="Write your blog content here..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as BlogStatus)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for blog cards and SEO"
              className="mt-1.5 min-h-[100px]"
              maxLength={500}
            />
          </div>

          <div className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm">
            <Label>Cover image</Label>
            {coverPreview ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-[#ddd4c4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Cover preview" className="h-40 w-full object-cover" />
              </div>
            ) : (
              <div className="mt-2 flex h-40 items-center justify-center rounded-xl border border-dashed border-[#ddd4c4] bg-[#faf6ee] text-sm text-stone-500">
                No cover image
              </div>
            )}
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#ddd4c4] bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-[#f8f4ec]">
              {isUploadingCover ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Upload cover
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleCoverUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
