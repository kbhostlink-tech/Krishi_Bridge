"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";
import { PageTransition } from "@/components/ui/page-transition";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, ClipboardList, Coins, DollarSign, Gavel, Hand, Package, RefreshCw, Timer, Trophy } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

type FilterTab = "all" | "unread";

function timeAgo(dateStr: string) {
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
  const className = "h-4 w-4";

  if (lower.includes("bid") || lower.includes("outbid")) return <Gavel className={`${className} text-blue-500`} />;
  if (lower.includes("auction") || lower.includes("won")) return <Trophy className={`${className} text-amber-500`} />;
  if (lower.includes("payment") || lower.includes("paid")) return <DollarSign className={`${className} text-green-500`} />;
  if (lower.includes("rfq") || lower.includes("quote") || lower.includes("response")) return <ClipboardList className={`${className} text-indigo-500`} />;
  if (lower.includes("token") || lower.includes("minted")) return <Coins className={`${className} text-amber-600`} />;
  if (lower.includes("kyc") || lower.includes("verified")) return <CheckCircle2 className={`${className} text-emerald-500`} />;
  if (lower.includes("welcome")) return <Hand className={`${className} text-purple-500`} />;
  if (lower.includes("expired") || lower.includes("expir")) return <Timer className={`${className} text-orange-500`} />;
  if (lower.includes("material") || lower.includes("warehouse")) return <Package className={`${className} text-stone-500`} />;
  if (lower.includes("transfer")) return <RefreshCw className={`${className} text-blue-500`} />;
  return <Bell className={`${className} text-stone-400`} />;
}

function getNotificationLink(data: Record<string, unknown> | null) {
  if (!data) return "/dashboard";
  if (data.lotId) return `/marketplace/${data.lotId}`;
  if (data.rfqId) return `/rfq/${data.rfqId}`;
  if (data.tokenId) return "/dashboard/my-tokens";
  if (data.transactionId) return "/dashboard";
  return "/dashboard";
}

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const bt = useTranslations("buyerConsole");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!accessToken) return;

    let active = true;

    const loadNotifications = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (filter === "unread") params.set("unread", "true");

        const res = await fetch(`/api/notifications?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data = await res.json();
        if (!active) return;

        setNotifications(data.notifications ?? []);
        setTotal(data.total ?? 0);
        setUnreadCount(data.unreadCount ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } catch {
        if (!active) return;
        toast.error(t("fetchError"));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [accessToken, authLoading, filter, page, router, t, user]);

  const markAsRead = async (id: string) => {
    if (!accessToken) return;

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setNotifications((previous) => previous.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
      setUnreadCount((previous) => Math.max(0, previous - 1));
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

      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      toast.success(t("allMarkedRead"));
    } catch {
      toast.error(t("markReadError"));
    }
  };

  if (loading) {
    return (
      <PageTransition className="buyer-console space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-36 rounded skeleton-shimmer" />
          <div className="h-10 w-72 rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 rounded skeleton-shimmer" />
          ))}
        </div>
        <div className="h-96 rounded skeleton-shimmer" />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="buyer-console space-y-8">
      <PageHeader
        eyebrow={bt("notifications.eyebrow")}
        title={bt("notifications.title")}
        description={bt("notifications.description")}
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex h-10 items-center border border-[#ddd4c4] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950"
            >
              {bt("notifications.markAllRead")}
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <MetricCard
          label={bt("notifications.total")}
          value={total}
          meta={bt("notifications.totalMeta")}
          tone="olive"
        />
        <MetricCard
          label={bt("notifications.unread")}
          value={unreadCount}
          meta={bt("notifications.unreadMeta")}
          tone="rose"
        />
        <MetricCard
          label={bt("notifications.onPage")}
          value={notifications.length}
          meta={bt("notifications.onPageMeta")}
          tone="slate"
        />
        <MetricCard
          label={bt("notifications.viewMode")}
          value={filter === "unread" ? bt("notifications.viewUnread") : bt("notifications.viewAll")}
          meta={bt("notifications.viewModeMeta")}
          tone="amber"
        />
      </div>

      <Surface className="p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {([
            { key: "all", label: `${bt("notifications.viewAll")} (${total})` },
            { key: "unread", label: `${bt("notifications.viewUnread")} (${unreadCount})` },
          ] as { key: FilterTab; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setFilter(tab.key);
                setPage(1);
              }}
              className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                filter === tab.key
                  ? "border border-[#405742] bg-[#405742] text-white"
                  : "border border-[#ddd4c4] bg-white text-stone-600 hover:bg-[#f8f4ec] hover:text-stone-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Surface>

      {notifications.length === 0 ? (
        <EmptyState
          variant="notifications"
          title={t("empty")}
          description={t("emptySubtitle")}
        />
      ) : (
        <Surface className="overflow-hidden">
          <div className="divide-y divide-[#ece4d6]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex cursor-pointer gap-4 px-5 py-4 transition-colors hover:bg-[#fcfaf4] ${
                  notification.isRead ? "bg-white" : "bg-[#fff8ee]"
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    void markAsRead(notification.id);
                  }
                  router.push(getNotificationLink(notification.data));
                }}
              >
                <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center border border-[#ddd4c4] bg-[#f8f4ec]">
                  {getNotificationIcon(notification.title)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm ${notification.isRead ? "text-stone-700" : "font-semibold text-stone-950"}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead ? (
                          <Badge className="console-chip border-0 text-[10px] uppercase tracking-[0.14em]">{bt("notifications.unreadBadge")}</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-stone-600">{notification.body}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-500">{timeAgo(notification.createdAt)}</span>
                      {!notification.isRead ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void markAsRead(notification.id);
                          }}
                          className="grid h-8 w-8 place-items-center border border-[#ddd4c4] bg-white text-[#a85d56] transition-colors hover:bg-[#f8f4ec]"
                          title={t("markRead")}
                        >
                          <span className="block h-2.5 w-2.5 rounded-full bg-[#a85d56]" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            disabled={page <= 1}
            className="inline-flex h-10 items-center border border-[#ddd4c4] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("previous")}
          </button>
          <span className="px-3 text-sm text-stone-600">{t("pageOf", { page, total: totalPages })}</span>
          <button
            type="button"
            onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={page >= totalPages}
            className="inline-flex h-10 items-center border border-[#ddd4c4] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("next")}
          </button>
        </div>
      ) : null}
    </PageTransition>
  );
}