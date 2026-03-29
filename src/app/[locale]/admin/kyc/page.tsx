"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface KycDoc {
  id: string;
  docType: string;
  docUrl: string;
  viewUrl: string;
  remarks: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

interface KycUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  country: string;
  kycStatus: string;
  createdAt: string;
  kycDocuments: KycDoc[];
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  UNDER_REVIEW: { label: "Under Review", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export default function AdminKycPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("UNDER_REVIEW");
  const [selectedUser, setSelectedUser] = useState<KycUser | null>(null);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const fetchKyc = useCallback(async (page = 1) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc?status=${statusFilter}&page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to load KYC submissions");
      }
    } catch {
      toast.error("Network error loading KYC data");
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => {
    fetchKyc(1);
  }, [fetchKyc]);

  const handleReview = async (userId: string, action: "APPROVED" | "REJECTED") => {
    if (!accessToken) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action, remarks: remarks || undefined }),
      });
      if (res.ok) {
        toast.success(`KYC ${action === "APPROVED" ? "approved" : "rejected"} successfully`);
        setSelectedUser(null);
        setRemarks("");
        fetchKyc(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update KYC status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-sage-900 text-2xl font-bold">KYC Approvals</h1>
          <p className="text-sage-500 text-sm mt-1">Review and approve user verification documents.</p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
          <SelectTrigger className="w-48 rounded-xl border-sage-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="ALL">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="pt-6 text-center py-12">
            <p className="text-sage-400 text-sm">No KYC submissions found for this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const badge = STATUS_BADGE[u.kycStatus] || STATUS_BADGE.PENDING;
            return (
              <Card key={u.id} className="rounded-2xl border-sage-100 hover:shadow-sm transition-shadow">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 font-medium text-sm shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sage-900 text-sm">{u.name}</span>
                          <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                        </div>
                        <p className="text-sage-500 text-xs mt-0.5">
                          {u.email} • {u.role} • {u.country} • {u.kycDocuments.length} doc(s)
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs"
                      onClick={() => { setSelectedUser(u); setRemarks(""); }}
                    >
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs"
                disabled={pagination.page <= 1}
                onClick={() => fetchKyc(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sage-500 text-xs">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchKyc(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              Review KYC — {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-sage-500 text-xs">Email</span>
                  <p className="text-sage-900">{selectedUser.email}</p>
                </div>
                <div>
                  <span className="text-sage-500 text-xs">Role</span>
                  <p className="text-sage-900">{selectedUser.role}</p>
                </div>
                <div>
                  <span className="text-sage-500 text-xs">Country</span>
                  <p className="text-sage-900">{selectedUser.country}</p>
                </div>
                <div>
                  <span className="text-sage-500 text-xs">Joined</span>
                  <p className="text-sage-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sage-700 text-xs font-semibold uppercase tracking-wider mb-2">Documents</h4>
                <div className="space-y-2">
                  {selectedUser.kycDocuments.length === 0 ? (
                    <p className="text-sage-400 text-xs">No documents uploaded yet.</p>
                  ) : (
                    selectedUser.kycDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-sage-50 rounded-xl">
                        <div>
                          <span className="text-sage-900 text-sm font-medium capitalize">
                            {doc.docType.replace(/_/g, " ")}
                          </span>
                          <p className="text-sage-500 text-xs">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={doc.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sage-700 text-xs font-medium hover:underline"
                        >
                          View Document ↗
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="text-sage-700 text-xs font-semibold uppercase tracking-wider">
                  Remarks (optional)
                </label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add notes about this review..."
                  className="mt-1 rounded-xl border-sage-200 text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleReview(selectedUser.id, "APPROVED")}
                  disabled={processing}
                  className="flex-1 bg-sage-700 hover:bg-sage-800 text-white rounded-full"
                >
                  {processing ? "Processing..." : "Approve KYC"}
                </Button>
                <Button
                  onClick={() => handleReview(selectedUser.id, "REJECTED")}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1 rounded-full"
                >
                  {processing ? "Processing..." : "Reject KYC"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
