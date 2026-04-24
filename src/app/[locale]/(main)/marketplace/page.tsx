"use client";

import { useCallback, useEffect, useState } from "react";

import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonMarketplaceGrid } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/use-currency";
import { useWatchlist } from "@/lib/use-watchlist";
import { Link } from "@/i18n/navigation";
import { CommodityIcon, COMMODITY_LABELS } from "@/lib/commodity-icons";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Ban, Clock, Zap, ShoppingBag, LayoutGrid, Home, Lock, ArrowRight, ShieldCheck } from "lucide-react";

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-amber-100 text-amber-800",
  UNGRADED: "bg-gray-100 text-gray-600",
};

interface LotCard {
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
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  createdAt: string;
  seller: { id: string; name: string; country: string } | null;
  farmer: { id: string; name: string; country: string } | null;
  warehouse: { id: string; name: string } | null;
  qualityCheck: { moisturePct: number | null; podSizeMm: number | null; colourGrade: string | null } | null;
  bidCount: number;
}

export default function MarketplacePage() {
  const t = useTranslations("marketplace");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { user } = useAuth();
  const { toggle: toggleWatchlist, isWatchlisted } = useWatchlist();
  const { display } = useCurrency();

  const [lots, setLots] = useState<LotCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [commodityFilter, setCommodityFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [listingModeFilter, setListingModeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchLots = useCallback(async (cursor?: string) => {
    if (cursor) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (commodityFilter !== "all") params.set("commodityType", commodityFilter);
      if (gradeFilter !== "all") params.set("grade", gradeFilter);
      if (countryFilter !== "all") params.set("country", countryFilter);
      if (listingModeFilter !== "all") params.set("listingMode", listingModeFilter);
      if (sortBy) params.set("sort", sortBy);
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "12");

      const res = await fetch(`/api/lots?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      setFetchError(false);
      if (cursor) {
        setLots((prev) => [...prev, ...data.lots]);
      } else {
        setLots(data.lots);
      }
      setNextCursor(data.pagination.nextCursor);
      setTotalCount(data.pagination.total);
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [search, commodityFilter, gradeFilter, countryFilter, listingModeFilter, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLots(), 350);
    return () => clearTimeout(timer);
  }, [fetchLots]);

  const timeRemaining = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs.toString().padStart(2, "0")}s`;
    return `${secs}s`;
  };

  const getAuctionStatus = (lot: LotCard) => {
    if (lot.listingMode !== "AUCTION" && lot.listingMode !== "BOTH") return null;
    const now = Date.now();
    const startsAt = lot.auctionStartsAt ? new Date(lot.auctionStartsAt).getTime() : null;
    const endsAt = lot.auctionEndsAt ? new Date(lot.auctionEndsAt).getTime() : null;

    if (lot.status === "SOLD" || lot.status === "CANCELLED" || lot.status === "REDEEMED") {
      return { type: "ended" as const, label: "ended" };
    }
    if (endsAt && now > endsAt) {
      return { type: "ended" as const, label: "ended" };
    }
    // Treat as LIVE when within the auction window, regardless of whether the
    // server-side cron has flipped the DB status yet. Source of truth is time.
    if (startsAt && endsAt && now >= startsAt && now < endsAt) {
      return { type: "live" as const, label: "live", timeLeft: timeRemaining(lot.auctionEndsAt) };
    }
    if (startsAt && now < startsAt) {
      return { type: "upcoming" as const, label: "upcoming", timeLeft: timeRemaining(lot.auctionStartsAt) };
    }
    if (lot.status === "LISTED" && !startsAt) {
      return { type: "upcoming" as const, label: "pending", timeLeft: null };
    }
    return null;
  };

  // Tick every second so "starts in" / "live" countdowns and status flips are
  // reflected without refetching from the server.
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveAuctionCount = lots.filter((lot) => getAuctionStatus(lot)?.type === "live").length;
  const endingSoonCount = lots.filter((lot) => {
    const status = getAuctionStatus(lot);
    return status?.type === "live" && typeof status.timeLeft === "string" && !status.timeLeft.includes("d");
  }).length;
  const visibleCount = lots.length;

  return (
    <PageTransition className="space-y-6">
      {/* Back-to-home / admin navigation row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-[#ddd4c4] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700 transition-colors hover:bg-[#faf6ee] hover:text-stone-950"
        >
          <Home className="h-3.5 w-3.5" /> Back to home
        </Link>
        {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 border border-[#d7c2bd] bg-terracotta/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta hover:bg-terracotta/10"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Back to admin panel
          </Link>
        )}
      </div>

      {/* Guest banner — prompts sign up / login */}
      {!user ? (
        <Surface className="border-[#d9e6cb] bg-[#f4f8ec] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-start gap-3 flex-1">
              <div className="shrink-0 grid h-10 w-10 place-items-center border border-[#c8d5b8] bg-white text-[#405742]">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#263522]">Preview mode — limited details</p>
                <p className="mt-0.5 text-sm text-[#556550]">
                  Sign up or log in to see lot prices, bid counts, seller details, and to place bids or RFQs.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/login?returnUrl=/marketplace"
                className="inline-flex items-center gap-1.5 border border-[#405742] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#405742] hover:bg-[#eef3e8]"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 border border-[#405742] bg-[#405742] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#2f422e]"
              >
                Sign up <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </Surface>
      ) : null}

      <PageHeader
        eyebrow={t("boardEyebrow")}
        title={tNav("marketplace")}
      />

      {user && user.kycStatus !== "APPROVED" ? (
        <Surface className="border-[#e4d2a7] bg-[#fff9ed] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[#a6781f]" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#563f14]">{t("kycRequired")}</p>
              <p className="text-sm text-[#7d6435]">{t("kycRequiredHint")}</p>
            </div>
          </div>
        </Surface>
      ) : null}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label={t("totalListings")} value={totalCount} icon={ShoppingBag} tone="slate" />
        <MetricCard label={t("visibleCards")} value={visibleCount} icon={LayoutGrid} tone="olive" />
        <MetricCard label={t("liveAuctionCount")} value={liveAuctionCount} icon={Zap} tone="teal" />
        <MetricCard label={t("endingSoon")} value={endingSoonCount} icon={Clock} tone="amber" />
      </div>

      <Surface className="p-3 sm:p-4">
        <div className="flex flex-wrap gap-2.5 items-center">
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-[#d9d1c2] min-w-40 flex-1 basis-40"
          />
          <Select value={commodityFilter} onValueChange={(v) => v && setCommodityFilter(v)}>
            <SelectTrigger className="w-40 border-[#d9d1c2]">
              <SelectValue placeholder={t("allCommodities")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCommodities")}</SelectItem>
              {Object.entries(COMMODITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  <span className="inline-flex items-center gap-1.5"><CommodityIcon type={key} className="w-3.5 h-3.5" /> {label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gradeFilter} onValueChange={(v) => v && setGradeFilter(v)}>
            <SelectTrigger className="w-32 border-[#d9d1c2]">
              <SelectValue placeholder={t("allGrades")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allGrades")}</SelectItem>
              <SelectItem value="A">{t("gradeBadge", { grade: "A" })}</SelectItem>
              <SelectItem value="B">{t("gradeBadge", { grade: "B" })}</SelectItem>
              <SelectItem value="C">{t("gradeBadge", { grade: "C" })}</SelectItem>
              <SelectItem value="UNGRADED">{t("ungraded")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={(v) => v && setCountryFilter(v)}>
            <SelectTrigger className="w-36 border-[#d9d1c2]">
              <SelectValue placeholder={t("allCountries")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCountries")}</SelectItem>
              <SelectItem value="IN">India</SelectItem>
              <SelectItem value="NP">Nepal</SelectItem>
              <SelectItem value="BT">Bhutan</SelectItem>
              <SelectItem value="AE">UAE</SelectItem>
              <SelectItem value="SA">Saudi Arabia</SelectItem>
              <SelectItem value="OM">Oman</SelectItem>
            </SelectContent>
          </Select>
          <Select value={listingModeFilter} onValueChange={(v) => v && setListingModeFilter(v)}>
            <SelectTrigger className="w-36 border-[#d9d1c2]">
              <SelectValue placeholder={t("allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTypes")}</SelectItem>
              <SelectItem value="AUCTION">{t("auctionMode")}</SelectItem>
              <SelectItem value="RFQ">{t("rfqMode")}</SelectItem>
              <SelectItem value="BOTH">{t("bothMode")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
            <SelectTrigger className="w-44 border-[#d9d1c2]">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("newestFirst")}</SelectItem>
              <SelectItem value="price_asc">{t("priceLowHigh")}</SelectItem>
              <SelectItem value="price_desc">{t("priceHighLow")}</SelectItem>
              <SelectItem value="ending_soon">{t("endingSoonSort")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Surface>

      {isLoading ? <SkeletonMarketplaceGrid /> : null}

      {!isLoading && fetchError ? (
        <ErrorState
          title={t("noListings")}
          message={t("unableToLoad")}
          onRetry={() => fetchLots()}
        />
      ) : null}

      {!isLoading && !fetchError && lots.length === 0 ? (
        <EmptyState
          variant="lots"
          title={t("noListings")}
          description={t("noListingsDesc")}
        />
      ) : null}

      {!isLoading && lots.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {lots.map((lot) => {
              const auctionStatus = getAuctionStatus(lot);
              const cardHref = user ? `/marketplace/${lot.id}` : `/login?returnUrl=/marketplace/${lot.id}`;

              return (
                <Link key={lot.id} href={cardHref}>
                  <Surface className="overflow-hidden transition-colors hover:bg-[#fdfbf7]">
                    <div className="relative h-52 overflow-hidden bg-linear-to-br from-sage-50 to-sage-100">
                      {lot.primaryImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={lot.primaryImageUrl}
                          alt={lot.lotNumber}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <CommodityIcon type={lot.commodityType} className="h-12 w-12 opacity-50" />
                        </div>
                      )}

                      <div className={`absolute top-3 ${isRtl ? "right-3" : "left-3"} flex gap-2`}>
                        <Badge className={`text-xs ${GRADE_COLORS[lot.grade] || GRADE_COLORS.UNGRADED}`}>{lot.grade === "UNGRADED" ? t("ungraded") : t("gradeBadge", { grade: lot.grade })}</Badge>
                        <Badge className="bg-white/90 text-stone-700">{lot.listingMode === "RFQ" ? t("rfqMode") : lot.listingMode === "BOTH" ? t("bothMode") : t("auctionMode")}</Badge>
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!user) {
                            window.location.href = `/${locale}/login?returnUrl=/marketplace`;
                            return;
                          }
                          toggleWatchlist(lot.id);
                        }}
                        className={`absolute top-3 ${isRtl ? "left-3" : "right-3"} grid h-10 w-10 place-items-center border border-[#ddd4c4] bg-white/92 text-stone-600 backdrop-blur-sm transition-colors hover:bg-white`}
                        aria-label={!user ? "Log in to save" : isWatchlisted(lot.id) ? t("removeWatchlist") : t("addWatchlist")}
                      >
                        <svg
                          className={`h-4 w-4 transition-colors ${isWatchlisted(lot.id) ? "fill-red-500 text-red-500" : "fill-none text-stone-500"}`}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                        </svg>
                      </button>

                      {auctionStatus ? (
                        <div className={`absolute inset-x-0 bottom-0 border-t border-white/20 px-4 py-2.5 backdrop-blur-sm ${auctionStatus.type === "live" ? "bg-emerald-600/80" : "bg-black/55"}`}>
                          {auctionStatus.type === "live" ? (
                            <div className="flex items-center justify-between gap-2 text-white">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                                </span>
                                <Zap className="h-3.5 w-3.5" /> {t("statusLive")}
                              </span>
                              <span className="text-xs tabular-nums">{t("endsIn", { time: auctionStatus.timeLeft ?? "" })}</span>
                            </div>
                          ) : auctionStatus.type === "upcoming" ? (
                            <div className="flex items-center justify-between gap-2 text-white">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                                <Clock className="h-3.5 w-3.5" /> {t("statusUpcoming")}
                              </span>
                              <span className="text-xs tabular-nums">{auctionStatus.timeLeft ? t("startsIn", { time: auctionStatus.timeLeft }) : t("auctionPending")}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 text-white">
                              <Ban className="h-3.5 w-3.5" />
                              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{t("auctionEndedOverlay")}</span>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-stone-950">
                            <CommodityIcon type={lot.commodityType} className="h-4 w-4" />
                            {COMMODITY_LABELS[lot.commodityType] || lot.commodityType}
                          </h3>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{lot.lotNumber}</p>
                        </div>
                        {user ? (
                          <p className="text-lg font-semibold text-stone-950">{lot.startingPriceInr ? display(lot.startingPriceInr) : "-"}</p>
                        ) : (
                          <span className="inline-flex items-center gap-1 border border-[#d9d1c2] bg-[#faf6ee] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                            <Lock className="h-3 w-3" /> Login to view
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                        <span>{lot.quantityKg.toLocaleString()} kg</span>
                        <span className="text-stone-300">/</span>
                        <span>{lot.origin?.state || lot.origin?.country || "-"}</span>
                        {user && lot.bidCount > 0 ? (
                          <>
                            <span className="text-stone-300">/</span>
                            <span>{t("bidsLabel", { count: lot.bidCount })}</span>
                          </>
                        ) : null}
                      </div>

                      <div className="border-t border-[#ece4d6] pt-4">
                        {user ? (
                          <p className="text-sm font-medium text-stone-700">
                            {lot.description?.slice(0, 112) || t("verifiedListing")}
                          </p>
                        ) : (
                          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#556550]">
                            <Lock className="h-3.5 w-3.5" /> Sign up to see full details, price, and bids
                          </p>
                        )}
                      </div>
                    </div>
                  </Surface>
                </Link>
              );
            })}
          </div>

          {nextCursor ? (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchLots(nextCursor)}
                disabled={isLoadingMore}
                className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2f422e] disabled:opacity-50"
              >
                {isLoadingMore ? t("loadingMore") : t("loadMore")}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </PageTransition>
  );
}