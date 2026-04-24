"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useWatchlist } from "@/lib/use-watchlist";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";
import { PageTransition } from "@/components/ui/page-transition";
import { CommodityIcon } from "@/lib/commodity-icons";
import { ArrowRight, Heart, MapPin, Timer } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom",
  TEA: "Tea",
  GINGER: "Ginger",
  TURMERIC: "Turmeric",
  PEPPER: "Pepper",
  COFFEE: "Coffee",
  SAFFRON: "Saffron",
  ARECA_NUT: "Areca Nut",
  CINNAMON: "Cinnamon",
  OTHER: "Other",
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-amber-100 text-amber-800",
  UNGRADED: "bg-stone-100 text-stone-600",
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
  startingPriceInr: number | null;
  auctionEndsAt: string | null;
  seller: { name: string } | null;
  farmer: { name: string } | null;
  warehouse: { name: string } | null;
}

export default function WatchlistPage() {
  const { watchlist, toggle: toggleWatchlist, clear } = useWatchlist();
  const { display } = useCurrency();
  const t = useTranslations("buyerConsole");

  const [lots, setLots] = useState<WatchlistLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadWatchlist = async () => {
      if (watchlist.length === 0) {
        if (!active) return;
        setLots([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const results = await Promise.allSettled(
          watchlist.map((id) => fetch(`/api/lots/${id}`).then((response) => (response.ok ? response.json() : null)))
        );

        if (!active) return;

        const nextLots = results.flatMap((result) =>
          result.status === "fulfilled" && result.value?.lot ? [result.value.lot as WatchlistLot] : []
        );

        setLots(nextLots);
      } catch {
        if (!active) return;
        toast.error(t("watchlist.empty"));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadWatchlist();

    return () => {
      active = false;
    };
  }, [watchlist]);

  const liveAuctions = useMemo(
    () => lots.filter((lot) => lot.auctionEndsAt && new Date(lot.auctionEndsAt).getTime() > Date.now()).length,
    [lots]
  );
  const marketCoverage = useMemo(
    () => new Set(lots.map((lot) => lot.origin?.country || lot.origin?.state).filter(Boolean)).size,
    [lots]
  );
  const suppliersTracked = useMemo(
    () => new Set(lots.map((lot) => lot.seller?.name || lot.farmer?.name).filter(Boolean)).size,
    [lots]
  );

  const formatPrice = (price: number | null) => (price == null ? "-" : display(price));
  const timeRemaining = (endsAt: string | null) => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return t("common.ended");
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <PageTransition className="buyer-console space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-36 rounded skeleton-shimmer" />
          <div className="h-10 w-72 rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 rounded skeleton-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-80 rounded skeleton-shimmer" />
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="buyer-console space-y-8">
      <PageHeader
        eyebrow={t("watchlist.eyebrow")}
        title={t("watchlist.title")}
        description={t("watchlist.description")}
        action={
          watchlist.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="inline-flex h-10 items-center border border-[#ddd4c4] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950"
            >
              {t("common.clearAll")}
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <MetricCard
          label={t("watchlist.savedLots")}
          value={watchlist.length}
          meta={t("watchlist.savedLotsMeta")}
          tone="olive"
        />
        <MetricCard
          label={t("watchlist.liveAuctions")}
          value={liveAuctions}
          meta={t("watchlist.liveAuctionsMeta")}
          tone="amber"
        />
        <MetricCard
          label={t("watchlist.marketCoverage")}
          value={marketCoverage}
          meta={t("watchlist.marketCoverageMeta")}
          tone="teal"
        />
        <MetricCard
          label={t("watchlist.suppliersTracked")}
          value={suppliersTracked}
          meta={t("watchlist.suppliersTrackedMeta")}
          tone="slate"
        />
      </div>

      {lots.length === 0 ? (
        <Surface className="p-10 text-center">
          <Heart className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-stone-950">{t("watchlist.empty")}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{t("watchlist.emptyDesc")}</p>
          <Link
            href="/marketplace"
            className="mt-6 inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#2f422e]"
          >
            {t("common.browseMarketplace")}
          </Link>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lots.map((lot) => {
            const originLabel = lot.origin?.state || lot.origin?.country || t("common.originPending");
            const supplier = lot.seller?.name || lot.farmer?.name || t("common.unknownSupplier");

            return (
              <div key={lot.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggleWatchlist(lot.id)}
                  className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center border border-[#ddd4c4] bg-white/96 text-rose-600 transition-colors hover:bg-white"
                  aria-label={t("watchlist.removeFromWatchlist")}
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>

                <Link href={`/marketplace/${lot.id}`} className="group block">
                  <Surface className="h-full overflow-hidden transition-colors hover:bg-[#fcfaf4]">
                    <div className="relative h-52 bg-[linear-gradient(180deg,#f6f1e6,#ece2cf)]">
                      {lot.primaryImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={lot.primaryImageUrl}
                          alt={lot.lotNumber}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#405742]">
                          <CommodityIcon type={lot.commodityType} className="h-12 w-12 opacity-60" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <Badge className={`border-0 text-[10px] uppercase tracking-[0.14em] ${GRADE_COLORS[lot.grade] || GRADE_COLORS.UNGRADED}`}>
                          {t("common.grade")} {lot.grade}
                        </Badge>
                        <Badge className="console-chip border-0 text-[10px] uppercase tracking-[0.14em]">
                          {lot.listingMode}
                        </Badge>
                      </div>
                      {lot.auctionEndsAt ? (
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 border border-white/30 bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                          <Timer className="h-3.5 w-3.5" />
                          {timeRemaining(lot.auctionEndsAt)}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4 p-5">
                      <div>
                        <p className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
                          {COMMODITY_LABELS[lot.commodityType] || lot.commodityType}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">{lot.lotNumber}</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="console-note p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">{t("common.lotValue")}</p>
                          <p className="mt-2 text-base font-semibold text-stone-950">{formatPrice(lot.startingPriceInr)}</p>
                        </div>
                        <div className="console-note p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">{t("common.quantity")}</p>
                          <p className="mt-2 text-base font-semibold text-stone-950">{(lot.quantityKg ?? 0).toLocaleString()} kg</p>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-[#ece4d6] pt-4 text-sm text-stone-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#7b6d4d]" />
                          <span>{originLabel}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate">{supplier}</span>
                          <span className="truncate text-right">{lot.warehouse?.name || t("common.warehousePending")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#405742] transition-transform group-hover:translate-x-1">
                        {t("common.openLot")}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Surface>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}