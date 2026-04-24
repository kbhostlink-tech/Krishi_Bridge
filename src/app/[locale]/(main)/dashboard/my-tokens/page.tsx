"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";
import { PageTransition } from "@/components/ui/page-transition";
import { CircleDot, RefreshCw, CheckCircle2, Clock, MapPin, Wheat } from "lucide-react";
import { COMMODITY_LABELS } from "@/lib/commodity-icons";

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

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: ReactNode }
> = {
  ACTIVE: { label: "Active", variant: "default", icon: <CircleDot className="h-3.5 w-3.5 text-green-600" /> },
  TRANSFERRED: { label: "Transferred", variant: "secondary", icon: <RefreshCw className="h-3.5 w-3.5 text-blue-600" /> },
  REDEEMED: { label: "Redeemed", variant: "outline", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> },
  EXPIRED: { label: "Expired", variant: "destructive", icon: <Clock className="h-3.5 w-3.5 text-stone-500" /> },
};

export default function MyTokensPage() {
  const t = useTranslations("tokens");
  const bt = useTranslations("buyerConsole");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tokens, setTokens] = useState<TokenListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const limit = 12;

  useEffect(() => {
    if (!authLoading && user && user.role !== "BUYER") {
      router.replace("/dashboard");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    const loadTokens = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(`/api/tokens?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load tokens");
        }

        const data = await res.json();
        if (!active) return;

        setTokens(data.tokens ?? []);
        setTotal(data.pagination?.total ?? 0);
      } catch {
        if (!active) return;
        setTokens([]);
        setTotal(0);
        setError("Failed to load tokens");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadTokens();

    return () => {
      active = false;
    };
  }, [accessToken, page, statusFilter]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const statusCounts = useMemo(
    () => ({
      ACTIVE: tokens.filter((token) => token.status === "ACTIVE").length,
      TRANSFERRED: tokens.filter((token) => token.status === "TRANSFERRED").length,
      REDEEMED: tokens.filter((token) => token.status === "REDEEMED").length,
      EXPIRED: tokens.filter((token) => token.status === "EXPIRED").length,
    }),
    [tokens]
  );
  const expiringSoon = tokens.filter((token) => {
    if (token.status !== "ACTIVE") return false;
    const daysLeft = Math.ceil((new Date(token.expiresAt).getTime() - currentTime) / (1000 * 60 * 60 * 24));
    return daysLeft <= 14;
  }).length;

  if (!authLoading && user && user.role !== "BUYER") {
    return null;
  }

  if (authLoading || loading) {
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
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="h-80 rounded skeleton-shimmer" />
          <div className="h-80 rounded skeleton-shimmer" />
        </div>
      </PageTransition>
    );
  }

  if (error && tokens.length === 0) {
    return <ErrorState title="Could not load tokens" message={error} onRetry={() => setLoading(true)} />;
  }

  return (
    <PageTransition className="buyer-console space-y-8">
      <PageHeader
        eyebrow={bt("tokens.eyebrow")}
        title={bt("tokens.title")}
        description={bt("tokens.description")}
        action={
          <Link
            href="/marketplace"
            className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#2f422e]"
          >
            {bt("tokens.browseInventory")}
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <MetricCard
          label={bt("tokens.total")}
          value={total}
          meta={bt("tokens.totalMeta")}
          tone="olive"
        />
        <MetricCard
          label={bt("tokens.active")}
          value={statusCounts.ACTIVE}
          meta={bt("tokens.activeMeta")}
          tone="teal"
        />
        <MetricCard
          label={bt("tokens.redeemed")}
          value={statusCounts.REDEEMED}
          meta={bt("tokens.redeemedMeta")}
          tone="amber"
        />
        <MetricCard
          label={bt("tokens.expiringSoon")}
          value={expiringSoon}
          meta={bt("tokens.expiringSoonMeta")}
          tone="rose"
        />
      </div>

      <Surface className="p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {([
            { key: "", label: `${bt("tokens.filterAll")} (${total})` },
            { key: "ACTIVE", label: `${bt("tokens.filterActive")} (${statusCounts.ACTIVE})` },
            { key: "TRANSFERRED", label: `${bt("tokens.filterTransferred")} (${statusCounts.TRANSFERRED})` },
            { key: "REDEEMED", label: `${bt("tokens.filterRedeemed")} (${statusCounts.REDEEMED})` },
            { key: "EXPIRED", label: `${bt("tokens.filterExpired")} (${statusCounts.EXPIRED})` },
          ] as { key: string; label: string }[]).map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => {
                setStatusFilter(filter.key);
                setPage(1);
              }}
              className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                statusFilter === filter.key
                  ? "border border-[#405742] bg-[#405742] text-white"
                  : "border border-[#ddd4c4] bg-white text-stone-600 hover:bg-[#f8f4ec] hover:text-stone-950"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </Surface>

      {tokens.length === 0 ? (
        <EmptyState
          variant="tokens"
          title={t("noTokens")}
          description={t("noTokensDesc")}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tokens.map((token) => {
            const status = STATUS_CONFIG[token.status] || STATUS_CONFIG.ACTIVE;
            const daysLeft = Math.ceil((new Date(token.expiresAt).getTime() - currentTime) / (1000 * 60 * 60 * 24));

            return (
              <Link key={token.id} href={`/dashboard/my-tokens/${token.id}`} className="group block">
                <Surface className="h-full p-5 transition-colors hover:bg-[#fcfaf4]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {token.lot?.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={token.lot.images[0]}
                          alt={COMMODITY_LABELS[token.lot.commodityType] || token.lot.commodityType}
                          className="h-14 w-14 border border-[#ddd4c4] object-cover"
                        />
                      ) : (
                        <span className="grid h-14 w-14 place-items-center border border-[#ddd4c4] bg-[#f8f4ec] text-[#405742]">
                          <Wheat className="h-5 w-5" />
                        </span>
                      )}
                      <div>
                        <p className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
                          {token.lot?.commodityType ? (COMMODITY_LABELS[token.lot.commodityType] || token.lot.commodityType) : bt("common.unknownLot")}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {token.lot?.lotNumber ? `Lot ${token.lot.lotNumber}` : bt("common.awaitingLotLink")}
                          {token.lot?.grade ? ` • ${bt("common.grade")} ${token.lot.grade}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant={status.variant} className="gap-1 text-[10px] uppercase tracking-[0.14em]">
                      {status.icon}
                      {status.label}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="console-note p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">{bt("common.quantity")}</p>
                      <p className="mt-2 text-base font-semibold text-stone-950">
                        {token.lot?.quantityKg != null ? `${token.lot.quantityKg.toLocaleString()} kg` : "-"}
                      </p>
                    </div>
                    <div className="console-note p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">{bt("tokens.minted")}</p>
                      <p className="mt-2 text-base font-semibold text-stone-950">
                        {new Date(token.mintedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#ece4d6] pt-4 text-sm text-stone-600">
                    <div className="flex min-w-0 items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[#7b6d4d]" />
                      <span className="truncate">{token.lot?.warehouse?.name || bt("common.warehousePending")}</span>
                    </div>
                    {token.status === "ACTIVE" ? (
                      <span className={daysLeft <= 14 ? "font-semibold text-[#a85d56]" : "font-semibold text-stone-900"}>
                        {daysLeft > 0 ? bt("tokens.daysLeft", { days: daysLeft }) : bt("tokens.expiring")}
                      </span>
                    ) : token.status === "REDEEMED" && token.redeemedAt ? (
                      <span className="font-semibold text-stone-900">{new Date(token.redeemedAt).toLocaleDateString()}</span>
                    ) : (
                      <span className="font-semibold text-stone-900">{status.label}</span>
                    )}
                  </div>
                </Surface>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            disabled={page === 1}
            className="inline-flex h-10 items-center border border-[#ddd4c4] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("prev")}
          </button>
          <span className="px-3 text-sm text-stone-600">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={page === totalPages}
            className="inline-flex h-10 items-center border border-[#ddd4c4] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("next")}
          </button>
        </div>
      ) : null}
    </PageTransition>
  );
}