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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CommodityIcon } from "@/lib/commodity-icons";
import {
  Trophy, CreditCard, Banknote, CheckCircle2, Clock, ArrowRight, User, IndianRupee,
} from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

const STATUS_COLORS: Record<string, string> = {
  INTAKE: "bg-amber-100 text-amber-800",
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-orange-100 text-orange-800",
  LISTED: "bg-blue-100 text-blue-800",
  AUCTION_ACTIVE: "bg-green-100 text-green-800",
  UNDER_RFQ: "bg-indigo-100 text-indigo-800",
  SOLD: "bg-purple-100 text-purple-800",
  REDEEMED: "bg-sage-100 text-sage-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-stone-100 text-stone-800",
};

const TXN_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  MANUAL_CONFIRMED: "bg-blue-100 text-blue-800",
  ESCROW_HELD: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FUNDS_RELEASED: "bg-green-100 text-green-800",
  REFUNDED: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
};

interface BankDetails {
  accountName: string | null;
  accountNumber: string | null;
  bankName: string | null;
  branch: string | null;
  ifscCode: string | null;
}

interface WinningBid {
  id: string;
  amountInr: number;
  buyer: {
    id: string;
    name: string;
    email: string;
    country: string;
    uniquePaymentCode: string | null;
  };
}

interface LotTransaction {
  id: string;
  status: string;
  grossAmount: number;
  commissionAmount: number;
  netToSeller: number;
  currency: string;
  paidAt: string | null;
  adminConfirmedAt: string | null;
  fundsReleasedAt: string | null;
  buyerReceivedAt: string | null;
  createdAt: string;
}

interface AdminLot {
  id: string;
  lotNumber: string;
  commodityType: string;
  grade: string;
  quantityKg: number;
  status: string;
  listingMode: string;
  startingPriceInr: number | null;
  reservePriceInr: number | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  origin: string | null;
  description: string | null;
  primaryImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  seller: { id: string; name: string; email: string; country: string; bankDetails: BankDetails | null } | null;
  farmer: { id: string; name: string; email: string; country: string; bankDetails: BankDetails | null } | null;
  warehouse: { id: string; name: string } | null;
  bidCount: number;
  winningBid: WinningBid | null;
  transaction: LotTransaction | null;
}

export default function AdminLotsPage() {
  const { accessToken } = useAuth();
  const { display } = useCurrency();
  const [lots, setLots] = useState<AdminLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLot, setSelectedLot] = useState<AdminLot | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejectingLotId, setRejectingLotId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [confirmPaymentRef, setConfirmPaymentRef] = useState("");
  const [releaseFundsReason, setReleaseFundsReason] = useState("");
  const [releasePaymentRef, setReleasePaymentRef] = useState("");

  const fetchLots = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/lots?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLots(data.lots);
      setTotalCount(data.pagination.total);
    } catch {
      toast.error("Failed to load lots");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLots(), 400);
    return () => clearTimeout(timer);
  }, [fetchLots]);

  const handleAction = async (lotId: string, action: "delist" | "relist" | "approve" | "reject", remarks?: string) => {
    if (!accessToken) return;
    setActionLoading(lotId);
    try {
      const res = await fetch(`/api/admin/lots/${lotId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action, remarks }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return;
      }
      toast.success(data.message);
      setRejectingLotId(null);
      setRejectRemarks("");
      // Update local state
      setLots((prev) =>
        prev.map((l) => (l.id === lotId ? { ...l, status: data.status } : l))
      );
      if (selectedLot?.id === lotId) {
        setSelectedLot((prev) => (prev ? { ...prev, status: data.status } : prev));
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const deleteLot = async () => {
    if (!accessToken || !deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/lots/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete lot");
        return;
      }
      toast.success(`Lot ${deleteTarget.lotNumber} permanently deleted`);
      setDeleteTarget(null);
      setSelectedLot(null);
      setLots((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setTotalCount((prev) => prev - 1);
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const confirmPayment = async (transactionId: string) => {
    if (!accessToken || !confirmPaymentRef.trim()) {
      toast.error("Payment reference is required");
      return;
    }
    setPaymentActionLoading(true);
    try {
      const res = await fetch("/api/payments/confirm-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ transactionId, paymentReference: confirmPaymentRef.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to confirm payment"); return; }
      toast.success("Payment confirmed & token minted!");
      setConfirmPaymentRef("");
      fetchLots();
    } catch { toast.error("Network error"); } finally { setPaymentActionLoading(false); }
  };

  const releaseFunds = async (transactionId: string) => {
    if (!accessToken || releaseFundsReason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }
    setPaymentActionLoading(true);
    try {
      const res = await fetch("/api/payments/release", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          transactionId,
          reason: releaseFundsReason.trim(),
          paymentReference: releasePaymentRef.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to release funds"); return; }
      toast.success("Funds released to seller!");
      setReleaseFundsReason("");
      setReleasePaymentRef("");
      fetchLots();
    } catch { toast.error("Network error"); } finally { setPaymentActionLoading(false); }
  };

  const canDelist = (status: string) =>
    !["CANCELLED", "REDEEMED", "DRAFT", "PENDING_APPROVAL"].includes(status);

  const canRelist = (status: string) => status === "CANCELLED";

  const canApprove = (status: string) => status === "PENDING_APPROVAL";

  const canReject = (status: string) => status === "PENDING_APPROVAL";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">Lots Management</h1>
        <p className="text-sage-500 text-sm mt-1">
          {totalCount} lot{totalCount !== 1 ? "s" : ""} in the system
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by lot number, farmer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border-sage-200"
        />
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-[180px] rounded-xl border-sage-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
            <SelectItem value="LISTED">Listed</SelectItem>
            <SelectItem value="AUCTION_ACTIVE">Auction Active</SelectItem>
            <SelectItem value="UNDER_RFQ">Under RFQ</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
            <SelectItem value="REDEEMED">Redeemed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-sage-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && lots.length === 0 && (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-12 text-center">
            <p className="text-sage-500 text-sm">No lots found matching your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Lots table */}
      {!isLoading && lots.length > 0 && (
        <div className="space-y-2">
          {/* Header row */}
          <div className="hidden lg:grid grid-cols-12 gap-2 px-4 text-xs text-sage-500 font-medium">
            <div className="col-span-2">Lot</div>
            <div className="col-span-2">Commodity</div>
            <div className="col-span-1">Farmer</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Qty (kg)</div>
            <div className="col-span-1">Winner</div>
            <div className="col-span-1">Payment</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {lots.map((lot) => (
            <Card
              key={lot.id}
              className="rounded-2xl border-sage-100 hover:border-sage-300 transition-colors"
            >
              <CardContent className="py-3 px-4">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div
                    className="col-span-12 lg:col-span-2 cursor-pointer"
                    onClick={() => setSelectedLot(lot)}
                  >
                    <p className="font-medium text-sage-900 text-sm hover:underline">
                      {lot.lotNumber}
                    </p>
                  </div>
                  <div className="col-span-6 lg:col-span-2 text-sm text-sage-700">
                    <span className="inline-flex items-center gap-1.5"><CommodityIcon type={lot.commodityType} className="w-3.5 h-3.5" /> {lot.commodityType.replace(/_/g, " ")}</span>
                  </div>
                  <div className="col-span-6 lg:col-span-1 text-sm text-sage-600 truncate">
                    {lot.seller?.name || "—"}
                  </div>
                  <div className="col-span-3 lg:col-span-1">
                    <Badge className={`text-xs ${STATUS_COLORS[lot.status]}`}>
                      {lot.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="col-span-3 lg:col-span-1 text-sm text-sage-700">
                    {lot.quantityKg.toLocaleString()}
                  </div>
                  <div className="col-span-3 lg:col-span-1 text-xs text-sage-600 truncate">
                    {lot.winningBid ? (
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-500" />
                        {lot.winningBid.buyer.name?.split(" ")[0]}
                      </span>
                    ) : (
                      <span className="text-sage-400">{lot.bidCount} bids</span>
                    )}
                  </div>
                  <div className="col-span-3 lg:col-span-1">
                    {lot.transaction ? (
                      <Badge className={`text-[10px] ${TXN_STATUS_COLORS[lot.transaction.status] || "bg-gray-100 text-gray-700"}`}>
                        {lot.transaction.status.replace(/_/g, " ")}
                      </Badge>
                    ) : (
                      <span className="text-sage-400 text-xs">—</span>
                    )}
                  </div>
                  <div className="col-span-3 lg:col-span-1 text-xs text-sage-400">
                    {formatDate(lot.createdAt)}
                  </div>
                  <div className="col-span-12 lg:col-span-2 flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs border-sage-200"
                      onClick={() => setSelectedLot(lot)}
                    >
                      Details
                    </Button>
                    {canDelist(lot.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs border-red-200 text-red-600 hover:bg-red-50"
                        disabled={actionLoading === lot.id}
                        onClick={() => handleAction(lot.id, "delist")}
                      >
                        {actionLoading === lot.id ? "..." : "Delist"}
                      </Button>
                    )}
                    {canRelist(lot.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs border-green-200 text-green-600 hover:bg-green-50"
                        disabled={actionLoading === lot.id}
                        onClick={() => handleAction(lot.id, "relist")}
                      >
                        {actionLoading === lot.id ? "..." : "Relist"}
                      </Button>
                    )}
                    {canApprove(lot.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        disabled={actionLoading === lot.id}
                        onClick={() => handleAction(lot.id, "approve")}
                      >
                        {actionLoading === lot.id ? "..." : "Approve"}
                      </Button>
                    )}
                    {canReject(lot.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs border-orange-200 text-orange-600 hover:bg-orange-50"
                        disabled={actionLoading === lot.id}
                        onClick={() => setRejectingLotId(lot.id)}
                      >
                        Reject
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteTarget(lot)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLot} onOpenChange={() => { setSelectedLot(null); setConfirmPaymentRef(""); setReleaseFundsReason(""); setReleasePaymentRef(""); }}>
        <DialogContent className="max-w-3xl rounded-3xl border-sage-100">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              Lot {selectedLot?.lotNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedLot && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Image */}
              {selectedLot.primaryImageUrl && (
                <div className="aspect-video rounded-2xl overflow-hidden bg-sage-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedLot.primaryImageUrl}
                    alt={selectedLot.lotNumber}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Status + Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${STATUS_COLORS[selectedLot.status]} text-sm`}>
                  {selectedLot.status.replace(/_/g, " ")}
                </Badge>
                <Badge className="bg-sage-50 text-sage-700 text-sm">
                  {selectedLot.listingMode.replace(/_/g, " ")}
                </Badge>
                {selectedLot.transaction && (
                  <Badge className={`text-sm ${TXN_STATUS_COLORS[selectedLot.transaction.status] || "bg-gray-100 text-gray-700"}`}>
                    Payment: {selectedLot.transaction.status.replace(/_/g, " ")}
                  </Badge>
                )}
                <div className="flex-1" />
                {canDelist(selectedLot.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                    disabled={actionLoading === selectedLot.id}
                    onClick={() => handleAction(selectedLot.id, "delist")}
                  >
                    {actionLoading === selectedLot.id ? "Processing..." : "Force Delist"}
                  </Button>
                )}
                {canRelist(selectedLot.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-600 hover:bg-green-50 rounded-lg"
                    disabled={actionLoading === selectedLot.id}
                    onClick={() => handleAction(selectedLot.id, "relist")}
                  >
                    {actionLoading === selectedLot.id ? "Processing..." : "Relist Lot"}
                  </Button>
                )}
                {canApprove(selectedLot.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                    disabled={actionLoading === selectedLot.id}
                    onClick={() => handleAction(selectedLot.id, "approve")}
                  >
                    {actionLoading === selectedLot.id ? "Processing..." : "Approve Lot"}
                  </Button>
                )}
                {canReject(selectedLot.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg"
                    disabled={actionLoading === selectedLot.id}
                    onClick={() => setRejectingLotId(selectedLot.id)}
                  >
                    Reject Lot
                  </Button>
                )}
              </div>

              <Separator className="bg-sage-100" />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-sage-400 text-xs mb-1">Commodity</p>
                  <p className="text-sage-900 font-medium">
                    <span className="inline-flex items-center gap-1.5"><CommodityIcon type={selectedLot.commodityType} /> {selectedLot.commodityType.replace(/_/g, " ")}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Grade</p>
                  <p className="text-sage-900 font-medium">{selectedLot.grade}</p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Quantity</p>
                  <p className="text-sage-900 font-medium">{selectedLot.quantityKg.toLocaleString()} kg</p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Starting Price</p>
                  <p className="text-sage-900 font-medium">
                    {selectedLot.startingPriceInr ? display(selectedLot.startingPriceInr) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Reserve Price</p>
                  <p className="text-sage-900 font-medium">
                    {selectedLot.reservePriceInr ? display(selectedLot.reservePriceInr) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Origin</p>
                  <p className="text-sage-900 font-medium">{selectedLot.origin ? JSON.stringify(selectedLot.origin) : "—"}</p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Total Bids</p>
                  <p className="text-sage-900 font-medium">{selectedLot.bidCount}</p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Listed</p>
                  <p className="text-sage-900 font-medium">{formatDateTime(selectedLot.createdAt)}</p>
                </div>
              </div>

              {/* Auction Dates */}
              {(selectedLot.auctionStartsAt || selectedLot.auctionEndsAt) && (
                <>
                  <Separator className="bg-sage-100" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedLot.auctionStartsAt && (
                      <div>
                        <p className="text-sage-400 text-xs mb-1">Auction Starts</p>
                        <p className="text-sage-900 font-medium">{formatDateTime(selectedLot.auctionStartsAt)}</p>
                      </div>
                    )}
                    {selectedLot.auctionEndsAt && (
                      <div>
                        <p className="text-sage-400 text-xs mb-1">Auction Ends</p>
                        <p className="text-sage-900 font-medium">{formatDateTime(selectedLot.auctionEndsAt)}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator className="bg-sage-100" />

              {/* Winner Info */}
              {selectedLot.winningBid && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                      <Trophy className="w-4 h-4" />
                      Auction Winner
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-amber-600 text-xs">Buyer Name</p>
                        <p className="text-amber-900 font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {selectedLot.winningBid.buyer.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-amber-600 text-xs">Email</p>
                        <p className="text-amber-900 font-medium text-xs">{selectedLot.winningBid.buyer.email}</p>
                      </div>
                      <div>
                        <p className="text-amber-600 text-xs">Country</p>
                        <p className="text-amber-900 font-medium">{selectedLot.winningBid.buyer.country}</p>
                      </div>
                      <div>
                        <p className="text-amber-600 text-xs">Payment Code</p>
                        <p className="text-amber-900 font-bold tracking-wider">{selectedLot.winningBid.buyer.uniquePaymentCode || "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-amber-600 text-xs">Winning Bid Amount</p>
                        <p className="text-amber-900 font-bold text-lg flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          {display(selectedLot.winningBid.amountInr)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-sage-100" />
                </>
              )}

              {/* Transaction / Payment Status */}
              {selectedLot.transaction && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
                      <CreditCard className="w-4 h-4" />
                      Payment Status
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-blue-600 text-xs">Status</p>
                        <Badge className={`text-xs ${TXN_STATUS_COLORS[selectedLot.transaction.status] || "bg-gray-100 text-gray-700"}`}>
                          {selectedLot.transaction.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-blue-600 text-xs">Currency</p>
                        <p className="text-blue-900 font-medium">{selectedLot.transaction.currency}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 text-xs">Gross Amount</p>
                        <p className="text-blue-900 font-bold">{display(selectedLot.transaction.grossAmount)}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 text-xs">Commission</p>
                        <p className="text-blue-900 font-medium">{display(selectedLot.transaction.commissionAmount)}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 text-xs">Net to Seller</p>
                        <p className="text-green-800 font-bold">{display(selectedLot.transaction.netToSeller)}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 text-xs">Created</p>
                        <p className="text-blue-900 font-medium text-xs">{formatDateTime(selectedLot.transaction.createdAt)}</p>
                      </div>
                    </div>

                    {/* Payment Timeline */}
                    <div className="mt-2 space-y-2">
                      <p className="text-blue-700 text-xs font-semibold">Timeline</p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span className="text-blue-700">Created: {formatDateTime(selectedLot.transaction.createdAt)}</span>
                        </div>
                        {selectedLot.transaction.adminConfirmedAt && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-700">Payment Confirmed: {formatDateTime(selectedLot.transaction.adminConfirmedAt)}</span>
                          </div>
                        )}
                        {selectedLot.transaction.fundsReleasedAt && (
                          <div className="flex items-center gap-2">
                            <Banknote className="w-3 h-3 text-green-500" />
                            <span className="text-green-700">Funds Released: {formatDateTime(selectedLot.transaction.fundsReleasedAt)}</span>
                          </div>
                        )}
                        {selectedLot.transaction.buyerReceivedAt && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-sage-500" />
                            <span className="text-sage-700">Buyer Received: {formatDateTime(selectedLot.transaction.buyerReceivedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Payment Actions */}
                    {selectedLot.transaction.status === "PENDING" && (
                      <div className="mt-3 bg-white rounded-xl p-3 border border-blue-100 space-y-2">
                        <p className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5" /> Confirm Buyer Payment
                        </p>
                        <p className="text-xs text-blue-600">
                          Verify that the buyer has paid to the platform account with code &quot;{selectedLot.winningBid?.buyer.uniquePaymentCode || "N/A"}&quot; in remarks, then confirm.
                        </p>
                        <Input
                          placeholder="Payment reference (UPI ref / bank transfer ref)"
                          value={confirmPaymentRef}
                          onChange={(e) => setConfirmPaymentRef(e.target.value)}
                          className="rounded-lg border-blue-200 text-sm"
                        />
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full"
                          disabled={paymentActionLoading || !confirmPaymentRef.trim()}
                          onClick={() => confirmPayment(selectedLot.transaction!.id)}
                        >
                          {paymentActionLoading ? "Confirming..." : "Confirm Payment & Mint Token"}
                        </Button>
                      </div>
                    )}

                    {(selectedLot.transaction.status === "MANUAL_CONFIRMED" || selectedLot.transaction.status === "COMPLETED" || selectedLot.transaction.status === "ESCROW_HELD") && !selectedLot.transaction.fundsReleasedAt && (
                      <div className="mt-3 bg-white rounded-xl p-3 border border-green-100 space-y-2">
                        <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
                          <Banknote className="w-3.5 h-3.5" /> Release Funds to Seller
                        </p>
                        <p className="text-xs text-green-600">
                          Transfer the net amount to the seller/farmer bank account below, then record the release.
                        </p>
                        <Textarea
                          placeholder="Reason for release (min 10 chars)"
                          value={releaseFundsReason}
                          onChange={(e) => setReleaseFundsReason(e.target.value)}
                          className="rounded-lg border-green-200 text-sm"
                          rows={2}
                        />
                        <Input
                          placeholder="Payment reference (optional)"
                          value={releasePaymentRef}
                          onChange={(e) => setReleasePaymentRef(e.target.value)}
                          className="rounded-lg border-green-200 text-sm"
                        />
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white rounded-lg w-full"
                          disabled={paymentActionLoading || releaseFundsReason.trim().length < 10}
                          onClick={() => releaseFunds(selectedLot.transaction!.id)}
                        >
                          {paymentActionLoading ? "Releasing..." : "Release Funds to Seller"}
                        </Button>
                      </div>
                    )}
                  </div>
                  <Separator className="bg-sage-100" />
                </>
              )}

              {/* Seller & Warehouse */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-sage-400 text-xs mb-1">Seller / Aggregator</p>
                  <p className="text-sage-900 font-medium">
                    {selectedLot.seller?.country && <span className="text-xs text-sage-400 font-mono">{selectedLot.seller.country}</span>}{" "}
                    {selectedLot.seller?.name || "Unknown"}
                  </p>
                  {selectedLot.seller?.email && (
                    <p className="text-sage-500 text-xs">{selectedLot.seller.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Warehouse</p>
                  <p className="text-sage-900 font-medium">{selectedLot.warehouse?.name || "Not assigned"}</p>
                </div>
              </div>

              {/* Farmer info (if different from seller) */}
              {selectedLot.farmer && selectedLot.farmer.id !== selectedLot.seller?.id && (
                <>
                  <Separator className="bg-sage-100" />
                  <div className="text-sm">
                    <p className="text-sage-400 text-xs mb-1">Farmer</p>
                    <p className="text-sage-900 font-medium">
                      {selectedLot.farmer.country && <span className="text-xs text-sage-400 font-mono">{selectedLot.farmer.country}</span>}{" "}
                      {selectedLot.farmer.name}
                    </p>
                    {selectedLot.farmer.email && (
                      <p className="text-sage-500 text-xs">{selectedLot.farmer.email}</p>
                    )}
                  </div>
                </>
              )}

              {/* Seller / Farmer Bank Details (for admin to pay them) */}
              {(() => {
                const bankSource = selectedLot.farmer?.bankDetails || selectedLot.seller?.bankDetails;
                const bankOwner = selectedLot.farmer?.bankDetails ? "Farmer" : "Seller";
                if (!bankSource || !bankSource.bankName) return null;
                return (
                  <>
                    <Separator className="bg-sage-100" />
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
                      <p className="text-green-800 font-semibold text-sm flex items-center gap-1.5">
                        <Banknote className="w-4 h-4" />
                        {bankOwner} Bank Details (for fund release)
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-green-600 text-xs">Account Holder</p>
                          <p className="text-green-900 font-medium">{bankSource.accountName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-green-600 text-xs">Bank Name</p>
                          <p className="text-green-900 font-medium">{bankSource.bankName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-green-600 text-xs">Account Number</p>
                          <p className="text-green-900 font-bold tracking-wider">{bankSource.accountNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-green-600 text-xs">Branch</p>
                          <p className="text-green-900 font-medium">{bankSource.branch || "—"}</p>
                        </div>
                        {bankSource.ifscCode && (
                          <div>
                            <p className="text-green-600 text-xs">IFSC Code</p>
                            <p className="text-green-900 font-bold tracking-wider">{bankSource.ifscCode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Description */}
              {selectedLot.description && (
                <>
                  <Separator className="bg-sage-100" />
                  <div>
                    <p className="text-sage-400 text-xs mb-1">Description</p>
                    <p className="text-sage-700 text-sm leading-relaxed">{selectedLot.description}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingLotId} onOpenChange={() => { setRejectingLotId(null); setRejectRemarks(""); }}>
        <DialogContent className="max-w-md rounded-3xl border-sage-100">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              Reject Lot
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sage-600 text-sm">
              Please provide a reason for rejection. The farmer will see this and can update their lot accordingly.
            </p>
            <Textarea
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="e.g. Quality documents missing, images unclear, grade mismatch..."
              className="rounded-xl border-sage-200"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => { setRejectingLotId(null); setRejectRemarks(""); }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50"
                disabled={rejectRemarks.trim().length < 5 || actionLoading === rejectingLotId}
                onClick={() => rejectingLotId && handleAction(rejectingLotId, "reject", rejectRemarks.trim())}
              >
                {actionLoading === rejectingLotId ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-700">Delete Lot Permanently</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sage-700 text-sm">
                You are about to permanently delete lot{" "}
                <strong className="text-sage-900">{deleteTarget.lotNumber}</strong> ({deleteTarget.commodityType.replace(/_/g, " ")}).
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
                <p className="font-semibold">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li>All bids on this lot ({deleteTarget.bidCount})</li>
                  <li>Any linked RFQ responses</li>
                  <li>The commodity token (if minted)</li>
                  <li>Quality check and QR code records</li>
                </ul>
                <p className="mt-2 font-semibold">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  variant="destructive"
                  className="flex-1 rounded-full"
                  disabled={deleting}
                  onClick={deleteLot}
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
