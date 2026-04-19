"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommodityIcon } from "@/lib/commodity-icons";
import { Lock, ClipboardList, Check } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

const COMMODITIES = [
  { value: "LARGE_CARDAMOM", label: "Large Cardamom" },
  { value: "TEA", label: "Tea" },
  { value: "GINGER", label: "Ginger" },
  { value: "TURMERIC", label: "Turmeric" },
  { value: "PEPPER", label: "Pepper" },
  { value: "COFFEE", label: "Coffee" },
  { value: "SAFFRON", label: "Saffron" },
  { value: "ARECA_NUT", label: "Areca Nut" },
  { value: "CINNAMON", label: "Cinnamon" },
  { value: "OTHER", label: "Other" },
];

const GRADES = ["PREMIUM", "A", "B", "C"];

const COUNTRIES = [
  { code: "IN", label: "India" },
  { code: "NP", label: "Nepal" },
  { code: "BT", label: "Bhutan" },
  { code: "AE", label: "UAE" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "OM", label: "Oman" },
];

export default function CreateRfqPage() {
  const t = useTranslations("rfq");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CURRENCIES = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "NPR", symbol: "रू", name: "Nepalese Rupee" },
    { code: "BTN", symbol: "Nu.", name: "Bhutanese Ngultrum" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
    { code: "OMR", symbol: "ر.ع.", name: "Omani Rial" },
    { code: "USD", symbol: "$", name: "US Dollar" },
  ];

  // Form state
  const [commodityType, setCommodityType] = useState("");
  const [grade, setGrade] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [targetPriceInr, setTargetPriceInr] = useState("");
  const [targetCurrency, setTargetCurrency] = useState("INR");
  const [deliveryCountry, setDeliveryCountry] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [description, setDescription] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");

  const { toInrFrom } = useCurrency();

  // Pre-populate from URL params (e.g. from marketplace lot page)
  useEffect(() => {
    const ct = searchParams.get("commodityType");
    const g = searchParams.get("grade");
    const q = searchParams.get("quantityKg");
    if (ct && COMMODITIES.some((c) => c.value === ct)) setCommodityType(ct);
    if (g && GRADES.includes(g)) setGrade(g);
    if (q && parseFloat(q) > 0) setQuantityKg(q);
  }, [searchParams]);

  const canProceedStep1 = commodityType && quantityKg && parseFloat(quantityKg) > 0;
  const canProceedStep2 = deliveryCountry && deliveryCity.trim().length > 0;

  const handleSubmit = async () => {
    if (!accessToken) {
      toast.error(t("loginRequired"));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          commodityType,
          grade: grade || undefined,
          quantityKg: parseFloat(quantityKg),
          targetPriceInr: targetPriceInr
            ? (targetCurrency === "INR" ? parseFloat(targetPriceInr) : toInrFrom(parseFloat(targetPriceInr), targetCurrency as import("@/generated/prisma/client").CurrencyCode))
            : undefined,
          targetCurrency: targetPriceInr ? targetCurrency : undefined,
          deliveryCountry,
          deliveryCity: deliveryCity.trim(),
          description: description.trim() || undefined,
          expiresInDays: parseInt(expiresInDays, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("createFailed"));
        return;
      }

      toast.success(t("createSuccess"));
      router.push("/dashboard/my-rfqs");
    } catch {
      toast.error(t("createFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-sage-100 rounded animate-pulse" />
        <div className="h-96 bg-white rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!user || user.role !== "BUYER") {
    return (
      <div className="text-center py-16">
        <Lock className="w-10 h-10 text-sage-300 mx-auto mb-4" />
        <p className="text-sage-700 font-medium">{t("buyersOnly")}</p>
      </div>
    );
  }

  if (user.kycStatus !== "APPROVED") {
    return (
      <div className="text-center py-16">
        <ClipboardList className="w-10 h-10 text-sage-300 mx-auto mb-4" />
        <p className="text-sage-700 font-medium">{t("kycRequired")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">{t("createTitle")}</h1>
        <p className="text-sage-500 text-sm mt-1">{t("createSubtitle")}</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s
                  ? "bg-sage-700 text-white"
                  : "bg-sage-100 text-sage-400"
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step >= s ? "text-sage-700" : "text-sage-400"}`}>
              {s === 1 ? t("stepCommodity") : s === 2 ? t("stepDelivery") : t("stepReview")}
            </span>
            {s < 3 && <div className={`flex-1 h-px ${step > s ? "bg-sage-700" : "bg-sage-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Commodity Details */}
      {step === 1 && (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="pt-6 space-y-5">
            <h2 className="font-heading text-sage-900 font-bold">{t("stepCommodity")}</h2>

            <div>
              <Label className="text-sage-700 text-sm">{t("commodityType")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {COMMODITIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCommodityType(c.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-sm transition-all ${
                      commodityType === c.value
                        ? "border-sage-700 bg-sage-50 text-sage-900 font-medium"
                        : "border-sage-200 text-sage-600 hover:border-sage-300"
                    }`}
                  >
                    <CommodityIcon type={c.value} className="w-5 h-5" />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sage-700 text-sm">{t("grade")}</Label>
              <Select value={grade} onValueChange={(v) => v && setGrade(v)}>
                <SelectTrigger className="mt-1.5 rounded-xl">
                  <SelectValue placeholder={t("gradeOptional")} />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sage-700 text-sm">{t("quantity")}</Label>
              <div className="relative mt-1.5">
                <Input
                  type="number"
                  min="1"
                  step="0.5"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  placeholder="100"
                  className="rounded-xl pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 text-sm">kg</span>
              </div>
            </div>

            <div>
              <Label className="text-sage-700 text-sm">{t("targetPrice")}</Label>
              <div className="flex gap-2 mt-1.5">
                <Select value={targetCurrency} onValueChange={(v) => v && setTargetCurrency(v)}>
                  <SelectTrigger className="rounded-xl w-28 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400 text-sm">
                    {CURRENCIES.find((c) => c.code === targetCurrency)?.symbol || "₹"}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={targetPriceInr}
                    onChange={(e) => setTargetPriceInr(e.target.value)}
                    placeholder={t("optional")}
                    className="rounded-xl pl-8"
                  />
                </div>
              </div>
              <p className="text-[10px] text-sage-400 mt-1">Price per kg in your selected currency</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="px-8 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("next")}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Delivery Details */}
      {step === 2 && (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="pt-6 space-y-5">
            <h2 className="font-heading text-sage-900 font-bold">{t("stepDelivery")}</h2>

            <div>
              <Label className="text-sage-700 text-sm">{t("deliveryCountry")}</Label>
              <Select value={deliveryCountry} onValueChange={(v) => v && setDeliveryCountry(v)}>
                <SelectTrigger className="mt-1.5 rounded-xl">
                  <SelectValue placeholder={t("selectCountry")} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sage-700 text-sm">{t("deliveryCity")}</Label>
              <Input
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                placeholder={t("enterCity")}
                className="mt-1.5 rounded-xl"
                maxLength={100}
              />
            </div>

            <div>
              <Label className="text-sage-700 text-sm">{t("description")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                className="mt-1.5 rounded-xl"
                maxLength={2000}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sage-700 text-sm">{t("expiresIn")}</Label>
              <Select value={expiresInDays} onValueChange={(v) => v && setExpiresInDays(v)}>
                <SelectTrigger className="mt-1.5 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 14, 21, 30].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} {t("days")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 border border-sage-200 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors"
              >
                {t("back")}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="px-8 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("next")}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="pt-6 space-y-5">
            <h2 className="font-heading text-sage-900 font-bold">{t("stepReview")}</h2>

            <div className="bg-sage-50 rounded-2xl p-5 space-y-3">
              <ReviewRow label={t("commodityType")} value={
                <span className="flex items-center gap-1.5">
                  <CommodityIcon type={commodityType} className="w-4 h-4" />
                  {COMMODITIES.find((c) => c.value === commodityType)?.label}
                </span>
              } />
              {grade && <ReviewRow label={t("grade")} value={grade} />}
              <ReviewRow label={t("quantity")} value={`${parseFloat(quantityKg).toLocaleString()} kg`} />
              {targetPriceInr && (
                <ReviewRow label={t("targetPrice")} value={`\u20b9${parseFloat(targetPriceInr).toFixed(2)}`} />
              )}
              <div className="border-t border-sage-200 my-2" />
              <ReviewRow label={t("deliveryCountry")} value={COUNTRIES.find((c) => c.code === deliveryCountry)?.label || ""} />
              <ReviewRow label={t("deliveryCity")} value={deliveryCity} />
              {description && <ReviewRow label={t("description")} value={description} />}
              <ReviewRow label={t("expiresIn")} value={`${expiresInDays} ${t("days")}`} />
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 border border-sage-200 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors"
              >
                {t("back")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("submitting")}
                  </span>
                ) : (
                  t("submitRfq")
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-sage-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-sage-900 font-medium text-right">{value}</span>
    </div>
  );
}
