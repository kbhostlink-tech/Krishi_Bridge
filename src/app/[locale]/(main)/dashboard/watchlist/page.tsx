"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useWatchlist } from "@/lib/use-watchlist";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const COMMODITY_ICONS: Record<string, string> = {
  LARGE_CARDAMOM: "🫛", TEA: "🍵", GINGER: "🫚", TURMERIC: "🌿", PEPPER: "🌶️",
  COFFEE: "☕", SAFFRON: "🌸", ARECA_NUT: "🥜", CINNAMON: "🪵", OTHER: "📦",
};

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-amber-100 text-amber-800",
  UNGRADED: "bg-gray-100 text-gray-600",
};

interface WatchlistLot {
  id: string;
  lotNumber: string;
  commodityType: string;
  grade: string;
  quantityKg: number;
  primaryImageUrl: string | null;
  origin: { country?: string; state?: string };
  status: string;
  listingMode: string;
  startingPriceUsd: number | null;
  auctionEndsAt: string | null;
  farmer: { name: string };
  warehouse: { name: string };
}

export default function WatchlistPage() {
  const t = useTranslations("marketplace");
  const { watchlist, toggle: toggleWatchlist, isWatchlisted, clear } = useWatchlist();
  const [lots, setLots] = useState<WatchlistLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWatchlistLots = useCallback(async () => {
    if (watchlist.length === 0) {
      setLots([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch each lot. Use Promise.allSettled to handle removed lots gracefully.
      const results = await Promise.allSettled(
        watchlist.map((id) => fetch(`/api/lots/${id}`).then((r) => r.ok ? r.json() : null))
      );

      const fetched: WatchlistLot[] = [];
      for (const result of results) {
        if (result.status === "fulfilled" && result.value?.lot) {
          fetched.push(result.value.lot);
        }
      }
      setLots(fetched);
    } catch {
      toast.error("Failed to load watchlist");
    } finally {
      setIsLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    fetchWatchlistLots();
  }, [fetchWatchlistLots]);

  const formatPrice = (price: number | null) => {
    if (!price) return "—";
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-script text-sage-500 text-lg">Saved Items</p>
          <h1 className="font-heading text-sage-900 text-3xl font-bold">Watchlist</h1>
          <p className="text-sage-500 text-sm mt-1">
            {watchlist.length} item{watchlist.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        {watchlist.length > 0 && (
          <button
            onClick={clear}
            className="text-sm text-sage-500 hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && watchlist.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: Math.min(watchlist.length, 6) }).map((_, i) => (
            <Card key={i} className="rounded-3xl border-sage-100 animate-pulse">
              <CardContent className="p-0">
                <div className="h-48 bg-sage-100 rounded-t-3xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-sage-100 rounded w-2/3" />
                  <div className="h-3 bg-sage-100 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && lots.length === 0 && (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-16 text-center">
            <div className="text-6xl mb-4">💜</div>
            <h2 className="font-heading text-sage-900 text-xl font-bold mb-2">
              Your watchlist is empty
            </h2>
            <p className="text-sage-500 text-sm max-w-md mx-auto leading-relaxed mb-6">
              Save lots you&apos;re interested in by tapping the heart icon on the marketplace.
            </p>
            <Link
              href="/marketplace"
              className="inline-block px-6 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors"
            >
              Browse Marketplace
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {!isLoading && lots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lots.map((lot) => (
            <div key={lot.id} className="relative">
              <Link href={`/marketplace/${lot.id}`}>
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
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl opacity-50">{COMMODITY_ICONS[lot.commodityType] || "📦"}</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <Badge className={`text-xs font-medium ${GRADE_COLORS[lot.grade] || GRADE_COLORS.UNGRADED}`}>
                          Grade {lot.grade}
                        </Badge>
                      </div>
                      {lot.auctionEndsAt && (
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
                          <h3 className="font-heading text-sage-900 font-bold text-sm group-hover:text-sage-700 transition-colors">
                            {COMMODITY_ICONS[lot.commodityType]} {COMMODITY_LABELS[lot.commodityType] || lot.commodityType}
                          </h3>
                          <p className="text-sage-500 text-xs mt-0.5">{lot.lotNumber}</p>
                        </div>
                        {lot.startingPriceUsd && (
                          <p className="font-heading text-sage-900 font-bold text-sm whitespace-nowrap">
                            {formatPrice(lot.startingPriceUsd)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-sage-500">
                        <span>{lot.quantityKg.toLocaleString()} kg</span>
                        <span className="w-1 h-1 rounded-full bg-sage-300" />
                        <span>{lot.origin?.state || lot.origin?.country || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-sage-50">
                        <p className="text-sage-400 text-xs">by {lot.farmer.name}</p>
                        <p className="text-sage-400 text-xs">{lot.warehouse.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Remove from watchlist button */}
              <button
                onClick={() => toggleWatchlist(lot.id)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors z-10"
                aria-label="Remove from watchlist"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
