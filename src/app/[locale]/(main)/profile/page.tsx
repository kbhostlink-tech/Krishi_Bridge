"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { localeNames } from "@/i18n/routing";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { PageHeader, Surface } from "@/components/ui/console-kit";
import { PageTransition } from "@/components/ui/page-transition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, BarChart3, Sprout, ArrowRight } from "lucide-react";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const authT = useTranslations("auth.register");
  const dashboardT = useTranslations("dashboard");
  const navT = useTranslations("nav");
  const commonT = useTranslations("common");
  const { user, accessToken, setUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [preferredLang, setPreferredLang] = useState(user?.preferredLang || "en");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const countryLabels: Record<string, string> = {
    IN: authT("countries.IN"),
    NP: authT("countries.NP"),
    BT: authT("countries.BT"),
    AE: authT("countries.AE"),
    SA: authT("countries.SA"),
    OM: authT("countries.OM"),
  };

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          toast.error(commonT("error"));
          return;
        }

        const data = await res.json();
        setName(data.user.name);
        setPhone(data.user.phone || "");
        setPreferredLang(data.user.preferredLang || "en");
      } catch {
        toast.error(commonT("networkError"));
      }
    })();
  }, [accessToken, commonT]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, phone: phone || undefined, preferredLang }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(commonT("error"));
        return;
      }

      setUser(data.user);
      setSuccess(t("updateSuccess"));
    } catch {
      setError(commonT("networkError"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-stone-500">{t("loginRequired")}</p>
        <Link href="/login" className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2f422e]">
          {navT("login")}
        </Link>
      </div>
    );
  }

  const roleLabel = {
    FARMER: authT("roleFarmer"),
    AGGREGATOR: authT("roleAggregator"),
    BUYER: authT("roleBuyer"),
    ADMIN: t("roleAdmin"),
  }[user.role] || user.role;

  const kycBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: dashboardT("kycStatusPending"), variant: "secondary" },
    UNDER_REVIEW: { label: dashboardT("kycStatusUnderReview"), variant: "outline" },
    APPROVED: { label: dashboardT("kycStatusApproved"), variant: "default" },
    REJECTED: { label: dashboardT("kycStatusRejected"), variant: "destructive" },
  };
  const kyc = kycBadge[user.kycStatus] || kycBadge.PENDING;

  return (
    <PageTransition className="space-y-6">
      <PageHeader eyebrow="Account" title={t("title")} />

      {/* Account Info */}
      <Surface className="p-4 sm:p-6">
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t("accountInfo")}</p>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#ddd4c4] bg-[#f7f2e8] text-lg font-bold text-[#405742]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-stone-950">{user.name}</p>
              <p className="text-sm text-stone-500">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[#ece4d6] pt-4 sm:grid-cols-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t("role")}</p>
              <p className="mt-1 text-sm font-medium text-stone-950">{roleLabel}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t("country")}</p>
              <p className="mt-1 text-sm font-medium text-stone-950">{countryLabels[user.country] || user.country}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t("kycStatus")}</p>
              <div className="mt-1"><Badge variant={kyc.variant}>{kyc.label}</Badge></div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t("emailVerified")}</p>
              <p className={`mt-1 text-sm font-medium ${user.emailVerified ? "text-emerald-700" : "text-amber-700"}`}>
                {user.emailVerified ? commonT("yes") : t("emailVerificationPending")}
              </p>
            </div>
          </div>
        </div>
      </Surface>

      {/* Edit Profile */}
      <Surface className="p-4 sm:p-6">
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t("editProfile")}</p>

          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{authT("name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-[#d9d1c2] bg-white"
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{authT("phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border-[#d9d1c2] bg-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t("preferredLanguage")}</Label>
              <Select value={preferredLang} onValueChange={(val) => { if (val) setPreferredLang(val); }}>
                <SelectTrigger className="w-full border-[#d9d1c2] sm:w-64" id="lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(localeNames).map(([code, label]) => (
                    <SelectItem key={code} value={code}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2f422e] disabled:opacity-60"
            >
              {isSaving ? t("saving") : t("saveChanges")}
            </button>
          </form>
        </div>
      </Surface>

      {/* Seller / Farmer Profile */}
      {(user.role === "FARMER" || user.role === "AGGREGATOR") && (
        <Surface className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-[#405742]" />
              <div>
                <p className="font-semibold text-stone-950">
                  {user.role === "FARMER" ? dashboardT("farmProfile") : dashboardT("sellerProfile")}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {user.role === "FARMER" ? dashboardT("addOriginDetails") : dashboardT("completeBusinessProfile")}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/seller-profile"
              className="inline-flex h-10 shrink-0 items-center border border-[#405742] bg-[#405742] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2f422e]"
            >
              {t("editProfile")}
            </Link>
          </div>
        </Surface>
      )}

      {/* Buyer Profile */}
      {user.role === "BUYER" && (
        <Surface className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-[#405742]" />
              <div>
                <p className="font-semibold text-stone-950">{dashboardT("buyerProfile")}</p>
                <p className="mt-1 text-sm text-stone-600">{dashboardT("completeBusinessProfile")}</p>
              </div>
            </div>
            <Link
              href="/dashboard/buyer-profile"
              className="inline-flex h-10 shrink-0 items-center border border-[#405742] bg-[#405742] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2f422e]"
            >
              {t("editProfile")}
            </Link>
          </div>
        </Surface>
      )}

      {/* Quick Links */}
      <Surface className="p-4 sm:p-5">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t("quickLinks")}</p>
          <div className="divide-y divide-[#ece4d6]">
            <Link
              href="/kyc"
              className="flex items-center justify-between py-3 transition-colors hover:text-[#405742]"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-stone-400" />
                <span className="text-sm font-medium text-stone-700">{navT("kycDocuments")}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-between py-3 transition-colors hover:text-[#405742]"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-stone-400" />
                <span className="text-sm font-medium text-stone-700">{navT("dashboard")}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400" />
            </Link>
          </div>
        </div>
      </Surface>
    </PageTransition>
  );
}
