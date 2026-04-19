"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
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
import { ClipboardList, Send, Loader, CheckCircle2, XCircle, Video, Wheat, Pencil, Camera, Paperclip, Sprout, Gavel, Timer } from "lucide-react";

// ─── Status colors ─────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  LISTED: "bg-sage-100 text-sage-800",
  REJECTED: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  LISTED: "Listed",
  REJECTED: "Rejected",
};

const LOT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  LISTED: "bg-blue-100 text-blue-700",
  AUCTION_ACTIVE: "bg-emerald-100 text-emerald-700",
  UNDER_RFQ: "bg-indigo-100 text-indigo-700",
  SOLD: "bg-green-100 text-green-800",
  REDEEMED: "bg-teal-100 text-teal-800",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const LOT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  LISTED: "Lot Listed",
  AUCTION_ACTIVE: "Auction Live",
  UNDER_RFQ: "RFQ Active",
  SOLD: "Sold",
  REDEEMED: "Redeemed",
  EXPIRED: "Auction Expired",
  CANCELLED: "Cancelled",
};

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger", TURMERIC: "Turmeric",
  PEPPER: "Pepper", COFFEE: "Coffee", SAFFRON: "Saffron", ARECA_NUT: "Areca Nut",
  CINNAMON: "Cinnamon", OTHER: "Other",
};

const COMMODITIES = [
  "LARGE_CARDAMOM", "TEA", "GINGER", "TURMERIC", "PEPPER",
  "COFFEE", "SAFFRON", "ARECA_NUT", "CINNAMON", "OTHER",
] as const;

const GRADES = ["PREMIUM", "A", "B", "C"] as const;
const COUNTRIES = ["IN", "NP", "BT", "AE", "SA", "OM"] as const;

interface Submission {
  id: string;
  commodityType: string;
  grade: string | null;
  variety: string | null;
  quantityKg: number;
  numberOfBags: number | null;
  bagWeight: number | null;
  packagingType: string | null;
  description: string | null;
  images: string[];
  videos: string[];
  thumbnailUrl: string | null;
  imageUrls: string[];
  videoUrls: string[];
  origin: { country: string; state: string; district: string; village?: string };
  harvestDate: string | null;
  harvestYear: number | null;
  harvestMonth: string | null;
  harvestSeason: string | null;
  moistureRange: string | null;
  colourAroma: string | null;
  tailCut: string | null;
  sellerDeclaration: string | null;
  labReportUrl: string | null;
  phytosanitaryUrl: string | null;
  originCertUrl: string | null;
  status: string;
  adminRemarks: string | null;
  lotId: string | null;
  lot: {
    id: string;
    lotNumber: string;
    status: string;
    auctionEndsAt: string | null;
    bidCount: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Component ─────────────────────────────────────────────────────

export default function FarmerSubmissionsPage() {
  const t = useTranslations("submissions");
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Create / Edit dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editSubmission, setEditSubmission] = useState<Submission | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Pending files for new submission
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [pendingVideo, setPendingVideo] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [imageUploadProgress, setImageUploadProgress] = useState<{ current: number; total: number; pct: number } | null>(null);

  // Form
  const [form, setForm] = useState({
    commodityType: "" as string,
    grade: "" as string,
    variety: "",
    quantityKg: "",
    numberOfBags: "",
    bagWeight: "",
    packagingType: "",
    description: "",
    originCountry: "",
    originState: "",
    originDistrict: "",
    originVillage: "",
    harvestYear: "",
    harvestMonth: "",
    harvestSeason: "",
    moistureRange: "",
    colourAroma: "",
    tailCut: "",
    sellerDeclaration: "",
  });

  const resetForm = () => {
    setForm({
      commodityType: "", grade: "", variety: "", quantityKg: "", numberOfBags: "", bagWeight: "",
      packagingType: "", description: "", originCountry: "", originState: "", originDistrict: "",
      originVillage: "", harvestYear: "", harvestMonth: "", harvestSeason: "",
      moistureRange: "", colourAroma: "", tailCut: "", sellerDeclaration: "",
    });
  };

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }),
    [accessToken]
  );

  // ─── Fetch submissions ──────────────────────────────────────────

  const fetchSubmissions = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/commodity-submissions?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load submissions");
      const data = await res.json();
      setSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  // ─── Create submission ──────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.commodityType || !form.quantityKg || !form.originCountry || !form.originState || !form.originDistrict) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (pendingImages.length === 0) {
      toast.error("Please add at least 1 photo of your commodity");
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        commodityType: form.commodityType,
        ...(form.grade && { grade: form.grade }),
        ...(form.variety && { variety: form.variety }),
        quantityKg: parseFloat(form.quantityKg),
        ...(form.numberOfBags && { numberOfBags: parseInt(form.numberOfBags) }),
        ...(form.bagWeight && { bagWeight: parseFloat(form.bagWeight) }),
        ...(form.packagingType && { packagingType: form.packagingType }),
        ...(form.description && { description: form.description }),
        origin: {
          country: form.originCountry,
          state: form.originState,
          district: form.originDistrict,
          ...(form.originVillage && { village: form.originVillage }),
        },
        ...(form.harvestYear && { harvestYear: parseInt(form.harvestYear) }),
        ...(form.harvestMonth && { harvestMonth: form.harvestMonth }),
        ...(form.harvestSeason && { harvestSeason: form.harvestSeason }),
        ...(form.moistureRange && { moistureRange: form.moistureRange }),
        ...(form.colourAroma && { colourAroma: form.colourAroma }),
        ...(form.tailCut && { tailCut: form.tailCut }),
        ...(form.sellerDeclaration && { sellerDeclaration: form.sellerDeclaration }),
      };

      const res = await fetch("/api/commodity-submissions", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create submission");
        return;
      }

      const submissionId = data.submission.id;

      // Upload images (required) with progress tracking
      const totalImages = pendingImages.length;
      for (let i = 0; i < totalImages; i++) {
        const imgFile = pendingImages[i];
        setImageUploadProgress({ current: i + 1, total: totalImages, pct: 0 });
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const imgForm = new FormData();
          imgForm.append("file", imgFile);
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setImageUploadProgress({ current: i + 1, total: totalImages, pct: Math.round((e.loaded / e.total) * 100) });
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error("Image upload failed"));
          });
          xhr.addEventListener("error", () => reject(new Error("Image upload failed")));
          xhr.open("POST", `/api/commodity-submissions/${submissionId}/images`);
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          xhr.send(imgForm);
        });
      }
      setImageUploadProgress(null);

      // Upload video (optional) with progress tracking
      if (pendingVideo) {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const vidForm = new FormData();
          vidForm.append("file", pendingVideo);
          setVideoUploadProgress(0);
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setVideoUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          });
          xhr.addEventListener("load", () => {
            setVideoUploadProgress(null);
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error("Video upload failed"));
          });
          xhr.addEventListener("error", () => {
            setVideoUploadProgress(null);
            reject(new Error("Video upload failed"));
          });
          xhr.open("POST", `/api/commodity-submissions/${submissionId}/videos`);
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          xhr.send(vidForm);
        });
      }

      toast.success("Commodity submitted successfully!");
      setShowCreateDialog(false);
      resetForm();
      setPendingImages([]);
      setPendingVideo(null);
      setVideoUploadProgress(null);
      setImageUploadProgress(null);
      fetchSubmissions();
    } catch {
      toast.error("Failed to create submission");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Update submission ──────────────────────────────────────────

  const handleUpdate = async () => {
    if (!editSubmission) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (form.commodityType) body.commodityType = form.commodityType;
      if (form.grade) body.grade = form.grade;
      if (form.variety) body.variety = form.variety;
      if (form.quantityKg) body.quantityKg = parseFloat(form.quantityKg);
      if (form.numberOfBags) body.numberOfBags = parseInt(form.numberOfBags);
      if (form.bagWeight) body.bagWeight = parseFloat(form.bagWeight);
      if (form.packagingType) body.packagingType = form.packagingType;
      if (form.description) body.description = form.description;
      if (form.originCountry && form.originState && form.originDistrict) {
        body.origin = {
          country: form.originCountry,
          state: form.originState,
          district: form.originDistrict,
          ...(form.originVillage && { village: form.originVillage }),
        };
      }
      if (form.harvestYear) body.harvestYear = parseInt(form.harvestYear);
      if (form.harvestMonth) body.harvestMonth = form.harvestMonth;
      if (form.harvestSeason) body.harvestSeason = form.harvestSeason;
      if (form.moistureRange) body.moistureRange = form.moistureRange;
      if (form.colourAroma) body.colourAroma = form.colourAroma;
      if (form.tailCut) body.tailCut = form.tailCut;
      if (form.sellerDeclaration) body.sellerDeclaration = form.sellerDeclaration;

      const res = await fetch(`/api/commodity-submissions/${editSubmission.id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update");
        return;
      }
      toast.success("Submission updated!");
      setEditSubmission(null);
      resetForm();
      fetchSubmissions();
    } catch {
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Image upload ───────────────────────────────────────────────

  const handleImageUpload = async (submissionId: string, file: File) => {
    setUploadingId(submissionId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/commodity-submissions/${submissionId}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      toast.success("Image uploaded!");
      fetchSubmissions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  // ─── Open edit dialog ───────────────────────────────────────────

  const openEdit = (sub: Submission) => {
    setEditSubmission(sub);
    setForm({
      commodityType: sub.commodityType,
      grade: sub.grade || "",
      variety: sub.variety || "",
      quantityKg: String(sub.quantityKg),
      numberOfBags: sub.numberOfBags ? String(sub.numberOfBags) : "",
      bagWeight: sub.bagWeight ? String(sub.bagWeight) : "",
      packagingType: sub.packagingType || "",
      description: sub.description || "",
      originCountry: sub.origin?.country || "",
      originState: sub.origin?.state || "",
      originDistrict: sub.origin?.district || "",
      originVillage: sub.origin?.village || "",
      harvestYear: sub.harvestYear ? String(sub.harvestYear) : "",
      harvestMonth: sub.harvestMonth || "",
      harvestSeason: sub.harvestSeason || "",
      moistureRange: sub.moistureRange || "",
      colourAroma: sub.colourAroma || "",
      tailCut: sub.tailCut || "",
      sellerDeclaration: sub.sellerDeclaration || "",
    });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  // ─── Stats ──────────────────────────────────────────────────────

  const stats = {
    total: submissions.length,
    submitted: submissions.filter((s) => s.status === "SUBMITTED").length,
    underReview: submissions.filter((s) => s.status === "UNDER_REVIEW").length,
    approved: submissions.filter((s) => s.status === "APPROVED").length,
    rejected: submissions.filter((s) => s.status === "REJECTED").length,
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-script text-sage-500 text-lg flex items-center gap-1.5"><Wheat className="w-5 h-5" /> {t("subtitle") || "Your Commodities"}</p>
          <h1 className="font-heading text-sage-900 text-3xl font-bold">{t("title") || "My Submissions"}</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateDialog(true); }}
          className="px-5 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors"
        >
          ＋ New Submission
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, icon: <ClipboardList className="w-5 h-5 text-blue-600" /> },
          { label: "Submitted", value: stats.submitted, icon: <Send className="w-5 h-5 text-indigo-600" /> },
          { label: "Under Review", value: stats.underReview, icon: <Loader className="w-5 h-5 text-amber-600" /> },
          { label: "Approved", value: stats.approved, icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> },
          { label: "Rejected", value: stats.rejected, icon: <XCircle className="w-5 h-5 text-red-500" /> },
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
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="LISTED">Listed</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && !isLoading && (
        <ErrorState title="Could not load submissions" message={error} onRetry={fetchSubmissions} />
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
      {!isLoading && submissions.length === 0 && (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-16 text-center">
            <Wheat className="w-12 h-12 text-sage-300 mx-auto mb-4" />
            <h2 className="font-heading text-sage-900 text-xl font-bold mb-2">
              {t("noSubmissions") || "No submissions yet"}
            </h2>
            <p className="text-sage-500 text-sm max-w-md mx-auto leading-relaxed">
              {t("noSubmissionsDesc") || "Submit your commodity details so sellers can create marketplace listings from them."}
            </p>
            <button
              onClick={() => { resetForm(); setShowCreateDialog(true); }}
              className="mt-6 px-6 py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors"
            >
              ＋ Create First Submission
            </button>
          </CardContent>
        </Card>
      )}

      {/* Submissions list */}
      {!isLoading && submissions.length > 0 && (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <Card key={sub.id} className="rounded-3xl border-sage-100 hover:border-sage-200 transition-colors">
              <CardContent className="py-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-full sm:w-20 h-32 sm:h-20 rounded-2xl bg-gradient-to-br from-sage-50 to-sage-100 overflow-hidden">
                      {sub.images && sub.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sub.thumbnailUrl ?? sub.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CommodityIcon type={sub.commodityType} className="w-6 h-6 opacity-50" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading text-sage-900 font-bold text-sm flex items-center gap-1.5">
                            <CommodityIcon type={sub.commodityType} className="w-4 h-4" /> {COMMODITY_LABELS[sub.commodityType] || sub.commodityType}
                          </h3>
                          <Badge className={`text-xs ${STATUS_COLORS[sub.status] || "bg-gray-100 text-gray-800"}`}>
                            {STATUS_LABELS[sub.status] || sub.status}
                          </Badge>
                          {sub.grade && (
                            <Badge className="text-xs bg-sage-50 text-sage-700">Grade {sub.grade}</Badge>
                          )}
                        </div>
                        {sub.status === "REJECTED" && sub.adminRemarks && (
                          <div className="mt-1 px-2 py-1 bg-red-50 border border-red-100 rounded-lg">
                            <p className="text-red-700 text-xs">
                              <span className="font-medium">Rejected:</span> {sub.adminRemarks}
                            </p>
                          </div>
                        )}
                        {sub.lot && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={`text-xs ${LOT_STATUS_COLORS[sub.lot.status] || "bg-gray-100 text-gray-800"}`}>
                              {sub.lot.status === "AUCTION_ACTIVE" && <Gavel className="w-3 h-3 mr-0.5 inline" />}
                              {sub.lot.status === "EXPIRED" && <Timer className="w-3 h-3 mr-0.5 inline" />}
                              {LOT_STATUS_LABELS[sub.lot.status] || sub.lot.status}
                            </Badge>
                            <span className="text-xs text-sage-500">Lot #{sub.lot.lotNumber}</span>
                            {sub.lot.bidCount > 0 && (
                              <span className="text-xs text-sage-500">· {sub.lot.bidCount} bid{sub.lot.bidCount !== 1 ? "s" : ""}</span>
                            )}
                            {sub.lot.status === "EXPIRED" && sub.lot.bidCount === 0 && (
                              <span className="text-xs text-amber-600 font-medium">No bids received</span>
                            )}
                          </div>
                        )}
                        {!sub.lot && sub.lotId && (
                          <p className="text-emerald-600 text-xs mt-1">✓ Listed as a marketplace lot</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-sage-500">
                      <span>{sub.quantityKg.toLocaleString()} kg</span>
                      <span className="w-1 h-1 rounded-full bg-sage-300" />
                      <span>{sub.origin?.district}, {sub.origin?.state}</span>
                      <span className="w-1 h-1 rounded-full bg-sage-300" />
                      <span>{formatDate(sub.createdAt)}</span>
                      {sub.images && sub.images.length > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-sage-300" />
                          <span>{sub.images.length} photo{sub.images.length !== 1 ? "s" : ""}</span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {(sub.status === "SUBMITTED" || sub.status === "REJECTED" || (sub.lot?.status === "EXPIRED" && sub.lot.bidCount === 0)) && (
                        <button
                          onClick={() => openEdit(sub)}
                          className="px-3 py-1.5 text-xs font-medium text-sage-700 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors"
                        >
                          <Pencil className="w-3 h-3 inline" /> {sub.lot?.status === "EXPIRED" ? "Re-edit & Resubmit" : "Edit"}
                        </button>
                      )}

                      {(sub.status === "SUBMITTED" || sub.status === "APPROVED") && (
                        <label className="px-3 py-1.5 text-xs font-medium text-sage-700 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors cursor-pointer inline-flex items-center gap-1">
                          {uploadingId === sub.id ? "Uploading..." : <><Camera className="w-3.5 h-3.5" /> Add Photo</>}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={uploadingId === sub.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(sub.id, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}

                      {sub.status === "UNDER_REVIEW" && (
                        <span className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-full inline-flex items-center gap-1">
                          <Loader className="w-3.5 h-3.5" /> Under Review
                        </span>
                      )}

                      {sub.status === "APPROVED" && !sub.lotId && (
                        <button
                          onClick={() => router.push(`/dashboard/create-lot?submissionId=${sub.id}`)}
                          className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-full hover:bg-emerald-700 transition-colors"
                        >
                                                    <Sprout className="w-3.5 h-3.5 inline" /> Create Lot from This
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Create Dialog ────────────────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); resetForm(); setPendingImages([]); setPendingVideo(null); setVideoUploadProgress(null); setImageUploadProgress(null); } }}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900 text-xl">
                            <Wheat className="w-5 h-5 inline" /> New Commodity Submission
            </DialogTitle>
          </DialogHeader>

          <SubmissionForm
            form={form}
            setForm={setForm}
            onSubmit={handleCreate}
            isSaving={isSaving}
            submitLabel="Submit Commodity"
            showFileUpload={true}
            imageFiles={pendingImages}
            onAddImage={(f) => setPendingImages((prev) => prev.length < 5 ? [...prev, f] : prev)}
            onRemoveImage={(i) => setPendingImages((prev) => prev.filter((_, idx) => idx !== i))}
            videoFile={pendingVideo}
            onSetVideo={(f) => setPendingVideo(f)}
            onClearVideo={() => setPendingVideo(null)}
            videoUploadProgress={videoUploadProgress}
            imageUploadProgress={imageUploadProgress}
          />
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!editSubmission} onOpenChange={(open) => { if (!open) { setEditSubmission(null); resetForm(); } }}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900 text-xl">
                            <Pencil className="w-4 h-4 inline" /> Edit Submission
            </DialogTitle>
          </DialogHeader>

          <SubmissionForm
            form={form}
            setForm={setForm}
            onSubmit={handleUpdate}
            isSaving={isSaving}
            submitLabel={editSubmission?.status === "REJECTED" ? "Resubmit" : "Save Changes"}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Shared Submission Form ────────────────────────────────────────

interface SubmissionFormData {
  commodityType: string;
  grade: string;
  variety: string;
  quantityKg: string;
  numberOfBags: string;
  bagWeight: string;
  packagingType: string;
  description: string;
  originCountry: string;
  originState: string;
  originDistrict: string;
  originVillage: string;
  harvestYear: string;
  harvestMonth: string;
  harvestSeason: string;
  moistureRange: string;
  colourAroma: string;
  tailCut: string;
  sellerDeclaration: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const PACKAGING_TYPES = ["Jute Bag", "Polythene Bag", "Vacuum Pack", "Cardboard Box", "Loose", "Other"];
const TAIL_CUT_OPTIONS = ["Tail-Cut", "Uncut", "Semi-Cut", "N/A"];

function SubmissionForm({
  form,
  setForm,
  onSubmit,
  isSaving,
  submitLabel,
  showFileUpload = false,
  imageFiles,
  onAddImage,
  onRemoveImage,
  videoFile,
  onSetVideo,
  onClearVideo,
  videoUploadProgress,
  imageUploadProgress,
}: {
  form: SubmissionFormData;
  setForm: React.Dispatch<React.SetStateAction<SubmissionFormData>>;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
  showFileUpload?: boolean;
  imageFiles?: File[];
  onAddImage?: (file: File) => void;
  onRemoveImage?: (index: number) => void;
  videoFile?: File | null;
  onSetVideo?: (file: File) => void;
  onClearVideo?: () => void;
  videoUploadProgress?: number | null;
  imageUploadProgress?: { current: number; total: number; pct: number } | null;
}) {
  const set = (key: string, value: string | null) => setForm((f) => ({ ...f, [key]: value ?? "" }));

  return (
    <div className="space-y-5 mt-2">
      {/* ── Section: Commodity Identity ── */}
      <fieldset className="rounded-2xl border border-sage-100 p-5 space-y-4">
        <legend className="text-xs font-semibold text-sage-500 uppercase tracking-wider px-2">Commodity Identity</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-sage-700 text-sm">Commodity Type *</Label>
            <Select value={form.commodityType} onValueChange={(v) => set("commodityType", v)}>
              <SelectTrigger className="mt-1.5 h-10 rounded-xl border-sage-200">
                <SelectValue placeholder="Select commodity" />
              </SelectTrigger>
              <SelectContent>
                {COMMODITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="inline-flex items-center gap-1.5"><CommodityIcon type={c} className="w-4 h-4" /> {COMMODITY_LABELS[c]}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sage-700 text-sm">Grade</Label>
            <Select value={form.grade} onValueChange={(v) => set("grade", v)}>
              <SelectTrigger className="mt-1.5 h-10 rounded-xl border-sage-200">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sage-700 text-sm">Variety</Label>
            <Input
              value={form.variety}
              onChange={(e) => set("variety", e.target.value)}
              placeholder="e.g. Golsey, Ramsey"
              className="mt-1.5 h-10 rounded-xl border-sage-200"
            />
          </div>
        </div>
      </fieldset>

      {/* ── Section: Quantity & Packaging ── */}
      <fieldset className="rounded-2xl border border-sage-100 p-5 space-y-4">
        <legend className="text-xs font-semibold text-sage-500 uppercase tracking-wider px-2">Quantity & Packaging</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-sage-700 text-sm">Quantity (kg) *</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={form.quantityKg}
              onChange={(e) => set("quantityKg", e.target.value)}
              placeholder="e.g. 500"
              className="mt-1.5 h-10 rounded-xl border-sage-200"
            />
          </div>
          <div>
            <Label className="text-sage-700 text-sm">Number of Bags</Label>
            <Input
              type="number"
              min="1"
              value={form.numberOfBags}
              onChange={(e) => set("numberOfBags", e.target.value)}
              placeholder="e.g. 20"
              className="mt-1.5 h-10 rounded-xl border-sage-200"
            />
          </div>
          <div>
            <Label className="text-sage-700 text-sm">Bag Weight (kg)</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={form.bagWeight}
              onChange={(e) => set("bagWeight", e.target.value)}
              placeholder="e.g. 25"
              className="mt-1.5 h-10 rounded-xl border-sage-200"
            />
          </div>
          <div>
            <Label className="text-sage-700 text-sm">Packaging Type</Label>
            <Select value={form.packagingType} onValueChange={(v) => set("packagingType", v)}>
              <SelectTrigger className="mt-1.5 h-10 rounded-xl border-sage-200">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {PACKAGING_TYPES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {/* ── Section: Origin + Harvest (side by side on desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <fieldset className="rounded-2xl border border-sage-100 p-5 space-y-4">
          <legend className="text-xs font-semibold text-sage-500 uppercase tracking-wider px-2">Origin Details *</legend>
          <div>
            <Label className="text-sage-700 text-sm">Country *</Label>
            <Select value={form.originCountry} onValueChange={(v) => set("originCountry", v)}>
              <SelectTrigger className="mt-1.5 h-10 rounded-xl border-sage-200">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "IN" ? "India" : c === "NP" ? "Nepal" : c === "BT" ? "Bhutan" :
                     c === "AE" ? "UAE" : c === "SA" ? "Saudi Arabia" : "Oman"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sage-700 text-sm">State / Province *</Label>
            <Input
              value={form.originState}
              onChange={(e) => set("originState", e.target.value)}
              placeholder="Enter state or province"
              className="mt-1.5 h-10 rounded-xl border-sage-200"
            />
          </div>
          <div>
            <Label className="text-sage-700 text-sm">District *</Label>
            <Input
              value={form.originDistrict}
              onChange={(e) => set("originDistrict", e.target.value)}
              placeholder="Enter district"
              className="mt-1.5 h-10 rounded-xl border-sage-200"
            />
          </div>
          <div>
            <Label className="text-sage-700 text-sm">Village / Market</Label>
            <Input
              value={form.originVillage}
              onChange={(e) => set("originVillage", e.target.value)}
              placeholder="Optional"
              className="mt-1.5 h-10 rounded-xl border-sage-200"
            />
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-sage-100 p-5 space-y-4">
          <legend className="text-xs font-semibold text-sage-500 uppercase tracking-wider px-2">Harvest Information</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sage-700 text-sm">Harvest Year</Label>
              <Input
                type="number"
                min="2020"
                max="2100"
                value={form.harvestYear}
                onChange={(e) => set("harvestYear", e.target.value)}
                placeholder="e.g. 2025"
                className="mt-1.5 h-10 rounded-xl border-sage-200"
              />
            </div>
            <div>
              <Label className="text-sage-700 text-sm">Season</Label>
              <Input
                value={form.harvestSeason}
                onChange={(e) => set("harvestSeason", e.target.value)}
                placeholder="e.g. Monsoon"
                className="mt-1.5 h-10 rounded-xl border-sage-200"
              />
            </div>
          </div>
          <div>
            <Label className="text-sage-700 text-sm">Harvest Month</Label>
            <Select value={form.harvestMonth} onValueChange={(v) => set("harvestMonth", v)}>
              <SelectTrigger className="mt-1.5 h-10 rounded-xl border-sage-200">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </fieldset>
      </div>

      {/* ── Section: Product Specifications ── */}
      <fieldset className="rounded-2xl border border-sage-100 p-5 space-y-4">
        <legend className="text-xs font-semibold text-sage-500 uppercase tracking-wider px-2">Product Specifications</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-sage-700 text-sm">Moisture Range</Label>
            <Input
              value={form.moistureRange}
              onChange={(e) => set("moistureRange", e.target.value)}
              placeholder="e.g. 10-12%"
              className="mt-1.5 h-10 rounded-xl border-sage-200"
            />
          </div>
          <div>
            <Label className="text-sage-700 text-sm">Tail Cut</Label>
            <Select value={form.tailCut} onValueChange={(v) => set("tailCut", v)}>
              <SelectTrigger className="mt-1.5 h-10 rounded-xl border-sage-200">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {TAIL_CUT_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sage-700 text-sm">Colour / Aroma</Label>
            <Input
              value={form.colourAroma}
              onChange={(e) => set("colourAroma", e.target.value)}
              placeholder="e.g. Dark brown, smoky"
              className="mt-1.5 h-10 rounded-xl border-sage-200"
            />
          </div>
        </div>
      </fieldset>

      {/* ── Section: Description & Declaration ── */}
      <fieldset className="rounded-2xl border border-sage-100 p-5 space-y-4">
        <legend className="text-xs font-semibold text-sage-500 uppercase tracking-wider px-2">Description & Compliance</legend>
        <div>
          <Label className="text-sage-700 text-sm">Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe your commodity — drying method, processing, etc."
            rows={3}
            className="mt-1.5 rounded-xl border-sage-200 resize-none"
            maxLength={2000}
          />
        </div>
        <div>
          <Label className="text-sage-700 text-sm">Seller Declaration</Label>
          <Textarea
            value={form.sellerDeclaration}
            onChange={(e) => set("sellerDeclaration", e.target.value)}
            placeholder="I declare that the commodity described above is as stated..."
            rows={2}
            className="mt-1.5 rounded-xl border-sage-200 resize-none"
            maxLength={5000}
          />
        </div>
        <p className="text-xs text-sage-400 flex items-center gap-1"><Paperclip className="w-3 h-3" /> You can upload lab reports and certificates after creating the submission.</p>
      </fieldset>

      {/* ── Section: Photos & Video ── */}
      {showFileUpload && (
        <>
          <p className="text-xs font-semibold text-sage-400 uppercase tracking-wider pt-2">Photos <span className="text-red-400">*</span></p>
          <p className="text-xs text-sage-500">At least 1 required · up to 5 photos · JPEG/PNG/WebP · max 10 MB each</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {imageFiles?.map((f, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-sage-200 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveImage?.(i)}
                  className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-bl-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            {(!imageFiles || imageFiles.length < 5) && (
              <label className="w-16 h-16 rounded-xl border-2 border-dashed border-sage-300 flex flex-col items-center justify-center cursor-pointer hover:bg-sage-50 transition-colors flex-shrink-0">
                <Camera className="w-5 h-5 text-sage-400" />
                <span className="text-xs text-sage-500 mt-0.5">Add</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onAddImage?.(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          {imageUploadProgress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-sage-500 mb-1">
                <span>Uploading photo {imageUploadProgress.current} of {imageUploadProgress.total}...</span>
                <span>{imageUploadProgress.pct}%</span>
              </div>
              <div className="w-full bg-sage-100 rounded-full h-2">
                <div
                  className="bg-sage-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${imageUploadProgress.pct}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-xs font-semibold text-sage-400 uppercase tracking-wider pt-2">
            Video <span className="font-normal text-sage-400">(optional · 1 max · mp4/webm/mov)</span>
          </p>
          <div className="mt-1">
            {videoFile ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-sage-50 rounded-xl">
                <span className="text-sm text-sage-700 flex-1 truncate inline-flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {videoFile.name}</span>
                <button type="button" onClick={onClearVideo} className="text-red-500 text-xs hover:underline">
                  Remove
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-sage-200 rounded-xl cursor-pointer hover:bg-sage-50 transition-colors">
                <span className="text-sm text-sage-600 inline-flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Add Video</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onSetVideo?.(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {typeof videoUploadProgress === "number" && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-sage-500 mb-1">
                  <span>Uploading video...</span>
                  <span>{videoUploadProgress}%</span>
                </div>
                <div className="w-full bg-sage-100 rounded-full h-2">
                  <div
                    className="bg-sage-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${videoUploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={isSaving}
        className="w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 disabled:opacity-50 transition-colors"
      >
        {isSaving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
