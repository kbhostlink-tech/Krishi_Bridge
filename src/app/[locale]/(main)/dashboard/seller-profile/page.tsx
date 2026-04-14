"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

const SELLER_TYPES = [
  { value: "INDIVIDUAL_FARMER", label: "Individual Farmer" },
  { value: "AGGREGATOR", label: "Aggregator" },
  { value: "FPO_COOPERATIVE", label: "FPO / Cooperative" },
  { value: "TRADER", label: "Trader" },
  { value: "PROCESSOR", label: "Processor" },
];

const HARVEST_SEASONS = [
  "Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec", "Year-round",
];

interface SellerProfileForm {
  sellerType: string;
  entityName: string;
  state: string;
  district: string;
  village: string;
  registrationId: string;
  fpoName: string;
  yearsOfActivity: number | null;
  typicalAnnualVolume: number | null;
  originRegion: string;
  harvestSeason: string;
  postHarvestProcess: string;
  indicativePriceExpectation: number | null;
  minAcceptableQuantity: number | null;
  willingToNegotiate: boolean;
}

const EMPTY_FORM: SellerProfileForm = {
  sellerType: "",
  entityName: "",
  state: "",
  district: "",
  village: "",
  registrationId: "",
  fpoName: "",
  yearsOfActivity: null,
  typicalAnnualVolume: null,
  originRegion: "",
  harvestSeason: "",
  postHarvestProcess: "",
  indicativePriceExpectation: null,
  minAcceptableQuantity: null,
  willingToNegotiate: true,
};

export default function SellerProfilePage() {
  const t = useTranslations("profiles");
  const { user, accessToken } = useAuth();

  const [form, setForm] = useState<SellerProfileForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch("/api/users/seller-profile", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setHasProfile(true);
            setForm({
              sellerType: data.profile.sellerType || "",
              entityName: data.profile.entityName || "",
              state: data.profile.state || "",
              district: data.profile.district || "",
              village: data.profile.village || "",
              registrationId: data.profile.registrationId || "",
              fpoName: data.profile.fpoName || "",
              yearsOfActivity: data.profile.yearsOfActivity,
              typicalAnnualVolume: data.profile.typicalAnnualVolume,
              originRegion: data.profile.originRegion || "",
              harvestSeason: data.profile.harvestSeason || "",
              postHarvestProcess: data.profile.postHarvestProcess || "",
              indicativePriceExpectation: data.profile.indicativePriceExpectation,
              minAcceptableQuantity: data.profile.minAcceptableQuantity,
              willingToNegotiate: data.profile.willingToNegotiate ?? true,
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

  const handleChange = (field: keyof SellerProfileForm, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!form.sellerType) {
      toast.error("Please select your seller type");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/users/seller-profile", {
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

  if (!user || (user.role !== "AGGREGATOR" && user.role !== "FARMER")) {
    return (
      <div className="text-center py-20">
        <p className="text-sage-500 mb-4">This page is only available for aggregators and farmers.</p>
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
        <p className="font-script text-sage-500 text-lg">{t("sellerProfileSubtitle")}</p>
        <h1 className="font-heading text-sage-900 text-3xl font-bold">{t("sellerProfileTitle")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seller Identity */}
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900">{t("sellerIdentity")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sage-700 font-medium">{t("sellerType")} *</Label>
              <Select value={form.sellerType} onValueChange={(v) => handleChange("sellerType", v)}>
                <SelectTrigger className="h-12 rounded-xl border-sage-200 bg-white">
                  <SelectValue placeholder={t("selectSellerType")} />
                </SelectTrigger>
                <SelectContent>
                  {SELLER_TYPES.map((st) => (
                    <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="entityName" className="text-sage-700 font-medium">{t("entityName")}</Label>
                <Input
                  id="entityName"
                  value={form.entityName}
                  onChange={(e) => handleChange("entityName", e.target.value)}
                  placeholder={t("entityNamePlaceholder")}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationId" className="text-sage-700 font-medium">{t("registrationId")}</Label>
                <Input
                  id="registrationId"
                  value={form.registrationId}
                  onChange={(e) => handleChange("registrationId", e.target.value)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
            </div>

            {(form.sellerType === "FPO_COOPERATIVE" || form.sellerType === "AGGREGATOR") && (
              <div className="space-y-2">
                <Label htmlFor="fpoName" className="text-sage-700 font-medium">{t("fpoName")}</Label>
                <Input
                  id="fpoName"
                  value={form.fpoName}
                  onChange={(e) => handleChange("fpoName", e.target.value)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sage-700 font-medium">{t("state")}</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district" className="text-sage-700 font-medium">{t("district")}</Label>
                <Input
                  id="district"
                  value={form.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="village" className="text-sage-700 font-medium">{t("village")}</Label>
                <Input
                  id="village"
                  value={form.village}
                  onChange={(e) => handleChange("village", e.target.value)}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsOfActivity" className="text-sage-700 font-medium">{t("yearsOfActivity")}</Label>
              <Input
                id="yearsOfActivity"
                type="number"
                min={0}
                max={200}
                value={form.yearsOfActivity ?? ""}
                onChange={(e) => handleChange("yearsOfActivity", e.target.value ? parseInt(e.target.value) : null)}
                className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500 max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Origin & Production */}
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900">{t("originProduction")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="originRegion" className="text-sage-700 font-medium">{t("originRegion")}</Label>
                <Input
                  id="originRegion"
                  value={form.originRegion}
                  onChange={(e) => handleChange("originRegion", e.target.value)}
                  placeholder={t("originRegionPlaceholder")}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sage-700 font-medium">{t("harvestSeason")}</Label>
                <Select value={form.harvestSeason} onValueChange={(v) => handleChange("harvestSeason", v)}>
                  <SelectTrigger className="h-12 rounded-xl border-sage-200 bg-white">
                    <SelectValue placeholder={t("selectSeason")} />
                  </SelectTrigger>
                  <SelectContent>
                    {HARVEST_SEASONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="typicalAnnualVolume" className="text-sage-700 font-medium">{t("annualVolume")}</Label>
              <Input
                id="typicalAnnualVolume"
                type="number"
                min={0}
                value={form.typicalAnnualVolume ?? ""}
                onChange={(e) => handleChange("typicalAnnualVolume", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="kg"
                className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500 max-w-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postHarvestProcess" className="text-sage-700 font-medium">{t("postHarvestProcess")}</Label>
              <Textarea
                id="postHarvestProcess"
                value={form.postHarvestProcess}
                onChange={(e) => handleChange("postHarvestProcess", e.target.value)}
                placeholder={t("postHarvestPlaceholder")}
                rows={3}
                className="rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Confidential Pricing */}
        <Card className="rounded-3xl border-amber-100 bg-amber-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle className="font-heading text-sage-900">{t("pricingExpectations")}</CardTitle>
              <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs">
                {t("confidential")}
              </Badge>
            </div>
            <p className="text-sage-500 text-sm mt-1">{t("confidentialNote")}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="indicativePriceExpectation" className="text-sage-700 font-medium">{t("indicativePrice")}</Label>
                <Input
                  id="indicativePriceExpectation"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.indicativePriceExpectation ?? ""}
                  onChange={(e) => handleChange("indicativePriceExpectation", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="USD per kg"
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minAcceptableQuantity" className="text-sage-700 font-medium">{t("minAcceptableQty")}</Label>
                <Input
                  id="minAcceptableQuantity"
                  type="number"
                  min={0}
                  value={form.minAcceptableQuantity ?? ""}
                  onChange={(e) => handleChange("minAcceptableQuantity", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="kg"
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="willingToNegotiate"
                checked={form.willingToNegotiate}
                onChange={(e) => handleChange("willingToNegotiate", e.target.checked)}
                className="w-4 h-4 rounded border-sage-300 text-sage-700 focus:ring-sage-500"
              />
              <Label htmlFor="willingToNegotiate" className="text-sage-700 font-medium cursor-pointer">
                {t("willingToNegotiate")}
              </Label>
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
