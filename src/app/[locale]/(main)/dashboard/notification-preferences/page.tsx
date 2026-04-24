"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";
import { PageTransition } from "@/components/ui/page-transition";
import { toast } from "sonner";
import { Bell, Mail, Smartphone } from "lucide-react";

interface NotificationPrefs {
  email: boolean;
  push: boolean;
  inApp: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export default function NotificationPreferencesPage() {
  const t = useTranslations("notificationPrefs");
  const bt = useTranslations("buyerConsole");
  const { accessToken } = useAuth();

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    const loadPrefs = async () => {
      setLoading(true);

      try {
        const res = await fetch("/api/notifications/preferences", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load");
        }

        const data = await res.json();
        if (!active) return;
        setPrefs(data.preferences);
      } catch {
        if (!active) return;
        toast.error(t("loadFetchError"));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadPrefs();

    return () => {
      active = false;
    };
  }, [accessToken, t]);

  const updatePref = async (patch: Partial<NotificationPrefs>) => {
    if (!prefs) return;

    const previous = prefs;
    const updated = { ...prefs, ...patch };

    setPrefs(updated);
    setSaving(true);

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      toast.success(t("saved"));
    } catch {
      setPrefs(previous);
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const enabledChannels = useMemo(
    () => (prefs ? [prefs.inApp, prefs.email, prefs.push].filter(Boolean).length : 0),
    [prefs]
  );
  const quietHoursEnabled = Boolean(prefs?.quietHoursStart || prefs?.quietHoursEnd);

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
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-56 rounded skeleton-shimmer" />
          ))}
        </div>
      </PageTransition>
    );
  }

  if (!prefs) {
    return <div className="py-12 text-center text-sage-500">{t("loadError")}</div>;
  }

  return (
    <PageTransition className="buyer-console space-y-8">
      <PageHeader
        eyebrow={bt("notificationPrefs.eyebrow")}
        title={t("title")}
        description={t("subtitle")}
        action={
          <Link
            href="/dashboard/notifications"
            className="inline-flex h-10 items-center border border-[#ddd4c4] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950"
          >
            {bt("notificationPrefs.openInbox")}
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <MetricCard
          label={bt("notificationPrefs.enabledChannels")}
          value={enabledChannels}
          tone="olive"
        />
        <MetricCard
          label={bt("notificationPrefs.quietHoursStatus")}
          value={quietHoursEnabled ? bt("notificationPrefs.quietOn") : bt("notificationPrefs.quietOff")}
          tone="amber"
        />
        <MetricCard
          label={bt("notificationPrefs.inAppStatus")}
          value={prefs.inApp ? bt("notificationPrefs.live") : bt("notificationPrefs.muted")}
          tone="teal"
        />
        <MetricCard
          label={bt("notificationPrefs.saveState")}
          value={saving ? bt("notificationPrefs.saving") : bt("notificationPrefs.synced")}
          tone="slate"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {[
          {
            key: "inApp" as const,
            label: t("inAppLabel"),
            description: t("inAppDesc"),
            icon: <Bell className="h-5 w-5 text-[#405742]" />,
          },
          {
            key: "email" as const,
            label: t("emailLabel"),
            description: t("emailDesc"),
            icon: <Mail className="h-5 w-5 text-[#405742]" />,
          },
          {
            key: "push" as const,
            label: t("pushLabel"),
            description: t("pushDesc"),
            icon: <Smartphone className="h-5 w-5 text-[#405742]" />,
          },
        ].map((channel) => (
          <Surface key={channel.key} className="p-5">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="space-y-4">
                <span className="grid h-11 w-11 place-items-center border border-[#ddd4c4] bg-[#f8f4ec]">
                  {channel.icon}
                </span>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em] text-stone-950">{channel.label}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{channel.description}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[channel.key]}
                disabled={saving}
                onClick={() => void updatePref({ [channel.key]: !prefs[channel.key] })}
                className={`inline-flex h-11 items-center justify-between border px-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                  prefs[channel.key]
                    ? "border-[#405742] bg-[#405742] text-white"
                    : "border-[#ddd4c4] bg-white text-stone-600"
                } ${saving ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-[#f8f4ec] hover:text-stone-950"}`}
              >
                <span>{prefs[channel.key] ? bt("notificationPrefs.enabled") : bt("notificationPrefs.disabled")}</span>
                <span className={`h-3 w-3 rounded-full ${prefs[channel.key] ? "bg-white" : "bg-stone-300"}`} />
              </button>
            </div>
          </Surface>
        ))}
      </div>

      <Surface className="p-5">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-stone-950">Quiet hours</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="quiet-start" className="text-sm font-medium text-stone-700">
                {t("from")}
              </label>
              <input
                id="quiet-start"
                type="time"
                value={prefs.quietHoursStart ?? ""}
                onChange={(event) => void updatePref({ quietHoursStart: event.target.value || null })}
                className="px-3 py-2 text-sm text-stone-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="quiet-end" className="text-sm font-medium text-stone-700">
                {t("to")}
              </label>
              <input
                id="quiet-end"
                type="time"
                value={prefs.quietHoursEnd ?? ""}
                onChange={(event) => void updatePref({ quietHoursEnd: event.target.value || null })}
                className="px-3 py-2 text-sm text-stone-900"
              />
            </div>
            {quietHoursEnabled ? (
              <button
                type="button"
                onClick={() => void updatePref({ quietHoursStart: null, quietHoursEnd: null })}
                className="inline-flex h-10 items-center border border-[#ddd4c4] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950"
              >
                {t("clear")}
              </button>
            ) : null}
          </div>
          <p className="text-xs text-stone-500">{bt("notificationPrefs.securityNote")}</p>
        </div>
      </Surface>
    </PageTransition>
  );
}