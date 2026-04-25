"use client";

import { useState, useEffect, use, useCallback } from "react";
import type { CurrencyCode } from "@/generated/prisma/client";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api-errors";
import { CURRENCY_OPTIONS } from "@/lib/currency-config";
import { useRouter, Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/console-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BidPanel } from "@/components/bid-panel";
import { AuctionCountdown } from "@/components/auction-countdown";
import { SkeletonLotDetail } from "@/components/ui/skeleton";
import { CommodityIcon, COMMODITY_LABELS } from "@/lib/commodity-icons";
import { Trophy, Video, FileText, FlaskConical, ClipboardList, TestTubes, Leaf, MapPin, Crown, Tag, Send, CheckCircle2, Lock, LogIn, AlertTriangle, Eye } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";
import type { AuctionBid } from "@/lib/use-auction-socket";

const STATUS_COLORS: Record<string, string> = {
  INTAKE: "bg-amber-100 text-amber-800",
  LISTED: "bg-blue-100 text-blue-800",
  AUCTION_ACTIVE: "bg-green-100 text-green-800",
  SOLD: "bg-purple-100 text-purple-800",
  REDEEMED: "bg-sage-100 text-sage-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-amber-100 text-amber-800",
  UNGRADED: "bg-gray-100 text-gray-600",
};

interface LotDetail {
  id: string;
  lotNumber: string;
  commodityType: string;
  grade: string;
  quantityKg: number;
  description: string | null;
  images: { key: string; url: string }[];
  videos: { key: string; url: string }[];
  origin: { country?: string; state?: string; district?: string };
  status: string;
  listingMode: string;
  startingPriceInr: number | null;
  reservePriceInr: number | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  seller: { id: string; name: string; country: string } | null;
  farmer: { id: string; name: string; country: string } | null;
  warehouse: { id: string; name: string; country: string; state: string | null; district: string | null } | null;
  qualityCheck: {
    moisturePct: number | null;
    podSizeMm: number | null;
    colourGrade: string | null;
    labCertUrl: string | null;
    inspectedBy: string;
    inspectedAt: string;
    notes: string | null;
  } | null;
  complianceDocs: {
    labReportUrl: string | null;
    phytosanitaryUrl: string | null;
    originCertUrl: string | null;
    sellerDeclaration: string | null;
  } | null;
  qrCode: { id: string; qrImageUrl: string; qrData: string; qrImageSignedUrl: string | null } | null;
  bids: { id: string; amountInr: number; createdAt: string; bidder: { name: string; country: string } }[];
  bidCount: number;
  winnerTransaction: { id: string; buyerId: string; status: string } | null;
}

export default function LotDetailPage({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  const t = useTranslations("marketplace");
  const tBid = useTranslations("bidding");
  const { user, accessToken } = useAuth();
  const router = useRouter();

  const [lot, setLot] = useState<LotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Periodically refresh bids for the Bids tab (must be before early returns)
  // Use ref to avoid re-rendering the BidPanel (which would steal focus from bid input)
  const [liveBids, setLiveBids] = useState<LotDetail["bids"]>([]);
  const [liveBidCount, setLiveBidCount] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const isAuctionActive = lot?.status === "AUCTION_ACTIVE";

  // RFQ modal state
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [rfqDeliveryCountry, setRfqDeliveryCountry] = useState("");
  const [rfqDeliveryCity, setRfqDeliveryCity] = useState("");
  const [rfqDescription, setRfqDescription] = useState("");
  const [rfqTargetPrice, setRfqTargetPrice] = useState("");
  const [rfqTargetCurrency, setRfqTargetCurrency] = useState<CurrencyCode>("INR");
  const [rfqQuantityKg, setRfqQuantityKg] = useState("");
  const [rfqExpiresInDays, setRfqExpiresInDays] = useState("7");
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccess, setRfqSuccess] = useState(false);
  const [createdRfqId, setCreatedRfqId] = useState<string | null>(null);
  const [rfqError, setRfqError] = useState("");
  const [rfqFieldErrors, setRfqFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchLot = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/lots/${lotId}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("Lot not found");
            router.push("/marketplace");
            return;
          }
          throw new Error("Failed to fetch");
        }
        const data = await res.json();
        setLot(data.lot);
        setLiveBids(data.lot.bids || []);
        setLiveBidCount(data.lot.bidCount || 0);
      } catch {
        toast.error("Failed to load lot details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLot();
  }, [lotId, router]);

  useEffect(() => {
    if (!isAuctionActive) return;
    // Lightweight safety-net poll (socket is the primary source). Runs only while
    // viewer sits on a live auction AND the browser tab is visible.
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/bids?lotId=${lotId}`);
          if (res.ok) {
            const data = await res.json();
            setLiveBids(data.bids?.slice(0, 20) || []);
            if (data.totalBids !== undefined) setLiveBidCount(data.totalBids);
          }
        } catch { /* silent */ }
      }, 20000);
    };
    const stop = () => { if (interval) { clearInterval(interval); interval = null; } };
    const onVis = () => { if (document.visibilityState === "visible") start(); else stop(); };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [lotId, isAuctionActive]);

  // Real-time socket subscription — drives the Bids tab AND the winner banner
  // instantly so the lot page stays in sync with BidPanel without duplicate data fetches.
  const handleSocketNewBid = useCallback((bid: AuctionBid) => {
    setLiveBids((prev) => {
      if (prev.some((b) => b.id === bid.id)) return prev;
      const next = [{
        id: bid.id,
        amountInr: bid.amountInr,
        createdAt: typeof bid.createdAt === "string" ? bid.createdAt : new Date(bid.createdAt).toISOString(),
        bidder: { name: bid.bidder.name, country: bid.bidder.country ?? "" },
      }, ...prev];
      next.sort((a, b) => b.amountInr - a.amountInr);
      return next.slice(0, 20);
    });
    setLiveBidCount((prev) => prev + 1);
  }, []);

  const handleSocketAuctionEnded = useCallback(
    (data: { lotId: string; outcome: string; winnerId?: string; winningAmount?: number }) => {
      if (data.lotId !== lotId) return;
      // Optimistic update so the winner banner appears instantly.
      setLot((prev) => {
        if (!prev) return prev;
        if (data.outcome === "SOLD" && data.winnerId) {
          return {
            ...prev,
            status: "SOLD",
            winnerTransaction: prev.winnerTransaction ?? {
              id: "",
              buyerId: data.winnerId,
              status: "PENDING",
            },
          };
        }
        return { ...prev, status: data.outcome === "NO_BIDS" || data.outcome === "BELOW_RESERVE" ? "LISTED" : prev.status };
      });
      // Background refetch to pick up the real transaction id for the payment CTA.
      void (async () => {
        try {
          const res = await fetch(`/api/lots/${lotId}`);
          if (res.ok) {
            const body = await res.json();
            setLot(body.lot);
            setLiveBids(body.lot.bids || []);
            setLiveBidCount(body.lot.bidCount || 0);
          }
        } catch { /* silent */ }
      })();
    },
    [lotId]
  );

  // Watch the auction start time — flip visual state to LIVE the instant
  // auctionStartsAt is reached even if the server-side cron hasn't run yet.
  useEffect(() => {
    if (!lot || lot.status !== "LISTED" || !lot.auctionStartsAt || !lot.auctionEndsAt) return;
    const startMs = new Date(lot.auctionStartsAt).getTime();
    const endMs = new Date(lot.auctionEndsAt).getTime();
    const now = Date.now();
    if (now >= endMs) return;
    if (now >= startMs) {
      setLot((prev) => (prev ? { ...prev, status: "AUCTION_ACTIVE" } : prev));
      return;
    }
    const timeout = setTimeout(() => {
      setLot((prev) => (prev ? { ...prev, status: "AUCTION_ACTIVE" } : prev));
      // Refetch shortly after to sync authoritative DB state.
      void fetch(`/api/lots/${lotId}`).then((r) => r.ok ? r.json() : null).then((body) => {
        if (body?.lot) { setLot(body.lot); setLiveBids(body.lot.bids || []); setLiveBidCount(body.lot.bidCount || 0); }
      }).catch(() => undefined);
    }, Math.max(0, startMs - now));
    return () => clearTimeout(timeout);
  }, [lot, lotId]);

  const { display, selectedCurrency, toInrFrom } = useCurrency();
  const formatPrice = (price: number | null) => {
    if (!price) return "—";
    return display(price);
  };

  const clearRfqFeedback = (...fields: string[]) => {
    setRfqError("");
    setRfqFieldErrors((prev) => {
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (isLoading) {
    return <SkeletonLotDetail />;
  }

  if (!lot) return null;

  const isOwner = user?.id === lot.seller?.id;
  const isRfqOnly = lot.listingMode === "RFQ";
  const originParts = [lot.origin?.district, lot.origin?.state, lot.origin?.country].filter(Boolean);

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${COMMODITY_LABELS[lot.commodityType] || lot.commodityType} — Grade ${lot.grade}`,
    description: lot.description || `${lot.quantityKg.toLocaleString()} kg of Grade ${lot.grade} ${COMMODITY_LABELS[lot.commodityType] || lot.commodityType}`,
    sku: lot.lotNumber,
    ...(lot.images.length > 0 ? { image: lot.images[0]?.url } : {}),
    offers: lot.startingPriceInr ? {
      "@type": "Offer",
      price: lot.startingPriceInr,
      priceCurrency: "INR",
      availability: lot.status === "LISTED" || lot.status === "AUCTION_ACTIVE"
        ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    } : undefined,
    brand: { "@type": "Organization", name: "Krishibridge" },
    category: COMMODITY_LABELS[lot.commodityType] || lot.commodityType,
    weight: { "@type": "QuantitativeValue", value: lot.quantityKg, unitCode: "KGM" },
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${COMMODITY_LABELS[lot.commodityType]} — ${lot.lotNumber}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleOpenRfqModal = () => {
    if (!lot) return;
    setRfqQuantityKg(String(lot.quantityKg));
    setRfqDeliveryCountry("");
    setRfqDeliveryCity("");
    setRfqDescription("");
    setRfqTargetPrice("");
    setRfqTargetCurrency(selectedCurrency);
    setRfqExpiresInDays("7");
    setRfqSuccess(false);
    setCreatedRfqId(null);
    setRfqError("");
    setRfqFieldErrors({});
    setShowRfqModal(true);
  };

  const handleSubmitRfq = async () => {
    if (!accessToken || !lot) return;

    clearRfqFeedback();

    if (rfqTargetPrice && parseFloat(rfqTargetPrice) <= 0) {
      const message = "Target price must be greater than zero.";
      setRfqFieldErrors({ targetPriceInr: message });
      setRfqError(message);
      toast.error(message);
      return;
    }

    setRfqSubmitting(true);
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          commodityType: lot.commodityType,
          grade: lot.grade !== "UNGRADED" ? lot.grade : undefined,
          quantityKg: parseFloat(rfqQuantityKg),
          targetPriceInr: rfqTargetPrice ? toInrFrom(parseFloat(rfqTargetPrice), rfqTargetCurrency) : undefined,
          targetCurrency: rfqTargetPrice ? rfqTargetCurrency : undefined,
          deliveryCountry: rfqDeliveryCountry,
          deliveryCity: rfqDeliveryCity.trim(),
          description: rfqDescription.trim() || undefined,
          expiresInDays: parseInt(rfqExpiresInDays, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = getApiErrorMessage(data, "Failed to create RFQ. Please try again.");
        setRfqFieldErrors(getApiFieldErrors(data));
        setRfqError(message);
        toast.error(message);
        return;
      }
      setRfqSuccess(true);
      setCreatedRfqId(data.rfq?.id || null);
      toast.success("RFQ submitted successfully! You'll be notified when sellers respond.");
    } catch {
      const message = "Failed to create RFQ. Please try again.";
      setRfqError(message);
      toast.error(message);
    } finally {
      setRfqSubmitting(false);
    }
  };

  const RFQ_COUNTRIES = [
    { code: "IN", label: "India" },
    { code: "NP", label: "Nepal" },
    { code: "BT", label: "Bhutan" },
    { code: "AE", label: "UAE" },
    { code: "SA", label: "Saudi Arabia" },
    { code: "OM", label: "Oman" },
  ];

  const canSubmitRfq = rfqDeliveryCountry && rfqDeliveryCity.trim().length > 0 && parseFloat(rfqQuantityKg) > 0;

  return (
    <div className="space-y-6">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className={`flex items-center justify-between text-sm text-sage-500 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
          <Link href="/marketplace" className="hover:text-sage-700 transition-colors">
            {t("breadcrumbMarketplace")}
          </Link>
          <span>/</span>
          <span className="text-sage-900 font-medium">{lot.lotNumber}</span>
        </div>
      </nav>

      {/* Hero: Image Gallery + Lot Insights side-by-side on xl */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] xl:items-start">
      <Card className="overflow-hidden border-[#ddd4c4]">
        <CardContent className="p-0">
          <div className="relative h-64 bg-linear-to-br from-sage-50 to-sage-100 sm:h-96 xl:h-104">
            {lot.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lot.images[activeImage]?.url}
                alt={`${lot.lotNumber} image ${activeImage + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CommodityIcon type={lot.commodityType} className="w-16 h-16 opacity-40" />
              </div>
            )}

            <div className={`absolute top-4 ${isRtl ? "right-4" : "left-4"} flex flex-wrap gap-2`}>
              <Badge className={`${STATUS_COLORS[lot.status] || "bg-gray-100 text-gray-700"} text-xs`}>
                {lot.status.replace("_", " ")}
              </Badge>
              <Badge className="bg-white/90 text-stone-700 text-xs backdrop-blur-sm">{lot.lotNumber}</Badge>
            </div>
          </div>

          {lot.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-[#ece4d6] p-4">
              {lot.images.map((img, i) => (
                <button
                  key={img.key}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 h-16 w-16 overflow-hidden border-2 transition-colors ${
                    i === activeImage ? "border-[#405742]" : "border-[#ece4d6] hover:border-[#8a9b79]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards beside image on xl screens — important lot actions live here once */}
      <div className="space-y-4">
        {/* Commercial Terms */}
        <Card className={isRfqOnly ? "border-[#b6c6a2] bg-linear-to-br from-[#f4f7ee] to-[#eef3e3]" : "border-[#ddd4c4]"}>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                {isRfqOnly ? "Quote-based sourcing" : "Commercial terms"}
              </p>
              {isRfqOnly ? (
                <>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#405742]" />
                    <h2 className="text-xl font-semibold text-stone-950">Request for Quote</h2>
                  </div>
                  {lot.startingPriceInr ? (
                    <p className="mt-2 text-xs text-stone-500">
                      Indicative: <span className="font-semibold text-stone-700">{formatPrice(lot.startingPriceInr)}</span>
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
            <div className="grid gap-2 border-t border-[#ece4d6] pt-3 text-sm text-stone-600">
              {lot.reservePriceInr ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs">Reserve</span>
                  <span className="font-semibold text-stone-950">{formatPrice(lot.reservePriceInr)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">Quantity</span>
                <span className="font-semibold text-stone-950">{lot.quantityKg.toLocaleString()} kg</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">Origin</span>
                <span className="max-w-[62%] truncate text-right font-semibold text-stone-950">{originParts.join(", ") || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">Warehouse</span>
                <span className="max-w-[62%] truncate text-right font-semibold text-stone-950">{lot.warehouse?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">Listed</span>
                <span className="font-semibold text-stone-950">{formatDate(lot.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isRfqOnly && (lot.listingMode === "AUCTION" || lot.listingMode === "BOTH") && (() => {
          const now = Date.now();
          const startsMs = lot.auctionStartsAt ? new Date(lot.auctionStartsAt).getTime() : null;
          const endsMs = lot.auctionEndsAt ? new Date(lot.auctionEndsAt).getTime() : null;
          const isUpcoming = !!startsMs && now < startsMs && lot.status !== "SOLD" && lot.status !== "CANCELLED";
          const isEnded = lot.status === "SOLD" || lot.status === "CANCELLED" || (!!endsMs && now >= endsMs);
          const isLiveNow = !isUpcoming && !isEnded;
          const cardClass = isEnded
            ? "border-stone-200 bg-linear-to-br from-stone-50 to-stone-100"
            : isUpcoming
              ? "border-sky-200 bg-linear-to-br from-sky-50 to-indigo-50"
              : "border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50";
          const dotClass = isEnded ? "bg-stone-400" : isUpcoming ? "bg-sky-500" : "bg-emerald-500";
          const pingClass = isUpcoming ? "bg-sky-400" : "bg-emerald-400";
          const labelClass = isEnded ? "text-stone-600" : isUpcoming ? "text-sky-700" : "text-emerald-700";
          const mutedClass = isEnded ? "text-stone-700/80" : isUpcoming ? "text-sky-900/70" : "text-emerald-900/80";
          const statusLabel = isEnded ? tBid("auctionEnded") : isUpcoming ? t("auctionUpcoming") : t("statusLive");

          return (
            <Card className={cardClass}>
              <CardContent className="space-y-3 pt-5 pb-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      {!isEnded && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${pingClass}`} />}
                      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotClass}`} />
                    </span>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${labelClass}`}>{statusLabel}</p>
                  </div>
                  {viewerCount > 0 && (
                    <span className={`flex shrink-0 items-center gap-1 text-[11px] ${mutedClass}`}>
                      <Eye className="h-3.5 w-3.5" /> {tBid("watching", { count: viewerCount })}
                    </span>
                  )}
                </div>

                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${labelClass}`}>
                    {liveBids.length > 0 ? t("highestLiveBid") : t("startingPrice")}
                  </p>
                  <p className="font-heading mt-1 text-3xl font-bold text-stone-950">
                    {liveBids.length > 0 && liveBids[0] ? formatPrice(liveBids[0].amountInr) : formatPrice(lot.startingPriceInr)}
                  </p>
                  <div className={`mt-1 flex items-center justify-between gap-3 text-xs ${mutedClass}`}>
                    <span>{liveBidCount === 1 ? `${liveBidCount} bid placed` : `${liveBidCount} bids placed`}</span>
                    {liveBids.length > 0 && liveBids[0] && (
                      <span className="max-w-[50%] truncate text-right">by {liveBids[0].bidder.name}</span>
                    )}
                  </div>
                </div>

                {isUpcoming && lot.auctionStartsAt && (
                  <div className="border-t border-sky-200/60 pt-3">
                    <p className={`mb-1 text-[11px] ${mutedClass}`}>{formatDate(lot.auctionStartsAt)}</p>
                    <AuctionCountdown endsAt={lot.auctionStartsAt} />
                  </div>
                )}
                {isLiveNow && lot.auctionEndsAt && (
                  <div className="border-t border-emerald-200/60 pt-3">
                    <p className={`mb-1 text-[11px] ${mutedClass}`}>{t("auctionEndsIn")}</p>
                    <AuctionCountdown endsAt={lot.auctionEndsAt} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {(lot.listingMode === "RFQ" || lot.listingMode === "BOTH") && (
          <Card className="border-[#ddd4c4]">
            <CardContent className="space-y-3 pt-6">
              <h3 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-sage-900">Request for Quote</h3>
              {lot.listingMode === "BOTH" && lot.status === "AUCTION_ACTIVE" ? (
                <div className="border border-[#ece4d6] bg-[#f8f4ec] p-4 text-center">
                  <Tag className="mx-auto mb-1 h-6 w-6 text-sage-300" />
                  <p className="text-sm font-medium text-sage-700">Auction In Progress</p>
                  <p className="mt-1 text-xs text-sage-500">RFQ available when auction ends</p>
                </div>
              ) : !user ? (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 border border-[#405742] py-3 text-sm font-medium text-[#405742] transition-colors hover:bg-[#f3f7f1]"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in to Request Quote
                </Link>
              ) : user.role !== "BUYER" ? (
                <div className="border border-[#ece4d6] bg-[#f8f4ec] p-4 text-center">
                  <Lock className="mx-auto mb-1 h-5 w-5 text-sage-300" />
                  <p className="text-sm text-sage-500">Only buyers can request quotes</p>
                </div>
              ) : user.kycStatus !== "APPROVED" ? (
                <div className="border border-amber-100 bg-amber-50 p-4 text-center">
                  <ClipboardList className="mx-auto mb-1 h-5 w-5 text-amber-400" />
                  <p className="text-sm text-amber-700">Complete KYC verification to request quotes</p>
                  <Link href="/dashboard/kyc" className="mt-1 inline-block text-xs text-amber-600 underline">
                    Complete KYC →
                  </Link>
                </div>
              ) : isOwner ? (
                <div className="border border-[#ece4d6] bg-[#f8f4ec] p-4 text-center">
                  <p className="text-sm text-sage-500">You own this lot</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-sage-500">Submit a request for quote and sellers will respond with competitive offers.</p>
                  <button
                    onClick={handleOpenRfqModal}
                    className="flex w-full items-center justify-center gap-2 border border-[#405742] bg-[#405742] py-3 text-sm font-medium text-white transition-colors hover:bg-[#2f422e]"
                  >
                    <Send className="h-4 w-4" />
                    Request Quote
                  </button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      </div>

      <PageHeader
        eyebrow={isRfqOnly ? t("rfqSourcingDesk") : lot.listingMode === "BOTH" ? t("hybridListing") : t("auctionListing")}
        title={COMMODITY_LABELS[lot.commodityType] || lot.commodityType}
        description={`${t("lotPrefix")} ${lot.lotNumber} • ${lot.quantityKg.toLocaleString()} kg • ${originParts.join(", ") || t("originPending")}`}
        action={
          <button
            onClick={handleShare}
            className="inline-flex h-10 items-center border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee]"
          >
            {t("shareListing")}
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge className={`${STATUS_COLORS[lot.status] || "bg-gray-100 text-gray-700"} text-xs`}>
          {lot.status.replace("_", " ")}
        </Badge>
        <Badge className={`text-xs ${GRADE_COLORS[lot.grade] || GRADE_COLORS.UNGRADED}`}>
          {t("gradeLabel")} {lot.grade}
        </Badge>
        <Badge className="bg-white text-stone-700 text-xs border border-[#d7cfbf]">
          {lot.listingMode === "RFQ" ? t("rfqMode") : lot.listingMode === "BOTH" ? t("auctionRfqMode") : t("auctionMode")}
        </Badge>
      </div>

      {/* Winner Banner — shown to buyer who won the auction */}
      {lot.status === "SOLD" && lot.winnerTransaction && user?.id === lot.winnerTransaction.buyerId && (
        <Card className="border-emerald-300 bg-linear-to-r from-emerald-50 to-green-50 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-emerald-900 font-heading font-bold text-lg">Congratulations! You Won This Auction</p>
                  <p className="text-emerald-700 text-sm mt-1">
                    {lot.winnerTransaction.status === "PENDING"
                      ? "Please complete your payment to secure this commodity."
                      : lot.winnerTransaction.status === "MANUAL_CONFIRMED"
                        ? "Your payment has been confirmed. Processing in progress."
                        : "Payment received. Your commodity token will be issued shortly."}
                  </p>
                </div>
              </div>
              {lot.winnerTransaction.status === "PENDING" && lot.winnerTransaction.id && (
                <Link
                  href={`/dashboard/payments/${lot.winnerTransaction.id}`}
                  className="inline-flex h-10 items-center border border-emerald-700 bg-emerald-700 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-800 whitespace-nowrap"
                >
                  Complete Payment →
                </Link>
              )}
              {lot.winnerTransaction.status === "PENDING" && !lot.winnerTransaction.id && (
                <span className="inline-flex h-10 items-center border border-emerald-700 bg-emerald-700/70 px-6 text-sm font-medium text-white whitespace-nowrap">
                  Preparing payment…
                </span>
              )}
              {lot.winnerTransaction.status !== "PENDING" && lot.winnerTransaction.id && (
                <Link
                  href={`/dashboard/payments/${lot.winnerTransaction.id}`}
                  className="inline-flex h-10 items-center border border-emerald-300 px-6 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 whitespace-nowrap"
                >
                  View Payment Details →
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        {/* Left: Details and tabs */}
        <div>
          {/* Video Gallery */}
          {lot.videos && lot.videos.length > 0 && (
            <Card className="border-[#ddd4c4]">
              <CardContent className="pt-5 pb-5">
                <h3 className="font-heading text-sage-900 font-bold text-sm mb-3 flex items-center gap-1.5 uppercase tracking-[0.14em]">
                  <Video className="w-5 h-5" /> Videos ({lot.videos.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lot.videos.map((video) => (
                    <video
                      key={video.key}
                      src={video.url}
                      controls
                      preload="metadata"
                      className="w-full aspect-video border border-[#ddd4c4] bg-black"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs: Quality / Bids / QR (Bids tab only for auction-capable lots) */}
          <Tabs defaultValue={isRfqOnly ? "quality" : "bids"} className="mt-6">
            <TabsList className={`grid h-auto ${isRfqOnly ? "grid-cols-2" : "grid-cols-3"} border border-[#ddd4c4] bg-white p-1`}>
              <TabsTrigger value="quality" className="text-sm">Quality Report</TabsTrigger>
              {!isRfqOnly && (
                <TabsTrigger value="bids" className="text-sm">Bids ({liveBidCount})</TabsTrigger>
              )}
              <TabsTrigger value="qr" className="text-sm">QR Code</TabsTrigger>
            </TabsList>

            <TabsContent value="quality">
              <Card className="mt-4 border-[#ddd4c4]">
                <CardContent className="pt-6">
                  {lot.qualityCheck ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {lot.qualityCheck.moisturePct !== null && (
                          <div className="border border-[#ece4d6] bg-[#f8f4ec] p-4 text-center">
                            <p className="text-xs text-sage-500 mb-1">Moisture</p>
                            <p className="font-heading text-sage-900 font-bold text-lg">
                              {lot.qualityCheck.moisturePct}%
                            </p>
                          </div>
                        )}
                        {lot.qualityCheck.podSizeMm !== null && (
                          <div className="border border-[#ece4d6] bg-[#f8f4ec] p-4 text-center">
                            <p className="text-xs text-sage-500 mb-1">Pod Size</p>
                            <p className="font-heading text-sage-900 font-bold text-lg">
                              {lot.qualityCheck.podSizeMm} mm
                            </p>
                          </div>
                        )}
                        {lot.qualityCheck.colourGrade && (
                          <div className="border border-[#ece4d6] bg-[#f8f4ec] p-4 text-center">
                            <p className="text-xs text-sage-500 mb-1">Colour Grade</p>
                            <p className="font-heading text-sage-900 font-bold text-lg">
                              {lot.qualityCheck.colourGrade}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Show placeholder if no quality metrics at all */}
                      {lot.qualityCheck.moisturePct === null && lot.qualityCheck.podSizeMm === null && !lot.qualityCheck.colourGrade && (
                        <div className="text-center py-4">
                          <p className="text-sage-400 text-sm">Quality metrics not yet recorded</p>
                        </div>
                      )}

                      {lot.qualityCheck.notes && (
                        <div className="border border-[#ece4d6] bg-[#f8f4ec] p-4">
                          <p className="text-xs text-sage-500 mb-1">Inspector Notes</p>
                          <p className="text-sm text-sage-700">{lot.qualityCheck.notes}</p>
                        </div>
                      )}

                      {lot.qualityCheck.inspectedBy && (
                        <div className="flex items-center gap-4 pt-2 text-xs text-sage-400">
                          <span>Inspected by: {lot.qualityCheck.inspectedBy}</span>
                          {lot.qualityCheck.inspectedAt && <span>{formatDate(lot.qualityCheck.inspectedAt)}</span>}
                        </div>
                      )}

                      {lot.qualityCheck.labCertUrl && (
                        <a
                          href={lot.qualityCheck.labCertUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-sage-700 hover:text-sage-900 font-medium"
                        >
                          <FileText className="w-4 h-4" /> View Lab Certificate
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-2">
                      <FlaskConical className="w-8 h-8 text-sage-300 mx-auto" />
                      <p className="text-sage-700 text-sm font-medium">Quality inspection pending</p>
                      <p className="text-sage-400 text-xs">Our team will inspect this lot and publish the quality report here.</p>
                    </div>
                  )}

                  {/* Compliance Documents */}
                  {lot.complianceDocs && (lot.complianceDocs.labReportUrl || lot.complianceDocs.phytosanitaryUrl || lot.complianceDocs.originCertUrl || lot.complianceDocs.sellerDeclaration) && (
                    <div className="mt-6 pt-6 border-t border-sage-100">
                      <h4 className="font-heading text-sage-900 font-bold text-sm mb-3 flex items-center gap-1.5"><ClipboardList className="w-5 h-5" /> Compliance Documents</h4>
                      <div className="space-y-2">
                        {lot.complianceDocs.labReportUrl && (
                          <a href={lot.complianceDocs.labReportUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 border border-[#ece4d6] bg-[#f8f4ec] p-3 text-sm text-sage-700 hover:text-sage-900">
                            <TestTubes className="w-3.5 h-3.5" /> Lab Report
                          </a>
                        )}
                        {lot.complianceDocs.phytosanitaryUrl && (
                          <a href={lot.complianceDocs.phytosanitaryUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 border border-[#ece4d6] bg-[#f8f4ec] p-3 text-sm text-sage-700 hover:text-sage-900">
                            <Leaf className="w-3.5 h-3.5" /> Phytosanitary Certificate
                          </a>
                        )}
                        {lot.complianceDocs.originCertUrl && (
                          <a href={lot.complianceDocs.originCertUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 border border-[#ece4d6] bg-[#f8f4ec] p-3 text-sm text-sage-700 hover:text-sage-900">
                            <MapPin className="w-3.5 h-3.5" /> Certificate of Origin
                          </a>
                        )}
                        {lot.complianceDocs.sellerDeclaration && (
                          <div className="border border-[#ece4d6] bg-[#f8f4ec] p-3">
                            <p className="text-xs text-sage-500 mb-1">Seller Declaration</p>
                            <p className="text-sm text-sage-700">{lot.complianceDocs.sellerDeclaration}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bids">
              <Card className="mt-4 border-[#ddd4c4]">
                <CardContent className="pt-6">
                  {liveBids.length > 0 ? (
                    <div className="space-y-3">
                      {liveBids.map((bid, i) => (
                        <div
                          key={bid.id}
                          className={`flex items-center justify-between p-3 rounded-2xl ${
                            i === 0 ? "border border-emerald-100 bg-emerald-50" : "border border-[#ece4d6] bg-[#f8f4ec]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {i === 0 && <span className="text-emerald-600 font-bold text-xs inline-flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> HIGHEST</span>}
                            <div>
                              <p className="text-sm font-medium text-sage-900">{bid.bidder.name}</p>
                              <p className="text-xs text-sage-500">{bid.bidder.country}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-heading text-sage-900 font-bold text-sm">
                              {formatPrice(bid.amountInr)}
                            </p>
                            <p className="text-xs text-sage-400">{formatDate(bid.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Tag className="w-10 h-10 text-sage-300 mx-auto mb-2" />
                      <p className="text-sage-500 text-sm">{t("noBidsYet")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qr">
              <Card className="mt-4 border-[#ddd4c4]">
                <CardContent className="pt-6">
                  {lot.qrCode?.qrImageSignedUrl ? (
                    <div className="text-center space-y-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={lot.qrCode.qrImageSignedUrl}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto border border-[#ddd4c4]"
                      />
                      <p className="text-xs text-sage-500 max-w-sm mx-auto">
                        This QR code is HMAC-signed and links to this lot&apos;s verification page.
                        Scan to verify authenticity.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sage-500 text-sm text-center py-8">
                      QR code not available for this lot.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Details Panel */}
        <div className="space-y-5">
          {isOwner && lot.status === "DRAFT" && (
            <Card className="border-[#ddd4c4]">
              <CardContent className="pt-6">
                <Link
                  href={`/dashboard/my-lots`}
                  className="block w-full border border-[#405742] bg-[#405742] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#2f422e]"
                >
                  Manage Listing
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Bid Panel — shown for AUCTION and BOTH listing modes */}
          {(lot.listingMode === "AUCTION" || lot.listingMode === "BOTH") && (
            <BidPanel
              lotId={lot.id}
              lotNumber={lot.lotNumber}
              status={lot.status}
              startingPriceInr={lot.startingPriceInr}
              auctionStartsAt={lot.auctionStartsAt}
              auctionEndsAt={lot.auctionEndsAt}
              initialBids={lot.bids}
              bidCount={lot.bidCount}
              farmerId={lot.seller?.id || ""}
              showSummary={false}
              onViewerCountChange={setViewerCount}
              onBidPlaced={handleSocketNewBid}
              onAuctionEnded={(outcome, winnerId) => {
                // Trigger the same optimistic-update path used by the socket handler
                // so the winner banner appears instantly even if the socket event is
                // missed (e.g. disconnected client relying on polling).
                handleSocketAuctionEnded({ lotId, outcome, winnerId });
              }}
            />
          )}

          {/* Description */}
          {lot.description && (
            <Card className="border-[#ddd4c4]">
              <CardContent className="pt-6">
                <h3 className="font-heading text-sage-900 font-bold text-sm mb-3 uppercase tracking-[0.14em]">Description</h3>
                <p className="text-sage-600 text-sm leading-relaxed">{lot.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* RFQ Creation Modal */}
      <Dialog open={showRfqModal} onOpenChange={setShowRfqModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto border-[#d9d1c2]">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              Request Quote
            </DialogTitle>
          </DialogHeader>

          {rfqSuccess ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div>
                <p className="text-sage-900 font-heading font-bold text-lg">RFQ Submitted!</p>
                <p className="text-sage-500 text-sm mt-2">
                  Your quote request has been submitted. Our team will route it to matching sellers
                  and you&apos;ll be notified when responses come in.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                {createdRfqId && (
                  <Link
                    href={`/rfq/${createdRfqId}`}
                    className="px-6 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors"
                  >
                    View RFQ Details
                  </Link>
                )}
                <Link
                  href="/dashboard/my-rfqs"
                  className="px-6 py-2.5 border border-sage-200 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors"
                >
                  My RFQs
                </Link>
                <button
                  onClick={() => setShowRfqModal(false)}
                  className="px-6 py-2.5 border border-sage-200 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              {rfqError && (
                <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{rfqError}</span>
                </div>
              )}

              {/* Pre-filled lot info */}
              <div className="border border-[#ece4d6] bg-[#f8f4ec] p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <CommodityIcon type={lot.commodityType} className="w-5 h-5" />
                  <span className="font-heading text-sage-900 font-bold text-sm">
                    {COMMODITY_LABELS[lot.commodityType] || lot.commodityType}
                  </span>
                  <Badge className={`text-[10px] ${GRADE_COLORS[lot.grade] || GRADE_COLORS.UNGRADED}`}>
                    Grade {lot.grade}
                  </Badge>
                </div>
                <p className="text-xs text-sage-500">Lot {lot.lotNumber}</p>
              </div>

              {/* Editable quantity */}
              <div>
                <Label className="text-sage-700 text-sm">Quantity (kg)</Label>
                <div className="relative mt-1.5">
                  <Input
                    type="number"
                    min="1"
                    step="0.5"
                    value={rfqQuantityKg}
                    onChange={(e) => {
                      setRfqQuantityKg(e.target.value);
                      clearRfqFeedback("quantityKg");
                    }}
                    placeholder="100"
                    className="rounded-xl pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 text-sm">kg</span>
                </div>
                <p className="text-[10px] text-sage-400 mt-1">
                  Pre-filled from lot ({lot.quantityKg.toLocaleString()} kg). Adjust if needed.
                </p>
                {rfqFieldErrors.quantityKg && (
                  <p className="text-[10px] text-red-700 mt-1">{rfqFieldErrors.quantityKg}</p>
                )}
              </div>

              {/* Delivery details */}
              <div>
                <Label className="text-sage-700 text-sm">Delivery Country <span className="text-red-500">*</span></Label>
                <Select value={rfqDeliveryCountry} onValueChange={(v) => {
                  if (!v) return;
                  setRfqDeliveryCountry(v);
                  clearRfqFeedback("deliveryCountry");
                }}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {RFQ_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {rfqFieldErrors.deliveryCountry && (
                  <p className="text-[10px] text-red-700 mt-1">{rfqFieldErrors.deliveryCountry}</p>
                )}
              </div>

              <div>
                <Label className="text-sage-700 text-sm">Delivery City / Location <span className="text-red-500">*</span></Label>
                <Input
                  value={rfqDeliveryCity}
                  onChange={(e) => {
                    setRfqDeliveryCity(e.target.value);
                    clearRfqFeedback("deliveryCity");
                  }}
                  placeholder="Enter delivery city"
                  className="mt-1.5 rounded-xl"
                  maxLength={100}
                />
                {rfqFieldErrors.deliveryCity && (
                  <p className="text-[10px] text-red-700 mt-1">{rfqFieldErrors.deliveryCity}</p>
                )}
              </div>

              {/* Optional target price */}
              <div>
                <Label className="text-sage-700 text-sm">Target Price per kg <span className="text-sage-400 font-normal">optional</span></Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rfqTargetPrice}
                    onChange={(e) => {
                      setRfqTargetPrice(e.target.value);
                      clearRfqFeedback("targetPriceInr");
                    }}
                    placeholder="Optional"
                    className="rounded-xl flex-1"
                  />
                  <select
                    value={rfqTargetCurrency}
                    onChange={(e) => {
                      setRfqTargetCurrency(e.target.value as CurrencyCode);
                      clearRfqFeedback("targetPriceInr");
                    }}
                    className="px-3 py-2 border border-sage-200 rounded-xl text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                  >
                    {CURRENCY_OPTIONS.map((currency) => (
                      <option key={currency.code} value={currency.code}>{currency.label}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-sage-400 mt-1">
                  Only visible to you and admins. Sellers never see your target price.
                </p>
                {rfqFieldErrors.targetPriceInr && (
                  <p className="text-[10px] text-red-700 mt-1">{rfqFieldErrors.targetPriceInr}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label className="text-sage-700 text-sm">Additional Details</Label>
                <Textarea
                  value={rfqDescription}
                  onChange={(e) => {
                    setRfqDescription(e.target.value);
                    clearRfqFeedback();
                  }}
                  placeholder="Quality expectations, packaging, delivery schedule..."
                  className="mt-1.5 rounded-xl"
                  maxLength={2000}
                  rows={3}
                />
              </div>

              {/* Validity */}
              <div>
                <Label className="text-sage-700 text-sm">Valid For</Label>
                <Select value={rfqExpiresInDays} onValueChange={(v) => {
                  if (!v) return;
                  setRfqExpiresInDays(v);
                  clearRfqFeedback();
                }}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 14, 21, 30].map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Privacy notice */}
              <div className="bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-700 flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Your identity and target price remain confidential. Sellers respond with blind quotes
                  evaluated by the platform to ensure fair pricing.
                </span>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitRfq}
                disabled={rfqSubmitting || !canSubmitRfq}
                className="flex w-full items-center justify-center gap-2 border border-[#405742] bg-[#405742] py-3 text-sm font-medium text-white transition-colors hover:bg-[#2f422e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rfqSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Quote Request
                  </>
                )}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
