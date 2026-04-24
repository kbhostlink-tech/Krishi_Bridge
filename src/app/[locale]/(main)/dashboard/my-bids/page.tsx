"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { MetricCard, PageHeader, StatusBarChart, Surface } from "@/components/ui/console-kit";
import { PageTransition } from "@/components/ui/page-transition";
import { CommodityIcon } from "@/lib/commodity-icons";
import { ArrowRight, CircleDot, Trophy, AlertTriangle, XCircle } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

interface BidItem {
  id: string;
  amountInr: number;
  currency: string;
  status: "ACTIVE" | "OUTBID" | "WON" | "CANCELLED";
  isProxy: boolean;
  maxProxyInr: number | null;
  createdAt: string;
  lot: {
    id: string;
    lotNumber: string;
    commodityType: string;
    quantityKg: number;
    status: string;
    grade: string;
    startingPriceInr: number | null;
  };
}

type BidFilter = "all" | "active" | "won" | "outbid" | "cancelled";

const STATUS_STYLES: Record<BidItem["status"], string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  WON: "bg-amber-50 text-amber-700 border-amber-100",
  OUTBID: "bg-red-50 text-red-700 border-red-100",
  CANCELLED: "bg-stone-100 text-stone-600 border-stone-200",
};

const STATUS_ICONS: Record<BidItem["status"], ReactNode> = {
  ACTIVE: <CircleDot className="h-3.5 w-3.5" />,
  WON: <Trophy className="h-3.5 w-3.5" />,
  OUTBID: <AlertTriangle className="h-3.5 w-3.5" />,
  CANCELLED: <XCircle className="h-3.5 w-3.5" />,
};

export default function MyBidsPage() {
  const t = useTranslations("bidding");
  const bt = useTranslations("buyerConsole");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const { display } = useCurrency();

  const [bids, setBids] = useState<BidItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<BidFilter>("all");

  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    const loadBids = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/bids?my=true", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load bids");
        }

        const data = await res.json();
        if (!active) return;
        setBids(data.bids ?? []);
      } catch {
        if (!active) return;
        setError("Network error loading bids");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadBids();

    return () => {
      active = false;
    };
  }, [accessToken]);

  const activeBids = useMemo(() => bids.filter((bid) => bid.status === "ACTIVE"), [bids]);
  const wonBids = useMemo(() => bids.filter((bid) => bid.status === "WON"), [bids]);
  const outbidBids = useMemo(() => bids.filter((bid) => bid.status === "OUTBID"), [bids]);
  const cancelledBids = useMemo(() => bids.filter((bid) => bid.status === "CANCELLED"), [bids]);
  const activeExposure = useMemo(
    () => activeBids.reduce((sum, bid) => sum + (bid.amountInr || 0), 0),
    [activeBids]
  );

  const filterMap: Record<BidFilter, BidItem[]> = {
    all: bids,
    active: activeBids,
    won: wonBids,
    outbid: outbidBids,
    cancelled: cancelledBids,
  };

  const filteredBids = filterMap[activeFilter];
  const bidChart = [
    { label: "Active", value: activeBids.length, fill: "#506547" },
    { label: "Won", value: wonBids.length, fill: "#c08a2b" },
    { label: "Outbid", value: outbidBids.length, fill: "#a85d56" },
    { label: "Cancelled", value: cancelledBids.length, fill: "#7b6d4d" },
  ];

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return "-";
    return display(price);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (authLoading || isLoading) {
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
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="h-80 rounded skeleton-shimmer" />
          <div className="h-80 rounded skeleton-shimmer" />
        </div>
      </PageTransition>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center text-sage-500">
        <p>{t("loginRequired")}</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Could not load bids" message={error} onRetry={() => setIsLoading(true)} />;
  }

  return (
    <PageTransition className="buyer-console space-y-8">
      <PageHeader
        eyebrow={t("auctionDesk")}
        title={t("myBids")}
        action={
          <Link
            href="/marketplace"
            className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#2f422e]"
          >
            {bt("common.browseMarketplace")}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("activeBids")}
          value={activeBids.length}
          tone="olive"
        />
        <MetricCard
          label={t("wonBids")}
          value={wonBids.length}
          tone="amber"
        />
        <MetricCard
          label={t("outbidBids")}
          value={outbidBids.length}
          tone="rose"
        />
        <MetricCard
          label={t("activeExposure")}
          value={formatPrice(activeExposure)}
          tone="slate"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <StatusBarChart
          title={t("bidStatusMix")}
          data={bidChart}
        />
      </div>

      <Surface className="p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {([  
            { key: "all", label: `${t("allBids")} (${bids.length})` },
            { key: "active", label: `${t("activeBids")} (${activeBids.length})` },
            { key: "won", label: `${t("wonBids")} (${wonBids.length})` },
            { key: "outbid", label: `${t("outbidBids")} (${outbidBids.length})` },
            { key: "cancelled", label: `${t("cancelledBids")} (${cancelledBids.length})` },
          ] as { key: BidFilter; label: string }[]).map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                activeFilter === filter.key
                  ? "border border-[#405742] bg-[#405742] text-white"
                  : "border border-[#ddd4c4] bg-white text-stone-600 hover:bg-[#f8f4ec] hover:text-stone-950"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </Surface>

      {filteredBids.length === 0 ? (
        bids.length === 0 ? (
          <EmptyState
            variant="bids"
            title={t("noBidsYet")}
            description={t("noBidsDesc")}
            action={
              <Link
                href="/marketplace"
                className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#2f422e]"
              >
                {t("browseMarketplace")}
              </Link>
            }
          />
        ) : (
          <Surface className="p-6 text-center">
            <p className="text-lg font-semibold tracking-[-0.03em] text-stone-950">{bt("common.noMatches")}</p>
            <p className="mt-2 text-sm text-stone-600">{bt("common.tryDifferentFilter")}</p>
          </Surface>
        )
      ) : (
        <div className="space-y-3">
          {filteredBids.map((bid) => (
            <Link key={bid.id} href={`/marketplace/${bid.lot?.id ?? ""}`} className="group block">
              <Surface className="p-4 transition-colors hover:bg-[#fcfaf4]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center border border-[#ddd4c4] bg-[#f8f4ec] text-[#405742]">
                        <CommodityIcon type={bid.lot?.commodityType ?? ""} className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold tracking-[-0.03em] text-stone-950">{bid.lot?.lotNumber ?? "—"}</p>
                          <Badge className={`gap-1 border text-[10px] uppercase tracking-[0.14em] ${STATUS_STYLES[bid.status]}`}>
                            {STATUS_ICONS[bid.status]}
                            {bid.status}
                          </Badge>
                          {bid.isProxy ? <Badge className="console-chip border-0 text-[10px] uppercase tracking-[0.14em]">Proxy</Badge> : null}
                        </div>
                        <p className="mt-1 text-sm text-stone-600">
                          {(bid.lot?.quantityKg ?? 0).toLocaleString()} kg • Grade {bid.lot?.grade ?? "-"} • Created {formatDate(bid.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="console-note p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">{t("yourBid")}</p>
                        <p className="mt-2 text-base font-semibold text-stone-950">{formatPrice(bid.amountInr)}</p>
                      </div>
                      <div className="console-note p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">{t("openingPrice")}</p>
                        <p className="mt-2 text-base font-semibold text-stone-950">{formatPrice(bid.lot?.startingPriceInr)}</p>
                      </div>
                      <div className="console-note p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">{t("proxyCeiling")}</p>
                        <p className="mt-2 text-base font-semibold text-stone-950">
                          {bid.isProxy ? formatPrice(bid.maxProxyInr) : t("manualBid")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#405742] transition-transform group-hover:translate-x-1">
                    {t("openLot")}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Surface>
            </Link>
          ))}
        </div>
      )}
    </PageTransition>
  );
}