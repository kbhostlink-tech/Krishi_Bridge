"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useAuctionSocket, type AuctionBid } from "@/lib/use-auction-socket";
import { AuctionCountdown } from "@/components/auction-countdown";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { Eye, Bell, ShieldCheck, ArrowRightLeft } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

interface BidPanelProps {
  lotId: string;
  lotNumber: string;
  status: string;
  startingPriceInr: number | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  initialBids: {
    id: string;
    amountInr: number;
    createdAt: string;
    bidder: { name: string; country: string };
  }[];
  bidCount: number;
  farmerId: string;
  showSummary?: boolean;
  onViewerCountChange?: (viewerCount: number) => void;
  onAuctionEnded?: (outcome: string, winnerId?: string) => void;
  onBidPlaced?: (bid: AuctionBid) => void;
}

const CURRENCY_OPTIONS = [
  { code: "INR", symbol: "₹", label: "INR" },
  { code: "NPR", symbol: "रू", label: "NPR" },
  { code: "BTN", symbol: "Nu.", label: "BTN" },
  { code: "AED", symbol: "د.إ", label: "AED" },
  { code: "SAR", symbol: "﷼", label: "SAR" },
  { code: "OMR", symbol: "ر.ع.", label: "OMR" },
  { code: "USD", symbol: "$", label: "USD" },
];

export function BidPanel({
  lotId,
  status,
  startingPriceInr,
  auctionStartsAt,
  auctionEndsAt: initialAuctionEndsAt,
  initialBids,
  bidCount: initialBidCount,
  farmerId,
  showSummary = true,
  onViewerCountChange,
  onAuctionEnded: onAuctionEndedProp,
  onBidPlaced,
}: BidPanelProps) {
  const { user, accessToken } = useAuth();
  const { display, selectedCurrency, getSymbol, rates } = useCurrency();
  const t = useTranslations("bidding");
  const [bids, setBids] = useState<AuctionBid[]>(
    initialBids.map((b) => ({
      id: b.id,
      amountInr: b.amountInr,
      currency: "INR",
      isProxy: false,
      createdAt: b.createdAt,
      bidder: { id: "", name: b.bidder.name, country: b.bidder.country },
    }))
  );
  const [bidCount, setBidCount] = useState(initialBidCount);
  const [bidAmount, setBidAmount] = useState("");
  const bidAmountRef = useRef<string>("");
  const [currency, setCurrency] = useState(selectedCurrency);
  const [isProxy, setIsProxy] = useState(false);
  const [maxProxyAmount, setMaxProxyAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auctionEndsAt, setAuctionEndsAt] = useState(initialAuctionEndsAt);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const bidInputRef = useRef<HTMLInputElement>(null);
  const bidInputMobileRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [mobileExpanded, setMobileExpanded] = useState(false);

  // Keep bidAmountRef in sync
  useEffect(() => {
    bidAmountRef.current = bidAmount;
  }, [bidAmount]);

  const currentHighestInr = bids.length > 0 ? bids[0].amountInr : 0;
  const minimumBidInr = currentHighestInr > 0 ? currentHighestInr + 10 : (startingPriceInr || 0);

  // Helper: convert INR to any currency using rates
  const fromInrAmount = useCallback((amountInr: number, toCurrency: string): number => {
    if (toCurrency === "INR") return amountInr;
    const rate = rates[toCurrency] ?? 1;
    return Math.round(amountInr * rate * 100) / 100;
  }, [rates]);

  // Helper: convert any currency to INR using rates
  const toInrAmount = useCallback((amount: number, fromCurrency: string): number => {
    if (fromCurrency === "INR") return amount;
    const rate = rates[fromCurrency] ?? 1;
    if (rate <= 0) return amount;
    return Math.round((amount / rate) * 100) / 100;
  }, [rates]);

  // Convert minimumBid to selected bid currency for display and validation
  const minimumBidLocal = useMemo(() => {
    return fromInrAmount(minimumBidInr, currency);
  }, [minimumBidInr, currency, fromInrAmount]);

  // Real-time Socket.io connection
  const { isConnected, viewerCount } = useAuctionSocket({
    lotId,
    onNewBid: useCallback((bid: AuctionBid) => {
      setBids((prev) => {
        const exists = prev.some((b) => b.id === bid.id);
        if (exists) return prev;
        const updated = [bid, ...prev];
        updated.sort((a, b) => b.amountInr - a.amountInr);
        return updated.slice(0, 50);
      });
      setBidCount((prev) => prev + 1);
    }, []),
    onOutbid: useCallback((data: { lotId: string; newAmount: number; lotNumber: string; userId?: string }) => {
      if (data.lotId !== lotId) return;
      if (!data.userId || !user?.id || data.userId !== user.id) return;

      toast.warning(t("outbidAlert", { amount: display(data.newAmount) }), {
        duration: 8000,
        action: {
          label: t("bidAgain"),
          onClick: () => {
            bidInputRef.current?.focus();
          },
        },
      });
    }, [lotId, user?.id, t, display]),
    onAuctionEnding: useCallback((data: { lotId: string; newEndsAt: string }) => {
      if (data.lotId === lotId) {
        setAuctionEndsAt(data.newEndsAt);
        toast.info(t("auctionExtended"), { duration: 5000 });
      }
    }, [lotId, t]),
    onAuctionEnded: useCallback((data: { lotId: string; outcome: string; winnerId?: string; winningAmount?: number }) => {
      if (data.lotId === lotId) {
        setAuctionEnded(true);
        if (data.outcome === "SOLD" && data.winnerId === user?.id) {
          toast.success(t("wonAuction"), { duration: 10000 });
        } else if (data.outcome === "SOLD") {
          toast.info(t("auctionSold"), { duration: 5000 });
        } else if (data.outcome === "NO_BIDS") {
          toast.info(t("auctionNoBids"), { duration: 5000 });
        } else if (data.outcome === "BELOW_RESERVE") {
          toast.info(t("auctionBelowReserve"), { duration: 5000 });
        }
        onAuctionEndedProp?.(data.outcome, data.winnerId);
      }
    }, [lotId, user?.id, t, onAuctionEndedProp]),
  });

  useEffect(() => {
    onViewerCountChange?.(viewerCount);
  }, [onViewerCountChange, viewerCount]);

  // Aggressive fallback poll when socket is disconnected — 2s to keep bids in sync
  // across buyers. When socket is connected, this does nothing (socket is instant).
  // Any newly discovered bids are pushed up through onBidPlaced so the parent
  // page's "Bids" tab also stays in sync without its own fast poll.
  const onBidPlacedRef = useRef(onBidPlaced);
  useEffect(() => { onBidPlacedRef.current = onBidPlaced; }, [onBidPlaced]);
  useEffect(() => {
    if (isConnected || auctionEnded) return;
    let stopped = false;
    const knownIds = new Set(bids.map((b) => b.id));
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/bids?lotId=${lotId}`);
        if (!res.ok || stopped) return;
        const data = await res.json();
        const fresh: AuctionBid[] = data.bids || [];
        setBids(fresh);
        setBidCount(data.totalBids);
        // Notify parent about newly-seen bids
        for (const b of fresh) {
          if (!knownIds.has(b.id)) {
            knownIds.add(b.id);
            onBidPlacedRef.current?.(b);
          }
        }
      } catch { /* silent */ }
    }, 2000);
    return () => { stopped = true; clearInterval(interval); };
    // NOTE: intentionally not including `bids` in deps — we only want the
    // initial snapshot of knownIds when the effect starts, so each new bid is
    // emitted exactly once per poll cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId, isConnected, auctionEnded]);

  // Safety-net poll — runs ALWAYS (even when socket reports connected) at a
  // slower 6s cadence. This is the last line of defense for production
  // scenarios where the API server cannot reach the socket server (e.g.
  // misconfigured SOCKET_SERVER_URL, Railway downtime, network policy) and
  // bids never broadcast despite the client maintaining a live socket. Dedup
  // by id ensures no double-render.
  useEffect(() => {
    if (auctionEnded) return;
    let stopped = false;
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/bids?lotId=${lotId}`);
        if (!res.ok || stopped) return;
        const data = await res.json();
        const fresh: AuctionBid[] = data.bids || [];
        setBids((prev) => {
          // Dedup: keep stable refs for known ids, append new ones in order.
          const prevById = new Map(prev.map((b) => [b.id, b]));
          const merged: AuctionBid[] = [];
          const newOnes: AuctionBid[] = [];
          for (const b of fresh) {
            const existing = prevById.get(b.id);
            if (existing) {
              merged.push(existing);
            } else {
              merged.push(b);
              newOnes.push(b);
            }
          }
          // Notify parent about brand-new bids only
          for (const b of newOnes) onBidPlacedRef.current?.(b);
          // Skip update if nothing changed (length & ids identical)
          if (merged.length === prev.length && newOnes.length === 0) return prev;
          return merged;
        });
        setBidCount(data.totalBids);
      } catch { /* silent */ }
    }, 6000);
    return () => { stopped = true; clearInterval(interval); };
  }, [lotId, auctionEnded]);

  // When user changes bid currency, convert existing bid amount to new currency
  const handleCurrencyChange = useCallback((newCurrency: string) => {
    const currentAmount = parseFloat(bidAmountRef.current);
    if (!isNaN(currentAmount) && currentAmount > 0) {
      // Convert: old currency → INR → new currency
      const inInr = toInrAmount(currentAmount, currency);
      const inNewCurrency = fromInrAmount(inInr, newCurrency);
      setBidAmount(inNewCurrency.toFixed(2));
    }
    setCurrency(newCurrency as typeof currency);
  }, [currency, toInrAmount, fromInrAmount]);

  const handlePlaceBid = async () => {
    if (!accessToken) {
      toast.error(t("loginRequired"));
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t("invalidAmount"));
      return;
    }

    // Convert bid amount to INR for validation
    const amountInInr = toInrAmount(amount, currency);

    if (amountInInr < minimumBidInr) {
      toast.error(t("minimumBid", { amount: `${display(minimumBidInr)}` }));
      return;
    }

    if (isProxy) {
      const maxProxy = parseFloat(maxProxyAmount);
      if (isNaN(maxProxy) || maxProxy < amount) {
        toast.error(t("proxyMin"));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          lotId,
          amount: amountInInr, // Always send INR amount to the server
          currency,
          isProxy,
          ...(isProxy ? { maxProxyAmount: toInrAmount(parseFloat(maxProxyAmount), currency) } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t("bidFailed"));
        return;
      }

      toast.success(t("bidPlaced", { amount: `${getSymbol(currency)}${amount.toFixed(2)}` }));
      setBidAmount("");
      setMaxProxyAmount("");
      setIsProxy(false);

      // Always add the bid to the local UI immediately for instant feedback.
      // If the socket delivers the same bid later, onNewBid dedup will skip it.
      // Also notify the parent page so the "Bids" tab updates instantly
      // without waiting for the socket round-trip.
      if (data.bid) {
        setBids((prev) => {
          const exists = prev.some((b) => b.id === data.bid.id);
          if (exists) return prev;
          const updated = [data.bid, ...prev];
          updated.sort((a: AuctionBid, b: AuctionBid) => b.amountInr - a.amountInr);
          return updated.slice(0, 50);
        });
        setBidCount((prev) => prev + 1);
        onBidPlaced?.(data.bid as AuctionBid);
      }

      // If proxy auto-outbid happened, add that too
      if (data.proxyBid) {
        setBids((prev) => {
          const exists = prev.some((b) => b.id === data.proxyBid.id);
          if (exists) return prev;
          const updated = [data.proxyBid, ...prev];
          updated.sort((a: AuctionBid, b: AuctionBid) => b.amountInr - a.amountInr);
          return updated.slice(0, 50);
        });
        setBidCount((prev) => prev + 1);
        onBidPlaced?.(data.proxyBid as AuctionBid);
      }

      if (data.auctionExtended && data.newAuctionEndsAt) {
        setAuctionEndsAt(data.newAuctionEndsAt);
      }

      // If proxy outbid us immediately
      if (data.proxyBid) {
        toast.warning(t("proxyOutbid"), { duration: 6000 });
      }
    } catch {
      toast.error(t("bidFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = user?.id === farmerId;
  const isBuyer = user?.role === "BUYER";
  const isKycApproved = user?.kycStatus === "APPROVED";
  const canBid = isBuyer && isKycApproved && !isOwner && status === "AUCTION_ACTIVE" && !auctionEnded;

  // Pre-live (upcoming) state — auction is scheduled but hasn't started yet.
  const startsMs = auctionStartsAt ? new Date(auctionStartsAt).getTime() : null;
  const nowMs = Date.now();
  const isUpcoming =
    !!startsMs &&
    startsMs > nowMs &&
    (status === "LISTED" || status === "AUCTION_ACTIVE") &&
    !auctionEnded;

  // Cross-currency equivalence display
  const CrossCurrencyNote = ({ amountLocal, bidCurrency }: { amountLocal: number; bidCurrency: string }) => {
    if (bidCurrency === "INR" || isNaN(amountLocal) || amountLocal <= 0) return null;
    const inInr = toInrAmount(amountLocal, bidCurrency);
    const sym = getSymbol(bidCurrency as Parameters<typeof getSymbol>[0]);
    return (
      <p className="text-[11px] text-sage-500 mt-1 flex items-center gap-1">
        <ArrowRightLeft className="w-3 h-3" />
        {sym}{amountLocal.toFixed(2)} = ₹{inInr.toFixed(2)} INR
      </p>
    );
  };

  // Quick bid suggestions in the selected currency, ABOVE the minimum
  const quickBidSuggestions = useMemo(() => {
    const increments = [0, 50, 100, 250]; // INR increments
    return increments.map((inc) => {
      const inrVal = minimumBidInr + inc;
      const localVal = fromInrAmount(inrVal, currency);
      return { inrVal, localVal };
    });
  }, [minimumBidInr, currency, fromInrAmount]);

  return (
    <>
      {/* Mobile sticky bottom bar — shows summary, tap to expand */}
      {canBid && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#ddd4c4] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb">
          {!mobileExpanded ? (
            <button
              onClick={() => setMobileExpanded(true)}
              className="w-full px-4 py-3 flex items-center justify-between"
            >
              <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                <p className="font-heading text-sage-900 text-lg font-bold">
                  {display(bids.length > 0 ? currentHighestInr : (startingPriceInr || 0))}
                </p>
                <span className="text-xs text-sage-500">{bidCount} {t("bidsPlacedPlural", { count: bidCount })}</span>
              </div>
              <span className="border border-[#405742] bg-[#405742] px-4 py-2 text-sm font-medium text-white">
                {t("placeBid", { amount: "" })}
              </span>
            </button>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto border-t border-[#ddd4c4] px-4 pt-3 pb-6">
              <div className="flex justify-center mb-3">
                <button
                  onClick={() => setMobileExpanded(false)}
                  className="w-10 h-1.5 bg-[#d7cfbf]"
                  aria-label="Collapse bid panel"
                />
              </div>
              {MobileBidContent()}
            </div>
          )}
        </div>
      )}

      {/* Desktop panel — always visible */}
      <div className={`hidden lg:block space-y-4 ${isRtl ? "text-right" : ""}`}>
        {DesktopBidContent()}
      </div>

      {/* Mobile panel — visible when NOT canBid (just info, no sticky bar needed) */}
      {!canBid && (
        <div className={`lg:hidden space-y-4 ${isRtl ? "text-right" : ""}`}>
          {DesktopBidContent()}
        </div>
      )}
    </>
  );

  function MobileBidContent() {
    return (
      <div className="space-y-4">
        {/* Price + Timer compact */}
        <div className="text-center">
          <p className="text-xs text-sage-500 uppercase tracking-wider mb-1">
            {bids.length > 0 ? t("currentHighest") : t("startingPrice")}
          </p>
          <p className="font-heading text-sage-900 text-3xl font-bold">
            {display(bids.length > 0 ? currentHighestInr : (startingPriceInr || 0))}
          </p>
          {selectedCurrency !== "INR" && (bids.length > 0 ? currentHighestInr : (startingPriceInr || 0)) > 0 && (
            <p className="text-xs text-sage-400 mt-0.5">
              = ₹{(bids.length > 0 ? currentHighestInr : (startingPriceInr || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} INR
            </p>
          )}
        </div>

        {/* Countdown intentionally omitted — the prominent status strip at the top of the lot page is the single source of truth for time remaining. */}

        {/* Silent auction-end detector so the panel flips to ended state when time runs out without the countdown card visible */}
        {!auctionEnded && !isUpcoming && auctionEndsAt && (
          <AuctionCountdown endsAt={auctionEndsAt} onEnd={() => setAuctionEnded(true)} className="hidden" />
        )}

        {/* Bid form */}
        <div>
          <label htmlFor="bid-amount-mobile" className="text-xs text-sage-500 mb-1.5 block">
            {t("bidAmount", { min: `${getSymbol(currency)}${minimumBidLocal.toFixed(2)}` })}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-sage-400 text-sm`}>{getSymbol(currency)}</span>
              <input
                ref={bidInputMobileRef}
                id="bid-amount-mobile"
                type="number"
                step="1"
                min={minimumBidLocal}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={minimumBidLocal.toFixed(2)}
                className={`w-full ${isRtl ? "pr-7 pl-3" : "pl-7 pr-3"} border border-[#d9d1c2] bg-white py-2.5 text-sm text-sage-900 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent`}
                disabled={isSubmitting}
              />
            </div>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="border border-[#d9d1c2] bg-white px-2 py-2.5 text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500"
              disabled={isSubmitting}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <CrossCurrencyNote amountLocal={parseFloat(bidAmount)} bidCurrency={currency} />
        </div>

        {/* Quick bids */}
        <div className="flex gap-2">
          {quickBidSuggestions.map((s, i) => (
            <button key={i} onClick={() => setBidAmount(s.localVal.toFixed(2))}
              className="flex-1 border border-[#d7cfbf] bg-white py-2 text-xs font-medium text-sage-700 transition-colors hover:bg-[#faf6ee]"
              disabled={isSubmitting}
            >
              {getSymbol(currency)}{s.localVal.toFixed(0)}
            </button>
          ))}
        </div>

        <button
          onClick={() => { handlePlaceBid(); setMobileExpanded(false); }}
          disabled={isSubmitting || !bidAmount}
          className="w-full border border-[#405742] bg-[#405742] py-3 text-sm font-medium text-white transition-colors hover:bg-[#2f422e] disabled:opacity-50"
        >
          {isSubmitting ? t("placingBid") : t("placeBid", { amount: `${getSymbol(currency)}${bidAmount || minimumBidLocal.toFixed(2)}` })}
        </button>
      </div>
    );
  }

  function DesktopBidContent() {
    return (
      <>
      {/* Current Price & Timer */}
      {showSummary && (
      <Card className="border-[#ddd4c4]">
        <CardContent className="pt-6 space-y-4">
          {/* Connection indicator */}
          <div className={`flex items-center justify-between text-xs ${isRtl ? "flex-row-reverse" : ""}`}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span className="text-sage-400">
                {isConnected ? t("live") : t("polling")}
              </span>
            </div>
            {viewerCount > 0 && (
              <span className="text-sage-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {t("watching", { count: viewerCount })}
              </span>
            )}
          </div>

          {/* Highest Bid */}
          <div className="text-center">
            <p className="text-xs text-sage-500 uppercase tracking-wider mb-1">
              {bids.length > 0 ? t("currentHighest") : t("startingPrice")}
            </p>
            <p className="font-heading text-sage-900 text-4xl font-bold">
              {display(bids.length > 0 ? currentHighestInr : (startingPriceInr || 0))}
            </p>
            {/* Show INR equivalent when user has a non-INR display currency */}
            {selectedCurrency !== "INR" && (bids.length > 0 ? currentHighestInr : (startingPriceInr || 0)) > 0 && (
              <p className="text-xs text-sage-400 mt-0.5">
                = ₹{(bids.length > 0 ? currentHighestInr : (startingPriceInr || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} INR
              </p>
            )}
            {bids.length > 0 && (
              <p className="text-sm text-sage-500 mt-1">
                {bidCount === 1 ? t("bidsPlaced", { count: bidCount }) : t("bidsPlacedPlural", { count: bidCount })}
              </p>
            )}
          </div>

          {/* Countdown Timer intentionally omitted — the prominent status strip at the top of the lot page is the single source of truth for time remaining. */}

          {/* Silent auction-end detector so the panel flips state when time runs out */}
          {!auctionEnded && !isUpcoming && auctionEndsAt && (
            <AuctionCountdown endsAt={auctionEndsAt} onEnd={() => setAuctionEnded(true)} className="hidden" />
          )}

          {auctionEnded && (
            <div className="bg-red-50 border border-red-100 p-4 text-center">
              <p className="text-lg mb-1"><Bell className="w-5 h-5 mx-auto" /></p>
              <p className="text-sm font-medium text-red-700">{t("auctionEnded")}</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {!showSummary && !auctionEnded && !isUpcoming && auctionEndsAt && (
        <AuctionCountdown endsAt={auctionEndsAt} onEnd={() => setAuctionEnded(true)} className="hidden" />
      )}

      {/* Bid Input */}
      {canBid && (
        <Card className="border-[#ddd4c4]">
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-heading text-sage-900 font-bold text-sm">{t("placeYourBid")}</h3>

            {/* Amount input with currency selector */}
            <div>
              <label htmlFor="bid-amount-input" className="text-xs text-sage-500 mb-1.5 block">
                {t("bidAmount", { min: `${getSymbol(currency)}${minimumBidLocal.toFixed(2)}` })}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-sage-400 text-sm`}>{getSymbol(currency)}</span>
                  <input
                    ref={bidInputRef}
                    id="bid-amount-input"
                    type="number"
                    step="1"
                    min={minimumBidLocal}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={minimumBidLocal.toFixed(2)}
                    className={`w-full ${isRtl ? "pr-7 pl-3" : "pl-7 pr-3"} border border-[#d9d1c2] bg-white py-2.5 text-sm text-sage-900 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent`}
                    disabled={isSubmitting}
                  />
                </div>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="border border-[#d9d1c2] bg-white px-3 py-2.5 text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500"
                  disabled={isSubmitting}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Cross-currency equivalence */}
              <CrossCurrencyNote amountLocal={parseFloat(bidAmount)} bidCurrency={currency} />
            </div>

            {/* Quick bid buttons — converted to selected currency, above current bid */}
            <div className="flex gap-2">
              {quickBidSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setBidAmount(suggestion.localVal.toFixed(2))}
                  className="flex-1 border border-[#d7cfbf] bg-white py-2 text-xs font-medium text-sage-700 transition-colors hover:bg-[#faf6ee]"
                  disabled={isSubmitting}
                >
                  {getSymbol(currency)}{suggestion.localVal.toFixed(0)}
                </button>
              ))}
            </div>

            {/* Proxy bidding toggle */}
            <div className="border border-[#ece4d6] bg-[#f8f4ec] p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProxy}
                  onChange={(e) => setIsProxy(e.target.checked)}
                  className="w-4 h-4 text-sage-700 border-sage-300 rounded focus:ring-sage-500"
                  disabled={isSubmitting}
                />
                <div>
                  <span className="text-sm font-medium text-sage-700">{t("enableProxy")}</span>
                  <p className="text-[10px] text-sage-400 mt-0.5">
                    {t("proxyDesc")}
                  </p>
                </div>
              </label>

              {isProxy && (
                <div>
                  <label className="text-xs text-sage-500 mb-1 block">{t("maxProxyAmount")}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-sage-400 text-sm`}>{getSymbol(currency)}</span>
                      <input
                        type="number"
                        step="1"
                        min={bidAmount || minimumBidLocal}
                        value={maxProxyAmount}
                        onChange={(e) => setMaxProxyAmount(e.target.value)}
                        placeholder={t("enterMaxAmount")}
                        className={`w-full ${isRtl ? "pr-7 pl-3" : "pl-7 pr-3"} border border-[#d9d1c2] bg-white py-2 text-sm text-sage-900 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-500`}
                        disabled={isSubmitting}
                      />
                    </div>
                    <span className="px-3 py-2 text-sm text-sage-400 self-center">{currency}</span>
                  </div>
                  <CrossCurrencyNote amountLocal={parseFloat(maxProxyAmount)} bidCurrency={currency} />
                </div>
              )}
            </div>

            {/* Place Bid Button */}
            <button
              onClick={handlePlaceBid}
              disabled={isSubmitting || !bidAmount}
              className="w-full border border-[#405742] bg-[#405742] py-3 text-sm font-medium text-white transition-colors hover:bg-[#2f422e] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("placingBid")}
                </span>
              ) : (
                t("placeBid", { amount: `${getSymbol(currency)}${bidAmount || minimumBidLocal.toFixed(2)}` })
              )}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Auth / KYC warnings */}
      {!user && (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-sage-600">
              {t("loginToBid")}
            </p>
          </CardContent>
        </Card>
      )}

      {user && !isBuyer && !isOwner && (
        <Card className="rounded-3xl border-amber-100 bg-amber-50">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-amber-700">{t("buyersOnly")}</p>
          </CardContent>
        </Card>
      )}

      {user && isBuyer && !isKycApproved && (
        <Card className="rounded-3xl border-amber-100 bg-amber-50">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-2xl"><ShieldCheck className="w-6 h-6 mx-auto" /></p>
            <p className="text-sm font-medium text-amber-800">KYC Verification Required</p>
            <p className="text-xs text-amber-600">
              Complete identity verification to place bids on the marketplace.
            </p>
            <Link
              href="/kyc"
              className="inline-block px-5 py-2 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              Complete KYC →
            </Link>
          </CardContent>
        </Card>
      )}
    </>
    );
  }
}

