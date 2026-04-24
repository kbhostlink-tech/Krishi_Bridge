"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CommodityIcon } from "@/lib/commodity-icons";
import { AlertTriangle, ClipboardList, BarChart3 } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";
import { Pagination } from "@/components/ui/pagination";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-800",
  ROUTED: "bg-indigo-100 text-indigo-800",
  RESPONDED: "bg-blue-100 text-blue-800",
  NEGOTIATING: "bg-amber-100 text-amber-800",
  SELECTED: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

const COUNTRY_LABELS: Record<string, string> = {
  IN: "India", NP: "Nepal", BT: "Bhutan", AE: "UAE", SA: "Saudi Arabia", OM: "Oman",
};

const RESPONSE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
  WITHDRAWN: "bg-gray-100 text-gray-500",
  COUNTERED: "bg-blue-50 text-blue-700",
};

interface RfqResponse {
  id: string;
  sellerId: string;
  seller: { id: string; name: string; country: string };
  offeredPriceInr: number;
  currency: string;
  deliveryDays: number;
  notes: string | null;
  status: string;
  adminForwarded: boolean;
  adminEditedPriceInr: number | null;
  createdAt: string;
  negotiations: {
    id: string;
    fromUser: { id: string; name: string; role: string };
    message: string;
    proposedPriceInr: number | null;
    createdAt: string;
  }[];
}

interface AdminRfq {
  id: string;
  buyerId: string;
  buyer: { id: string; name: string; country: string };
  commodityType: string;
  grade: string | null;
  quantityKg: number;
  targetPriceInr: number | null;
  deliveryCountry: string;
  deliveryCity: string;
  description: string | null;
  status: string;
  responseCount: number;
  routedSellerIds: string[];
  selectedResponseId: string | null;
  finalPriceInr: number | null;
  adminNotes: string | null;
  expiresAt: string;
  createdAt: string;
  responses: RfqResponse[];
}

interface Seller {
  id: string;
  name: string;
  country: string;
}

interface PriceBand {
  lowInr: number;
  midInr: number;
  highInr: number;
  sampleCount: number;
}

export default function AdminRfqsPage() {
  const { accessToken } = useAuth();
  const { display } = useCurrency();
  const [rfqs, setRfqs] = useState<AdminRfq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  // Detail modal
  const [selectedRfq, setSelectedRfq] = useState<AdminRfq | null>(null);

  // Route modal
  const [showRouteModal, setShowRouteModal] = useState<string | null>(null);
  const [availableSellers, setAvailableSellers] = useState<Seller[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [adminRoutePrice, setAdminRoutePrice] = useState("");
  const [isRouting, setIsRouting] = useState(false);

  // Set terms modal
  const [showTermsModal, setShowTermsModal] = useState<{ rfqId: string; responseId: string } | null>(null);
  const [finalPrice, setFinalPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSettingTerms, setIsSettingTerms] = useState(false);

  // Price reference
  const [priceBand, setPriceBand] = useState<PriceBand | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<AdminRfq | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRfqs = useCallback(async () => {
    if (!accessToken) return;
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/rfq?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRfqs(data.rfqs ?? []);
        setTotalCount(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statusFilter, page]);

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const fetchSellers = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/admin/users?role=FARMER&kycStatus=APPROVED&limit=200", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableSellers(data.users || []);
      }
    } catch {
      // silent
    }
  };

  const fetchPriceBand = async (commodityType: string, grade?: string | null) => {
    if (!accessToken) return;
    try {
      const params = new URLSearchParams({ commodity: commodityType });
      if (grade) params.set("grade", grade);
      const res = await fetch(`/api/admin/price-reference?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPriceBand(data.band);
      }
    } catch {
      setPriceBand(null);
    }
  };

  const openRouteModal = (rfq: AdminRfq) => {
    setShowRouteModal(rfq.id);
    setSelectedSellers(rfq.routedSellerIds || []);
    setAdminRoutePrice("");
    fetchSellers();
  };

  const handleRoute = async () => {
    if (!accessToken || !showRouteModal) return;
    setIsRouting(true);
    try {
      const res = await fetch(`/api/admin/rfq/${showRouteModal}/route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sellerIds: selectedSellers,
          ...(adminRoutePrice ? { adminPriceInr: parseFloat(adminRoutePrice) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to route RFQ");
        return;
      }
      toast.success(`RFQ routed to ${data.newlyRouted ?? selectedSellers.length} seller(s)`);
      setShowRouteModal(null);
      fetchRfqs();
    } catch {
      toast.error("Failed to route RFQ");
    } finally {
      setIsRouting(false);
    }
  };

  const openTermsModal = (rfqId: string, responseId: string, rfq: AdminRfq) => {
    setShowTermsModal({ rfqId, responseId });
    setFinalPrice("");
    setAdminNotes(rfq.adminNotes || "");
    fetchPriceBand(rfq.commodityType, rfq.grade);
  };

  const handleSetTerms = async () => {
    if (!accessToken || !showTermsModal || !finalPrice) return;
    setIsSettingTerms(true);
    try {
      const res = await fetch(`/api/admin/rfq/${showTermsModal.rfqId}/set-terms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          responseId: showTermsModal.responseId,
          finalPriceInr: parseFloat(finalPrice),
          notes: adminNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to set terms");
        return;
      }
      toast.success("Deal terms confirmed successfully");
      setShowTermsModal(null);
      fetchRfqs();
    } catch {
      toast.error("Failed to set terms");
    } finally {
      setIsSettingTerms(false);
    }
  };

  const toggleSeller = (sellerId: string) => {
    setSelectedSellers((prev) =>
      prev.includes(sellerId)
        ? prev.filter((id) => id !== sellerId)
        : [...prev, sellerId]
    );
  };

  // Forward response to buyer (admin mediation)
  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const [forwardEditPrice, setForwardEditPrice] = useState("");

  const handleForwardResponse = async (rfqId: string, responseId: string) => {
    if (!accessToken) return;
    setForwardingId(responseId);
    try {
      const res = await fetch(`/api/admin/rfq/${rfqId}/responses/${responseId}/forward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...(forwardEditPrice ? { adminEditedPriceInr: parseFloat(forwardEditPrice) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to forward response");
        return;
      }
      toast.success("Response forwarded to buyer");
      setForwardEditPrice("");
      fetchRfqs();
    } catch {
      toast.error("Failed to forward response");
    } finally {
      setForwardingId(null);
    }
  };

  const deleteRfq = async () => {
    if (!accessToken || !deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/rfq/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete RFQ");
        return;
      }
      toast.success("RFQ permanently deleted");
      setDeleteTarget(null);
      setSelectedRfq(null);
      setRfqs((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = (rfqs ?? []).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.commodityType.toLowerCase().includes(q) ||
      (r.buyer?.name ?? "").toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-sage-100 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    open: rfqs.filter((r) => r.status === "OPEN").length,
    routed: rfqs.filter((r) => r.status === "ROUTED").length,
    selected: rfqs.filter((r) => r.status === "SELECTED").length,
    total: rfqs.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">RFQ Management</h1>
        <p className="text-sage-500 text-sm mt-1">
          Route requests to sellers, review responses, and set final deal terms
        </p>
      </div>

      {/* Neutrality Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span><strong>Advisory:</strong> Admin must not influence pricing or privilege any party. 
        All actions are logged and auditable. Set fair deal terms based on market reference prices.</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="rounded-xl">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.open}</p>
            <p className="text-xs text-sage-500">Awaiting Routing</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.routed}</p>
            <p className="text-xs text-sage-500">Routed</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.selected}</p>
            <p className="text-xs text-sage-500">Awaiting Terms</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-sage-700">{stats.total}</p>
            <p className="text-xs text-sage-500">Total RFQs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, commodity, or buyer..."
          className="rounded-xl flex-1"
        />
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="rounded-xl w-full sm:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(STATUS_COLORS).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* RFQ List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center">
          <ClipboardList className="w-10 h-10 text-sage-300 mb-3" />
          <p className="text-sage-700 font-medium">No RFQs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rfq) => (
            <Card key={rfq.id} className="rounded-xl border-sage-100 hover:border-sage-200 transition-all">
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="shrink-0 mt-0.5">
                      <CommodityIcon type={rfq.commodityType} className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-heading text-sage-900 font-bold text-sm">
                          {COMMODITY_LABELS[rfq.commodityType] || rfq.commodityType}
                        </p>
                        <Badge className={STATUS_COLORS[rfq.status]}>{rfq.status}</Badge>
                      </div>
                      <p className="text-xs text-sage-500 mt-0.5">
                        Buyer: <strong>{rfq.buyer.name}</strong> ({COUNTRY_LABELS[rfq.buyer.country]})
                        {" • "}{rfq.quantityKg.toLocaleString()} kg
                        {rfq.grade && ` • Grade ${rfq.grade}`}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-sage-500">
                        {rfq.targetPriceInr != null && (
                          <span>Target: <span className="text-sage-700 font-medium">{display(Number(rfq.targetPriceInr))}</span></span>
                        )}
                        <span>Delivery: {rfq.deliveryCity}, {COUNTRY_LABELS[rfq.deliveryCountry]}</span>
                        <span>{rfq.responseCount} response{rfq.responseCount !== 1 ? "s" : ""}</span>
                        {(rfq.routedSellerIds?.length ?? 0) > 0 && (
                          <span>Routed to {rfq.routedSellerIds.length} seller{rfq.routedSellerIds.length !== 1 ? "s" : ""}</span>
                        )}
                        {rfq.finalPriceInr != null && (
                          <span className="text-emerald-700 font-medium">
                            Final: {display(Number(rfq.finalPriceInr))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-lg"
                      onClick={() => setSelectedRfq(rfq)}
                    >
                      View Details
                    </Button>
                    {["OPEN", "ROUTED", "RESPONDED", "NEGOTIATING"].includes(rfq.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs rounded-lg text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                        onClick={() => openRouteModal(rfq)}
                      >
                        Route to Sellers
                      </Button>
                    )}
                    {rfq.status === "SELECTED" && rfq.selectedResponseId && (
                      <Button
                        size="sm"
                        className="text-xs rounded-lg bg-purple-700 hover:bg-purple-800"
                        onClick={() => openTermsModal(rfq.id, rfq.selectedResponseId!, rfq)}
                      >
                        Set Final Terms
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-lg border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteTarget(rfq)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Pagination page={page} totalPages={totalPages} total={totalCount} limit={limit} onPageChange={setPage} />
        </div>
      )}
      <Dialog open={!!selectedRfq} onOpenChange={() => setSelectedRfq(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              RFQ Details — {selectedRfq?.commodityType}
            </DialogTitle>
          </DialogHeader>
          {selectedRfq && (
            <div className="space-y-4 pt-2">
              {/* RFQ Info */}
              <div className="grid grid-cols-2 gap-3 bg-sage-50 rounded-xl p-4 text-sm">
                <div>
                  <p className="text-sage-500 text-xs">Buyer</p>
                  <p className="text-sage-900 font-medium">{selectedRfq.buyer.name}</p>
                </div>
                <div>
                  <p className="text-sage-500 text-xs">Status</p>
                  <Badge className={STATUS_COLORS[selectedRfq.status]}>{selectedRfq.status}</Badge>
                </div>
                <div>
                  <p className="text-sage-500 text-xs">Quantity</p>
                  <p className="text-sage-900 font-medium">{selectedRfq.quantityKg.toLocaleString()} kg</p>
                </div>
                {selectedRfq.targetPriceInr != null && (
                  <div>
                    <p className="text-sage-500 text-xs">Buyer&apos;s Target Price</p>
                    <p className="text-sage-900 font-bold">{display(Number(selectedRfq.targetPriceInr))}</p>
                  </div>
                )}
                <div>
                  <p className="text-sage-500 text-xs">Delivery</p>
                  <p className="text-sage-900 font-medium">{selectedRfq.deliveryCity}, {COUNTRY_LABELS[selectedRfq.deliveryCountry]}</p>
                </div>
                {selectedRfq.finalPriceInr != null && (
                  <div>
                    <p className="text-sage-500 text-xs">Final Price</p>
                    <p className="text-emerald-700 font-bold">{display(Number(selectedRfq.finalPriceInr))}</p>
                  </div>
                )}
              </div>

              {selectedRfq.description && (
                <div>
                  <p className="text-xs text-sage-500 mb-1">Description</p>
                  <p className="text-sm text-sage-700 bg-sage-50 rounded-xl p-3">{selectedRfq.description}</p>
                </div>
              )}

              {selectedRfq.adminNotes && (
                <div>
                  <p className="text-xs text-sage-500 mb-1">Admin Notes</p>
                  <p className="text-sm text-sage-700 bg-amber-50 rounded-xl p-3">{selectedRfq.adminNotes}</p>
                </div>
              )}

              {/* Responses with full prices */}
              {(selectedRfq.responses?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-medium text-sage-700 mb-2">
                    Responses ({selectedRfq.responses.length})
                  </p>
                  <div className="space-y-3">
                    {selectedRfq.responses.map((resp) => {
                      const isSelectedResponse = selectedRfq.selectedResponseId === resp.id;
                      return (
                        <Card key={resp.id} className={`rounded-xl ${isSelectedResponse ? "ring-2 ring-purple-300" : ""}`}>
                          <CardContent className="py-3 px-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm font-medium text-sage-900">
                                  {resp.seller.name}
                                  {isSelectedResponse && (
                                    <span className="ml-2 text-purple-600 text-xs">⭐ Buyer Selected</span>
                                  )}
                                </p>
                                <p className="text-xs text-sage-500">{COUNTRY_LABELS[resp.seller.country]}</p>
                              </div>
                              <Badge className={RESPONSE_STATUS_COLORS[resp.status]}>{resp.status}</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-sage-500">Offered Price</p>
                                <p className="text-sage-900 font-bold">{display(Number(resp.offeredPriceInr))}</p>
                              </div>
                              <div>
                                <p className="text-sage-500">Delivery</p>
                                <p className="text-sage-900 font-bold">{resp.deliveryDays} days</p>
                              </div>
                              <div>
                                <p className="text-sage-500">Currency</p>
                                <p className="text-sage-900 font-bold">{resp.currency}</p>
                              </div>
                            </div>
                            {resp.notes && (
                              <p className="text-xs text-sage-600 mt-2 bg-sage-50 rounded p-2">{resp.notes}</p>
                            )}
                            {/* Action: Set terms for buyer-selected response */}
                            {selectedRfq.status === "SELECTED" && isSelectedResponse && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  className="text-xs bg-purple-700 hover:bg-purple-800 rounded-lg"
                                  onClick={() => {
                                    setSelectedRfq(null);
                                    openTermsModal(selectedRfq.id, resp.id, selectedRfq);
                                  }}
                                >
                                  Set Final Terms for This Response
                                </Button>
                              </div>
                            )}
                            {/* Forward to buyer (admin mediation) */}
                            {!resp.adminForwarded && (
                              <div className="mt-2 flex items-end gap-2 bg-indigo-50 rounded-xl p-3">
                                <div className="flex-1">
                                  <Label className="text-xs text-indigo-700">Edit price before forwarding (optional)</Label>
                                  <div className="relative mt-1">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sage-400 text-xs">₹</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder={String(Number(resp.offeredPriceInr))}
                                      value={forwardEditPrice}
                                      onChange={(e) => setForwardEditPrice(e.target.value)}
                                      className="rounded-lg pl-6 h-8 text-xs"
                                    />
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  className="text-xs bg-indigo-700 hover:bg-indigo-800 rounded-lg h-8"
                                  disabled={forwardingId === resp.id}
                                  onClick={() => handleForwardResponse(selectedRfq.id, resp.id)}
                                >
                                  {forwardingId === resp.id ? "Forwarding..." : "Forward to Buyer"}
                                </Button>
                              </div>
                            )}
                            {resp.adminForwarded && (
                              <p className="mt-2 text-xs text-emerald-600 font-medium">✓ Forwarded to buyer{resp.adminEditedPriceInr ? ` (edited: ${display(Number(resp.adminEditedPriceInr))})` : ""}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Route to Sellers Modal */}
      <Dialog open={!!showRouteModal} onOpenChange={() => setShowRouteModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Route RFQ to Sellers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-sage-600">
              Select sellers who will be able to see and respond to this RFQ. 
              Only KYC-approved sellers are shown.
            </p>

            <div>
              <Label className="text-sage-700 text-sm">Admin Price Guidance (₹/kg) — Optional</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400 text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adminRoutePrice}
                  onChange={(e) => setAdminRoutePrice(e.target.value)}
                  placeholder="Set a reference price for sellers"
                  className="rounded-xl pl-7"
                />
              </div>
              <p className="text-[10px] text-sage-400 mt-1">This price will be visible to routed sellers as admin guidance.</p>
            </div>

            {availableSellers.length === 0 ? (
              <p className="text-sage-400 text-sm text-center py-4">Loading sellers...</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableSellers.map((seller) => (
                  <label
                    key={seller.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedSellers.includes(seller.id)
                        ? "bg-indigo-50 border-indigo-200"
                        : "bg-white border-sage-100 hover:bg-sage-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSellers.includes(seller.id)}
                      onChange={() => toggleSeller(seller.id)}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm text-sage-900 font-medium">{seller.name}</p>
                      <p className="text-xs text-sage-500">{COUNTRY_LABELS[seller.country] || seller.country}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-sage-500">{selectedSellers.length} seller(s) selected</p>
              <Button
                onClick={handleRoute}
                disabled={isRouting || selectedSellers.length === 0}
                className="bg-indigo-700 hover:bg-indigo-800 rounded-lg"
              >
                {isRouting ? "Routing..." : "Route RFQ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Final Terms Modal */}
      <Dialog open={!!showTermsModal} onOpenChange={() => setShowTermsModal(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Set Final Deal Terms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Setting final terms will accept this response, reject all others, and notify both parties with the confirmed price.</span>
            </div>

            {/* Reference Price Band */}
            {priceBand && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <p className="text-xs text-indigo-600 font-medium mb-1 flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> Market Reference Band</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-indigo-400">Low</p>
                    <p className="text-indigo-800 font-bold">{display(priceBand.lowInr)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-400">Mid</p>
                    <p className="text-indigo-800 font-bold">{display(priceBand.midInr)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-400">High</p>
                    <p className="text-indigo-800 font-bold">{display(priceBand.highInr)}</p>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-400 mt-1">Based on {priceBand.sampleCount} recent transactions</p>
              </div>
            )}

            <div>
              <Label className="text-sage-700 text-sm">Final Price (INR/kg)</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400 text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl pl-7"
                />
              </div>
            </div>

            <div>
              <Label className="text-sage-700 text-sm">Admin Notes (optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about the deal terms..."
                className="mt-1.5 rounded-xl"
                rows={3}
                maxLength={2000}
              />
            </div>

            <Button
              onClick={handleSetTerms}
              disabled={isSettingTerms || !finalPrice}
              className="w-full bg-purple-700 hover:bg-purple-800 rounded-lg"
            >
              {isSettingTerms ? "Confirming..." : "Confirm Deal Terms"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-700">Delete RFQ Permanently</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sage-700 text-sm">
                You are about to permanently delete the RFQ for{" "}
                <strong className="text-sage-900">
                  {COMMODITY_LABELS[deleteTarget.commodityType] || deleteTarget.commodityType}
                </strong>{" "}
                ({deleteTarget.quantityKg.toLocaleString()} kg) by{" "}
                <strong className="text-sage-900">{deleteTarget.buyer.name}</strong>.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
                <p className="font-semibold">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li>All {deleteTarget.responseCount} seller response(s)</li>
                  <li>All negotiation history</li>
                  <li>RFQ routing and terms data</li>
                </ul>
                <p className="mt-2 font-semibold">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  variant="destructive"
                  className="flex-1 rounded-full"
                  disabled={deleting}
                  onClick={deleteRfq}
                >
                  {deleting ? "Deleting..." : "Yes, Delete Permanently"}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
