"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
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
  const { accessToken } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/preferences", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPrefs(data.preferences);
    } catch {
      toast.error(t("loadFetchError"));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    if (accessToken) fetchPrefs();
  }, [accessToken, fetchPrefs]);

  const updatePref = async (patch: Partial<NotificationPrefs>) => {
    if (!prefs) return;
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
      if (!res.ok) throw new Error("Failed to save");
      toast.success(t("saved"));
    } catch {
      setPrefs({ ...prefs }); // revert
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-72 bg-sage-100 rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white/60 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="text-center py-12 text-sage-500">
        {t("loadError")}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-sage-900">
          {t("title")}
        </h1>
        <p className="text-sage-500 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Channel Toggles */}
      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-sage-800">
          {t("channels")}
        </h2>
        {[
          {
            key: "inApp" as const,
            label: t("inAppLabel"),
            description: t("inAppDesc"),
            icon: <Bell className="w-6 h-6 text-sage-600" />,
          },
          {
            key: "email" as const,
            label: t("emailLabel"),
            description: t("emailDesc"),
            icon: <Mail className="w-6 h-6 text-sage-600" />,
          },
          {
            key: "push" as const,
            label: t("pushLabel"),
            description: t("pushDesc"),
            icon: <Smartphone className="w-6 h-6 text-sage-600" />,
          },
        ].map((channel) => (
          <Card key={channel.key} className="bg-white border-sage-100 rounded-3xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {channel.icon}
                  <div>
                    <p className="text-sm font-semibold text-sage-900">{channel.label}</p>
                    <p className="text-xs text-sage-500">{channel.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[channel.key]}
                  disabled={saving}
                  onClick={() => updatePref({ [channel.key]: !prefs[channel.key] })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${
                    prefs[channel.key] ? "bg-sage-700" : "bg-sage-200"
                  } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      prefs[channel.key] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiet Hours */}
      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-sage-800">
          {t("quietHours")}
        </h2>
        <Card className="bg-white border-sage-100 rounded-3xl">
          <CardContent className="p-5">
            <p className="text-sm text-sage-500 mb-4">
              {t("quietHoursDesc")}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label htmlFor="quiet-start" className="text-sm font-medium text-sage-700">
                  {t("from")}
                </label>
                <input
                  id="quiet-start"
                  type="time"
                  value={prefs.quietHoursStart || ""}
                  onChange={(e) =>
                    updatePref({ quietHoursStart: e.target.value || null })
                  }
                  className="rounded-xl border border-sage-200 px-3 py-1.5 text-sm text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="quiet-end" className="text-sm font-medium text-sage-700">
                  {t("to")}
                </label>
                <input
                  id="quiet-end"
                  type="time"
                  value={prefs.quietHoursEnd || ""}
                  onChange={(e) =>
                    updatePref({ quietHoursEnd: e.target.value || null })
                  }
                  className="rounded-xl border border-sage-200 px-3 py-1.5 text-sm text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>
              {(prefs.quietHoursStart || prefs.quietHoursEnd) && (
                <button
                  type="button"
                  onClick={() => updatePref({ quietHoursStart: null, quietHoursEnd: null })}
                  className="text-xs text-terracotta-500 hover:text-terracotta-700 transition-colors"
                >
                  {t("clear")}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <div className="bg-sage-50/50 border border-sage-100 rounded-2xl px-5 py-4">
        <p className="text-xs text-sage-500 leading-relaxed">
          You can manage individual notification types from the{" "}
          <a href="/dashboard/notifications" className="text-sage-700 underline hover:text-sage-900">
            notifications page
          </a>
          . Critical security alerts (password resets, account actions) are always sent regardless of your preferences.
        </p>
      </div>
    </div>
  );
}
