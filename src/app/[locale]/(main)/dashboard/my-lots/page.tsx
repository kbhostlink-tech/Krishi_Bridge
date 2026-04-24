"use client";

import { useState, useEffect, useCallback } from "react";
import type { CurrencyCode } from "@/generated/prisma/client";
import { useAuth } from "@/lib/auth-context";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api-errors";
import { CURRENCY_OPTIONS, getDefaultCurrencyForCountry } from "@/lib/currency-config";
import { getCurrentLocalDateTimeInputValue, getDateInputValue, getTimeInputValue, mergeDateAndTime, toLocalDateTimeInputValue } from "@/lib/date-time";
import { getFirstLotAuctionError, getLotAuctionFieldErrors, hasLotAuctionFieldErrors } from "@/lib/lot-validation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";
import { ErrorState } from "@/components/ui/error-state";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommodityIcon } from "@/lib/commodity-icons";
import { useCurrency } from "@/lib/use-currency";
import { Loader, ClipboardList, Camera, AlertTriangle } from "lucide-react";

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const fmtTime = (t: string) => {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
};

const formatInputAmount = (amount: number) =>
  amount.toFixed(3).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-orange-100 text-orange-800",
  LISTED: "bg-blue-100 text-blue-800",
  AUCTION_ACTIVE: "bg-green-100 text-green-800",
  UNDER_RFQ: "bg-indigo-100 text-indigo-800",
  SOLD: "bg-purple-100 text-purple-800",
  REDEEMED: "bg-sage-100 text-sage-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-stone-100 text-stone-800",
};

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

interface MyLot {
  id: string;
  lotNumber: string;
  commodityType: string;
  grade: string;
  quantityKg: number;
  description: string | null;
  primaryImageUrl: string | null;
  origin: { country?: string; state?: string; district?: string };
  status: string;
  listingMode: string;
  startingPriceInr: number | null;
  reservePriceInr: number | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  createdAt: string;
  farmer: { id: string; name: string; country: string };
  warehouse: { id: string; name: string };
  qualityCheck: { moisturePct: number | null; podSizeMm: number | null; colourGrade: string | null } | null;
  bidCount: number;
  adminRemarks: string | null;
}

export default function MyLotsPage() {
  const t = useTranslations("lots");
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const { display, toInrFrom, fromInrTo } = useCurrency();

  const [lots, setLots] = useState<MyLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;
  const [lotOverview, setLotOverview] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    listed: 0,
    auctionActive: 0,
    sold: 0,
    redeemed: 0,
  });

  // Edit dialog
  const [editLot, setEditLot] = useState<MyLot | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    listingMode: "AUCTION",
    startingPriceInr: "",
    reservePriceInr: "",
    auctionStartsAt: "",
    auctionEndsAt: "",
  });
  const [editError, setEditError] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editPriceCurrency, setEditPriceCurrency] = useState<CurrencyCode>("INR");
  const [editReserveCurrency, setEditReserveCurrency] = useState<CurrencyCode>("INR");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Image upload
  const [uploadingLotId, setUploadingLotId] = useState<string | null>(null);

  // Guard: seller or admin only
  useEffect(() => {
    if (user && user.role !== "AGGREGATOR" && user.role !== "FARMER" && user.role !== "ADMIN") {
      toast.error(t("accessDeniedSeller"));
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchLots = useCallback(async () => {
    if (!accessToken || !user) return;
    setIsLoading(true);

    setError(null);
    try {
      const params = new URLSearchParams({ sellerId: user.id, limit: String(PAGE_SIZE), page: String(currentPage) });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/lots?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLots(data.lots);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotalCount(data.pagination?.total ?? 0);
    } catch {
      setError(t("failedLoad"));
      toast.error(t("failedLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, statusFilter, currentPage]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  const fetchLotStats = useCallback(async () => {
    if (!accessToken || !user) return;

    const headers = { Authorization: `Bearer ${accessToken}` };
    const fetchCount = async (status?: string) => {
      const params = new URLSearchParams({ sellerId: user.id, limit: "1" });
      if (status) params.set("status", status);
      const res = await fetch(`/api/lots?${params.toString()}`, { headers });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.pagination?.total ?? 0;
    };

    try {
      const [total, draft, pending, listed, auctionActive, sold, redeemed] = await Promise.all([
        fetchCount(),
        fetchCount("DRAFT"),
        fetchCount("PENDING_APPROVAL"),
        fetchCount("LISTED"),
        fetchCount("AUCTION_ACTIVE"),
        fetchCount("SOLD"),
        fetchCount("REDEEMED"),
      ]);

      setLotOverview({ total, draft, pending, listed, auctionActive, sold, redeemed });
    } catch {
      // non-critical overview panel
    }
  }, [accessToken, user]);

  useEffect(() => {
    fetchLotStats();
  }, [fetchLotStats]);

  const clearEditFeedback = (...fields: string[]) => {
    setEditError("");
    setEditFieldErrors((prev) => {
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

  const convertInputCurrency = useCallback((value: string, fromCurrency: CurrencyCode, toCurrency: CurrencyCode) => {
    if (!value) {
      return "";
    }

    const parsedValue = parseFloat(value);
    if (!Number.isFinite(parsedValue)) {
      return value;
    }

    const amountInr = toInrFrom(parsedValue, fromCurrency);
    return formatInputAmount(fromInrTo(amountInr, toCurrency));
  }, [fromInrTo, toInrFrom]);

  const openEdit = (lot: MyLot) => {
    const defaultCurrency = getDefaultCurrencyForCountry(lot.origin?.country || user?.country);

    setEditLot(lot);
    setEditPriceCurrency(defaultCurrency);
    setEditReserveCurrency(defaultCurrency);
    setEditError("");
    setEditFieldErrors({});
    setEditForm({
      description: lot.description || "",
      listingMode: lot.listingMode || "AUCTION",
      startingPriceInr: lot.startingPriceInr !== null ? formatInputAmount(fromInrTo(lot.startingPriceInr, defaultCurrency)) : "",
      reservePriceInr: lot.reservePriceInr !== null ? formatInputAmount(fromInrTo(lot.reservePriceInr, defaultCurrency)) : "",
      auctionStartsAt: toLocalDateTimeInputValue(lot.auctionStartsAt),
      auctionEndsAt: toLocalDateTimeInputValue(lot.auctionEndsAt),
    });
  };

  const handleSave = async () => {
    if (!editLot || !accessToken) return;

    clearEditFeedback();

    const originalAuctionStartsAt = toLocalDateTimeInputValue(editLot.auctionStartsAt);
    const originalAuctionEndsAt = toLocalDateTimeInputValue(editLot.auctionEndsAt);
    const auctionValidation = getLotAuctionFieldErrors({
      listingMode: editForm.listingMode,
      startingPriceInr: editForm.startingPriceInr ? toInrFrom(parseFloat(editForm.startingPriceInr), editPriceCurrency) : undefined,
      reservePriceInr: editForm.reservePriceInr ? toInrFrom(parseFloat(editForm.reservePriceInr), editReserveCurrency) : undefined,
      auctionStartsAt: editForm.auctionStartsAt,
      auctionEndsAt: editForm.auctionEndsAt,
      requireFutureStart: !editLot.auctionStartsAt || editForm.auctionStartsAt !== originalAuctionStartsAt,
      requireFutureEnd: !editLot.auctionEndsAt || editForm.auctionEndsAt !== originalAuctionEndsAt,
    });

    if (hasLotAuctionFieldErrors(auctionValidation)) {
      const nextFieldErrors = Object.fromEntries(
        Object.entries(auctionValidation).map(([field, messages]) => [field, messages?.[0] ?? ""])
      );
      const message = getFirstLotAuctionError(auctionValidation) || "Review the auction settings before saving.";
      setEditFieldErrors(nextFieldErrors);
      setEditError(message);
      toast.error(message);
      return;
    }

    setIsSaving(true);

    try {
      const body: Record<string, unknown> = {
        description: editForm.description || undefined,
        listingMode: editForm.listingMode,
      };

      if (editForm.startingPriceInr) {
        body.startingPriceInr = toInrFrom(parseFloat(editForm.startingPriceInr), editPriceCurrency);
      }
      if (editForm.reservePriceInr) {
        body.reservePriceInr = toInrFrom(parseFloat(editForm.reservePriceInr), editReserveCurrency);
      }
      if (editForm.auctionStartsAt && editForm.auctionStartsAt !== originalAuctionStartsAt) {
        body.auctionStartsAt = new Date(editForm.auctionStartsAt).toISOString();
      }
      if (editForm.auctionEndsAt && editForm.auctionEndsAt !== originalAuctionEndsAt) {
        body.auctionEndsAt = new Date(editForm.auctionEndsAt).toISOString();
      }

      const res = await fetch(`/api/lots/${editLot.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = getApiErrorMessage(err, "Failed to update lot");
        setEditFieldErrors(getApiFieldErrors(err));
        setEditError(message);
        throw new Error(message);
      }

      toast.success(t("updateSuccess"));
      setEditLot(null);
      fetchLots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedUpdate"));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (lotId: string) => {
    if (!accessToken) return;
    setIsPublishing(true);

    // Find the lot to include its listing mode details
    const lot = lots.find((l) => l.id === lotId);
    if (!lot) return;

    try {
      const body: Record<string, unknown> = {
        listingMode: lot.listingMode,
      };

      if (lot.startingPriceInr) body.startingPriceInr = lot.startingPriceInr;
      if (lot.reservePriceInr) body.reservePriceInr = lot.reservePriceInr;
      if (lot.auctionStartsAt) body.auctionStartsAt = lot.auctionStartsAt;
      if (lot.auctionEndsAt) body.auctionEndsAt = lot.auctionEndsAt;

      const res = await fetch(`/api/lots/${lotId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(err, "Failed to publish lot"));
      }

      toast.success(t("publishSuccess"));
      fetchLots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish lot");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageUpload = async (lotId: string, file: File) => {
    if (!accessToken) return;
    setUploadingLotId(lotId);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/lots/${lotId}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(err, "Upload failed"));
      }

      toast.success("Image uploaded");
      fetchLots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingLotId(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const activeListingCount = lotOverview.listed + lotOverview.auctionActive;
  const editNeedsAuction = editForm.listingMode === "AUCTION" || editForm.listingMode === "BOTH";
  const minimumScheduleDate = getDateInputValue(getCurrentLocalDateTimeInputValue(1));
  const minimumAuctionEndDate = getDateInputValue(editForm.auctionStartsAt || getCurrentLocalDateTimeInputValue(1));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <MetricCard label={t("totalLots")} value={lotOverview.total} tone="slate" />
        <MetricCard label={t("awaitingSetup")} value={lotOverview.draft} tone="amber" />
        <MetricCard label={t("pendingReview")} value={lotOverview.pending} tone="rose" />
        <MetricCard label={t("activeListings")} value={activeListingCount} tone="olive" />
        <MetricCard label={t("redeemed") || "Redeemed"} value={lotOverview.redeemed} tone="teal" />
      </div>

      <Surface className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-stone-950 shrink-0">{t("filterAllStatuses")}</span>
          <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setCurrentPage(1); } }}>
            <SelectTrigger className="w-48 border-[#d9d1c2]">
              <SelectValue placeholder={t("filterAllStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterAllStatuses")}</SelectItem>
              <SelectItem value="DRAFT">{t("filterDraft")}</SelectItem>
              <SelectItem value="PENDING_APPROVAL">{t("filterPendingApproval")}</SelectItem>
              <SelectItem value="LISTED">{t("filterListed")}</SelectItem>
              <SelectItem value="AUCTION_ACTIVE">{t("filterAuctionActive")}</SelectItem>
              <SelectItem value="SOLD">{t("filterSold")}</SelectItem>
              <SelectItem value="REDEEMED">{t("filterRedeemed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Surface>

      {/* Error */}
      {error && !isLoading && (
        <ErrorState title="Could not load lots" message={error} onRetry={fetchLots} />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Surface key={i} className="animate-pulse p-5">
              <div className="flex gap-4">
                  <div className="h-24 w-24 shrink-0 bg-[#ece4d6]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-[#ece4d6]" />
                    <div className="h-3 w-1/2 bg-[#ece4d6]" />
                    <div className="h-3 w-1/4 bg-[#ece4d6]" />
                  </div>
              </div>
            </Surface>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && lots.length === 0 && (
        <Surface className="p-12 text-center sm:p-16">
            <ClipboardList className="w-12 h-12 text-sage-300 mx-auto mb-4" />
            <h2 className="font-heading text-sage-900 text-xl font-bold mb-2">
              {t("noLots")}
            </h2>
            <p className="text-sage-500 text-sm max-w-md mx-auto leading-relaxed">
              {t("noLotsDesc")}
            </p>
        </Surface>
      )}

      {/* Lots List */}
      {!isLoading && lots.length > 0 && (
        <div className="space-y-4">
          {lots.map((lot) => (
            <Surface key={lot.id} className="p-4 transition-colors hover:bg-[#fdfbf7] sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
                  <Link href={`/marketplace/${lot.id}`} className="block border border-[#ddd4c4] bg-[#f7f2e8]">
                    <div className="h-28 w-full overflow-hidden bg-linear-to-br from-sage-50 to-sage-100 sm:h-24">
                      {lot.primaryImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={lot.primaryImageUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CommodityIcon type={lot.commodityType} className="w-6 h-6 opacity-50" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="min-w-0 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-stone-950 flex items-center gap-2">
                            <CommodityIcon type={lot.commodityType} className="w-4 h-4" /> {COMMODITY_LABELS[lot.commodityType]}
                          </h3>
                          <Badge className={`text-xs ${STATUS_COLORS[lot.status]}`}>
                            {lot.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{lot.lotNumber}</p>
                        {lot.status === "DRAFT" && lot.adminRemarks && (
                          <div className="mt-3 border border-red-200 bg-red-50 px-3 py-2">
                            <p className="text-red-700 text-xs">
                              <span className="font-medium">Rejected:</span> {lot.adminRemarks}
                            </p>
                          </div>
                        )}
                      </div>
                      {lot.startingPriceInr && (
                        <p className="whitespace-nowrap text-lg font-semibold text-stone-950">
                          {display(lot.startingPriceInr)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                      <span>Grade {lot.grade}</span>
                      <span className="text-stone-300">/</span>
                      <span>{lot.quantityKg.toLocaleString()} kg</span>
                      <span className="text-stone-300">/</span>
                      <span>{formatDate(lot.createdAt)}</span>
                      {lot.bidCount > 0 && (
                        <>
                          <span className="text-stone-300">/</span>
                          <span>{lot.bidCount} bids</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-[#ece4d6] pt-4">
                      <Link
                        href={`/marketplace/${lot.id}`}
                        className="inline-flex h-10 items-center border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee]"
                      >
                        View
                      </Link>

                      {(lot.status === "LISTED" || lot.status === "DRAFT") && (
                        <button
                          onClick={() => openEdit(lot)}
                          className="inline-flex h-10 items-center border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee]"
                        >
                          Edit
                        </button>
                      )

                      }

                      {(lot.status === "DRAFT") && (
                        <button
                          onClick={() => handlePublish(lot.id)}
                          disabled={isPublishing}
                          className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#2f422e] disabled:opacity-50"
                        >
                          {lot.status === "DRAFT" ? "Resubmit for Approval" : "Submit for Approval"}
                        </button>
                      )}

                      {lot.status === "PENDING_APPROVAL" && (
                        <span className="inline-flex h-10 items-center border border-orange-200 bg-orange-50 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-700 gap-1">
                          <Loader className="w-3.5 h-3.5" /> Awaiting Admin Review
                        </span>
                      )}

                      {/* Image upload */}
                      {(lot.status === "LISTED" || lot.status === "DRAFT") && (
                        <label className="inline-flex h-10 cursor-pointer items-center gap-1 border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee]">
                          {uploadingLotId === lot.id ? t("uploading") : <><Camera className="w-3.5 h-3.5" /> {t("addImage")}</>}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={uploadingLotId === lot.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(lot.id, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
            </Surface>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-10 items-center border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Prev
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-10 min-w-10 border px-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  page === currentPage
                    ? "border-[#405742] bg-[#405742] text-white"
                    : "border-[#d7cfbf] bg-white text-stone-700 hover:bg-[#faf6ee]"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-10 items-center border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
      {!isLoading && totalPages > 0 && (
        <p className="text-center text-xs text-sage-400">
          Showing {lots.length} of {totalCount} lot{totalCount !== 1 ? "s" : ""}
        </p>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editLot} onOpenChange={(open) => !open && setEditLot(null)}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              Edit Lot — {editLot?.lotNumber}
            </DialogTitle>
          </DialogHeader>

          {editLot && (
            <div className="space-y-4 mt-4">
              {editLot.status === "LISTED" && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Lot is live — only price and auction schedule can be changed.
                </p>
              )}

              {editError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Description — DRAFT only */}
              {editLot.status === "DRAFT" && (
                <div>
                  <Label className="text-sage-700 text-sm">Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => {
                      setEditForm({ ...editForm, description: e.target.value });
                      clearEditFeedback();
                    }}
                    placeholder="Describe your commodity lot..."
                    className="mt-1 rounded-xl border-sage-200"
                    rows={3}
                  />
                </div>
              )}

              {/* Listing Mode — DRAFT only */}
              {editLot.status === "DRAFT" && (
                <div>
                  <Label className="text-sage-700 text-sm">Listing Mode</Label>
                  <Select
                    value={editForm.listingMode}
                    onValueChange={(v) => {
                      if (!v) return;
                      setEditForm({ ...editForm, listingMode: v });
                      clearEditFeedback("startingPriceInr", "reservePriceInr", "auctionStartsAt", "auctionEndsAt");
                    }}
                  >
                    <SelectTrigger className="mt-1 rounded-xl border-sage-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUCTION">Auction</SelectItem>
                      <SelectItem value="RFQ">RFQ</SelectItem>
                      <SelectItem value="BOTH">Auction + RFQ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sage-700 text-sm">
                    {editNeedsAuction ? t("startingPrice") : t("price")}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.startingPriceInr}
                      onChange={(e) => {
                        setEditForm({ ...editForm, startingPriceInr: e.target.value });
                        clearEditFeedback("startingPriceInr", "reservePriceInr");
                      }}
                      placeholder="0.00"
                      className="rounded-xl border-sage-200 flex-1"
                    />
                    <select
                      value={editPriceCurrency}
                      onChange={(e) => {
                        const nextCurrency = e.target.value as CurrencyCode;
                        setEditForm((prev) => ({
                          ...prev,
                          startingPriceInr: convertInputCurrency(prev.startingPriceInr, editPriceCurrency, nextCurrency),
                        }));
                        setEditPriceCurrency(nextCurrency);
                        clearEditFeedback("startingPriceInr", "reservePriceInr");
                      }}
                      className="px-3 py-2 border border-sage-200 rounded-xl text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                    >
                      {CURRENCY_OPTIONS.map((currency) => (
                        <option key={currency.code} value={currency.code}>{currency.label}</option>
                      ))}
                    </select>
                  </div>
                  {editFieldErrors.startingPriceInr && (
                    <p className="text-xs text-red-700 mt-1">{editFieldErrors.startingPriceInr}</p>
                  )}
                </div>
                {editNeedsAuction && (
                  <div>
                    <Label className="text-sage-700 text-sm">{t("reservePrice")}</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.reservePriceInr}
                        onChange={(e) => {
                          setEditForm({ ...editForm, reservePriceInr: e.target.value });
                          clearEditFeedback("reservePriceInr");
                        }}
                        placeholder="Optional"
                        className="rounded-xl border-sage-200 flex-1"
                      />
                      <select
                        value={editReserveCurrency}
                        onChange={(e) => {
                          const nextCurrency = e.target.value as CurrencyCode;
                          setEditForm((prev) => ({
                            ...prev,
                            reservePriceInr: convertInputCurrency(prev.reservePriceInr, editReserveCurrency, nextCurrency),
                          }));
                          setEditReserveCurrency(nextCurrency);
                          clearEditFeedback("reservePriceInr");
                        }}
                        className="px-3 py-2 border border-sage-200 rounded-xl text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                      >
                        {CURRENCY_OPTIONS.map((currency) => (
                          <option key={currency.code} value={currency.code}>{currency.label}</option>
                        ))}
                      </select>
                    </div>
                    {editFieldErrors.reservePriceInr && (
                      <p className="text-xs text-red-700 mt-1">{editFieldErrors.reservePriceInr}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Auction Schedule */}
              {editNeedsAuction && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sage-700 text-sm">{t("auctionStarts")}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="date"
                        min={minimumScheduleDate}
                        value={getDateInputValue(editForm.auctionStartsAt)}
                        onChange={(e) => {
                          setEditForm({
                            ...editForm,
                            auctionStartsAt: mergeDateAndTime(e.target.value, getTimeInputValue(editForm.auctionStartsAt, "09:00"), "09:00"),
                          });
                          clearEditFeedback("auctionStartsAt", "auctionEndsAt");
                        }}
                        className="rounded-xl border-sage-200"
                      />
                      <Select
                        value={getTimeInputValue(editForm.auctionStartsAt)}
                        onValueChange={(v) => {
                          setEditForm({
                            ...editForm,
                            auctionStartsAt: mergeDateAndTime(getDateInputValue(editForm.auctionStartsAt ?? ""), v, "09:00"),
                          });
                          clearEditFeedback("auctionStartsAt", "auctionEndsAt");
                        }}
                      >
                        <SelectTrigger className="rounded-xl border-sage-200">
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {TIME_SLOTS.map((t) => (
                            <SelectItem key={t} value={t}>{fmtTime(t)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {editFieldErrors.auctionStartsAt && (
                      <p className="text-xs text-red-700 mt-1">{editFieldErrors.auctionStartsAt}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sage-700 text-sm">{t("auctionEnds")}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="date"
                        min={minimumAuctionEndDate}
                        value={getDateInputValue(editForm.auctionEndsAt)}
                        onChange={(e) => {
                          setEditForm({
                            ...editForm,
                            auctionEndsAt: mergeDateAndTime(e.target.value, getTimeInputValue(editForm.auctionEndsAt, "18:00"), "18:00"),
                          });
                          clearEditFeedback("auctionEndsAt");
                        }}
                        className="rounded-xl border-sage-200"
                      />
                      <Select
                        value={getTimeInputValue(editForm.auctionEndsAt)}
                        onValueChange={(v) => {
                          setEditForm({
                            ...editForm,
                            auctionEndsAt: mergeDateAndTime(getDateInputValue(editForm.auctionEndsAt ?? ""), v, "18:00"),
                          });
                          clearEditFeedback("auctionEndsAt");
                        }}
                      >
                        <SelectTrigger className="rounded-xl border-sage-200">
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {TIME_SLOTS.map((t) => (
                            <SelectItem key={t} value={t}>{fmtTime(t)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {editFieldErrors.auctionEndsAt && (
                      <p className="text-xs text-red-700 mt-1">{editFieldErrors.auctionEndsAt}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditLot(null)}
                  className="px-5 py-2.5 text-sm font-medium text-sage-600 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-sage-700 rounded-full hover:bg-sage-800 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
