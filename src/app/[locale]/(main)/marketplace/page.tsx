"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useWatchlist } from "@/lib/use-watchlist";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonMarketplaceGrid } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageTransition } from "@/components/ui/page-transition";
import { CommodityIcon, COMMODITY_LABELS } from "@/lib/commodity-icons";
import { AlertTriangle } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

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
  const { user, accessToken } = useAuth();
  const { toggle: toggleWatchlist, isWatchlisted } = useWatchlist();

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
  const [geoDetected, setGeoDetected] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Auto-detect country from Geo-IP on first load
  useEffect(() => {
    if (geoDetected) return;
    fetch("/api/geo")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.country) setCountryFilter(data.country);
      })
      .catch(() => {})
      .finally(() => setGeoDetected(true));
  }, [geoDetected]);

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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchLots(), 400);
    return () => clearTimeout(timer);
  }, [fetchLots]);

  const { display } = useCurrency();
  const formatPrice = (price: number | null) => {
    if (!price) return "—";
    return display(price);
  };

  const timeRemaining = (endsAt: string | null) => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div>
        <p className="font-script text-sage-500 text-lg">{t("liveAuctions")}</p>
        <h1 className="font-heading text-sage-900 text-3xl font-bold">{tNav("marketplace")}</h1>
        {totalCount > 0 && (
          <p className="text-sage-500 text-sm mt-1">{totalCount} listings available</p>
        )}
      </div>

      {/* KYC Notice */}
      {user && user.kycStatus !== "APPROVED" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium text-sm">{t("kycRequired")}</p>
            <p className="text-amber-600 text-sm mt-0.5">
              {t("kycRequired")}
            </p>
            <Link href="/kyc" className="inline-block mt-2 text-sm font-medium text-amber-700 hover:underline">
              {tNav("dashboard")} →
            </Link>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <Card className="rounded-3xl border-sage-100">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border-sage-200 bg-white"
              />
            </div>

            {/* Commodity filter */}
            <Select value={commodityFilter} onValueChange={(v) => v && setCommodityFilter(v)}>
              <SelectTrigger className="w-full lg:w-[180px] rounded-xl border-sage-200">
                <SelectValue placeholder="Commodity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Commodities</SelectItem>
                {Object.entries(COMMODITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <span className="inline-flex items-center gap-1.5"><CommodityIcon type={key} className="w-3.5 h-3.5" /> {label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Grade filter */}
            <Select value={gradeFilter} onValueChange={(v) => v && setGradeFilter(v)}>
              <SelectTrigger className="w-full lg:w-[140px] rounded-xl border-sage-200">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="A">Grade A</SelectItem>
                <SelectItem value="B">Grade B</SelectItem>
                <SelectItem value="C">Grade C</SelectItem>
                <SelectItem value="UNGRADED">Ungraded</SelectItem>
              </SelectContent>
            </Select>

            {/* Country filter */}
            <Select value={countryFilter} onValueChange={(v) => v && setCountryFilter(v)}>
              <SelectTrigger className="w-full lg:w-[140px] rounded-xl border-sage-200">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="IN">🇮🇳 India</SelectItem>
                <SelectItem value="NP">🇳🇵 Nepal</SelectItem>
                <SelectItem value="BT">🇧🇹 Bhutan</SelectItem>
                <SelectItem value="AE">🇦🇪 UAE</SelectItem>
                <SelectItem value="SA">🇸🇦 Saudi Arabia</SelectItem>
                <SelectItem value="OM">🇴🇲 Oman</SelectItem>
              </SelectContent>
            </Select>

            {/* Listing mode filter */}
            <Select value={listingModeFilter} onValueChange={(v) => v && setListingModeFilter(v)}>
              <SelectTrigger className="w-full lg:w-[160px] rounded-xl border-sage-200">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="AUCTION">Auction</SelectItem>
                <SelectItem value="RFQ">RFQ</SelectItem>
                <SelectItem value="BOTH">Auction + RFQ</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
              <SelectTrigger className="w-full lg:w-[160px] rounded-xl border-sage-200">
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low → High</SelectItem>
                <SelectItem value="price_desc">Price: High → Low</SelectItem>
                <SelectItem value="ending_soon">Ending Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && <SkeletonMarketplaceGrid />}

      {/* Error state */}
      {!isLoading && fetchError && (
        <ErrorState
          title={t("noListings")}
          message="We couldn't load the listings. Please try again."
          onRetry={() => fetchLots()}
        />
      )}

      {/* Empty state */}
      {!isLoading && !fetchError && lots.length === 0 && (
        <EmptyState
          variant="lots"
          title={t("noListings")}
          description="No commodity lots match your filters. Try adjusting your search criteria."
        />
      )}

      {/* Lots Grid */}
      {!isLoading && lots.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lots.map((lot) => (
              <Link key={lot.id} href={`/marketplace/${lot.id}`}>
                <Card className="rounded-3xl border-sage-100 hover:border-sage-300 hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden">
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-sage-50 to-sage-100 overflow-hidden">
                      {lot.primaryImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={lot.primaryImageUrl}
                          alt={lot.lotNumber}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CommodityIcon type={lot.commodityType} className="w-12 h-12 opacity-50" />
                        </div>
                      )}

                      {/* Badges overlay */}
                      <div className={`absolute top-3 ${isRtl ? "right-3" : "left-3"} flex gap-1.5`}>
                        <Badge className={`text-xs font-medium ${GRADE_COLORS[lot.grade] || GRADE_COLORS.UNGRADED}`}>
                          Grade {lot.grade}
                        </Badge>
                        <Badge className="bg-white/90 text-sage-700 text-xs font-medium backdrop-blur-sm">
                          {lot.listingMode === "RFQ" ? "RFQ" : lot.listingMode === "BOTH" ? "Auction+RFQ" : "Auction"}
                        </Badge>
                      </div>

                      {/* Watchlist heart */}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchlist(lot.id); }}
                        className={`absolute top-3 ${isRtl ? "left-3" : "right-3"} w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors`}
                        aria-label={isWatchlisted(lot.id) ? "Remove from watchlist" : "Add to watchlist"}
                      >
                        <svg
                          className={`w-4 h-4 transition-colors ${isWatchlisted(lot.id) ? "fill-red-500 text-red-500" : "fill-none text-sage-500"}`}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                        </svg>
                      </button>

                      {/* Auction timer */}
                      {lot.listingMode === "AUCTION" && lot.auctionEndsAt && (
                        <div className="absolute bottom-3 right-3">
                          <Badge className="bg-black/60 text-white text-xs backdrop-blur-sm">
                            ⏱ {timeRemaining(lot.auctionEndsAt)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-heading text-sage-900 font-bold text-sm group-hover:text-sage-700 transition-colors flex items-center gap-1">
                            <CommodityIcon type={lot.commodityType} className="w-3.5 h-3.5" /> {COMMODITY_LABELS[lot.commodityType] || lot.commodityType}
                          </h3>
                          <p className="text-sage-500 text-xs mt-0.5">{lot.lotNumber}</p>
                        </div>
                        {lot.startingPriceInr && (
                          <p className="font-heading text-sage-900 font-bold text-sm whitespace-nowrap">
                            {formatPrice(lot.startingPriceInr)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-sage-500">
                        <span>{lot.quantityKg.toLocaleString()} kg</span>
                        <span className="w-1 h-1 rounded-full bg-sage-300" />
                        <span>{lot.origin?.state || lot.origin?.country || "—"}</span>
                        {lot.bidCount > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-sage-300" />
                            <span>{lot.bidCount} bid{lot.bidCount !== 1 ? "s" : ""}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-sage-50">
                        <p className="text-sage-400 text-xs">
                          by {lot.seller?.name || lot.farmer?.name || "Unknown"}
                        </p>
                        <p className="text-sage-400 text-xs">
                          {lot.warehouse?.name || "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Load More */}
          {nextCursor && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchLots(nextCursor)}
                disabled={isLoadingMore}
                className="px-8 py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? tNav("loadMore") + "..." : tNav("loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
