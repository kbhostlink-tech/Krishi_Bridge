"use client";

import { useEffect, useMemo, useState } from "react";

import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { CommodityIcon } from "@/lib/commodity-icons";
import { useTranslations } from "next-intl";
import { ClipboardList, Store } from "lucide-react";

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Black Cardamom",
  TEA: "Orthodox Tea",
  OTHER: "Black Tea",
};

const COUNTRY_LABELS: Record<string, string> = {
  IN: "India",
  NP: "Nepal",
  BT: "Bhutan",
  AE: "UAE",
  SA: "Saudi Arabia",
  OM: "Oman",
};

interface RfqItem {
  id: string;
  commodityType: string;
  grade: string | null;
  quantityKg: number;
  deliveryCountry: string;
  deliveryCity: string;
  description: string | null;
  status: string;
  responseCount: number;
  expiresAt: string;
  createdAt: string;
  buyerLabel: string;
  isAnonymized: boolean;
  alreadyResponded: boolean;
  myResponseStatus: string | null;
}

export default function BrowseRfqPage() {
  const t = useTranslations("rfq");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [rfqs, setRfqs] = useState<RfqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!accessToken) return;

    const fetchRfqs = async () => {
      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(currentPage) });
        if (filter !== "all") params.set("commodityType", filter);

        const res = await fetch(`/api/rfq/open?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setRfqs(data.rfqs);
          setTotalPages(data.totalPages ?? 1);
          setTotalCount(data.total ?? 0);
          setError(null);
        } else {
          setError(t("failedLoad"));
        }
      } catch {
        setError(t("networkError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRfqs();
  }, [accessToken, filter, currentPage, t]);

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const filtered = useMemo(() => {
    return rfqs.filter((rfq) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        rfq.commodityType.toLowerCase().includes(q) ||
        rfq.deliveryCity.toLowerCase().includes(q) ||
        rfq.deliveryCountry.toLowerCase().includes(q)
      );
    });
  }, [rfqs, search]);

  const openNow = filtered.length;
  const respondedCount = filtered.filter((rfq) => rfq.alreadyResponded).length;
  const urgentCount = filtered.filter((rfq) => daysLeft(rfq.expiresAt) <= 2).length;

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-[#ece4d6]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse border border-[#ddd4c4] bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "FARMER" && user.role !== "AGGREGATOR")) {
    return (
      <div className="py-16 text-center">
        <Store className="mx-auto mb-4 h-10 w-10 text-sage-300" />
        <p className="font-medium text-sage-700">{t("sellersOnly")}</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState title={t("couldNotLoad")} message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("demandBoardEyebrow")}
        title={t("browseTitle")}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label={t("openRfqsLabel")} value={totalCount} tone="slate" />
        <MetricCard label={t("visibleNowLabel")} value={openNow} tone="olive" />
        <MetricCard label={t("responded")} value={respondedCount} tone="teal" />
        <MetricCard label={t("expiringSoon")} value={urgentCount} tone="amber" />
      </div>

      <Surface className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchRfqs")}
            className="border-[#d9d1c2] min-w-40 flex-1 basis-40"
          />
          <Select value={filter} onValueChange={(v) => { if (v) { setFilter(v); setCurrentPage(1); } }}>
            <SelectTrigger className="w-48 border-[#d9d1c2]">
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
        </div>
      </Surface>

      {filtered.length === 0 ? (
        <Surface className="p-12 text-center sm:p-16">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-sage-300" />
          <p className="font-medium text-sage-700">{t("noOpenRfqs")}</p>
          <p className="mt-1 text-sm text-sage-500">{t("noOpenRfqsDesc")}</p>
        </Surface>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((rfq) => (
              <Link key={rfq.id} href={`/rfq/${rfq.id}`}>
                <Surface className="h-full p-4 transition-colors hover:bg-[#fdfbf7] sm:p-5">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="border border-[#ddd4c4] bg-[#f7f2e8] p-3">
                          <CommodityIcon type={rfq.commodityType} className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-stone-950">
                            {COMMODITY_LABELS[rfq.commodityType] || rfq.commodityType}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                            {rfq.grade ? t("gradeBadge", { grade: rfq.grade }) : t("ungradedRequest")}
                          </p>
                        </div>
                      </div>
                      {rfq.alreadyResponded ? (
                        <Badge className="bg-emerald-50 text-emerald-700">{t("responded")}</Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700">{t("new")}</Badge>
                      )}
                    </div>

                    <div className="grid gap-2 text-sm text-stone-600">
                      <div className="flex items-center justify-between">
                        <span>{t("quantity")}</span>
                        <span className="font-semibold text-stone-950">{rfq.quantityKg.toLocaleString()} kg</span>
                      </div>
                      {rfq.buyerLabel ? (
                        <div className="flex items-center justify-between gap-4">
                          <span>{t("requestedBy") || "Requested by"}</span>
                          <span className="text-right font-semibold text-stone-950">{rfq.buyerLabel}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between gap-4">
                        <span>{t("deliverTo")}</span>
                        <span className="text-right font-semibold text-stone-950">
                          {rfq.deliveryCity}, {COUNTRY_LABELS[rfq.deliveryCountry]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#ece4d6] pt-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{t("responsesLabel")}</p>
                        <p className="text-sm font-semibold text-stone-950">
                          {rfq.responseCount} {rfq.responseCount === 1 ? t("response") : t("responses")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{t("timeLeftLabel")}</p>
                        <p className={`text-sm font-semibold ${daysLeft(rfq.expiresAt) <= 2 ? "text-[#a6781f]" : "text-stone-950"}`}>
                          {daysLeft(rfq.expiresAt)} {t("daysLeft")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Surface>
              </Link>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-10 items-center border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← {t("prevLabel")}
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
                {t("nextLabel")} →
              </button>
            </div>
          ) : null}

          <p className="text-center text-xs text-sage-500">
            {t("showingRfqs", { shown: filtered.length, total: totalCount })}
          </p>
        </>
      )}
    </div>
  );
}