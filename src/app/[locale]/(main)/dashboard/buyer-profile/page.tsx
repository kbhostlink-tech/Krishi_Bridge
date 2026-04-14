"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";

const BUYER_TYPES = [
  { value: "IMPORTER", label: "Importer" },
  { value: "EXPORTER", label: "Exporter" },
  { value: "BLENDER_PROCESSOR", label: "Blender / Processor" },
  { value: "WHOLESALER", label: "Wholesaler" },
  { value: "INSTITUTIONAL", label: "Institutional Buyer" },
  { value: "TRADER", label: "Trader" },
];

const ORIGIN_OPTIONS = [
  "India — Sikkim", "India — West Bengal", "India — Meghalaya",
  "India — Arunachal Pradesh", "India — Kerala", "India — Karnataka",
  "Nepal — Province 1", "Nepal — Gandaki", "Bhutan — Thimphu",
  "Bhutan — Bumthang", "UAE", "Saudi Arabia", "Oman",
];

const GRADE_OPTIONS = ["PREMIUM", "A", "B", "C"];

interface BuyerProfileForm {
  companyName: string;
  tradeName: string;
  buyerType: string;
  fullAddress: string;
  website: string;
  registrationNumber: string;
  taxId: string;
  importExportLicense: string;
  yearsInBusiness: number | null;
  typicalMonthlyVolumeMin: number | null;
  typicalMonthlyVolumeMax: number | null;
  preferredOrigins: string[];
  preferredGrades: string[];
  packagingPreference: string;
}

const EMPTY_FORM: BuyerProfileForm = {
  companyName: "",
  tradeName: "",
  buyerType: "",
  fullAddress: "",
  website: "",
  registrationNumber: "",
  taxId: "",
  importExportLicense: "",
  yearsInBusiness: null,
  typicalMonthlyVolumeMin: null,
  typicalMonthlyVolumeMax: null,
  preferredOrigins: [],
  preferredGrades: [],
  packagingPreference: "",
};

export default function BuyerProfilePage() {
  const t = useTranslations("profiles");
  const { user, accessToken } = useAuth();

  const [form, setForm] = useState<BuyerProfileForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch("/api/users/buyer-profile", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setHasProfile(true);
            setForm({
              companyName: data.profile.companyName || "",
              tradeName: data.profile.tradeName || "",
              buyerType: data.profile.buyerType || "",
              fullAddress: data.profile.fullAddress || "",
              website: data.profile.website || "",
              registrationNumber: data.profile.registrationNumber || "",
              taxId: data.profile.taxId || "",
              importExportLicense: data.profile.importExportLicense || "",
              yearsInBusiness: data.profile.yearsInBusiness,
              typicalMonthlyVolumeMin: data.profile.typicalMonthlyVolumeMin,
              typicalMonthlyVolumeMax: data.profile.typicalMonthlyVolumeMax,
              preferredOrigins: data.profile.preferredOrigins || [],
              preferredGrades: data.profile.preferredGrades || [],
              packagingPreference: data.profile.packagingPreference || "",
            });
          }
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [accessToken]);

  const handleChange = (field: keyof BuyerProfileForm, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "preferredOrigins" | "preferredGrades", item: string) => {
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!form.buyerType) {
      toast.error("Please select your buyer type");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/users/buyer-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save profile");
        return;
      }

      setHasProfile(true);
      toast.success(hasProfile ? t("updated") : t("created"));
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== "BUYER") {
    return (
      <div className="text-center py-20">
        <p className="text-sage-500 mb-4">This page is only available for buyers.</p>
        <Link href="/dashboard" className="inline-flex h-10 px-6 items-center bg-sage-700 text-white rounded-full font-medium text-sm">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
        <div className="h-8 w-48 rounded skeleton-shimmer" />
        <div className="h-64 rounded-3xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <PageTransition className="space-y-8 max-w-3xl mx-auto">
      <div>
        <p className="font-script text-sage-500 text-lg">{t("buyerProfileSubtitle")}</p>
        <h1 className="font-heading text-sage-900 text-3xl font-bold">{t("buyerProfileTitle")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Details */}
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900">{t("companyDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sage-700 font-medium">{t("companyName")} *</Label>
                <Input
                  id="companyName"
                  required
                  value={form.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeName" className="text-sage-700 font-medium">{t("tradeName")}</Label>
                <Input
                  id="tradeName"
                  value={form.tradeName}
                  onChange={(e) => handleChange("tradeName", e.target.value)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sage-700 font-medium">{t("buyerType")} *</Label>
              <Select value={form.buyerType} onValueChange={(v) => handleChange("buyerType", v)}>
                <SelectTrigger className="h-12 rounded-xl border-sage-200 bg-white">
                  <SelectValue placeholder={t("selectBuyerType")} />
                </SelectTrigger>
                <SelectContent>
                  {BUYER_TYPES.map((bt) => (
                    <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullAddress" className="text-sage-700 font-medium">{t("fullAddress")} *</Label>
              <Textarea
                id="fullAddress"
                required
                value={form.fullAddress}
                onChange={(e) => handleChange("fullAddress", e.target.value)}
                rows={3}
                className="rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sage-700 font-medium">{t("website")}</Label>
              <Input
                id="website"
                type="url"
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://example.com"
                className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Credentials */}
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900">{t("businessCredentials")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber" className="text-sage-700 font-medium">{t("registrationNumber")}</Label>
                <Input
                  id="registrationNumber"
                  value={form.registrationNumber}
                  onChange={(e) => handleChange("registrationNumber", e.target.value)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId" className="text-sage-700 font-medium">{t("taxId")}</Label>
                <Input
                  id="taxId"
                  value={form.taxId}
                  onChange={(e) => handleChange("taxId", e.target.value)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="importExportLicense" className="text-sage-700 font-medium">{t("importExportLicense")}</Label>
                <Input
                  id="importExportLicense"
                  value={form.importExportLicense}
                  onChange={(e) => handleChange("importExportLicense", e.target.value)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsInBusiness" className="text-sage-700 font-medium">{t("yearsInBusiness")}</Label>
                <Input
                  id="yearsInBusiness"
                  type="number"
                  min={0}
                  max={200}
                  value={form.yearsInBusiness ?? ""}
                  onChange={(e) => handleChange("yearsInBusiness", e.target.value ? parseInt(e.target.value) : null)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buying Profile */}
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900">{t("buyingProfile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="volumeMin" className="text-sage-700 font-medium">{t("monthlyVolumeMin")}</Label>
                <Input
                  id="volumeMin"
                  type="number"
                  min={0}
                  value={form.typicalMonthlyVolumeMin ?? ""}
                  onChange={(e) => handleChange("typicalMonthlyVolumeMin", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="kg"
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volumeMax" className="text-sage-700 font-medium">{t("monthlyVolumeMax")}</Label>
                <Input
                  id="volumeMax"
                  type="number"
                  min={0}
                  value={form.typicalMonthlyVolumeMax ?? ""}
                  onChange={(e) => handleChange("typicalMonthlyVolumeMax", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="kg"
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sage-700 font-medium">{t("preferredOrigins")}</Label>
              <div className="flex flex-wrap gap-2">
                {ORIGIN_OPTIONS.map((origin) => (
                  <button
                    type="button"
                    key={origin}
                    onClick={() => toggleArrayItem("preferredOrigins", origin)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      form.preferredOrigins.includes(origin)
                        ? "bg-sage-700 text-white"
                        : "bg-sage-50 text-sage-600 hover:bg-sage-100"
                    }`}
                  >
                    {origin}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sage-700 font-medium">{t("preferredGrades")}</Label>
              <div className="flex flex-wrap gap-2">
                {GRADE_OPTIONS.map((grade) => (
                  <button
                    type="button"
                    key={grade}
                    onClick={() => toggleArrayItem("preferredGrades", grade)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      form.preferredGrades.includes(grade)
                        ? "bg-sage-700 text-white"
                        : "bg-sage-50 text-sage-600 hover:bg-sage-100"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="packagingPreference" className="text-sage-700 font-medium">{t("packagingPreference")}</Label>
              <Input
                id="packagingPreference"
                value={form.packagingPreference}
                onChange={(e) => handleChange("packagingPreference", e.target.value)}
                placeholder={t("packagingPlaceholder")}
                className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-12 px-8 bg-sage-700 hover:bg-sage-800 text-white font-medium rounded-full transition-colors duration-200"
          >
            {isSaving ? t("saving") : hasProfile ? t("updateProfile") : t("saveProfile")}
          </Button>
          <Link
            href="/dashboard"
            className="text-sage-500 hover:text-sage-700 text-sm font-medium transition-colors"
          >
            {t("backToDashboard")}
          </Link>
        </div>
      </form>
    </PageTransition>
  );
}
