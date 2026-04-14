"use client";

import { type ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/i18n/navigation";
import { usePushNotifications } from "@/lib/use-push";
import { toast } from "sonner";
import { Gavel, Trophy, DollarSign, ClipboardList, Coins, CheckCircle2, Hand, Timer, Package, RefreshCw, Bell as BellIcon } from "lucide-react";

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
  return <BellIcon className={`${cls} text-sage-400`} />;
}

function getNotificationLink(data: Record<string, unknown> | null): string {
  if (!data) return "/dashboard";
  if (data.lotId) return `/marketplace/${data.lotId}`;
  if (data.rfqId) return `/rfq/${data.rfqId}`;
  if (data.tokenId) return `/dashboard/my-tokens`;
  if (data.transactionId) return `/dashboard`;
  return "/dashboard";
}

export function NotificationBell() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Push notifications — show toast on foreground messages
  const handleForegroundMessage = useCallback(
    (payload: { title: string; body: string }) => {
      toast.info(payload.title, { description: payload.body, duration: 6000 });
      // Refresh count
      fetchUnreadCount();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { permission, requestPermission, isConfigured } = usePushNotifications(handleForegroundMessage);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Silently fail — will retry on next poll
    }
  }, [accessToken]);

  // Fetch recent notifications for dropdown
  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
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
        // silent
      }
    },
    [accessToken]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!accessToken) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  }, [accessToken]);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user || !accessToken) return;
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, accessToken, fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      // Request push permission on first interaction (non-intrusive)
      if (isConfigured && permission === "default") {
        requestPermission();
      }
    }
  }, [isOpen, fetchNotifications, isConfigured, permission, requestPermission]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-sage-50 transition-colors text-sage-600 hover:text-sage-700"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-terracotta rounded-full leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-sage-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sage-100 bg-sage-50/50">
            <h3 className="text-sm font-semibold text-sage-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-sage-600 hover:text-sage-700 font-medium hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-5 h-5 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center flex flex-col items-center">
                <BellIcon className="w-8 h-8 text-sage-300" />
                <p className="text-sm text-sage-500 mt-2">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) markAsRead(notif.id);
                    const link = getNotificationLink(notif.data);
                    setIsOpen(false);
                    router.push(link);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-sage-50 hover:bg-sage-50/50 transition-colors ${
                    !notif.isRead ? "bg-sage-50/30" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notif.title)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-tight ${
                            !notif.isRead ? "font-semibold text-sage-900" : "text-sage-700"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-terracotta" />
                        )}
                      </div>
                      <p className="text-xs text-sage-500 mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-[10px] text-sage-400 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-sage-100">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard/notifications");
              }}
              className="w-full px-4 py-2.5 text-sm font-medium text-sage-600 hover:text-sage-700 hover:bg-sage-50 transition-colors text-center"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
