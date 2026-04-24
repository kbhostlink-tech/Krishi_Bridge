"use client";

import { useState, useEffect, useCallback } from "react";
import type { CurrencyCode } from "@/generated/prisma/client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api-errors";
import { CURRENCY_OPTIONS, getDefaultCurrencyForCountry } from "@/lib/currency-config";
import { getCurrentLocalDateTimeInputValue, toLocalDateTimeInputValue } from "@/lib/date-time";
import { getFirstLotAuctionError, getLotAuctionFieldErrors, hasLotAuctionFieldErrors } from "@/lib/lot-validation";
import { Card, CardContent } from "@/components/ui/card";
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
import { CommodityIcon } from "@/lib/commodity-icons";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";
import { useTranslations } from "next-intl";

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

interface Submission {
  id: string;
  commodityType: string;
  grade: string;
  variety: string | null;
  quantityKg: number;
  numberOfBags: number | null;
  bagWeight: number | null;
  packagingType: string | null;
  description: string | null;
  origin: { country: string; state: string; district: string; village?: string };
  harvestYear: number | null;
  harvestMonth: string | null;
  harvestSeason: string | null;
  moistureRange: string | null;
  colourAroma: string | null;
  tailCut: string | null;
  sellerDeclaration: string | null;
  labReportUrl: string | null;
  phytosanitaryUrl: string | null;
  originCertUrl: string | null;
  images: string[];
  videos: string[];
  status: string;
}

export default function CreateLotPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const t = useTranslations("createLot");

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form state — lot-specific fields (commodity data comes from submission)
  const [description, setDescription] = useState("");
  const [listingMode, setListingMode] = useState("AUCTION");
  const [startingPriceInr, setStartingPriceInr] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("INR");
  const [reservePriceInr, setReservePriceInr] = useState("");
  const [reserveCurrency, setReserveCurrency] = useState("INR");
  const [auctionStartsAt, setAuctionStartsAt] = useState("");
  const [auctionEndsAt, setAuctionEndsAt] = useState("");

  const clearFieldFeedback = (...fields: string[]) => {
    setFormError("");
    setFieldErrors((prev) => {
      if (fields.length === 0) {
        return {};
      }

      const next = { ...prev };
      for (const field of fields) {
        delete next[field];
      }
      return next;
    });
  };

  const fetchSubmission = useCallback(async () => {
    if (!accessToken || !submissionId) return;
    try {
      const res = await fetch(`/api/commodity-submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch submission");
      const data = await res.json();
      const sub = data.submission;

      if (sub.status !== "APPROVED") {
        toast.error(t("toastApprovedOnly"));
        router.push("/dashboard/my-submissions");
        return;
      }

      setSubmission(sub);
      setDescription(sub.description || "");

      // Auto-detect currency from submission origin country
      const originCountry = sub.origin?.country || "";
      const defaultCurrency = getDefaultCurrencyForCountry(originCountry);
      setPriceCurrency(defaultCurrency);
      setReserveCurrency(defaultCurrency);
    } catch {
      toast.error(t("toastLoadFailed"));
      router.push("/dashboard/my-submissions");
    } finally {
      setLoading(false);
    }
  }, [accessToken, submissionId, router, t]);

  useEffect(() => {
    if (!submissionId) {
      toast.error(t("toastNoSubmission"));
      router.push("/dashboard/my-submissions");
      return;
    }
    fetchSubmission();
  }, [submissionId, fetchSubmission, router, t]);

  const { toInrFrom } = useCurrency();
  // Minimum auction start is 15 minutes from now to give buyers time to see the listing.
  const minimumStartAt = getCurrentLocalDateTimeInputValue(15);
  // End must be strictly AFTER start: bump by 1 minute when start is set.
  const minimumEndAt = auctionStartsAt
    ? toLocalDateTimeInputValue(new Date(new Date(auctionStartsAt).getTime() + 60_000))
    : minimumStartAt;

  const handleCreate = async () => {
    if (!submission || !accessToken) return;

    clearFieldFeedback();

    const auctionValidation = getLotAuctionFieldErrors({
      listingMode,
      startingPriceInr: startingPriceInr ? parseFloat(startingPriceInr) : undefined,
      reservePriceInr: reservePriceInr ? parseFloat(reservePriceInr) : undefined,
      auctionStartsAt,
      auctionEndsAt,
    });

    if (hasLotAuctionFieldErrors(auctionValidation)) {
      // Map backend English messages to localized equivalents
      const localizeError = (raw: string): string => {
        if (raw.includes("start must be in the future")) return t("errorStartPast");
        if (raw.includes("end must be later than the start") || raw.includes("end must be in the future")) return t("errorEndBeforeStart");
        if (raw.includes("starting price")) return t("errorStartingPriceRequired");
        return raw;
      };
      const nextFieldErrors = Object.fromEntries(
        Object.entries(auctionValidation).map(([field, messages]) => [field, localizeError(messages?.[0] ?? "")])
      );
      const first = getFirstLotAuctionError(auctionValidation);
      const message = first ? localizeError(first) : t("toastReviewSettings");
      setFieldErrors(nextFieldErrors);
      setFormError(message);
      toast.error(message);
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        commodityType: submission.commodityType,
        grade: submission.grade,
        quantityKg: submission.quantityKg,
        description,
        origin: submission.origin,
        listingMode,
        submissionId: submission.id,
      };

      const res = await fetch("/api/lots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = getApiErrorMessage(data, "Failed to create lot");
        setFieldErrors(getApiFieldErrors(data));
        setFormError(message);
        throw new Error(message);
      }

      const { lot } = await res.json();
      toast.success(t("toastLotCreated", { lotNumber: lot.lotNumber }));

      // If auction/both mode, publish immediately with pricing
      // Convert user-entered price from their selected currency to INR (base)
      if (listingMode === "AUCTION" || listingMode === "BOTH") {
        const startPriceLocal = parseFloat(startingPriceInr);
        const startPriceInr = toInrFrom(startPriceLocal, priceCurrency as CurrencyCode);
        const publishBody: Record<string, unknown> = {
          listingMode,
          startingPriceInr: startPriceInr,
        };
        if (reservePriceInr) {
          const reserveLocal = parseFloat(reservePriceInr);
          publishBody.reservePriceInr = toInrFrom(reserveLocal, reserveCurrency as CurrencyCode);
        }
        if (auctionStartsAt) publishBody.auctionStartsAt = new Date(auctionStartsAt).toISOString();
        if (auctionEndsAt) publishBody.auctionEndsAt = new Date(auctionEndsAt).toISOString();

        const pubRes = await fetch(`/api/lots/${lot.id}/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(publishBody),
        });

        if (pubRes.ok) {
          toast.success(t("toastLotForApproval"));
        } else {
          const publishData = await pubRes.json().catch(() => ({}));
          toast.warning(t("toastLotDraftFallback", { reason: getApiErrorMessage(publishData, "") }));
        }
      } else if (listingMode === "RFQ") {
        // For RFQ-only, publish without auction fields
        const pubRes = await fetch(`/api/lots/${lot.id}/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ listingMode: "RFQ" }),
        });

        if (pubRes.ok) {
          toast.success(t("toastLotForApproval"));
        } else {
          const publishData = await pubRes.json().catch(() => ({}));
          toast.warning(t("toastLotDraftFallback", { reason: getApiErrorMessage(publishData, "") }));
        }
      }

      router.push("/dashboard/my-lots");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toastFailedCreate"));
    } finally {
      setCreating(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-64 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-80 rounded skeleton-shimmer" />
          </div>
          <div className="h-8 w-24 rounded skeleton-shimmer" />
        </div>
        <div className="h-36 rounded-3xl skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-3xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!submission) return null;

  const needsAuction = listingMode === "AUCTION" || listingMode === "BOTH";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-sage-900">{t("title")}</h1>
          <p className="text-sage-500 text-sm mt-1">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/my-submissions")}
          className="self-start text-sm text-sage-500 hover:text-sage-700 transition-colors sm:self-center"
        >
          {t("backToSubmissions")}
        </button>
      </div>

      {/* Submission Summary */}
      <Card className="rounded-3xl border-sage-100 bg-white/80 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sage-50 flex items-center justify-center">
              <CommodityIcon type={submission.commodityType} className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-heading font-bold text-sage-900">
                  {COMMODITY_LABELS[submission.commodityType] || submission.commodityType}
                </h2>
                <Badge className="bg-sage-100 text-sage-700 text-xs">{submission.grade}</Badge>
                {submission.variety && (
                  <Badge variant="outline" className="text-xs">{submission.variety}</Badge>
                )}
                <Badge className="bg-green-100 text-green-700 text-xs">{t("statusApproved")}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                <div>
                  <span className="text-sage-400">{t("quantityLabel")}</span>
                  <p className="font-semibold text-sage-800">{submission.quantityKg} kg</p>
                </div>
                <div>
                  <span className="text-sage-400">{t("originLabel")}</span>
                  <p className="font-semibold text-sage-800">
                    {submission.origin.district}, {submission.origin.state}
                  </p>
                </div>
                {submission.numberOfBags && (
                  <div>
                    <span className="text-sage-400">{t("bagsLabel")}</span>
                    <p className="font-semibold text-sage-800">
                      {submission.numberOfBags} × {submission.bagWeight || "—"} kg
                    </p>
                  </div>
                )}
                {submission.moistureRange && (
                  <div>
                    <span className="text-sage-400">{t("moistureLabel")}</span>
                    <p className="font-semibold text-sage-800">{submission.moistureRange}</p>
                  </div>
                )}
              </div>
              {submission.colourAroma && (
                <p className="text-sm text-sage-500 mt-2">
                  <span className="font-medium">{t("colourAromaLabel")}:</span> {submission.colourAroma}
                </p>
              )}
              {submission.tailCut && submission.tailCut !== "N/A" && (
                <p className="text-sm text-sage-500 mt-1">
                  <span className="font-medium">{t("tailCutLabel")}:</span> {submission.tailCut}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lot Configuration Form */}
      <Card className="rounded-3xl border-sage-100 bg-white/80 backdrop-blur">
        <CardContent className="p-6 space-y-5">
          <h3 className="text-lg font-heading font-bold text-sage-900">{t("configTitle")}</h3>

          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Description */}
          <div>
            <Label className="text-sage-700 text-sm">{t("descriptionLabel")}</Label>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearFieldFeedback();
              }}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
              className="mt-1 rounded-xl border-sage-200 resize-none"
              maxLength={2000}
            />
          </div>

          {/* Listing Mode */}
          <div>
            <Label className="text-sage-700 text-sm font-medium">{t("listingModeLabel")} *</Label>
            <Select value={listingMode} onValueChange={(v) => {
              if (!v) return;
              setListingMode(v);
              clearFieldFeedback("startingPriceInr", "reservePriceInr", "auctionStartsAt", "auctionEndsAt");
            }}>
              <SelectTrigger className="mt-1 rounded-xl border-sage-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUCTION">{t("modeAuction")}</SelectItem>
                <SelectItem value="RFQ">{t("modeRfq")}</SelectItem>
                <SelectItem value="BOTH">{t("modeBoth")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-sage-400 mt-1">
              {listingMode === "AUCTION" && t("modeAuctionHint")}
              {listingMode === "RFQ" && t("modeRfqHint")}
              {listingMode === "BOTH" && t("modeBothHint")}
            </p>
          </div>

          {/* Auction Fields */}
          {needsAuction && (
            <div className="space-y-4 p-4 bg-sage-50/50 rounded-2xl border border-sage-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-sage-400 uppercase tracking-wider">{t("auctionSettings")}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                  {t("istBadge")}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sage-700 text-sm">{t("startingPriceLabel")} *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={startingPriceInr}
                      onChange={(e) => {
                        setStartingPriceInr(e.target.value);
                        clearFieldFeedback("startingPriceInr", "reservePriceInr");
                      }}
                      placeholder={t("startingPricePlaceholder")}
                      className="rounded-xl border-sage-200 flex-1"
                    />
                    <select
                      value={priceCurrency}
                      onChange={(e) => {
                        setPriceCurrency(e.target.value);
                        clearFieldFeedback("startingPriceInr", "reservePriceInr");
                      }}
                      className="px-3 py-2 border border-sage-200 rounded-xl text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.startingPriceInr && (
                    <p className="text-xs text-red-700 mt-1">{fieldErrors.startingPriceInr}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sage-700 text-sm">{t("reservePriceLabel")}</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={reservePriceInr}
                      onChange={(e) => {
                        setReservePriceInr(e.target.value);
                        clearFieldFeedback("reservePriceInr");
                      }}
                      placeholder={t("reservePricePlaceholder")}
                      className="rounded-xl border-sage-200 flex-1"
                    />
                    <select
                      value={reserveCurrency}
                      onChange={(e) => {
                        setReserveCurrency(e.target.value);
                        clearFieldFeedback("reservePriceInr");
                      }}
                      className="px-3 py-2 border border-sage-200 rounded-xl text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-sage-400 mt-1">{t("reserveHint")}</p>
                  {fieldErrors.reservePriceInr && (
                    <p className="text-xs text-red-700 mt-1">{fieldErrors.reservePriceInr}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sage-700 text-sm">{t("auctionStartsLabel")} * <span className="text-xs font-normal text-sage-400">{t("timezoneSuffix")}</span></Label>
                  <Input
                    type="datetime-local"
                    value={auctionStartsAt}
                    min={minimumStartAt}
                    step={60}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Guard: reject past times (browsers may not enforce `min`).
                      if (val && new Date(val).getTime() < Date.now()) {
                        toast.error(t("toastStartInFuture"));
                        setFieldErrors((prev) => ({ ...prev, auctionStartsAt: t("errorStartPast") }));
                        return;
                      }
                      setAuctionStartsAt(val);
                      clearFieldFeedback("auctionStartsAt", "auctionEndsAt");
                    }}
                    className="mt-1 rounded-xl border-sage-200"
                  />
                  {fieldErrors.auctionStartsAt && (
                    <p className="text-xs text-red-700 mt-1">{fieldErrors.auctionStartsAt}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: t("quickIn1Hour"), hours: 1 },
                      { label: t("quickIn6Hours"), hours: 6 },
                      { label: t("quickTomorrow10AM"), hours: -1 },
                    ].map(({ label, hours }) => (
                      <button
                        key={label}
                        type="button"
                        className="px-2.5 py-1 text-xs rounded-full bg-sage-50 text-sage-600 hover:bg-sage-100 border border-sage-200 transition-colors"
                        onClick={() => {
                          const d = new Date();
                          if (hours === -1) {
                            d.setDate(d.getDate() + 1);
                            d.setHours(10, 0, 0, 0);
                          } else {
                            d.setHours(d.getHours() + hours);
                          }
                          setAuctionStartsAt(toLocalDateTimeInputValue(d));
                          clearFieldFeedback("auctionStartsAt", "auctionEndsAt");
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sage-700 text-sm">{t("auctionEndsLabel")} * <span className="text-xs font-normal text-sage-400">{t("timezoneSuffix")}</span></Label>
                  <Input
                    type="datetime-local"
                    value={auctionEndsAt}
                    min={minimumEndAt}
                    step={60}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && new Date(val).getTime() < Date.now()) {
                        toast.error(t("toastStartInFuture"));
                        return;
                      }
                      if (val && auctionStartsAt && new Date(val).getTime() <= new Date(auctionStartsAt).getTime()) {
                        toast.error(t("toastEndAfterStart"));
                        setFieldErrors((prev) => ({ ...prev, auctionEndsAt: t("errorEndBeforeStart") }));
                        return;
                      }
                      setAuctionEndsAt(val);
                      clearFieldFeedback("auctionEndsAt");
                    }}
                    className="mt-1 rounded-xl border-sage-200"
                  />
                  {fieldErrors.auctionEndsAt && (
                    <p className="text-xs text-red-700 mt-1">{fieldErrors.auctionEndsAt}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: t("quickPlus24h"), hours: 24 },
                      { label: t("quickPlus48h"), hours: 48 },
                      { label: t("quickPlus7d"), hours: 168 },
                    ].map(({ label, hours }) => (
                      <button
                        key={label}
                        type="button"
                        className="px-2.5 py-1 text-xs rounded-full bg-sage-50 text-sage-600 hover:bg-sage-100 border border-sage-200 transition-colors"
                        onClick={() => {
                          const start = auctionStartsAt ? new Date(auctionStartsAt) : new Date();
                          const d = new Date(start.getTime() + hours * 60 * 60 * 1000);
                          setAuctionEndsAt(toLocalDateTimeInputValue(d));
                          clearFieldFeedback("auctionEndsAt");
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Docs Carried Over */}
          {(submission.labReportUrl || submission.phytosanitaryUrl || submission.originCertUrl) && (
            <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("complianceDocsTitle")}
              </p>
              <div className="flex flex-wrap gap-2">
                {submission.labReportUrl && (
                  <Badge variant="outline" className="text-green-700 border-green-200">{t("labReport")}</Badge>
                )}
                {submission.phytosanitaryUrl && (
                  <Badge variant="outline" className="text-green-700 border-green-200">{t("phytoCert")}</Badge>
                )}
                {submission.originCertUrl && (
                  <Badge variant="outline" className="text-green-700 border-green-200">{t("originCert")}</Badge>
                )}
              </div>
              <p className="text-xs text-green-500 mt-1">{t("complianceDocsHint")}</p>
            </div>
          )}

          {/* Info box */}
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
            <p className="text-sm text-amber-700">
              <span className="font-semibold">{t("whatHappensNext")}</span> {t("whatHappensNextBody")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push("/dashboard/my-submissions")}
              className="flex-1 py-3 border border-sage-200 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 disabled:opacity-50 transition-colors"
            >
              {creating ? t("submitting") : t("submitFull")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
