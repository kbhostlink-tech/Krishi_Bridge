"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { formatBlogRelativeTime, getBlogPageCopy } from "@/lib/blog-page-content";
import { Heart, Link2, MessageCircle, Share2, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Engagement = {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedByMe: boolean;
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
};

type BlogEngagementProps = {
  slug: string;
  title: string;
  initialEngagement: Engagement;
  initialComments?: Comment[];
};

export function BlogEngagement({
  slug,
  title,
  initialEngagement,
  initialComments,
}: BlogEngagementProps) {
  const locale = useLocale();
  const copy = getBlogPageCopy(locale);
  const { user, accessToken } = useAuth();
  const [engagement, setEngagement] = useState(initialEngagement);
  const [comments, setComments] = useState<Comment[]>(initialComments ?? []);
  const [commentBody, setCommentBody] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(!initialComments);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }),
    [accessToken]
  );

  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/blogs/${slug}/comments`);
      if (!res.ok) throw new Error(copy.commentsLoadFailed);
      const data = await res.json();
      setComments(data.comments);
    } catch {
      toast.error(copy.commentsLoadFailed);
    } finally {
      setIsLoadingComments(false);
    }
  }, [slug, copy.commentsLoadFailed]);

  useEffect(() => {
    if (initialComments) return;
    fetchComments();
  }, [fetchComments, initialComments]);

  const toggleLike = async () => {
    if (!user || !accessToken) {
      toast.error(copy.signInToLike);
      return;
    }

    const previous = engagement;
    const optimistic = {
      ...previous,
      likedByMe: !previous.likedByMe,
      likesCount: previous.likedByMe
        ? Math.max(0, previous.likesCount - 1)
        : previous.likesCount + 1,
    };

    setEngagement(optimistic);
    setIsTogglingLike(true);
    try {
      const res = await fetch(`/api/blogs/${slug}/like`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || copy.likeFailed);
      }
      const data = await res.json();
      setEngagement((prev) => ({
        ...prev,
        likesCount: data.likesCount,
        likedByMe: data.likedByMe,
      }));
    } catch (error) {
      setEngagement(previous);
      toast.error(error instanceof Error ? error.message : copy.likeFailed);
    } finally {
      setIsTogglingLike(false);
    }
  };

  const trackShare = async () => {
    try {
      const res = await fetch(`/api/blogs/${slug}/share`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setEngagement((prev) => ({
        ...prev,
        sharesCount: data.sharesCount,
      }));
    } catch {
      // non-blocking
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title,
      text: copy.shareText.replace("{title}", title),
      url: shareUrl,
    };

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        await trackShare();
        toast.success(copy.shareThanks);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        await trackShare();
        toast.success(copy.linkCopiedClipboard);
      } else {
        toast.error(copy.shareNotSupported);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error(copy.shareFailed);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const copyLink = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(shareUrl);
      await trackShare();
      toast.success(copy.linkCopied);
    } catch {
      toast.error(copy.shareFailed);
    }
  };

  const submitComment = async () => {
    if (!user || !accessToken) {
      toast.error(`${copy.signIn} ${copy.signInToComment}`);
      return;
    }
    if (!commentBody.trim()) {
      toast.error(copy.writeCommentFirst);
      return;
    }

    const trimmed = commentBody.trim();
    const previousEngagement = engagement;
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      body: trimmed,
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name || copy.you,
        role: user.role,
      },
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setCommentBody("");
    setEngagement((prev) => ({
      ...prev,
      commentsCount: prev.commentsCount + 1,
    }));
    setIsSubmittingComment(true);

    try {
      const res = await fetch(`/api/blogs/${slug}/comments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || copy.commentFailed);
      }
      const data = await res.json();
      setComments((prev) => [
        data.comment,
        ...prev.filter((comment) => comment.id !== optimisticComment.id),
      ]);
      setEngagement((prev) => ({
        ...prev,
        commentsCount: data.engagement.commentsCount,
      }));
      toast.success(copy.commentPosted);
    } catch (error) {
      setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id));
      setCommentBody(trimmed);
      setEngagement(previousEngagement);
      toast.error(error instanceof Error ? error.message : copy.commentFailed);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const likeLabel = engagement.likesCount === 1 ? copy.like : copy.likes;
  const shareLabel = engagement.sharesCount === 1 ? copy.share : copy.shares;
  const commentLabel = engagement.commentsCount === 1 ? copy.comment : copy.comments;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 border-y border-sage-100 py-4">
        <button
          type="button"
          onClick={toggleLike}
          disabled={isTogglingLike}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            engagement.likedByMe
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-sage-100 bg-white text-stone-700 hover:bg-sage-50"
          )}
        >
          {isTogglingLike ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4", engagement.likedByMe && "fill-current")} />
          )}
          {engagement.likesCount} {likeLabel}
        </button>

        <button
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          className="inline-flex items-center gap-2 rounded-full border border-sage-100 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-sage-50"
        >
          {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          {engagement.sharesCount} {shareLabel}
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-full border border-sage-100 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-sage-50"
        >
          <Link2 className="h-4 w-4" />
          {copy.copyLink}
        </button>

        <div className="inline-flex items-center gap-2 rounded-full border border-sage-100 bg-sage-50 px-4 py-2 text-sm font-medium text-stone-600">
          <MessageCircle className="h-4 w-4" />
          {engagement.commentsCount} {commentLabel}
        </div>
      </div>

      <section className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-heading text-xl font-semibold text-sage-900">{copy.commentsTitle}</h2>

        {user ? (
          <div className="mt-4 space-y-3">
            <Textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder={copy.commentPlaceholder}
              className="min-h-[100px] resize-y"
              maxLength={2000}
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={isSubmittingComment || !commentBody.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-sage-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-800 disabled:opacity-60"
            >
              {isSubmittingComment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {copy.postComment}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-sage-600">
            <Link href="/login" className="font-medium text-sage-800 underline-offset-2 hover:underline">
              {copy.signIn}
            </Link>{" "}
            {copy.signInToComment}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {isLoadingComments ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-sage-50" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-sage-100 bg-sage-50 px-4 py-8 text-center text-sm text-sage-500">
              {copy.noComments}
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-sage-100 bg-linen px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-sage-900">{comment.user.name}</p>
                  <p className="text-xs text-sage-500">
                    {formatBlogRelativeTime(comment.createdAt, copy, locale)}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-sage-700">{comment.body}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
