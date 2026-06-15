"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
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

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function BlogEngagement({
  slug,
  title,
  initialEngagement,
  initialComments,
}: BlogEngagementProps) {
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
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      setComments(data.comments);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setIsLoadingComments(false);
    }
  }, [slug]);

  useEffect(() => {
    if (initialComments) return;
    fetchComments();
  }, [fetchComments, initialComments]);

  const toggleLike = async () => {
    if (!user || !accessToken) {
      toast.error("Sign in to like this article");
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
        throw new Error(data.error || "Failed to update like");
      }
      const data = await res.json();
      setEngagement((prev) => ({
        ...prev,
        likesCount: data.likesCount,
        likedByMe: data.likedByMe,
      }));
    } catch (error) {
      setEngagement(previous);
      toast.error(error instanceof Error ? error.message : "Failed to update like");
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
      text: `Read "${title}" on Krishibridge`,
      url: shareUrl,
    };

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        await trackShare();
        toast.success("Thanks for sharing!");
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        await trackShare();
        toast.success("Link copied to clipboard");
      } else {
        toast.error("Sharing is not supported on this device");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Could not share this article");
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
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const submitComment = async () => {
    if (!user || !accessToken) {
      toast.error("Sign in to comment");
      return;
    }
    if (!commentBody.trim()) {
      toast.error("Write a comment first");
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
        name: user.name || "You",
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
        throw new Error(data.error || "Failed to post comment");
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
      toast.success("Comment posted");
    } catch (error) {
      setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id));
      setCommentBody(trimmed);
      setEngagement(previousEngagement);
      toast.error(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 border-y border-[#ddd4c4] py-4">
        <button
          type="button"
          onClick={toggleLike}
          disabled={isTogglingLike}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            engagement.likedByMe
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-[#ddd4c4] bg-white text-stone-700 hover:bg-[#f8f4ec]"
          )}
        >
          {isTogglingLike ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4", engagement.likedByMe && "fill-current")} />
          )}
          {engagement.likesCount} {engagement.likesCount === 1 ? "Like" : "Likes"}
        </button>

        <button
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          className="inline-flex items-center gap-2 rounded-full border border-[#ddd4c4] bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-[#f8f4ec]"
        >
          {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          {engagement.sharesCount} {engagement.sharesCount === 1 ? "Share" : "Shares"}
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-full border border-[#ddd4c4] bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-[#f8f4ec]"
        >
          <Link2 className="h-4 w-4" />
          Copy link
        </button>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd4c4] bg-[#faf6ee] px-4 py-2 text-sm font-medium text-stone-600">
          <MessageCircle className="h-4 w-4" />
          {engagement.commentsCount} {engagement.commentsCount === 1 ? "Comment" : "Comments"}
        </div>
      </div>

      <section className="rounded-2xl border border-[#ddd4c4] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-heading text-xl font-semibold text-sage-900">Comments</h2>

        {user ? (
          <div className="mt-4 space-y-3">
            <Textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[100px] resize-y"
              maxLength={2000}
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={isSubmittingComment || !commentBody.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-[#405742] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2f422e] disabled:opacity-60"
            >
              {isSubmittingComment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post comment
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-sage-600">
            <Link href="/login" className="font-medium text-[#405742] underline-offset-2 hover:underline">
              Sign in
            </Link>{" "}
            to leave a comment.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {isLoadingComments ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-[#f5efe3]" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#ddd4c4] bg-[#faf6ee] px-4 py-8 text-center text-sm text-sage-500">
              No comments yet. Be the first to share your thoughts.
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-[#ece4d4] bg-[#fffdf8] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-sage-900">{comment.user.name}</p>
                  <p className="text-xs text-sage-500">{formatRelativeTime(comment.createdAt)}</p>
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
