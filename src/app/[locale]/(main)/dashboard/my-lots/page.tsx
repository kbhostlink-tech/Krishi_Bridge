"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

interface MyLot {
  id: string;
  lotNumber: string;
  commodityType: string;
  grade: string;
  quantityKg: number;
  description: string | null;
  primaryImageUrl: string | null;
  origin: { country?: string; state?: string; district?: string };
  status: string;
  listingMode: string;
  startingPriceUsd: number | null;
  reservePriceUsd: number | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  createdAt: string;
  farmer: { id: string; name: string; country: string };
  warehouse: { id: string; name: string };
  qualityCheck: { moisturePct: number | null; podSizeMm: number | null; colourGrade: string | null } | null;
  bidCount: number;
}

export default function MyLotsPage() {
  const t = useTranslations("lots");
  const { user, accessToken } = useAuth();
  const router = useRouter();

  const [lots, setLots] = useState<MyLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit dialog
  const [editLot, setEditLot] = useState<MyLot | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    listingMode: "AUCTION",
    startingPriceUsd: "",
    reservePriceUsd: "",
    auctionStartsAt: "",
    auctionEndsAt: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Image upload
  const [uploadingLotId, setUploadingLotId] = useState<string | null>(null);

  // Guard: farmer only
  useEffect(() => {
    if (user && user.role !== "FARMER" && user.role !== "ADMIN") {
      toast.error("Access denied. Farmers only.");
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchLots = useCallback(async () => {
    if (!accessToken || !user) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({ farmerId: user.id });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/lots?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLots(data.lots);
    } catch {
      toast.error("Failed to load your lots");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, statusFilter]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  const openEdit = (lot: MyLot) => {
    setEditLot(lot);
    setEditForm({
      description: lot.description || "",
      listingMode: lot.listingMode || "AUCTION",
      startingPriceUsd: lot.startingPriceUsd?.toString() || "",
      reservePriceUsd: lot.reservePriceUsd?.toString() || "",
      auctionStartsAt: lot.auctionStartsAt ? new Date(lot.auctionStartsAt).toISOString().slice(0, 16) : "",
      auctionEndsAt: lot.auctionEndsAt ? new Date(lot.auctionEndsAt).toISOString().slice(0, 16) : "",
    });
  };

  const handleSave = async () => {
    if (!editLot || !accessToken) return;
    setIsSaving(true);

    try {
      const body: Record<string, unknown> = {
        description: editForm.description || undefined,
        listingMode: editForm.listingMode,
      };

      if (editForm.startingPriceUsd) body.startingPriceUsd = parseFloat(editForm.startingPriceUsd);
      if (editForm.reservePriceUsd) body.reservePriceUsd = parseFloat(editForm.reservePriceUsd);
      if (editForm.auctionStartsAt) body.auctionStartsAt = new Date(editForm.auctionStartsAt).toISOString();
      if (editForm.auctionEndsAt) body.auctionEndsAt = new Date(editForm.auctionEndsAt).toISOString();

      const res = await fetch(`/api/lots/${editLot.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }

      toast.success("Lot updated successfully");
      setEditLot(null);
      fetchLots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update lot");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (lotId: string) => {
    if (!accessToken) return;
    setIsPublishing(true);

    // Find the lot to include its listing mode details
    const lot = lots.find((l) => l.id === lotId);
    if (!lot) return;

    try {
      const body: Record<string, unknown> = {
        listingMode: lot.listingMode,
      };

      if (lot.startingPriceUsd) body.startingPriceUsd = lot.startingPriceUsd;
      if (lot.reservePriceUsd) body.reservePriceUsd = lot.reservePriceUsd;
      if (lot.auctionStartsAt) body.auctionStartsAt = lot.auctionStartsAt;
      if (lot.auctionEndsAt) body.auctionEndsAt = lot.auctionEndsAt;

      const res = await fetch(`/api/lots/${lotId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to publish");
      }

      toast.success("Lot published to marketplace!");
      fetchLots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish lot");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageUpload = async (lotId: string, file: File) => {
    if (!accessToken) return;
    setUploadingLotId(lotId);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/lots/${lotId}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      toast.success("Image uploaded");
      fetchLots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingLotId(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  // Stats
  const stats = {
    total: lots.length,
    intake: lots.filter((l) => l.status === "INTAKE").length,
    listed: lots.filter((l) => ["LISTED", "AUCTION_ACTIVE"].includes(l.status)).length,
    sold: lots.filter((l) => l.status === "SOLD").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-script text-sage-500 text-lg">Your commodities</p>
          <h1 className="font-heading text-sage-900 text-3xl font-bold">My Lots</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Lots", value: stats.total, icon: "📦" },
          { label: "Awaiting Setup", value: stats.intake, icon: "🕐" },
          { label: "Active Listings", value: stats.listed, icon: "🟢" },
          { label: "Sold", value: stats.sold, icon: "✅" },
        ].map((s) => (
          <Card key={s.label} className="rounded-3xl border-sage-100">
            <CardContent className="pt-5 pb-4 text-center">
              <span className="text-2xl">{s.icon}</span>
              <p className="font-heading text-sage-900 text-2xl font-bold mt-1">{s.value}</p>
              <p className="text-sage-500 text-xs">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-[180px] rounded-xl border-sage-200">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="INTAKE">Intake</SelectItem>
            <SelectItem value="LISTED">Listed</SelectItem>
            <SelectItem value="AUCTION_ACTIVE">Auction Active</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
            <SelectItem value="REDEEMED">Redeemed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-3xl border-sage-100 animate-pulse">
              <CardContent className="py-6">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-sage-100 rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-sage-100 rounded w-1/3" />
                    <div className="h-3 bg-sage-100 rounded w-1/2" />
                    <div className="h-3 bg-sage-100 rounded w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && lots.length === 0 && (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-16 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="font-heading text-sage-900 text-xl font-bold mb-2">
              No lots yet
            </h2>
            <p className="text-sage-500 text-sm max-w-md mx-auto leading-relaxed">
              Your commodity lots will appear here once a warehouse receives your goods.
              Visit a warehouse to have your commodities weighed and graded.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lots List */}
      {!isLoading && lots.length > 0 && (
        <div className="space-y-4">
          {lots.map((lot) => (
            <Card key={lot.id} className="rounded-3xl border-sage-100 hover:border-sage-200 transition-colors">
              <CardContent className="py-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <Link href={`/marketplace/${lot.id}`} className="flex-shrink-0">
                    <div className="w-full sm:w-20 h-32 sm:h-20 rounded-2xl bg-gradient-to-br from-sage-50 to-sage-100 overflow-hidden">
                      {lot.primaryImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={lot.primaryImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl opacity-50">{COMMODITY_ICONS[lot.commodityType] || "📦"}</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading text-sage-900 font-bold text-sm">
                            {COMMODITY_ICONS[lot.commodityType]} {COMMODITY_LABELS[lot.commodityType]}
                          </h3>
                          <Badge className={`text-xs ${STATUS_COLORS[lot.status]}`}>
                            {lot.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sage-500 text-xs mt-0.5">{lot.lotNumber}</p>
                      </div>
                      {lot.startingPriceUsd && (
                        <p className="font-heading text-sage-900 font-bold text-sm whitespace-nowrap">
                          ${lot.startingPriceUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-sage-500">
                      <span>Grade {lot.grade}</span>
                      <span className="w-1 h-1 rounded-full bg-sage-300" />
                      <span>{lot.quantityKg.toLocaleString()} kg</span>
                      <span className="w-1 h-1 rounded-full bg-sage-300" />
                      <span>{formatDate(lot.createdAt)}</span>
                      {lot.bidCount > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-sage-300" />
                          <span>{lot.bidCount} bids</span>
                        </>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Link
                        href={`/marketplace/${lot.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-sage-700 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors"
                      >
                        View
                      </Link>

                      {(lot.status === "INTAKE" || lot.status === "LISTED") && (
                        <button
                          onClick={() => openEdit(lot)}
                          className="px-3 py-1.5 text-xs font-medium text-sage-700 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors"
                        >
                          Edit
                        </button>
                      )}

                      {lot.status === "INTAKE" && (
                        <button
                          onClick={() => handlePublish(lot.id)}
                          disabled={isPublishing}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-sage-700 rounded-full hover:bg-sage-800 transition-colors disabled:opacity-50"
                        >
                          Publish
                        </button>
                      )}

                      {/* Image upload */}
                      {(lot.status === "INTAKE" || lot.status === "LISTED") && (
                        <label className="px-3 py-1.5 text-xs font-medium text-sage-700 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors cursor-pointer">
                          {uploadingLotId === lot.id ? "Uploading..." : "📷 Add Image"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={uploadingLotId === lot.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(lot.id, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editLot} onOpenChange={(open) => !open && setEditLot(null)}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              Edit Lot — {editLot?.lotNumber}
            </DialogTitle>
          </DialogHeader>

          {editLot && (
            <div className="space-y-4 mt-4">
              {/* Description */}
              <div>
                <Label className="text-sage-700 text-sm">Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Describe your commodity lot..."
                  className="mt-1 rounded-xl border-sage-200"
                  rows={3}
                />
              </div>

              {/* Listing Mode */}
              <div>
                <Label className="text-sage-700 text-sm">Listing Mode</Label>
                <Select
                  value={editForm.listingMode}
                  onValueChange={(v) => v && setEditForm({ ...editForm, listingMode: v })}
                >
                  <SelectTrigger className="mt-1 rounded-xl border-sage-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUCTION">Auction</SelectItem>
                    <SelectItem value="RFQ">RFQ</SelectItem>
                    <SelectItem value="BOTH">Auction + RFQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sage-700 text-sm">
                    {editForm.listingMode === "AUCTION" ? "Starting Price (USD)" : "Price (USD)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.startingPriceUsd}
                    onChange={(e) => setEditForm({ ...editForm, startingPriceUsd: e.target.value })}
                    placeholder="0.00"
                    className="mt-1 rounded-xl border-sage-200"
                  />
                </div>
                {editForm.listingMode === "AUCTION" && (
                  <div>
                    <Label className="text-sage-700 text-sm">Reserve Price (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.reservePriceUsd}
                      onChange={(e) => setEditForm({ ...editForm, reservePriceUsd: e.target.value })}
                      placeholder="Optional"
                      className="mt-1 rounded-xl border-sage-200"
                    />
                  </div>
                )}
              </div>

              {/* Auction Schedule */}
              {editForm.listingMode === "AUCTION" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sage-700 text-sm">Auction Starts</Label>
                    <Input
                      type="datetime-local"
                      value={editForm.auctionStartsAt}
                      onChange={(e) => setEditForm({ ...editForm, auctionStartsAt: e.target.value })}
                      className="mt-1 rounded-xl border-sage-200"
                    />
                  </div>
                  <div>
                    <Label className="text-sage-700 text-sm">Auction Ends</Label>
                    <Input
                      type="datetime-local"
                      value={editForm.auctionEndsAt}
                      onChange={(e) => setEditForm({ ...editForm, auctionEndsAt: e.target.value })}
                      className="mt-1 rounded-xl border-sage-200"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditLot(null)}
                  className="px-5 py-2.5 text-sm font-medium text-sage-600 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-sage-700 rounded-full hover:bg-sage-800 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
