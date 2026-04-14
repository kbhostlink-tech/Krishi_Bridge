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
import { CircleDot, Send, MessageCircle, Handshake, CheckCircle2, XCircle, Star, Clock } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-100",
  ROUTED: "bg-indigo-50 text-indigo-700 border-indigo-100",
  RESPONDED: "bg-blue-50 text-blue-700 border-blue-100",
  NEGOTIATING: "bg-amber-50 text-amber-700 border-amber-100",
  SELECTED: "bg-purple-50 text-purple-700 border-purple-100",
  ACCEPTED: "bg-sage-700 text-white border-sage-700",
  EXPIRED: "bg-sage-50 text-sage-500 border-sage-100",
  CANCELLED: "bg-red-50 text-red-600 border-red-100",
};

const STATUS_ICONS: Record<string, ReactNode> = {
  OPEN: <CircleDot className="w-3.5 h-3.5 text-green-600" />,
  ROUTED: <Send className="w-3.5 h-3.5 text-blue-600" />,
  RESPONDED: <MessageCircle className="w-3.5 h-3.5 text-purple-600" />,
  NEGOTIATING: <Handshake className="w-3.5 h-3.5 text-amber-600" />,
  SELECTED: <Star className="w-3.5 h-3.5 text-purple-600" />,
  ACCEPTED: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  EXPIRED: <Clock className="w-3.5 h-3.5 text-sage-500" />,
  CANCELLED: <XCircle className="w-3.5 h-3.5 text-red-500" />,
};

interface RfqItem {
  id: string;
  commodityType: string;
  grade: string | null;
  quantityKg: number;
  targetPriceInr: number | null;
  deliveryCountry: string;
  deliveryCity: string;
  status: string;
  responseCount: number;
  selectedResponseId: string | null;
  finalPriceInr: number | null;
  expiresAt: string;
  createdAt: string;
  isAnonymized: boolean;
  responses: {
    id: string;
    status: string;
    deliveryDays: number;
    notes: string | null;
    supplierLabel: string;
  }[];
}

export default function MyRfqsPage() {
  const t = useTranslations("rfq");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const { display } = useCurrency();
  const [rfqs, setRfqs] = useState<RfqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRfqs = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rfq?limit=50", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRfqs(data.rfqs);
      } else {
        setError("Failed to load RFQs");
      }
    } catch {
      setError("Network error loading RFQs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, [accessToken]);

  const openRfqs = rfqs.filter((r) => ["OPEN", "ROUTED", "RESPONDED", "NEGOTIATING", "SELECTED"].includes(r.status));
  const acceptedRfqs = rfqs.filter((r) => r.status === "ACCEPTED");
  const closedRfqs = rfqs.filter((r) => ["EXPIRED", "CANCELLED"].includes(r.status));

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const bestDelivery = (rfq: RfqItem) => {
    const pending = rfq.responses.filter((r) => ["PENDING", "COUNTERED"].includes(r.status));
    if (pending.length === 0) return null;
    return Math.min(...pending.map((r) => r.deliveryDays));
  };

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
    return <ErrorState title="Could not load RFQs" message={error} onRetry={fetchRfqs} />;
  }

  const renderRfqList = (items: RfqItem[]) => {
    if (items.length === 0) {
      return (
        <EmptyState
          variant="rfq"
          title={t("noRfqs")}
          description={t("noRfqsDesc")}
          action={
            <Link
              href="/rfq/create"
              className="inline-block px-6 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors"
            >
              {t("createRfq")}
            </Link>
          }
        />
      );
    }

    return (
      <div className="space-y-3">
        {items.map((rfq) => (
          <Link key={rfq.id} href={`/rfq/${rfq.id}`}>
            <Card className="rounded-3xl border-sage-100 hover:border-sage-200 hover:shadow-sm transition-all cursor-pointer">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0">
                      <CommodityIcon type={rfq.commodityType} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-heading text-sage-900 font-bold text-sm truncate">
                          {COMMODITY_LABELS[rfq.commodityType] || rfq.commodityType}
                        </p>
                        <Badge className={`text-[10px] ${STATUS_COLORS[rfq.status]}`}>
                          {STATUS_ICONS[rfq.status]} {rfq.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-sage-500 mt-0.5">
                        {rfq.quantityKg.toLocaleString()} kg
                        {rfq.grade && ` • Grade ${rfq.grade}`}
                        {" • "}{rfq.responseCount} {rfq.responseCount === 1 ? t("response") : t("responses")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {rfq.status === "ACCEPTED" && rfq.finalPriceInr != null ? (
                      <>
                        <p className="font-heading text-sage-900 font-bold text-lg">
                          {display(Number(rfq.finalPriceInr))}
                        </p>
                        <p className="text-[10px] text-sage-400">{t("finalPrice") || "Final Price"}</p>
                      </>
                    ) : rfq.responses.length > 0 ? (
                      <>
                        <p className="font-heading text-sage-900 font-bold text-sm">
                          {bestDelivery(rfq) != null ? `${bestDelivery(rfq)} days` : `${rfq.responses.length} offers`}
                        </p>
                        <p className="text-[10px] text-sage-400">
                          {daysLeft(rfq.expiresAt)} {t("daysLeft")}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className={`text-xs font-medium ${daysLeft(rfq.expiresAt) <= 2 ? "text-red-500" : "text-sage-500"}`}>
                          {daysLeft(rfq.expiresAt)} {t("daysLeft")}
                        </p>
                        <p className="text-[10px] text-sage-400">{t("noOffers")}</p>
                      </>
                    )}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-sage-900 text-2xl font-bold">{t("myRfqs")}</h1>
          <p className="text-sage-500 text-sm mt-1">{t("myRfqsSubtitle")}</p>
        </div>
        <Link
          href="/rfq/create"
          className="self-start px-6 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors"
        >
          + {t("createRfq")}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-4 text-center">
            <p className="font-heading text-sage-900 text-2xl font-bold">{openRfqs.length}</p>
            <p className="text-xs text-sage-500 mt-1">{t("activeRfqs")}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-4 text-center">
            <p className="font-heading text-sage-900 text-2xl font-bold">{acceptedRfqs.length}</p>
            <p className="text-xs text-sage-500 mt-1">{t("accepted")}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-4 text-center">
            <p className="font-heading text-sage-900 text-2xl font-bold">{rfqs.length}</p>
            <p className="text-xs text-sage-500 mt-1">{t("totalRfqs")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList className="bg-sage-50 rounded-2xl p-1">
          <TabsTrigger value="active" className="rounded-xl text-sm">
            {t("activeRfqs")} ({openRfqs.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="rounded-xl text-sm">
            {t("accepted")} ({acceptedRfqs.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="rounded-xl text-sm">
            {t("closed")} ({closedRfqs.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-xl text-sm">
            {t("all")} ({rfqs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {renderRfqList(openRfqs)}
        </TabsContent>
        <TabsContent value="accepted" className="mt-4">
          {renderRfqList(acceptedRfqs)}
        </TabsContent>
        <TabsContent value="closed" className="mt-4">
          {renderRfqList(closedRfqs)}
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          {renderRfqList(rfqs)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
