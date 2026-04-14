"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { SkeletonStatCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageTransition } from "@/components/ui/page-transition";
import { CircleDot, RefreshCw, CheckCircle2, Clock, Wheat, MapPin } from "lucide-react";

interface TokenListItem {
  id: string;
  status: string;
  mintedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  lot: {
    lotNumber: string;
    commodityType: string;
    grade: string;
    quantityKg: number;
    images: string[];
    warehouse: { name: string } | null;
  } | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: ReactNode }> = {
  ACTIVE: { label: "Active", variant: "default", icon: <CircleDot className="w-3.5 h-3.5 text-green-600" /> },
  TRANSFERRED: { label: "Transferred", variant: "secondary", icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> },
  REDEEMED: { label: "Redeemed", variant: "outline", icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> },
  EXPIRED: { label: "Expired", variant: "destructive", icon: <Clock className="w-3.5 h-3.5 text-sage-500" /> },
};

export default function MyTokensPage() {
  const t = useTranslations("tokens");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [tokens, setTokens] = useState<TokenListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/tokens?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setTokens(data.tokens);
        setTotal(data.pagination?.total || 0);
      })
      .catch(() => { setTokens([]); setError("Failed to load tokens"); })
      .finally(() => setLoading(false));
  }, [accessToken, page, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  // Stats
  const activeCount = tokens.filter((t) => t.status === "ACTIVE").length;

  if (authLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded skeleton-shimmer" />
            <div className="h-9 w-48 rounded skeleton-shimmer" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-9 w-12 rounded skeleton-shimmer ml-auto" />
            <div className="h-4 w-24 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-3xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (error && tokens.length === 0) {
    return <ErrorState title="Could not load tokens" message={error} onRetry={() => { setError(null); setLoading(true); }} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-script text-sage-500 text-lg">{t("subtitle")}</p>
          <h1 className="font-heading text-sage-900 text-3xl font-bold">
            {t("title")}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-3xl font-heading font-bold text-sage-900">{total}</p>
          <p className="text-sage-500 text-sm">{t("totalTokens")}</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["ACTIVE", "TRANSFERRED", "REDEEMED", "EXPIRED"] as const).map((s) => {
          const cfg = statusConfig[s];
          const count = tokens.filter((t) => t.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={`rounded-2xl p-4 text-left transition-all border ${
                statusFilter === s
                  ? "border-sage-400 bg-sage-50 shadow-sm"
                  : "border-sage-100 bg-white hover:border-sage-200"
              }`}
            >
              <span className="text-lg">{cfg.icon}</span>
              <p className="font-heading font-bold text-sage-900 text-xl mt-1">{count}</p>
              <p className="text-sage-500 text-xs">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Token Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-white rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <EmptyState
          variant="tokens"
          title={t("noTokens")}
          description={t("noTokensDesc")}
          action={
            <Link
              href="/marketplace"
              className="inline-flex h-10 px-6 items-center bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors"
            >
              {t("browseMarketplace")}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => {
            const cfg = statusConfig[token.status] || statusConfig.ACTIVE;
            const daysLeft = Math.ceil(
              (new Date(token.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Link
                href={`/dashboard/my-tokens/${token.id}`}
                key={token.id}
                className="group"
              >
                <Card className="rounded-3xl border-sage-100 shadow-sm hover:shadow-md hover:border-sage-200 transition-all h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {token.lot?.images?.[0] ? (
                          <img
                            src={token.lot.images[0]}
                            alt={token.lot.commodityType}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-sage-50 flex items-center justify-center">
                            <Wheat className="w-4 h-4 text-amber-600" />
                          </div>
                        )}
                      </div>
                      <Badge variant={cfg.variant} className="text-xs">
                        {cfg.icon} {cfg.label}
                      </Badge>
                    </div>

                    <h3 className="font-heading font-bold text-sage-900 group-hover:text-sage-700 transition-colors">
                      {token.lot?.commodityType || "—"} — {token.lot?.grade || "—"}
                    </h3>
                    <p className="text-sage-500 text-sm mt-1">
                      Lot #{token.lot?.lotNumber} · {token.lot?.quantityKg} kg
                    </p>

                    {token.lot?.warehouse && (
                      <p className="text-sage-400 text-xs mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {token.lot.warehouse.name}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-sage-50">
                      <span className="text-sage-400 text-xs">
                        {t("minted")}: {new Date(token.mintedAt).toLocaleDateString()}
                      </span>
                      {token.status === "ACTIVE" && (
                        <span
                          className={`text-xs font-medium ${
                            daysLeft <= 7
                              ? "text-red-600"
                              : daysLeft <= 30
                              ? "text-amber-600"
                              : "text-sage-500"
                          }`}
                        >
                          {daysLeft > 0 ? `${daysLeft}d left` : "Expiring"}
                        </span>
                      )}
                      {token.status === "REDEEMED" && token.redeemedAt && (
                        <span className="text-sage-400 text-xs">
                          {new Date(token.redeemedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-9 px-4 rounded-full border border-sage-200 text-sage-600 text-sm hover:bg-sage-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← {t("prev")}
          </button>
          <span className="flex items-center text-sage-500 text-sm px-3">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-9 px-4 rounded-full border border-sage-200 text-sage-600 text-sm hover:bg-sage-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t("next")} →
          </button>
        </div>
      )}
    </div>
  );
}
