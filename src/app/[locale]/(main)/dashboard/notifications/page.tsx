"use client";

import { type ReactNode, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SkeletonNotification } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTransition } from "@/components/ui/page-transition";
import { Gavel, Trophy, DollarSign, ClipboardList, Coins, CheckCircle2, Hand, Timer, Package, RefreshCw, Bell } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getNotificationIcon(title: string): ReactNode {
  const lower = title.toLowerCase();
  const cls = "w-4 h-4";
  if (lower.includes("bid") || lower.includes("outbid")) return <Gavel className={`${cls} text-blue-500`} />;
  if (lower.includes("auction") || lower.includes("won")) return <Trophy className={`${cls} text-amber-500`} />;
  if (lower.includes("payment") || lower.includes("paid")) return <DollarSign className={`${cls} text-green-500`} />;
  if (lower.includes("rfq") || lower.includes("quote") || lower.includes("response")) return <ClipboardList className={`${cls} text-indigo-500`} />;
  if (lower.includes("token") || lower.includes("minted")) return <Coins className={`${cls} text-amber-600`} />;
  if (lower.includes("kyc") || lower.includes("verified")) return <CheckCircle2 className={`${cls} text-emerald-500`} />;
  if (lower.includes("welcome")) return <Hand className={`${cls} text-purple-500`} />;
  if (lower.includes("expired") || lower.includes("expir")) return <Timer className={`${cls} text-orange-500`} />;
  if (lower.includes("material") || lower.includes("warehouse")) return <Package className={`${cls} text-stone-500`} />;
  if (lower.includes("transfer")) return <RefreshCw className={`${cls} text-blue-500`} />;
  return <Bell className={`${cls} text-sage-400`} />;
}

function getNotificationLink(data: Record<string, unknown> | null): string {
  if (!data) return "/dashboard";
  if (data.lotId) return `/marketplace/${data.lotId}`;
  if (data.rfqId) return `/rfq/${data.rfqId}`;
  if (data.tokenId) return `/dashboard/my-tokens`;
  if (data.transactionId) return `/dashboard`;
  return "/dashboard";
}

type FilterTab = "all" | "unread";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FilterTab>("all");

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filter === "unread") params.set("unread", "true");

      const res = await fetch(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data = await res.json();
      setNotifications(data.notifications);
      setTotal(data.total);
      setUnreadCount(data.unreadCount);
      setTotalPages(data.totalPages);
    } catch {
      toast.error(t("fetchError"));
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, filter, t]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (accessToken) {
      fetchNotifications();
    }
  }, [accessToken, authLoading, user, router, fetchNotifications]);

  const markAsRead = async (id: string) => {
    if (!accessToken) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error(t("markReadError"));
    }
  };

  const markAllAsRead = async () => {
    if (!accessToken) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success(t("allMarkedRead"));
    } catch {
      toast.error(t("markReadError"));
    }
  };

  const handleFilterChange = (newFilter: FilterTab) => {
    setFilter(newFilter);
    setPage(1);
  };

  return (
    <PageTransition className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-sage-900">
            {t("title")}
          </h1>
          <p className="text-sm text-sage-500 mt-1">
            {t("subtitle", { count: total, unread: unreadCount })}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-sage-600 bg-sage-50 hover:bg-sage-100 rounded-full transition-colors"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-sage-50 rounded-xl mb-6 w-fit">
        {(["all", "unread"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleFilterChange(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? "bg-white text-sage-900 shadow-sm"
                : "text-sage-500 hover:text-sage-700"
            }`}
          >
            {tab === "all" ? t("filterAll") : t("filterUnread")}
            {tab === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-terracotta rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-sage-100 overflow-hidden shadow-sm">
        {loading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonNotification key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            variant="notifications"
            title={t("empty")}
            description={t("emptySubtitle")}
          />
        ) : (
          <>
            {notifications.map((notif, index) => (
              <div
                key={notif.id}
                className={`flex gap-4 px-5 py-4 cursor-pointer hover:bg-sage-50/50 transition-colors ${
                  !notif.isRead ? "bg-sage-50/30" : ""
                } ${index < notifications.length - 1 ? "border-b border-sage-50" : ""}`}
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif.id);
                  router.push(getNotificationLink(notif.data));
                }}
              >
                <span className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notif.title)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-tight ${
                          !notif.isRead
                            ? "font-semibold text-sage-900"
                            : "text-sage-700"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-sm text-sage-500 mt-1 line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-xs text-sage-400 mt-1.5">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="p-1 rounded-full hover:bg-sage-100 transition-colors"
                          title={t("markRead")}
                        >
                          <span className="w-2.5 h-2.5 block rounded-full bg-terracotta" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium text-sage-600 bg-white border border-sage-200 rounded-full hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t("previous")}
          </button>
          <span className="text-sm text-sage-500">
            {t("pageOf", { page, total: totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-medium text-sage-600 bg-white border border-sage-200 rounded-full hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t("next")}
          </button>
        </div>
      )}
    </PageTransition>
  );
}
