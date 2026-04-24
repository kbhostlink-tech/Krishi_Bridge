"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useRouter, Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommodityIcon } from "@/lib/commodity-icons";
import { Search, Lock, CheckCircle2, CreditCard, Package, Lightbulb, Star } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";
import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Black Cardamom", TEA: "Orthodox Tea", OTHER: "Black Tea",
  GINGER: "Ginger", TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon",
};

const COUNTRY_LABELS: Record<string, string> = {
  IN: "India", NP: "Nepal", BT: "Bhutan", AE: "UAE", SA: "Saudi Arabia", OM: "Oman",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700",
  ROUTED: "bg-indigo-50 text-indigo-700",
  RESPONDED: "bg-blue-50 text-blue-700",
  NEGOTIATING: "bg-amber-50 text-amber-700",
  SELECTED: "bg-purple-50 text-purple-700",
  ACCEPTED: "bg-sage-700 text-white",
  EXPIRED: "bg-sage-100 text-sage-500",
  CANCELLED: "bg-red-50 text-red-600",
};

const RESPONSE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
  WITHDRAWN: "bg-sage-100 text-sage-500",
  COUNTERED: "bg-blue-50 text-blue-700",
};

/* ---------- Anonymized types from API ---------- */
interface Negotiation {
  id: string;
  fromUser: { id: string; name: string; role: string };
  fromLabel?: string;
  message: string;
  proposedPriceInr: number | null;
  proposedQuantityKg: number | null;
  createdAt: string;
}

interface RfqResponse {
  id: string;
  sellerId?: string;
  seller?: { id: string; name: string; country: string };
  supplierLabel?: string;
  lotId: string | null;
  lot: { id: string; lotNumber: string; commodityType: string; grade: string; images: string[] } | null;
  offeredPriceInr?: number;
  currency?: string;
  deliveryDays: number;
  notes: string | null;
  status: string;
  createdAt: string;
  negotiations: Negotiation[];
}

interface RfqDetail {
  id: string;
  buyerId?: string;
  buyer?: { id: string; name: string; country: string };
  buyerLabel?: string;
  commodityType: string;
  grade: string | null;
  quantityKg: number;
  targetPriceInr: number | null;
  deliveryCountry: string;
  deliveryCity: string;
  description: string | null;
  status: string;
  responseCount: number;
  selectedResponseId: string | null;
  finalPriceInr: number | null;
  expiresAt: string;
  createdAt: string;
  isAnonymized?: boolean;
  responses: RfqResponse[];
}

export default function RfqDetailPage({ params }: { params: Promise<{ rfqId: string }> }) {
  const { rfqId } = use(params);
  const t = useTranslations("rfq");
  const router = useRouter();
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const { display } = useCurrency();
  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [isBuyer, setIsBuyer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showNegotiateModal, setShowNegotiateModal] = useState<string | null>(null);

  const [offeredPrice, setOfferedPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [negotiateMsg, setNegotiateMsg] = useState("");
  const [negotiatePrice, setNegotiatePrice] = useState("");
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const fetchRfq = async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/rfq/${rfqId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRfq(data.rfq);
        setIsBuyer(data.isBuyer);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRfq();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, rfqId]);

  const handleSubmitResponse = async () => {
    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/rfq/${rfqId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          offeredPriceInr: parseFloat(offeredPrice),
          currency,
          deliveryDays: parseInt(deliveryDays, 10),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("respondFailed"));
        return;
      }
      toast.success(t("respondSuccess"));
      setShowResponseModal(false);
      setOfferedPrice("");
      setDeliveryDays("");
      setNotes("");
      fetchRfq();
    } catch {
      toast.error(t("respondFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNegotiate = async (responseId: string) => {
    if (!accessToken) return;
    setIsNegotiating(true);
    try {
      const body: Record<string, unknown> = { message: negotiateMsg.trim() };
      if (!isBuyer && negotiatePrice) {
        body.proposedPriceInr = parseFloat(negotiatePrice);
      }
      const res = await fetch(`/api/rfq/${rfqId}/responses/${responseId}/negotiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("negotiateFailed"));
        return;
      }
      toast.success(t("negotiateSuccess"));
      setShowNegotiateModal(null);
      setNegotiateMsg("");
      setNegotiatePrice("");
      fetchRfq();
    } catch {
      toast.error(t("negotiateFailed"));
    } finally {
      setIsNegotiating(false);
    }
  };

  const handleSelect = async (responseId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/rfq/${rfqId}/accept/${responseId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("selectionFailed"));
        return;
      }
      toast.success(t("selectionSuccess"));
      fetchRfq();
    } catch {
      toast.error(t("selectionFailed"));
    }
  };

  const handleCancel = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/rfq/${rfqId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("cancelFailed"));
        return;
      }
      toast.success(t("cancelSuccess"));
      fetchRfq();
    } catch {
      toast.error(t("cancelFailed"));
    }
  };

  const handleWithdraw = async (responseId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/rfq/${rfqId}/responses/${responseId}/withdraw`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("withdrawFailed"));
        return;
      }
      toast.success(t("withdrawSuccess"));
      fetchRfq();
    } catch {
      toast.error(t("withdrawFailed"));
    }
  };

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handlePayForRfq = useCallback(async () => {
    if (!accessToken || !rfq || isPaying) return;
    const acceptedResponse = rfq.responses.find((r) => r.status === "ACCEPTED");
    if (!acceptedResponse) {
      toast.error(t("noAcceptedResponse"));
      return;
    }
    setIsPaying(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ rfqId: rfq.id, responseId: acceptedResponse.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to initiate payment");
        return;
      }
      toast.success("Payment initiated! Redirecting...");
      router.push(`/dashboard/payments/${data.transactionId}`);
    } catch {
      toast.error("Failed to initiate payment");
    } finally {
      setIsPaying(false);
    }
  }, [accessToken, rfq, isPaying, router, t]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-sage-100 rounded animate-pulse" />
        <div className="h-64 bg-white rounded-3xl animate-pulse" />
        <div className="h-48 bg-white rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="text-center py-16">
        <Search className="w-10 h-10 text-sage-300 mx-auto mb-4" />
        <p className="text-sage-700 font-medium">{t("notFound")}</p>
      </div>
    );
  }

  const isSeller = user?.role === "FARMER" || user?.role === "AGGREGATOR";
  const hasResponded = rfq.responses.some((r) => r.sellerId === user?.id);
  const canRespond = isSeller && !isBuyer && !hasResponded && ["ROUTED", "RESPONDED", "NEGOTIATING"].includes(rfq.status) && daysLeft(rfq.expiresAt) > 0;
  const canCancel = isBuyer && !["CANCELLED", "ACCEPTED", "SELECTED"].includes(rfq.status);
  const posterName = rfq.buyer?.name || rfq.buyerLabel || `Request #${rfq.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-stone-500">
        <Link
          href={isBuyer ? "/dashboard/my-rfqs" : "/rfq/browse"}
          className="hover:text-[#405742] transition-colors"
        >
          {isBuyer ? "My RFQs" : "RFQ Browse"}
        </Link>
        <span>/</span>
        <span className="font-medium text-stone-900">RFQ #{rfq.id.slice(0, 8).toUpperCase()}</span>
      </nav>

      <PageHeader
        eyebrow={isBuyer ? "Buyer RFQ Desk" : "Seller RFQ Desk"}
        title={COMMODITY_LABELS[rfq.commodityType] || rfq.commodityType}
        description={`${isBuyer ? "Posted by you" : posterName} • ${new Date(rfq.createdAt).toLocaleDateString()} • Deliver to ${rfq.deliveryCity}, ${COUNTRY_LABELS[rfq.deliveryCountry]}`}
        action={
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[rfq.status]}>{rfq.status}</Badge>
          </div>
        }
      />

      {isBuyer && rfq.isAnonymized && (
        <Surface className="border-[#c5d0e8] bg-[#f4f6fd] p-4">
          <div className="flex items-start gap-3 text-sm text-[#3a4677]">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Supplier identities and prices are hidden to ensure fair evaluation. Select a preferred supplier based on delivery terms and notes. The platform admin will confirm the final deal price.</span>
          </div>
        </Surface>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Quantity" value={`${rfq.quantityKg.toLocaleString()} kg`} meta={rfq.grade ? `Grade ${rfq.grade}` : undefined} tone="olive" />
        <MetricCard label="Responses" value={rfq.responseCount} meta="Seller offers so far" tone="teal" />
        <MetricCard
          label="Expires"
          value={`${daysLeft(rfq.expiresAt)}d`}
          meta={daysLeft(rfq.expiresAt) <= 2 ? "Urgent — closing soon" : "Days left"}
          tone={daysLeft(rfq.expiresAt) <= 2 ? "amber" : "slate"}
        />
        <MetricCard
          label={isBuyer && rfq.targetPriceInr != null ? "Target (private)" : "Delivery"}
          value={isBuyer && rfq.targetPriceInr != null ? display(Number(rfq.targetPriceInr)) : rfq.deliveryCity}
          meta={isBuyer && rfq.targetPriceInr != null ? "Only visible to you & admins" : COUNTRY_LABELS[rfq.deliveryCountry]}
          tone="amber"
        />
      </div>

      <Surface className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-xl bg-[#f3f0e6] p-3">
            <CommodityIcon type={rfq.commodityType} className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            {rfq.status === "ACCEPTED" && rfq.finalPriceInr != null && (
              <div className="border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Deal Confirmed</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-900">{display(Number(rfq.finalPriceInr))}/kg</p>
                <p className="mt-1 text-xs text-emerald-700">Final price confirmed by platform</p>
                {isBuyer && (
                  <button
                    onClick={handlePayForRfq}
                    disabled={isPaying}
                    className="mt-4 inline-flex h-10 items-center gap-2 border border-emerald-700 bg-emerald-700 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isPaying ? "Processing..." : <><CreditCard className="h-4 w-4" /> Proceed to Payment</>}
                  </button>
                )}
              </div>
            )}

            {rfq.status === "SELECTED" && isBuyer && (
              <div className="border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800 flex items-start gap-2">
                <Star className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
                <span>You have selected a supplier. The platform admin is reviewing and will confirm the final deal terms.</span>
              </div>
            )}

            {rfq.description && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{t("description")}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{rfq.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {canRespond && (
                <button
                  onClick={() => setShowResponseModal(true)}
                  className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2f422e]"
                >
                  {t("submitResponse")}
                </button>
              )}
              {canCancel && (
                <button
                  onClick={handleCancel}
                  className="inline-flex h-10 items-center border border-red-200 bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600 transition-colors hover:bg-red-50"
                >
                  {t("cancelRfq")}
                </button>
              )}
            </div>
          </div>
        </div>
      </Surface>

      {rfq.responses.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-sage-900 font-bold text-lg">
            {t("responses")} ({rfq.responses.length})
          </h2>

          {rfq.responses.map((response) => {
            const isOwnResponse = response.sellerId === user?.id;
            const displayName = response.seller?.name || response.supplierLabel || "Supplier";
            const displayCountry = response.seller?.country;
            const isSelected = rfq.selectedResponseId === response.id;

            return (
              <Card key={response.id} className={`rounded-3xl border-sage-100 ${isSelected ? "ring-2 ring-purple-300" : ""}`}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-heading text-sage-900 font-bold text-sm">
                        {displayName}
                        {isSelected && <span className="ml-2 text-purple-600 inline-flex items-center gap-0.5"><Star className="w-3.5 h-3.5" /> Selected</span>}
                      </p>
                      <p className="text-xs text-sage-500">
                        {displayCountry ? COUNTRY_LABELS[displayCountry] + " • " : ""}
                        {new Date(response.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={RESPONSE_STATUS_COLORS[response.status]}>
                      {response.status}
                    </Badge>
                  </div>

                  <div className={`grid ${response.offeredPriceInr != null ? "grid-cols-3" : "grid-cols-2"} gap-3 bg-sage-50 rounded-xl p-3`}>
                    {response.offeredPriceInr != null && (
                      <div>
                        <p className="text-[10px] text-sage-500">{t("offeredPrice")}</p>
                        <p className="text-sage-900 font-bold">{display(Number(response.offeredPriceInr))}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-sage-500">{t("deliveryDays")}</p>
                      <p className="text-sage-900 font-bold">{response.deliveryDays} {t("days")}</p>
                    </div>
                    {response.currency && (
                      <div>
                        <p className="text-[10px] text-sage-500">{t("currency")}</p>
                        <p className="text-sage-900 font-bold">{response.currency}</p>
                      </div>
                    )}
                  </div>

                  {response.notes && (
                    <p className="text-sm text-sage-600 bg-sage-50/50 rounded-xl p-3">{response.notes}</p>
                  )}

                  {response.lot && (
                    <div className="flex items-center gap-2 text-xs text-sage-500">
                      <span className="flex items-center gap-1"><Package className="w-4 h-4" /> {t("linkedLot")}: {response.lot.lotNumber}</span>
                    </div>
                  )}

                  {response.negotiations.length > 0 && (
                    <div className="border-t border-sage-100 pt-3">
                      <p className="text-xs text-sage-500 font-medium mb-2">
                        {t("negotiationThread")} ({response.negotiations.length})
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {response.negotiations.map((n) => {
                          const isMe = n.fromUser.id === user?.id;
                          const senderLabel = n.fromLabel || n.fromUser.name;
                          return (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-xl text-sm ${
                                isMe ? "bg-sage-700 text-white ml-8" : "bg-sage-50 text-sage-900 mr-8"
                              }`}
                            >
                              <p className="text-[10px] opacity-70 mb-0.5">{senderLabel}</p>
                              <p>{n.message}</p>
                              {n.proposedPriceInr != null && (
                                <p className="text-xs mt-1 opacity-80">
                                  {t("proposedPrice")}: {display(Number(n.proposedPriceInr))}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {isBuyer && ["PENDING", "COUNTERED"].includes(response.status) && !rfq.selectedResponseId && (
                      <>
                        <button
                          onClick={() => handleSelect(response.id)}
                          className="px-4 py-2 bg-sage-700 text-white rounded-full text-xs font-medium hover:bg-sage-800 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5" /> Select This Supplier
                        </button>
                        <button
                          onClick={() => {
                            setShowNegotiateModal(response.id);
                            setNegotiateMsg("");
                            setNegotiatePrice("");
                          }}
                          className="px-4 py-2 border border-sage-200 text-sage-700 rounded-full text-xs font-medium hover:bg-sage-50 transition-colors"
                        >
                          {t("negotiate")}
                        </button>
                      </>
                    )}
                    {!isBuyer && isOwnResponse && ["PENDING", "COUNTERED"].includes(response.status) && (
                      <>
                        <button
                          onClick={() => {
                            setShowNegotiateModal(response.id);
                            setNegotiateMsg("");
                            setNegotiatePrice("");
                          }}
                          className="px-4 py-2 border border-sage-200 text-sage-700 rounded-full text-xs font-medium hover:bg-sage-50 transition-colors"
                        >
                          {t("counterOffer")}
                        </button>
                        <button
                          onClick={() => handleWithdraw(response.id)}
                          className="px-4 py-2 border border-red-200 text-red-600 rounded-full text-xs font-medium hover:bg-red-50 transition-colors"
                        >
                          {t("withdraw")}
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("submitResponse")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sage-700 text-sm">{t("offeredPrice")}</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400 text-sm">{({INR:"₹",NPR:"रू",BTN:"Nu.",AED:"د.إ",SAR:"﷼",OMR:"ر.ع.",USD:"$"} as Record<string,string>)[currency] || "₹"}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl pl-8"
                />
              </div>
              <p className="text-[10px] text-sage-400 mt-1">This price is confidential — only visible to you and the platform admin.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sage-700 text-sm">{t("deliveryDays")}</Label>
                <Input
                  type="number"
                  min="1"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  placeholder="7"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sage-700 text-sm">{t("currency")}</Label>
                <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["INR", "NPR", "BTN", "AED", "SAR", "OMR", "USD"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sage-700 text-sm">{t("notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                className="mt-1.5 rounded-xl"
                rows={3}
                maxLength={2000}
              />
            </div>
            <button
              onClick={handleSubmitResponse}
              disabled={isSubmitting || !offeredPrice || !deliveryDays}
              className="w-full py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? t("submitting") : t("submitResponse")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showNegotiateModal} onOpenChange={() => setShowNegotiateModal(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("negotiate")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {isBuyer && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" /> As a buyer, you can discuss delivery terms and conditions. Price proposals are handled by the platform admin.
              </div>
            )}
            <div>
              <Label className="text-sage-700 text-sm">{t("message")}</Label>
              <Textarea
                value={negotiateMsg}
                onChange={(e) => setNegotiateMsg(e.target.value)}
                placeholder={isBuyer ? "Discuss delivery terms, quality requirements, etc." : t("negotiatePlaceholder")}
                className="mt-1.5 rounded-xl"
                rows={3}
                maxLength={2000}
              />
            </div>
            {!isBuyer && (
              <div>
                <Label className="text-sage-700 text-sm">{t("proposedPrice")} ({t("optional")})</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400 text-sm">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={negotiatePrice}
                    onChange={(e) => setNegotiatePrice(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl pl-7"
                  />
                </div>
              </div>
            )}
            <button
              onClick={() => showNegotiateModal && handleNegotiate(showNegotiateModal)}
              disabled={isNegotiating || !negotiateMsg.trim()}
              className="w-full py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors disabled:opacity-50"
            >
              {isNegotiating ? t("submitting") : t("sendOffer")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}