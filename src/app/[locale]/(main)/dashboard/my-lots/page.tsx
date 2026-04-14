"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
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
import { CommodityIcon } from "@/lib/commodity-icons";
import { Package, Clock, Loader, CircleDot, CheckCircle2, ClipboardList, Camera, AlertTriangle } from "lucide-react";

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const fmtTime = (t: string) => {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
};

const STATUS_COLORS: Record<string, string> = {
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
  startingPriceInr: number | null;
  reservePriceInr: number | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  createdAt: string;
  farmer: { id: string; name: string; country: string };
  warehouse: { id: string; name: string };
  qualityCheck: { moisturePct: number | null; podSizeMm: number | null; colourGrade: string | null } | null;
  bidCount: number;
  adminRemarks: string | null;
}

export default function MyLotsPage() {
  const t = useTranslations("lots");
  const { user, accessToken } = useAuth();
  const router = useRouter();

  const [lots, setLots] = useState<MyLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit dialog
  const [editLot, setEditLot] = useState<MyLot | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    listingMode: "AUCTION",
    startingPriceInr: "",
    reservePriceInr: "",
    auctionStartsAt: "",
    auctionEndsAt: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Image upload
  const [uploadingLotId, setUploadingLotId] = useState<string | null>(null);

  // Guard: seller or admin only
  useEffect(() => {
    if (user && user.role !== "AGGREGATOR" && user.role !== "FARMER" && user.role !== "ADMIN") {
      toast.error("Access denied. Sellers and farmers only.");
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchLots = useCallback(async () => {
    if (!accessToken || !user) return;
    setIsLoading(true);

    setError(null);
    try {
      const params = new URLSearchParams({ sellerId: user.id });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/lots?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLots(data.lots);
    } catch {
      setError("Failed to load your lots. Please try again.");
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
      startingPriceInr: lot.startingPriceInr?.toString() || "",
      reservePriceInr: lot.reservePriceInr?.toString() || "",
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

      if (editForm.startingPriceInr) body.startingPriceInr = parseFloat(editForm.startingPriceInr);
      if (editForm.reservePriceInr) body.reservePriceInr = parseFloat(editForm.reservePriceInr);
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

      if (lot.startingPriceInr) body.startingPriceInr = lot.startingPriceInr;
      if (lot.reservePriceInr) body.reservePriceInr = lot.reservePriceInr;
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
    intake: lots.filter((l) => l.status === "DRAFT").length,
    pending: lots.filter((l) => l.status === "PENDING_APPROVAL").length,
    listed: lots.filter((l) => ["LISTED", "AUCTION_ACTIVE"].includes(l.status)).length,
    sold: lots.filter((l) => l.status === "SOLD").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-script text-sage-500 text-lg">{t("subtitle")}</p>
          <h1 className="font-heading text-sage-900 text-3xl font-bold">{t("title")}</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: t("totalLots"), value: stats.total, icon: <Package className="w-5 h-5 text-blue-600" /> },
          { label: t("awaitingSetup"), value: stats.intake, icon: <Clock className="w-5 h-5 text-amber-600" /> },
          { label: "Pending Review", value: stats.pending, icon: <Loader className="w-5 h-5 text-orange-600" /> },
          { label: t("activeListings"), value: stats.listed, icon: <CircleDot className="w-5 h-5 text-green-600" /> },
          { label: t("sold"), value: stats.sold, icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" /> },
        ].map((s) => (
          <Card key={s.label} className="rounded-3xl border-sage-100">
            <CardContent className="pt-5 pb-4 text-center">
              <div className="flex justify-center">{s.icon}</div>
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
            <SelectItem value="all">{t("allStatuses") || "All Statuses"}</SelectItem>
            <SelectItem value="DRAFT">{"Draft"}</SelectItem>
            <SelectItem value="PENDING_APPROVAL">{"Pending Approval"}</SelectItem>
            <SelectItem value="LISTED">{t("listed") || "Listed"}</SelectItem>
            <SelectItem value="AUCTION_ACTIVE">{t("auctionActive") || "Auction Active"}</SelectItem>
            <SelectItem value="SOLD">{t("sold")}</SelectItem>
            <SelectItem value="REDEEMED">{t("redeemed") || "Redeemed"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && !isLoading && (
        <ErrorState title="Could not load lots" message={error} onRetry={fetchLots} />
      )}

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
            <ClipboardList className="w-12 h-12 text-sage-300 mx-auto mb-4" />
            <h2 className="font-heading text-sage-900 text-xl font-bold mb-2">
              {t("noLots")}
            </h2>
            <p className="text-sage-500 text-sm max-w-md mx-auto leading-relaxed">
              {t("noLotsDesc")}
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
                        <img src={lot.primaryImageUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CommodityIcon type={lot.commodityType} className="w-6 h-6 opacity-50" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading text-sage-900 font-bold text-sm flex items-center gap-1.5">
                            <CommodityIcon type={lot.commodityType} className="w-4 h-4" /> {COMMODITY_LABELS[lot.commodityType]}
                          </h3>
                          <Badge className={`text-xs ${STATUS_COLORS[lot.status]}`}>
                            {lot.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sage-500 text-xs mt-0.5">{lot.lotNumber}</p>
                        {lot.status === "DRAFT" && lot.adminRemarks && (
                          <div className="mt-1 px-2 py-1 bg-red-50 border border-red-100 rounded-lg">
                            <p className="text-red-700 text-xs">
                              <span className="font-medium">Rejected:</span> {lot.adminRemarks}
                            </p>
                          </div>
                        )}
                      </div>
                      {lot.startingPriceInr && (
                        <p className="font-heading text-sage-900 font-bold text-sm whitespace-nowrap">
                          ${lot.startingPriceInr.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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

                      {(lot.status === "LISTED" || lot.status === "DRAFT") && (
                        <button
                          onClick={() => openEdit(lot)}
                          className="px-3 py-1.5 text-xs font-medium text-sage-700 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors"
                        >
                          Edit
                        </button>
                      )

                      }

                      {(lot.status === "DRAFT") && (
                        <button
                          onClick={() => handlePublish(lot.id)}
                          disabled={isPublishing}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-sage-700 rounded-full hover:bg-sage-800 transition-colors disabled:opacity-50"
                        >
                          {lot.status === "DRAFT" ? "Resubmit for Approval" : "Submit for Approval"}
                        </button>
                      )}

                      {lot.status === "PENDING_APPROVAL" && (
                        <span className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 rounded-full inline-flex items-center gap-1">
                          <Loader className="w-3.5 h-3.5" /> Awaiting Admin Review
                        </span>
                      )}

                      {/* Image upload */}
                      {(lot.status === "LISTED" || lot.status === "DRAFT") && (
                        <label className="px-3 py-1.5 text-xs font-medium text-sage-700 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors cursor-pointer inline-flex items-center gap-1">
                          {uploadingLotId === lot.id ? t("uploading") : <><Camera className="w-3.5 h-3.5" /> {t("addImage")}</>}
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
              {editLot.status === "LISTED" && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Lot is live — only price and auction schedule can be changed.
                </p>
              )}

              {/* Description — DRAFT only */}
              {editLot.status === "DRAFT" && (
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
              )}

              {/* Listing Mode — DRAFT only */}
              {editLot.status === "DRAFT" && (
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
              )}

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
                    value={editForm.startingPriceInr}
                    onChange={(e) => setEditForm({ ...editForm, startingPriceInr: e.target.value })}
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
                      value={editForm.reservePriceInr}
                      onChange={(e) => setEditForm({ ...editForm, reservePriceInr: e.target.value })}
                      placeholder="Optional"
                      className="mt-1 rounded-xl border-sage-200"
                    />
                  </div>
                )}
              </div>

              {/* Auction Schedule */}
              {editForm.listingMode === "AUCTION" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sage-700 text-sm">Auction Starts</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="date"
                        value={editForm.auctionStartsAt.slice(0, 10)}
                        onChange={(e) => {
                          const time = editForm.auctionStartsAt.slice(11, 16) || "09:00";
                          setEditForm({ ...editForm, auctionStartsAt: e.target.value ? `${e.target.value}T${time}` : "" });
                        }}
                        className="rounded-xl border-sage-200"
                      />
                      <Select
                        value={editForm.auctionStartsAt.slice(11, 16) || ""}
                        onValueChange={(v) => {
                          const date = editForm.auctionStartsAt.slice(0, 10);
                          setEditForm({ ...editForm, auctionStartsAt: date ? `${date}T${v}` : "" });
                        }}
                      >
                        <SelectTrigger className="rounded-xl border-sage-200">
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {TIME_SLOTS.map((t) => (
                            <SelectItem key={t} value={t}>{fmtTime(t)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sage-700 text-sm">Auction Ends</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="date"
                        value={editForm.auctionEndsAt.slice(0, 10)}
                        onChange={(e) => {
                          const time = editForm.auctionEndsAt.slice(11, 16) || "18:00";
                          setEditForm({ ...editForm, auctionEndsAt: e.target.value ? `${e.target.value}T${time}` : "" });
                        }}
                        className="rounded-xl border-sage-200"
                      />
                      <Select
                        value={editForm.auctionEndsAt.slice(11, 16) || ""}
                        onValueChange={(v) => {
                          const date = editForm.auctionEndsAt.slice(0, 10);
                          setEditForm({ ...editForm, auctionEndsAt: date ? `${date}T${v}` : "" });
                        }}
                      >
                        <SelectTrigger className="rounded-xl border-sage-200">
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {TIME_SLOTS.map((t) => (
                            <SelectItem key={t} value={t}>{fmtTime(t)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
