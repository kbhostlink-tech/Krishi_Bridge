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
import Image from "next/image";
import { CommodityIcon } from "@/lib/commodity-icons";
import { Leaf, CheckCircle2, XCircle, FileText, Video } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  LISTED: "bg-indigo-100 text-indigo-800",
  REJECTED: "bg-red-100 text-red-800",
};

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

const COUNTRY_LABELS: Record<string, string> = {
  IN: "India", NP: "Nepal", BT: "Bhutan", AE: "UAE", SA: "Saudi Arabia", OM: "Oman",
};



interface Farmer {
  id: string;
  name: string;
  country: string;
}

interface Origin {
  country: string;
  state: string;
  district: string;
  village?: string;
}

interface CommoditySubmission {
  id: string;
  farmerId: string;
  farmer: Farmer;
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
  imageUrls?: string[];
  videoUrls?: string[];
  origin: Origin;
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
  createdAt: string;
  updatedAt: string;
}

export default function AdminCommoditySubmissionsPage() {
  const { accessToken } = useAuth();
  const [submissions, setSubmissions] = useState<CommoditySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [total, setTotal] = useState(0);

  const [selectedSubmission, setSelectedSubmission] = useState<CommoditySubmission | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommoditySubmission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleViewDetails = async (sub: CommoditySubmission) => {
    // Open modal immediately with list-level data (no signed URLs yet)
    setSelectedSubmission(sub);
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/commodity-submissions/${sub.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setSelectedSubmission((prev) => prev?.id === sub.id ? {
        ...prev,
        imageUrls: data.submission.imageUrls ?? [],
        videoUrls: data.submission.videoUrls ?? [],
      } : prev);
    } catch {
      // Silently ignore — images just won't load with signed URLs
    }
  };

  const fetchSubmissions = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/commodity-submissions?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleAction = async (
    submissionId: string,
    action: "approve" | "reject" | "review",
    adminRemarks?: string
  ) => {
    if (!accessToken) return;
    setActionLoading(submissionId);
    try {
      const res = await fetch(`/api/commodity-submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action, adminRemarks }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return;
      }

      const statusMap: Record<string, string> = {
        approve: "APPROVED",
        reject: "REJECTED",
        review: "UNDER_REVIEW",
      };
      const newStatus = statusMap[action];

      toast.success(
        action === "approve"
          ? "Submission approved — farmer has been notified"
          : action === "reject"
          ? "Submission rejected — farmer has been notified"
          : "Submission marked for review"
      );

      setRejectDialogId(null);
      setRemarks("");

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, status: newStatus, adminRemarks: adminRemarks || s.adminRemarks }
            : s
        )
      );
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission((prev) =>
          prev ? { ...prev, status: newStatus, adminRemarks: adminRemarks || prev.adminRemarks } : prev
        );
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.id.toLowerCase().includes(q) ||
      s.commodityType.toLowerCase().includes(q) ||
      (s.farmer?.name ?? "").toLowerCase().includes(q)
    );
  });

  const deleteSubmission = async () => {
    if (!accessToken || !deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete submission");
        return;
      }
      toast.success("Submission permanently deleted");
      setDeleteTarget(null);
      setSelectedSubmission(null);
      setSubmissions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setTotal((prev) => prev - 1);
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const stats = {
    submitted: submissions.filter((s) => s.status === "SUBMITTED").length,
    underReview: submissions.filter((s) => s.status === "UNDER_REVIEW").length,
    approved: submissions.filter((s) => s.status === "APPROVED").length,
    rejected: submissions.filter((s) => s.status === "REJECTED").length,
    total: submissions.length,
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const originStr = (origin: Origin) => {
    const parts = [origin.village, origin.district, origin.state, COUNTRY_LABELS[origin.country]].filter(Boolean);
    return parts.join(", ");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-sage-100 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">Commodity Submissions</h1>
        <p className="text-sage-500 text-sm mt-1">
          Review and approve/reject farmer commodity submissions. Farmers are notified on each decision.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-xl">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.submitted}</p>
            <p className="text-xs text-sage-500">Awaiting Review</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
            <p className="text-xs text-sage-500">Under Review</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-sage-500">Approved</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
            <p className="text-xs text-sage-500">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, commodity, or farmer…"
          className="rounded-xl flex-1"
        />
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="rounded-xl w-full sm:w-52">
            <SelectValue placeholder="All Statuses" />
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

      {/* Submissions list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Leaf className="w-10 h-10 text-sage-300 mx-auto mb-3" />
          <p className="text-sage-700 font-medium">No submissions found</p>
          <p className="text-sage-400 text-sm mt-1">
            {statusFilter !== "all" ? "Try changing the status filter." : "Farmers haven't submitted any commodity yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <Card key={sub.id} className="rounded-xl border-sage-100 hover:border-sage-200 transition-all">
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="shrink-0 mt-0.5">
                      <CommodityIcon type={sub.commodityType} className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-heading text-sage-900 font-bold text-sm">
                          {COMMODITY_LABELS[sub.commodityType] || sub.commodityType}
                        </p>
                        {sub.grade && (
                          <span className="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full">
                            Grade {sub.grade}
                          </span>
                        )}
                        {sub.variety && (
                          <span className="text-xs bg-sage-50 text-sage-500 px-2 py-0.5 rounded-full border border-sage-200">
                            {sub.variety}
                          </span>
                        )}
                        <Badge className={STATUS_COLORS[sub.status]}>{sub.status.replace("_", " ")}</Badge>
                      </div>

                      <p className="text-xs text-sage-500 mt-0.5">
                        Farmer:{" "}
                        <strong>
                          {sub.farmer?.country && <span className="text-xs text-sage-400 font-mono">{sub.farmer.country}</span>} {sub.farmer?.name}
                        </strong>
                        {" • "}{Number(sub.quantityKg).toLocaleString()} kg
                        {sub.origin && ` • ${originStr(sub.origin as Origin)}`}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-sage-400">
                        <span>Submitted {formatDate(sub.createdAt)}</span>
                        {sub.harvestSeason && <span>Season: {sub.harvestSeason}</span>}
                        {sub.lotId && (
                          <span className="text-indigo-600 font-medium">Lot created</span>
                        )}
                      </div>

                      {sub.adminRemarks && (
                        <p className="text-xs text-sage-600 mt-1.5 bg-amber-50 rounded-lg px-2 py-1.5">
                          Admin note: {sub.adminRemarks}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-lg"
                      onClick={() => handleViewDetails(sub)}
                    >
                      View Details
                    </Button>

                    {sub.status === "SUBMITTED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs rounded-lg text-blue-700 border-blue-200 hover:bg-blue-50"
                        disabled={actionLoading === sub.id}
                        onClick={() => handleAction(sub.id, "review")}
                      >
                        Mark Under Review
                      </Button>
                    )}

                    {["SUBMITTED", "UNDER_REVIEW"].includes(sub.status) && (
                      <>
                        <Button
                          size="sm"
                          className="text-xs rounded-lg bg-green-700 hover:bg-green-800 text-white"
                          disabled={actionLoading === sub.id}
                          onClick={() => handleAction(sub.id, "approve")}
                        >
                          {actionLoading === sub.id ? "…" : <><CheckCircle2 className="w-3.5 h-3.5" /> Approve</>}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                          disabled={actionLoading === sub.id}
                          onClick={() => {
                            setRejectDialogId(sub.id);
                            setRemarks("");
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-lg border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteTarget(sub)}
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

      {/* Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Submission Details — {selectedSubmission ? (COMMODITY_LABELS[selectedSubmission.commodityType] || selectedSubmission.commodityType) : ""}
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-5 pt-2">
              {/* Status banner */}
              <div className="flex items-center gap-2">
                <Badge className={`${STATUS_COLORS[selectedSubmission.status]} text-sm px-3 py-1`}>
                  {selectedSubmission.status.replace("_", " ")}
                </Badge>
                <span className="text-xs text-sage-400">ID: {selectedSubmission.id.slice(0, 8)}…</span>
              </div>

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3 bg-sage-50 rounded-xl p-4 text-sm">
                <div>
                  <p className="text-sage-400 text-xs">Farmer / Aggregator</p>
                  <p className="text-sage-900 font-medium">
                    {selectedSubmission.farmer?.country && <span className="text-xs text-sage-400 font-mono">{selectedSubmission.farmer.country}</span>}{" "}
                    {selectedSubmission.farmer?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs">Commodity</p>
                  <p className="text-sage-900 font-medium flex items-center gap-1">
                    <CommodityIcon type={selectedSubmission.commodityType} />{" "}
                    {COMMODITY_LABELS[selectedSubmission.commodityType]}
                    {selectedSubmission.grade && ` — Grade ${selectedSubmission.grade}`}
                    {selectedSubmission.variety && ` (${selectedSubmission.variety})`}
                  </p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs">Quantity</p>
                  <p className="text-sage-900 font-bold">{Number(selectedSubmission.quantityKg).toLocaleString()} kg</p>
                </div>
                <div>
                  <p className="text-sage-400 text-xs">Submitted On</p>
                  <p className="text-sage-900 font-medium">{formatDate(selectedSubmission.createdAt)}</p>
                </div>
                {selectedSubmission.harvestSeason && (
                  <div>
                    <p className="text-sage-400 text-xs">Harvest Season</p>
                    <p className="text-sage-900 font-medium">{selectedSubmission.harvestSeason}</p>
                  </div>
                )}
                {selectedSubmission.harvestDate && (
                  <div>
                    <p className="text-sage-400 text-xs">Harvest Date</p>
                    <p className="text-sage-900 font-medium">{formatDate(selectedSubmission.harvestDate)}</p>
                  </div>
                )}
                {(selectedSubmission.harvestYear || selectedSubmission.harvestMonth) && (
                  <div>
                    <p className="text-sage-400 text-xs">Harvest Period</p>
                    <p className="text-sage-900 font-medium">
                      {[selectedSubmission.harvestMonth, selectedSubmission.harvestYear].filter(Boolean).join(" ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Packaging & Bags */}
              {(selectedSubmission.numberOfBags || selectedSubmission.packagingType) && (
                <div className="grid grid-cols-3 gap-3 bg-sage-50 rounded-xl p-4 text-sm">
                  {selectedSubmission.numberOfBags != null && (
                    <div>
                      <p className="text-sage-400 text-xs">Number of Bags</p>
                      <p className="text-sage-900 font-medium">{selectedSubmission.numberOfBags}</p>
                    </div>
                  )}
                  {selectedSubmission.bagWeight != null && (
                    <div>
                      <p className="text-sage-400 text-xs">Bag Weight</p>
                      <p className="text-sage-900 font-medium">{selectedSubmission.bagWeight} kg</p>
                    </div>
                  )}
                  {selectedSubmission.packagingType && (
                    <div>
                      <p className="text-sage-400 text-xs">Packaging Type</p>
                      <p className="text-sage-900 font-medium">{selectedSubmission.packagingType}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Product Specifications */}
              {(selectedSubmission.moistureRange || selectedSubmission.colourAroma || selectedSubmission.tailCut) && (
                <div>
                  <p className="text-xs text-sage-400 mb-1 font-medium uppercase tracking-wider">Product Specifications</p>
                  <div className="grid grid-cols-3 gap-3 bg-sage-50 rounded-xl p-4 text-sm">
                    {selectedSubmission.moistureRange && (
                      <div>
                        <p className="text-sage-400 text-xs">Moisture</p>
                        <p className="text-sage-900 font-medium">{selectedSubmission.moistureRange}</p>
                      </div>
                    )}
                    {selectedSubmission.colourAroma && (
                      <div>
                        <p className="text-sage-400 text-xs">Colour / Aroma</p>
                        <p className="text-sage-900 font-medium">{selectedSubmission.colourAroma}</p>
                      </div>
                    )}
                    {selectedSubmission.tailCut && (
                      <div>
                        <p className="text-sage-400 text-xs">Tail Cut</p>
                        <p className="text-sage-900 font-medium">{selectedSubmission.tailCut}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Origin */}
              {selectedSubmission.origin && (
                <div>
                  <p className="text-xs text-sage-400 mb-1">Origin</p>
                  <div className="bg-sage-50 rounded-xl p-3 text-sm">
                    <p className="text-sage-700">
                      {(selectedSubmission.origin as Origin).country && <span className="text-xs text-sage-400 font-mono">{(selectedSubmission.origin as Origin).country}</span>}{" "}
                      {originStr(selectedSubmission.origin as Origin)}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedSubmission.description && (
                <div>
                  <p className="text-xs text-sage-400 mb-1">Description</p>
                  <p className="text-sm text-sage-700 bg-sage-50 rounded-xl p-3">{selectedSubmission.description}</p>
                </div>
              )}

              {/* Seller Declaration */}
              {selectedSubmission.sellerDeclaration && (
                <div>
                  <p className="text-xs text-sage-400 mb-1">Seller Declaration</p>
                  <p className="text-sm text-sage-700 bg-sage-50 rounded-xl p-3 italic">{selectedSubmission.sellerDeclaration}</p>
                </div>
              )}

              {/* Compliance Documents */}
              {(selectedSubmission.labReportUrl || selectedSubmission.phytosanitaryUrl || selectedSubmission.originCertUrl) && (
                <div>
                  <p className="text-xs text-sage-400 mb-2 font-medium uppercase tracking-wider">Compliance Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.labReportUrl && (
                      <a href={selectedSubmission.labReportUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition">
                        <FileText className="w-3.5 h-3.5" /> Lab Report
                      </a>
                    )}
                    {selectedSubmission.phytosanitaryUrl && (
                      <a href={selectedSubmission.phytosanitaryUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition">
                        <FileText className="w-3.5 h-3.5" /> Phytosanitary Cert
                      </a>
                    )}
                    {selectedSubmission.originCertUrl && (
                      <a href={selectedSubmission.originCertUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition">
                        <FileText className="w-3.5 h-3.5" /> Origin Certificate
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Images */}
              {selectedSubmission.images.length > 0 && (
                <div>
                  <p className="text-xs text-sage-400 mb-2">Images ({selectedSubmission.images.length})</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedSubmission.images.map((key, i) => {
                      const url = selectedSubmission.imageUrls?.[i] ?? key;
                      return (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <Image
                            src={url}
                            alt={`Submission image ${i + 1}`}
                            width={80}
                            height={80}
                            unoptimized
                            className="w-20 h-20 rounded-xl object-cover border border-sage-100 hover:opacity-80 transition"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Videos */}
              {selectedSubmission.videos && selectedSubmission.videos.length > 0 && (
                <div>
                  <p className="text-xs text-sage-400 mb-2">Videos ({selectedSubmission.videos.length})</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedSubmission.videos.map((key, i) => {
                      const url = selectedSubmission.videoUrls?.[i] ?? key;
                      return (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs bg-sage-50 text-sage-700 px-3 py-2 rounded-lg border border-sage-200 hover:bg-sage-100 transition">
                          <Video className="w-3.5 h-3.5" /> Video {i + 1}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Existing admin remarks */}
              {selectedSubmission.adminRemarks && (
                <div>
                  <p className="text-xs text-sage-400 mb-1">Admin Remarks</p>
                  <p className="text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{selectedSubmission.adminRemarks}</p>
                </div>
              )}

              {/* Action buttons inside modal */}
              {["SUBMITTED", "UNDER_REVIEW"].includes(selectedSubmission.status) && (
                <div className="border-t border-sage-100 pt-4 flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 bg-green-700 hover:bg-green-800 text-white rounded-xl"
                    disabled={actionLoading === selectedSubmission.id}
                    onClick={() => handleAction(selectedSubmission.id, "approve")}
                  >
                    {actionLoading === selectedSubmission.id ? "Processing…" : <><CheckCircle2 className="w-3.5 h-3.5" /> Approve Submission</>}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                    onClick={() => {
                      setRejectDialogId(selectedSubmission.id);
                      setSelectedSubmission(null);
                      setRemarks("");
                    }}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Submission
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialogId} onOpenChange={() => setRejectDialogId(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-700">Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-sage-600">
              Please provide a reason so the farmer knows what to fix before resubmitting.
            </p>
            <div className="space-y-1.5">
              <Label className="text-sage-700">Rejection Reason (optional but recommended)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g., Insufficient documentation, moisture level too high, images unclear…"
                className="rounded-xl border-sage-200 min-h-25"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setRejectDialogId(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                disabled={!!actionLoading}
                onClick={() => {
                  if (rejectDialogId) {
                    handleAction(rejectDialogId, "reject", remarks.trim() || undefined);
                  }
                }}
              >
                {actionLoading ? "Rejecting…" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-sage-300 text-center">
        Total {total} submission{total !== 1 ? "s" : ""} in system
      </p>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-700">Delete Submission Permanently</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sage-700 text-sm">
                You are about to permanently delete the{" "}
                <strong className="text-sage-900">
                  {COMMODITY_LABELS[deleteTarget.commodityType] || deleteTarget.commodityType}
                </strong>{" "}
                submission by{" "}
                <strong className="text-sage-900">{deleteTarget.farmer?.name}</strong>.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                <p className="font-semibold">This action cannot be undone.</p>
                <p className="mt-1">All submission data, documents, and images will be permanently removed.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  variant="destructive"
                  className="flex-1 rounded-full"
                  disabled={deleting}
                  onClick={deleteSubmission}
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
