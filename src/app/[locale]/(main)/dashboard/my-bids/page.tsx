"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonStatCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageTransition } from "@/components/ui/page-transition";
import { CommodityIcon } from "@/lib/commodity-icons";
import { CircleDot, Trophy, AlertTriangle, XCircle } from "lucide-react";
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

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  WON: "bg-amber-50 text-amber-700 border-amber-100",
  OUTBID: "bg-red-50 text-red-700 border-red-100",
  CANCELLED: "bg-sage-50 text-sage-500 border-sage-100",
};

const STATUS_ICONS: Record<string, ReactNode> = {
  ACTIVE: <CircleDot className="w-3.5 h-3.5 text-green-600" />,
  WON: <Trophy className="w-3.5 h-3.5 text-amber-600" />,
  OUTBID: <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />,
  CANCELLED: <XCircle className="w-3.5 h-3.5 text-red-500" />,
};

export default function MyBidsPage() {
  const t = useTranslations("bidding");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [bids, setBids] = useState<BidItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBids = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bids?my=true", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBids(data.bids);
      } else {
        setError("Failed to load bids");
      }
    } catch {
      setError("Network error loading bids");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [accessToken]);

  const activeBids = bids.filter((b) => b.status === "ACTIVE");
  const wonBids = bids.filter((b) => b.status === "WON");
  const outbidBids = bids.filter((b) => b.status === "OUTBID");

  const { display } = useCurrency();
  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return "—";
    return display(price);
  };
  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded skeleton-shimmer" />
          <div className="h-4 w-64 rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-3xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-sage-500">{t("loginRequired")}</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Could not load bids" message={error} onRetry={fetchBids} />;
  }

  const renderBidList = (items: BidItem[]) => {
    if (items.length === 0) {
      return (
        <EmptyState
          variant="bids"
          title={t("noBidsYet")}
          description={t("noBidsDesc")}
          action={
            <Link
              href="/marketplace"
              className="inline-block px-6 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors"
            >
              {t("browseMarketplace")}
            </Link>
          }
        />
      );
    }

    return (
      <div className="space-y-3">
        {items.map((bid) => (
          <Link key={bid.id} href={`/marketplace/${bid.lot.id}`}>
            <Card className="rounded-3xl border-sage-100 hover:border-sage-200 hover:shadow-sm transition-all cursor-pointer">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0">
                      <CommodityIcon type={bid.lot.commodityType} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-heading text-sage-900 font-bold text-sm truncate">
                          {bid.lot.lotNumber}
                        </p>
                        <Badge className={`text-[10px] ${STATUS_COLORS[bid.status]}`}>
                          {STATUS_ICONS[bid.status]} {bid.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-sage-500 mt-0.5">
                        {(bid.lot.quantityKg ?? 0).toLocaleString()} kg • Grade {bid.lot.grade} • {formatDate(bid.createdAt)}
                      </p>
                      {bid.isProxy && bid.maxProxyInr && (
                        <p className="text-[10px] text-sage-400 mt-0.5">
                          {t("proxy")}: max {formatPrice(bid.maxProxyInr)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading text-sage-900 font-bold text-lg">
                      {formatPrice(bid.amountInr)}
                    </p>
                    <p className="text-[10px] text-sage-400">{bid.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">{t("myBids")}</h1>
        <p className="text-sage-500 text-sm mt-1">{t("myBidsSubtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-4 text-center">
            <p className="font-heading text-sage-900 text-2xl font-bold">{activeBids.length}</p>
            <p className="text-xs text-sage-500 mt-1">{t("activeBids")}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-4 text-center">
            <p className="font-heading text-sage-900 text-2xl font-bold">{wonBids.length}</p>
            <p className="text-xs text-sage-500 mt-1">{t("wonBids")}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-4 text-center">
            <p className="font-heading text-sage-900 text-2xl font-bold">{outbidBids.length}</p>
            <p className="text-xs text-sage-500 mt-1">{t("outbidBids")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bid Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="bg-sage-50 rounded-2xl p-1">
          <TabsTrigger value="all" className="rounded-xl text-sm">
            {t("allBids")} ({bids.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-xl text-sm">
            {t("activeBids")} ({activeBids.length})
          </TabsTrigger>
          <TabsTrigger value="won" className="rounded-xl text-sm">
            {t("wonBids")} ({wonBids.length})
          </TabsTrigger>
          <TabsTrigger value="outbid" className="rounded-xl text-sm">
            {t("outbidBids")} ({outbidBids.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderBidList(bids)}
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          {renderBidList(activeBids)}
        </TabsContent>
        <TabsContent value="won" className="mt-4">
          {renderBidList(wonBids)}
        </TabsContent>
        <TabsContent value="outbid" className="mt-4">
          {renderBidList(outbidBids)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
