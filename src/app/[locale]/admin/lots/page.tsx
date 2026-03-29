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

const STATUS_COLORS: Record<string, string> = {
  INTAKE: "bg-amber-100 text-amber-800",
  LISTED: "bg-blue-100 text-blue-800",
  AUCTION_ACTIVE: "bg-green-100 text-green-800",
  SOLD: "bg-purple-100 text-purple-800",
  REDEEMED: "bg-sage-100 text-sage-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const COMMODITY_ICONS: Record<string, string> = {
  LARGE_CARDAMOM: "🫛", TEA: "🍵", GINGER: "🫚", TURMERIC: "🌿", PEPPER: "🌶️",
  COFFEE: "☕", SAFFRON: "🌸", ARECA_NUT: "🥜", CINNAMON: "🪵", OTHER: "📦",
};

const COUNTRY_FLAGS: Record<string, string> = {
  IN: "🇮🇳", NP: "🇳🇵", BT: "🇧🇹", AE: "🇦🇪", SA: "🇸🇦", OM: "🇴🇲",
};

interface AdminLot {
  id: string;
  lotNumber: string;
  commodityType: string;
  grade: string;
  quantityKg: number;
  status: string;
  listingMode: string;
  startingPriceUsd: number | null;
  reservePriceUsd: number | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  origin: string | null;
  description: string | null;
  imageKey: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  farmer: { id: string; name: string; country: string };
  warehouse: { id: string; name: string };
  bidCount: number;
}

export default function AdminLotsPage() {
  const { accessToken } = useAuth();
  const [lots, setLots] = useState<AdminLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLot, setSelectedLot] = useState<AdminLot | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleAction = async (lotId: string, action: "delist" | "relist") => {
    if (!accessToken) return;
    setActionLoading(lotId);
    try {
      const res = await fetch(`/api/admin/lots/${lotId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return;
      }
      toast.success(data.message);
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

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const canDelist = (status: string) =>
    !["CANCELLED", "REDEEMED"].includes(status);

  const canRelist = (status: string) => status === "CANCELLED";

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
            <SelectItem value="INTAKE">Intake</SelectItem>
            <SelectItem value="LISTED">Listed</SelectItem>
            <SelectItem value="AUCTION_ACTIVE">Auction Active</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
            <SelectItem value="REDEEMED">Redeemed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
            <div className="col-span-2">Farmer</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Qty (kg)</div>
            <div className="col-span-1">Bids</div>
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
                    {COMMODITY_ICONS[lot.commodityType]} {lot.commodityType.replace(/_/g, " ")}
                  </div>
                  <div className="col-span-6 lg:col-span-2 text-sm text-sage-600 truncate">
                    {COUNTRY_FLAGS[lot.farmer.country] || ""} {lot.farmer.name}
                  </div>
                  <div className="col-span-3 lg:col-span-1">
                    <Badge className={`text-xs ${STATUS_COLORS[lot.status]}`}>
                      {lot.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="col-span-3 lg:col-span-1 text-sm text-sage-700">
                    {lot.quantityKg.toLocaleString()}
                  </div>
                  <div className="col-span-3 lg:col-span-1 text-sm text-sage-500">
                    {lot.bidCount}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLot} onOpenChange={() => setSelectedLot(null)}>
        <DialogContent className="max-w-2xl rounded-3xl border-sage-100">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              Lot {selectedLot?.lotNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedLot && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Image */}
              {selectedLot.imageUrl && (
                <div className="aspect-video rounded-2xl overflow-hidden bg-sage-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedLot.imageUrl}
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
              </div>

              <Separator className="bg-sage-100" />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-sage-400 text-xs mb-1">Commodity</p>
                  <p className="text-sage-900 font-medium">
                    {COMMODITY_ICONS[selectedLot.commodityType]} {selectedLot.commodityType.replace(/_/g, " ")}
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
                    {selectedLot.startingPriceUsd ? `$${selectedLot.startingPriceUsd.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Reserve Price</p>
                  <p className="text-sage-900 font-medium">
                    {selectedLot.reservePriceUsd ? `$${selectedLot.reservePriceUsd.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Origin</p>
                  <p className="text-sage-900 font-medium">{selectedLot.origin || "—"}</p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Active Bids</p>
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

              {/* Farmer & Warehouse */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-sage-400 text-xs mb-1">Farmer</p>
                  <p className="text-sage-900 font-medium">
                    {COUNTRY_FLAGS[selectedLot.farmer.country] || ""} {selectedLot.farmer.name}
                  </p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs mb-1">Warehouse</p>
                  <p className="text-sage-900 font-medium">{selectedLot.warehouse.name}</p>
                </div>
              </div>

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
    </div>
  );
}
