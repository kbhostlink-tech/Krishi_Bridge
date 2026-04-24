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
import { ArrowRight, CheckCircle2, CircleDot, Clock, Handshake, MessageCircle, Send, Star, XCircle } from "lucide-react";
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

type RfqFilter = "active" | "accepted" | "closed" | "all";

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-100",
  ROUTED: "bg-sky-50 text-sky-700 border-sky-100",
  RESPONDED: "bg-indigo-50 text-indigo-700 border-indigo-100",
  NEGOTIATING: "bg-amber-50 text-amber-700 border-amber-100",
  SELECTED: "bg-violet-50 text-violet-700 border-violet-100",
  ACCEPTED: "bg-[#405742] text-white border-[#405742]",
  EXPIRED: "bg-stone-100 text-stone-600 border-stone-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-100",
};

const STATUS_ICONS: Record<string, ReactNode> = {
  OPEN: <CircleDot className="h-3.5 w-3.5" />,
  ROUTED: <Send className="h-3.5 w-3.5" />,
  RESPONDED: <MessageCircle className="h-3.5 w-3.5" />,
  NEGOTIATING: <Handshake className="h-3.5 w-3.5" />,
  SELECTED: <Star className="h-3.5 w-3.5" />,
  ACCEPTED: <CheckCircle2 className="h-3.5 w-3.5" />,
  EXPIRED: <Clock className="h-3.5 w-3.5" />,
  CANCELLED: <XCircle className="h-3.5 w-3.5" />,
};

export default function MyRfqsPage() {
  const t = useTranslations("rfq");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const { display } = useCurrency();

  const [rfqs, setRfqs] = useState<RfqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RfqFilter>("active");

  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    const loadRfqs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/rfq?limit=50", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load RFQs");
        }

        const data = await res.json();
        if (!active) return;
        setRfqs(data.rfqs ?? []);
      } catch {
        if (!active) return;
        setError("Network error loading RFQs");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadRfqs();

    return () => {
      active = false;
    };
  }, [accessToken]);

  const openRfqs = useMemo(
    () => rfqs.filter((rfq) => ["OPEN", "ROUTED", "RESPONDED", "NEGOTIATING", "SELECTED"].includes(rfq.status)),
    [rfqs]
  );
  const acceptedRfqs = useMemo(() => rfqs.filter((rfq) => rfq.status === "ACCEPTED"), [rfqs]);
  const closedRfqs = useMemo(() => rfqs.filter((rfq) => ["EXPIRED", "CANCELLED"].includes(rfq.status)), [rfqs]);
  const responseCount = useMemo(() => rfqs.reduce((sum, rfq) => sum + rfq.responseCount, 0), [rfqs]);

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const bestDelivery = (rfq: RfqItem) => {
    const pending = rfq.responses.filter((response) => ["PENDING", "COUNTERED"].includes(response.status));
    if (pending.length === 0) return null;
    return Math.min(...pending.map((response) => response.deliveryDays));
  };

  const expiringSoon = openRfqs.filter((rfq) => daysLeft(rfq.expiresAt) <= 3).length;
  const filterMap: Record<RfqFilter, RfqItem[]> = {
    active: openRfqs,
    accepted: acceptedRfqs,
    closed: closedRfqs,
    all: rfqs,
  };

  const filteredRfqs = filterMap[activeFilter];
  const rfqChart = [
    { label: "Active", value: openRfqs.length, fill: "#506547" },
    { label: "Accepted", value: acceptedRfqs.length, fill: "#c08a2b" },
    { label: "Closed", value: closedRfqs.length, fill: "#55616f" },
    { label: "Responses", value: responseCount, fill: "#2f7d71" },
  ];

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
    return <ErrorState title="Could not load RFQs" message={error} onRetry={() => setIsLoading(true)} />;
  }

  return (
    <PageTransition className="buyer-console space-y-8">
      <PageHeader
        eyebrow={t("sourcingDesk")}
        title={t("myRfqs")}
        action={
          <Link
            href="/rfq/create"
            className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#2f422e]"
          >
            {t("createRfq")}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("activeRfqs")}
          value={openRfqs.length}
          tone="olive"
        />
        <MetricCard
          label={t("accepted")}
          value={acceptedRfqs.length}
          tone="amber"
        />
        <MetricCard
          label={t("totalResponses")}
          value={responseCount}
          tone="teal"
        />
        <MetricCard
          label={t("expiringSoon")}
          value={expiringSoon}
          tone="rose"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <StatusBarChart
          title={t("rfqFlowMix")}
          data={rfqChart}
        />
      </div>

      <Surface className="p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {([
            { key: "active", label: `${t("activeRfqs")} (${openRfqs.length})` },
            { key: "accepted", label: `${t("accepted")} (${acceptedRfqs.length})` },
            { key: "closed", label: `${t("closed")} (${closedRfqs.length})` },
            { key: "all", label: `${t("all")} (${rfqs.length})` },
          ] as { key: RfqFilter; label: string }[]).map((filter) => (
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

      {filteredRfqs.length === 0 ? (
        rfqs.length === 0 ? (
          <EmptyState
            variant="rfq"
            title={t("noRfqs")}
            description={t("noRfqsDesc")}
            action={
              <Link
                href="/rfq/create"
                className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#2f422e]"
              >
                {t("createRfq")}
              </Link>
            }
          />
        ) : (
          <Surface className="p-6 text-center">
            <p className="text-lg font-semibold tracking-[-0.03em] text-stone-950">No RFQs in this view</p>
            <p className="mt-2 text-sm text-stone-600">Switch the filter or open a new sourcing request to keep procurement moving.</p>
          </Surface>
        )
      ) : (
        <div className="space-y-3">
          {filteredRfqs.map((rfq) => {
            const remainingDays = daysLeft(rfq.expiresAt);
            const deliverySignal = bestDelivery(rfq);

            return (
              <Link key={rfq.id} href={`/rfq/${rfq.id}`} className="group block">
                <Surface className="p-4 transition-colors hover:bg-[#fcfaf4]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center border border-[#ddd4c4] bg-[#f8f4ec] text-[#405742]">
                          <CommodityIcon type={rfq.commodityType} className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
                              {COMMODITY_LABELS[rfq.commodityType] || rfq.commodityType}
                            </p>
                            <Badge className={`gap-1 border text-[10px] uppercase tracking-[0.14em] ${STATUS_STYLES[rfq.status] || STATUS_STYLES.OPEN}`}>
                              {STATUS_ICONS[rfq.status] || <CircleDot className="h-3.5 w-3.5" />}
                              {rfq.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-stone-600">
                            {rfq.quantityKg.toLocaleString()} kg
                            {rfq.grade ? ` • Grade ${rfq.grade}` : ""}
                            {` • ${rfq.deliveryCity}, ${rfq.deliveryCountry}`}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="console-note p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">Target price</p>
                          <p className="mt-2 text-base font-semibold text-stone-950">
                            {rfq.targetPriceInr != null ? display(Number(rfq.targetPriceInr)) : "Open"}
                          </p>
                        </div>
                        <div className="console-note p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">Responses</p>
                          <p className="mt-2 text-base font-semibold text-stone-950">{rfq.responseCount}</p>
                        </div>
                        <div className="console-note p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">Delivery signal</p>
                          <p className="mt-2 text-base font-semibold text-stone-950">
                            {deliverySignal != null ? `${deliverySignal} days` : `${remainingDays} days left`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#405742] transition-transform group-hover:translate-x-1">
                      Open RFQ
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Surface>
              </Link>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}