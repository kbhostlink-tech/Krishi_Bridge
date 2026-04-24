"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";
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
import { Loader, Video, Wheat, Pencil, Camera, Paperclip, Sprout, Gavel, Timer, AlertCircle, Upload, Eye, CheckCircle2, Package, XCircle, ClipboardList } from "lucide-react";

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
  LARGE_CARDAMOM: "Black Cardamom", TEA: "Orthodox Tea", OTHER: "Black Tea",
  GINGER: "Ginger", TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon",
};

const COMMODITIES = [
  "LARGE_CARDAMOM", "TEA", "OTHER",
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
  const { accessToken } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  // Stats (fetched separately to always reflect true DB counts)
  const [statsData, setStatsData] = useState({
    total: 0, submitted: 0, underReview: 0, approved: 0, rejected: 0, listed: 0,
  });

  // Create / Edit dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editSubmission, setEditSubmission] = useState<Submission | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    setFormErrors({});
    setForm({
      commodityType: "", grade: "", variety: "", quantityKg: "", numberOfBags: "", bagWeight: "",
      packagingType: "", description: "", originCountry: "", originState: "", originDistrict: "",
      originVillage: "", harvestYear: "", harvestMonth: "", harvestSeason: "",
      moistureRange: "", colourAroma: "", tailCut: "", sellerDeclaration: "",
    });
  };

  const clearFormError = (key: string) =>
    setFormErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });

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
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(currentPage) });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/commodity-submissions?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load submissions");
      const data = await res.json();
      setSubmissions(data.submissions);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statusFilter, currentPage]);

  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    try {
      const statuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "LISTED"];
      const [totalRes, ...statusRes] = await Promise.all([
        fetch(`/api/commodity-submissions?limit=1`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        ...statuses.map(s =>
          fetch(`/api/commodity-submissions?limit=1&status=${s}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        ),
      ]);
      const [totalData, ...statusData] = await Promise.all([totalRes.json(), ...statusRes.map(r => r.json())]);
      setStatsData({
        total: totalData.total ?? 0,
        submitted: statusData[0].total ?? 0,
        underReview: statusData[1].total ?? 0,
        approved: statusData[2].total ?? 0,
        rejected: statusData[3].total ?? 0,
        listed: statusData[4].total ?? 0,
      });
    } catch {
      // stats failure is non-critical
    }
  }, [accessToken]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ─── Validate create form ───────────────────────────────────────

  const validateCreateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.commodityType) errors.commodityType = t("validationCommodityRequired");
    const qty = parseFloat(form.quantityKg);
    if (!form.quantityKg || isNaN(qty) || qty <= 0)
      errors.quantityKg = t("validationQuantityInvalid");
    if (!form.originCountry) errors.originCountry = t("validationCountryRequired");
    if (!form.originState.trim()) errors.originState = t("validationStateRequired");
    if (!form.originDistrict.trim()) errors.originDistrict = t("validationDistrictRequired");
    if (pendingImages.length === 0) errors.images = t("validationImagesRequired");
    return errors;
  };

  // ─── Create submission ──────────────────────────────────────────

  const handleCreate = async () => {
    const errors = validateCreateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Show the FIRST specific error in the toast so users know exactly what to fix
      const firstError = Object.values(errors)[0];
      toast.error(firstError || t("validationFormIncomplete"));
      // Scroll to first error field
      setTimeout(() => {
        const firstKey = Object.keys(errors)[0];
        const el = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      return;
    }
    setFormErrors({});
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
        // Surface server-side field errors if present
        if (data.details && typeof data.details === "object") {
          const serverErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(data.details as Record<string, string[]>)) {
            if (Array.isArray(msgs) && msgs.length > 0) serverErrors[key] = msgs[0];
          }
          if (Object.keys(serverErrors).length > 0) setFormErrors(serverErrors);
        }
        toast.error(data.error || t("validationFormIncomplete"));
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

      toast.success(t("toastCreateSuccess"));
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
    // Validate required fields
    const errors: Record<string, string> = {};
    if (!form.commodityType) errors.commodityType = "Please select a commodity type";
    const qty = parseFloat(form.quantityKg);
    if (!form.quantityKg || isNaN(qty) || qty <= 0)
      errors.quantityKg = "Please enter a valid quantity greater than 0";
    if (!form.originCountry) errors.originCountry = "Please select the country of origin";
    if (!form.originState.trim()) errors.originState = "Please enter the state or province";
    if (!form.originDistrict.trim()) errors.originDistrict = "Please enter the district";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all highlighted fields before saving");
      return;
    }
    setFormErrors({});
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
        if (data.details && typeof data.details === "object") {
          const serverErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(data.details as Record<string, string[]>)) {
            if (Array.isArray(msgs) && msgs.length > 0) serverErrors[key] = msgs[0];
          }
          if (Object.keys(serverErrors).length > 0) setFormErrors(serverErrors);
        }
        toast.error(data.error || t("validationFormIncompleteSave"));
        return;
      }
      toast.success(t("toastUpdateSuccess"));
      setEditSubmission(null);
      resetForm();
      fetchSubmissions();
    } catch {
      toast.error(t("validationFormIncompleteSave"));
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
        throw new Error(data.error || t("toastUploadFailed"));
      }
      toast.success(t("toastImageUploaded"));
      fetchSubmissions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toastUploadFailed"));
    } finally {
      setUploadingId(null);
    }
  };

  // ─── Open edit dialog ───────────────────────────────────────────

  const openEdit = (sub: Submission) => {
    if (sub.status === "APPROVED" || sub.status === "LISTED") {
      toast.error(t("toastLockedApproved"));
      return;
    }
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

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("supplyIntakeEyebrow")}
        title={t("title") || "My Submissions"}
        action={
          <button
            onClick={() => { resetForm(); setShowCreateDialog(true); }}
            className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2f422e]"
          >
            {t("newSubmission")}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <MetricCard label={t("statTotal")} value={statsData.total} icon={ClipboardList} tone="slate" />
        <MetricCard label={t("statSubmitted")} value={statsData.submitted} icon={Upload} tone="olive" />
        <MetricCard label={t("statUnderReview")} value={statsData.underReview} icon={Eye} tone="amber" />
        <MetricCard label={t("statApproved")} value={statsData.approved} icon={CheckCircle2} tone="teal" />
        <MetricCard label={t("statListed")} value={statsData.listed} icon={Package} tone="olive" />
        <MetricCard label={t("statRejected")} value={statsData.rejected} icon={XCircle} tone="rose" />
      </div>

      <Surface className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-stone-950 shrink-0">{t("filters")}</span>
          <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setCurrentPage(1); } }}>
            <SelectTrigger className="w-44 border-[#d9d1c2]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("statusAll") }</SelectItem>
              <SelectItem value="SUBMITTED">{t("statusSubmitted")}</SelectItem>
              <SelectItem value="UNDER_REVIEW">{t("statusUnderReview")}</SelectItem>
              <SelectItem value="APPROVED">{t("statusApproved")}</SelectItem>
              <SelectItem value="LISTED">{t("statusListed")}</SelectItem>
              <SelectItem value="REJECTED">{t("statusRejected")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-sm text-stone-600">
            <span><span className="font-medium text-stone-700">{t("visibleRows")}:</span> <span className="font-semibold text-stone-950">{submissions.length}</span></span>
            <span><span className="font-medium text-stone-700">{t("filteredTotal")}:</span> <span className="font-semibold text-stone-950">{totalCount}</span></span>
            <span><span className="font-medium text-stone-700">{t("currentPage")}:</span> <span className="font-semibold text-stone-950">{currentPage} / {Math.max(totalPages, 1)}</span></span>
          </div>
        </div>
      </Surface>

      {/* Error */}
      {error && !isLoading && (
        <ErrorState title="Could not load submissions" message={error} onRetry={fetchSubmissions} />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Surface key={i} className="animate-pulse p-5">
                <div className="flex gap-4">
                  <div className="h-24 w-24 shrink-0 bg-[#ece4d6]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-[#ece4d6]" />
                    <div className="h-3 w-1/2 bg-[#ece4d6]" />
                    <div className="h-3 w-1/4 bg-[#ece4d6]" />
                  </div>
                </div>
            </Surface>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && submissions.length === 0 && (
        <Surface className="p-12 text-center sm:p-16">
            <Wheat className="w-12 h-12 text-sage-300 mx-auto mb-4" />
            <h2 className="font-heading text-sage-900 text-xl font-bold mb-2">
              {t("noSubmissions") || "No submissions yet"}
            </h2>
            <p className="text-sage-500 text-sm max-w-md mx-auto leading-relaxed">
              {t("noSubmissionsDesc") || "Submit your commodity details so sellers can create marketplace listings from them."}
            </p>
            <button
              onClick={() => { resetForm(); setShowCreateDialog(true); }}
              className="mt-6 inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2f422e]"
            >
              {t("createFirstCta")}
            </button>
        </Surface>
      )}

      {/* Submissions list */}
      {!isLoading && submissions.length > 0 && (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <Surface key={sub.id} className="p-4 transition-colors hover:bg-[#fdfbf7] sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
                  <div className="shrink-0 border border-[#ddd4c4] bg-[#f7f2e8]">
                    <div className="h-28 w-full overflow-hidden bg-linear-to-br from-sage-50 to-sage-100 sm:h-24">
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

                  <div className="min-w-0 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-stone-950 flex items-center gap-2">
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
                          <div className="mt-3 border border-red-200 bg-red-50 px-3 py-2">
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
                              <span className="text-xs text-amber-600 font-medium">{t("noBids")}</span>
                            )}
                          </div>
                        )}
                        {!sub.lot && sub.lotId && (
                          <p className="text-emerald-600 text-xs mt-1">✓ {t("listedAsLot")}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                      <span>{sub.quantityKg.toLocaleString()} kg</span>
                      <span className="text-stone-300">/</span>
                      <span>{sub.origin?.district}, {sub.origin?.state}</span>
                      <span className="text-stone-300">/</span>
                      <span>{formatDate(sub.createdAt)}</span>
                      {sub.images && sub.images.length > 0 && (
                        <>
                          <span className="text-stone-300">/</span>
                          <span>{sub.images.length} {sub.images.length !== 1 ? t("photosLabel") : t("photoLabel")}</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-[#ece4d6] pt-4">
                      {(sub.status === "SUBMITTED" || sub.status === "REJECTED" || (sub.lot?.status === "EXPIRED" && sub.lot.bidCount === 0)) && (
                        <button
                          onClick={() => openEdit(sub)}
                          className="inline-flex h-10 items-center border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee]"
                        >
                          <Pencil className="w-3 h-3 inline" /> {sub.lot?.status === "EXPIRED" ? t("actionReEditResubmit") : t("actionEdit")}
                        </button>
                      )}

                      {(sub.status === "SUBMITTED" || sub.status === "APPROVED") && (
                        <label className="inline-flex h-10 cursor-pointer items-center gap-1 border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee]">
                          {uploadingId === sub.id ? t("actionUploading") : <><Camera className="w-3.5 h-3.5" /> {t("actionAddPhoto")}</>}
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
                        <span className="inline-flex h-10 items-center gap-1 border border-amber-200 bg-amber-50 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                          <Loader className="w-3.5 h-3.5" /> {t("underReviewBadge")}
                        </span>
                      )}

                      {sub.status === "APPROVED" && !sub.lotId && (
                        <button
                          onClick={() => router.push(`/dashboard/create-lot?submissionId=${sub.id}`)}
                          className="inline-flex h-10 items-center border border-[#2f7d71] bg-[#2f7d71] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#24665d]"
                        >
                                                    <Sprout className="w-3.5 h-3.5 inline" /> {t("actionCreateLot")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
            </Surface>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-10 items-center border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← {t("prev")}
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-10 min-w-10 border px-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  page === currentPage
                    ? "border-[#405742] bg-[#405742] text-white"
                    : "border-[#d7cfbf] bg-white text-stone-700 hover:bg-[#faf6ee]"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-10 items-center border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("next")} →
          </button>
        </div>
      )}
      {!isLoading && totalPages > 0 && (
        <p className="text-center text-xs text-sage-400">
          {t("showingOf", { shown: submissions.length, total: totalCount })}
        </p>
      )}

      {/* ─── Create Dialog ────────────────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); resetForm(); setPendingImages([]); setPendingVideo(null); setVideoUploadProgress(null); setImageUploadProgress(null); } }}>
        <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto border-[#d9d1c2] bg-[#faf8f3] p-0">
          <DialogHeader className="px-6 sm:px-7 pt-6 pb-4 border-b border-sage-100 bg-white">
            <DialogTitle className="font-heading text-sage-900 text-xl flex items-center gap-2">
              <Wheat className="w-5 h-5" /> {t("newCommoditySubmission")}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 sm:px-7 pb-2">
          <SubmissionForm
            form={form}
            setForm={setForm}
            onSubmit={handleCreate}
            isSaving={isSaving}
            submitLabel={t("submitCommodity")}
            fieldErrors={formErrors}
            onClearError={clearFormError}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!editSubmission} onOpenChange={(open) => { if (!open) { setEditSubmission(null); resetForm(); } }}>
        <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto border-[#d9d1c2] bg-[#faf8f3] p-0">
          <DialogHeader className="px-6 sm:px-7 pt-6 pb-4 border-b border-sage-100 bg-white">
            <DialogTitle className="font-heading text-sage-900 text-xl flex items-center gap-2">
              <Pencil className="w-4 h-4" /> {t("editSubmissionTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 sm:px-7 pb-2">
          <SubmissionForm
            form={form}
            setForm={setForm}
            onSubmit={handleUpdate}
            isSaving={isSaving}
            submitLabel={editSubmission?.status === "REJECTED" ? t("resubmit") : t("saveChanges")}
            fieldErrors={formErrors}
            onClearError={clearFormError}
          />
          </div>
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
// Harvest year options — current year down to 10 years back.
const HARVEST_YEARS = (() => {
  const cy = new Date().getFullYear();
  return Array.from({ length: 11 }, (_, i) => cy - i);
})();

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
  fieldErrors,
  onClearError,
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
  fieldErrors?: Record<string, string>;
  onClearError?: (key: string) => void;
}) {
  const t = useTranslations("submissions");
  const set = (key: string, value: string | null) => {
    setForm((f) => ({ ...f, [key]: value ?? "" }));
    onClearError?.(key);
  };

  return (
    <div className="space-y-6 mt-2">
      {/* ── Section 1 · Commodity Identity ── */}
      <section className="rounded-xl border border-sage-100 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-heading text-sage-900 text-base">{t("sectionIdentity")}</h3>
          <p className="text-xs text-sage-500 mt-0.5">{t("sectionIdentityHint")}</p>
        </div>
        <div className="space-y-1.5" data-field="commodityType">
          <Label className="text-sage-700 text-sm font-medium">{t("fieldCommodity")} <span className="text-red-500">*</span></Label>
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${fieldErrors?.commodityType ? "ring-1 ring-red-300 rounded-lg p-1" : ""}`}>
            {COMMODITIES.map((c) => {
              const selected = form.commodityType === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("commodityType", c)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    selected
                      ? "border-sage-700 bg-sage-50 ring-2 ring-sage-200 shadow-sm"
                      : "border-sage-200 bg-white hover:border-sage-400 hover:bg-sage-50/50"
                  }`}
                >
                  <CommodityIcon type={c} className="w-9 h-9 shrink-0" />
                  <span className={`text-sm font-medium ${selected ? "text-sage-900" : "text-sage-700"}`}>
                    {COMMODITY_LABELS[c]}
                  </span>
                </button>
              );
            })}
          </div>
          {fieldErrors?.commodityType && (
            <p className="text-xs text-red-600 flex items-center gap-1 mt-2"><AlertCircle className="w-3 h-3" /> {fieldErrors.commodityType}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldGrade")}</Label>
            <Select value={form.grade} onValueChange={(v) => set("grade", v)}>
              <SelectTrigger className="h-11 rounded-lg border-sage-200 w-full">
                <SelectValue placeholder={t("placeholderGrade")} />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldVariety")}</Label>
            <Input
              value={form.variety}
              onChange={(e) => set("variety", e.target.value)}
              placeholder={t("placeholderVariety")}
              className="h-11 rounded-lg border-sage-200"
            />
          </div>
        </div>
      </section>

      {/* ── Section 2 · Quantity & Packaging ── */}
      <section className="rounded-xl border border-sage-100 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-heading text-sage-900 text-base">{t("sectionQuantity")}</h3>
          <p className="text-xs text-sage-500 mt-0.5">{t("sectionQuantityHint")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5" data-field="quantityKg">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldQuantity")} <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={form.quantityKg}
              onChange={(e) => set("quantityKg", e.target.value)}
              placeholder={t("placeholderQuantity")}
              className={`h-11 rounded-lg ${fieldErrors?.quantityKg ? "border-red-400 focus:border-red-500" : "border-sage-200"}`}
            />
            {fieldErrors?.quantityKg && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.quantityKg}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldBagCount")}</Label>
            <Input
              type="number"
              min="1"
              value={form.numberOfBags}
              onChange={(e) => set("numberOfBags", e.target.value)}
              placeholder={t("placeholderBags")}
              className="h-11 rounded-lg border-sage-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldBagWeight")}</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={form.bagWeight}
              onChange={(e) => set("bagWeight", e.target.value)}
              placeholder={t("placeholderBagWeight")}
              className="h-11 rounded-lg border-sage-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldPackaging")}</Label>
            <Select value={form.packagingType} onValueChange={(v) => set("packagingType", v)}>
              <SelectTrigger className="h-11 rounded-lg border-sage-200">
                <SelectValue placeholder={t("placeholderPackaging")} />
              </SelectTrigger>
              <SelectContent>
                {PACKAGING_TYPES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Section 3 · Origin Details ── */}
      <section className="rounded-xl border border-sage-100 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-heading text-sage-900 text-base">{t("sectionOrigin")} <span className="text-red-500 text-sm">*</span></h3>
          <p className="text-xs text-sage-500 mt-0.5">{t("sectionOriginHint")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5" data-field="originCountry">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldCountry")} <span className="text-red-500">*</span></Label>
            <Select value={form.originCountry} onValueChange={(v) => set("originCountry", v)}>
              <SelectTrigger className={`h-11 rounded-lg ${fieldErrors?.originCountry ? "border-red-400 focus:ring-red-300" : "border-sage-200"}`}>
                <SelectValue placeholder={t("placeholderCountry")} />
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
            {fieldErrors?.originCountry && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.originCountry}</p>
            )}
          </div>
          <div className="space-y-1.5" data-field="originState">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldState")} <span className="text-red-500">*</span></Label>
            <Input
              value={form.originState}
              onChange={(e) => set("originState", e.target.value)}
              placeholder={t("placeholderState")}
              className={`h-11 rounded-lg ${fieldErrors?.originState ? "border-red-400 focus:border-red-500" : "border-sage-200"}`}
            />
            {fieldErrors?.originState && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.originState}</p>
            )}
          </div>
          <div className="space-y-1.5" data-field="originDistrict">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldDistrict")} <span className="text-red-500">*</span></Label>
            <Input
              value={form.originDistrict}
              onChange={(e) => set("originDistrict", e.target.value)}
              placeholder={t("placeholderDistrict")}
              className={`h-11 rounded-lg ${fieldErrors?.originDistrict ? "border-red-400 focus:border-red-500" : "border-sage-200"}`}
            />
            {fieldErrors?.originDistrict && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.originDistrict}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldVillage")}</Label>
            <Input
              value={form.originVillage}
              onChange={(e) => set("originVillage", e.target.value)}
              placeholder={t("placeholderVillage")}
              className="h-11 rounded-lg border-sage-200"
            />
          </div>
        </div>
      </section>

      {/* ── Section 4 · Harvest Information ── */}
      <section className="rounded-xl border border-sage-100 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-heading text-sage-900 text-base">{t("sectionHarvest")}</h3>
          <p className="text-xs text-sage-500 mt-0.5">{t("sectionHarvestHint")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldHarvestYear")}</Label>
            <Select value={form.harvestYear} onValueChange={(v) => set("harvestYear", v)}>
              <SelectTrigger className="h-11 rounded-lg border-sage-200 w-full">
                <SelectValue placeholder={t("placeholderYear")} />
              </SelectTrigger>
              <SelectContent>
                {HARVEST_YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldHarvestSeason")}</Label>
            <Input
              value={form.harvestSeason}
              onChange={(e) => set("harvestSeason", e.target.value)}
              placeholder={t("placeholderSeason")}
              className="h-11 rounded-lg border-sage-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldHarvestMonth")}</Label>
            <Select value={form.harvestMonth} onValueChange={(v) => set("harvestMonth", v)}>
              <SelectTrigger className="h-11 rounded-lg border-sage-200">
                <SelectValue placeholder={t("placeholderMonth")} />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Section 5 · Product Specifications ── */}
      <section className="rounded-xl border border-sage-100 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-heading text-sage-900 text-base">{t("sectionSpecs")}</h3>
          <p className="text-xs text-sage-500 mt-0.5">{t("sectionSpecsHint")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldMoisture")}</Label>
            <Input
              value={form.moistureRange}
              onChange={(e) => set("moistureRange", e.target.value)}
              placeholder={t("placeholderMoisture")}
              className="h-11 rounded-lg border-sage-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldTailCut")}</Label>
            <Select value={form.tailCut} onValueChange={(v) => set("tailCut", v)}>
              <SelectTrigger className="h-11 rounded-lg border-sage-200">
                <SelectValue placeholder={t("placeholderTailCut")} />
              </SelectTrigger>
              <SelectContent>
                {TAIL_CUT_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sage-700 text-sm font-medium">{t("fieldColourGrade")}</Label>
            <Input
              value={form.colourAroma}
              onChange={(e) => set("colourAroma", e.target.value)}
              placeholder={t("placeholderColour")}
              className="h-11 rounded-lg border-sage-200"
            />
          </div>
        </div>
      </section>

      {/* ── Section 6 · Description & Declaration ── */}
      <section className="rounded-xl border border-sage-100 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-heading text-sage-900 text-base">{t("sectionDescription")}</h3>
          <p className="text-xs text-sage-500 mt-0.5">{t("sectionDescriptionHint")}</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sage-700 text-sm font-medium">{t("fieldDescription")}</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={t("placeholderDescription")}
            rows={3}
            className="rounded-lg border-sage-200 resize-none"
            maxLength={2000}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sage-700 text-sm font-medium">{t("fieldSellerDeclaration")}</Label>
          <Textarea
            value={form.sellerDeclaration}
            onChange={(e) => set("sellerDeclaration", e.target.value)}
            placeholder={t("placeholderDeclaration")}
            rows={2}
            className="rounded-lg border-sage-200 resize-none"
            maxLength={5000}
          />
        </div>
        <p className="text-xs text-sage-500 flex items-center gap-1.5 pt-1"><Paperclip className="w-3.5 h-3.5" /> {t("complianceNote")}</p>
      </section>

      {/* ── Section 7 · Media ── */}
      {showFileUpload && (
        <section className="rounded-xl border border-sage-100 bg-white p-6 shadow-sm space-y-5" data-field="images">
          <div>
            <h3 className="font-heading text-sage-900 text-base">{t("sectionMedia")}</h3>
            <p className="text-xs text-sage-500 mt-0.5">{t("sectionMediaHint")}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-sage-700">{t("fieldImages")} <span className="text-red-500">*</span></p>
                <p className="text-xs text-sage-500 mt-0.5">{t("photosHint")}</p>
              </div>
              {fieldErrors?.images && (
                <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.images}</p>
              )}
              <div className="flex flex-wrap gap-2.5">
                {imageFiles?.map((f, i) => (
                  <div key={i} className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-sage-200">
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
                  <label className="size-20 shrink-0 rounded-lg border-2 border-dashed border-sage-300 flex flex-col items-center justify-center cursor-pointer hover:bg-sage-50 transition-colors">
                    <Camera className="w-5 h-5 text-sage-400" />
                    <span className="text-xs text-sage-500 mt-0.5">{t("addLabel")}</span>
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
                <div>
                  <div className="flex justify-between text-xs text-sage-500 mb-1">
                    <span>{t("uploadingPhotoProgress", { current: imageUploadProgress.current, total: imageUploadProgress.total })}</span>
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
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-sage-700">{t("videoLabel")} <span className="font-normal text-sage-400 text-xs">({t("optionalLabel")})</span></p>
                <p className="text-xs text-sage-500 mt-0.5">{t("videoHint")}</p>
              </div>
              <div>
                {videoFile ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-sage-50 rounded-lg border border-sage-200">
                    <span className="text-sm text-sage-700 flex-1 truncate inline-flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {videoFile.name}</span>
                    <button type="button" onClick={onClearVideo} className="text-red-500 text-xs hover:underline">
                      {t("removeLabel")}
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-sage-200 rounded-lg cursor-pointer hover:bg-sage-50 transition-colors">
                    <Video className="w-4 h-4 text-sage-500" />
                    <span className="text-sm text-sage-600">{t("addVideoLabel")}</span>
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
                      <span>{t("uploadingVideo")}</span>
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
            </div>
          </div>
        </section>
      )}

      {/* Submit */}
      <div className="sticky bottom-0 -mx-6 sm:-mx-7 px-6 sm:px-7 py-4 bg-white/95 backdrop-blur border-t border-sage-100">
        <button
          onClick={onSubmit}
          disabled={isSaving}
          className="w-full py-3 bg-sage-700 text-white rounded-lg text-sm font-medium hover:bg-sage-800 disabled:opacity-50 transition-colors"
        >
          {isSaving ? t("saving") : submitLabel}
        </button>
      </div>
    </div>
  );
}
