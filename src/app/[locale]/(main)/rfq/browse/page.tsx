"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
import { CommodityIcon } from "@/lib/commodity-icons";
import { Store, ClipboardList, Check } from "lucide-react";

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

const COUNTRY_LABELS: Record<string, string> = {
  IN: "India", NP: "Nepal", BT: "Bhutan", AE: "UAE", SA: "Saudi Arabia", OM: "Oman",
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

  useEffect(() => {
    if (!accessToken) return;

    const fetchRfqs = async () => {
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (filter !== "all") params.set("commodityType", filter);

        const res = await fetch(`/api/rfq/open?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRfqs(data.rfqs);
          setError(null);
        } else {
          setError("Failed to load RFQ listings");
        }
      } catch {
        setError("Network error loading RFQs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRfqs();
  }, [accessToken, filter]);

  const filtered = rfqs.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.commodityType.toLowerCase().includes(q) ||
      r.deliveryCity.toLowerCase().includes(q) ||
      r.deliveryCountry.toLowerCase().includes(q)
    );
  });

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-sage-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-white rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "FARMER" && user.role !== "AGGREGATOR")) {
    return (
      <div className="text-center py-16">
        <Store className="w-10 h-10 text-sage-300 mx-auto mb-4" />
        <p className="text-sage-700 font-medium">{t("sellersOnly")}</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Could not load RFQs" message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-sage-900 text-2xl font-bold">{t("browseTitle")}</h1>
          <p className="text-sage-500 text-sm mt-1">{t("browseSubtitle")}</p>
        </div>
        <Badge className="bg-sage-50 text-sage-700 text-sm self-start">
          {filtered.length} {t("openRfqs")}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchRfqs")}
          className="rounded-xl flex-1"
        />
        <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
          <SelectTrigger className="rounded-xl w-full sm:w-48">
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

      {/* RFQ Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-10 h-10 text-sage-300 mx-auto mb-3" />
          <p className="text-sage-700 font-medium">{t("noOpenRfqs")}</p>
          <p className="text-sage-500 text-sm mt-1">{t("noOpenRfqsDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((rfq) => (
            <Link key={rfq.id} href={`/rfq/${rfq.id}`}>
              <Card className="rounded-3xl border-sage-100 hover:border-sage-200 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardContent className="pt-5 pb-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CommodityIcon type={rfq.commodityType} className="w-6 h-6" />
                      <div>
                        <p className="font-heading text-sage-900 font-bold text-sm">
                          {COMMODITY_LABELS[rfq.commodityType] || rfq.commodityType}
                        </p>
                        {rfq.grade && (
                          <Badge className="mt-0.5 text-[10px] bg-sage-50 text-sage-600">{rfq.grade}</Badge>
                        )}
                      </div>
                    </div>
                    {rfq.alreadyResponded ? (
                      <Badge className="bg-emerald-50 text-emerald-700 text-[10px]">
                        <Check className="w-3 h-3" /> {t("responded")}
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 text-[10px]">
                        {t("new")}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-sage-500">{t("quantity")}</span>
                      <span className="text-sage-900 font-medium">{rfq.quantityKg.toLocaleString()} kg</span>
                    </div>
                    {rfq.buyerLabel && (
                      <div className="flex justify-between">
                        <span className="text-sage-500">{t("requestedBy") || "Requested by"}</span>
                        <span className="text-sage-900 font-medium text-xs">{rfq.buyerLabel}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sage-500">{t("deliverTo")}</span>
                      <span className="text-sage-900 font-medium">{rfq.deliveryCity}, {COUNTRY_LABELS[rfq.deliveryCountry]}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-sage-100">
                    <span className="text-xs text-sage-400">
                      {rfq.responseCount} {rfq.responseCount === 1 ? t("response") : t("responses")}
                    </span>
                    <span className={`text-xs font-medium ${daysLeft(rfq.expiresAt) <= 2 ? "text-red-500" : "text-sage-500"}`}>
                      {daysLeft(rfq.expiresAt)} {t("daysLeft")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
