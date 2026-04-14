"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  country: string;
  preferredCurrency?: string;
  preferredLang?: string;
  kycStatus: string;
  emailVerified?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count: { kycDocuments: number };
  kycDocuments?: {
    id: string;
    docType: string;
    docUrl: string;
    remarks: string | null;
    verifiedAt: string | null;
    createdAt: string;
  }[];
}

const KYC_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  UNDER_REVIEW: { label: "Review", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-terracotta/10 text-terracotta",
  FARMER: "bg-sage-100 text-sage-700",
  BUYER: "bg-blue-50 text-blue-700",
  SELLER: "bg-amber-50 text-amber-700",
};

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India", NP: "Nepal", BT: "Bhutan", AE: "UAE", SA: "Saudi Arabia", OM: "Oman",
};

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [kycFilter, setKycFilter] = useState("ALL");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    if (!accessToken) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    if (kycFilter !== "ALL") params.set("kycStatus", kycFilter);
    if (countryFilter !== "ALL") params.set("country", countryFilter);

    try {
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to load users");
      }
    } catch {
      toast.error("Network error loading users");
    } finally {
      setLoading(false);
    }
  }, [accessToken, search, roleFilter, kycFilter, countryFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  const toggleActive = async (userId: string, currentActive: boolean) => {
    if (!accessToken) return;
    setToggling(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        toast.success(`User ${!currentActive ? "activated" : "deactivated"}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u))
        );
        if (selectedUser?.id === userId) {
          setSelectedUser((prev) => prev ? { ...prev, isActive: !currentActive } : null);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update user");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setToggling(null);
    }
  };

  const openUserDetail = async (user: UserRow) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data.user);
      }
    } catch {
      // Use the basic data we already have
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!accessToken || !deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete user");
        return;
      }
      toast.success(`User "${deleteTarget.name}" permanently deleted`);
      setDeleteTarget(null);
      setSelectedUser(null);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">Users & KYC</h1>
        <p className="text-sage-500 text-sm mt-1">Manage all platform users and their verification status.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] max-w-xs rounded-xl border-sage-200 text-sm"
        />
        <Select value={roleFilter} onValueChange={(v) => { if (v) setRoleFilter(v); }}>
          <SelectTrigger className="w-36 sm:w-40 rounded-xl border-sage-200 text-sm">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="FARMER">Farmer</SelectItem>
            <SelectItem value="BUYER">Buyer</SelectItem>
            <SelectItem value="AGGREGATOR">Aggregator</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={kycFilter} onValueChange={(v) => { if (v) setKycFilter(v); }}>
          <SelectTrigger className="w-36 sm:w-40 rounded-xl border-sage-200 text-sm">
            <SelectValue placeholder="KYC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All KYC</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={(v) => { if (v) setCountryFilter(v); }}>
          <SelectTrigger className="w-36 sm:w-40 rounded-xl border-sage-200 text-sm">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Countries</SelectItem>
            <SelectItem value="IN">India</SelectItem>
            <SelectItem value="NP">Nepal</SelectItem>
            <SelectItem value="BT">Bhutan</SelectItem>
            <SelectItem value="AE">UAE</SelectItem>
            <SelectItem value="SA">Saudi Arabia</SelectItem>
            <SelectItem value="OM">Oman</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-sage-500">
        <span>Total: <strong className="text-sage-900">{pagination.total}</strong></span>
        {!loading && <span>Showing: <strong className="text-sage-900">{users.length}</strong></span>}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="pt-6 text-center py-12">
            <p className="text-sage-400 text-sm">No users match the current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-sage-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sage-100 bg-sage-50/50">
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Country</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">KYC</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Docs</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Joined</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const kyc = KYC_BADGE[u.kycStatus] || KYC_BADGE.PENDING;
                  const roleCls = ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700";
                  return (
                    <tr key={u.id} className="border-b border-sage-50 hover:bg-sage-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => openUserDetail(u)}
                          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 font-medium text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sage-900 font-medium">{u.name}</p>
                            <p className="text-sage-400 text-xs">{u.email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleCls}`}>
                          {u.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sage-700">{COUNTRY_NAMES[u.country] || u.country}</td>
                      <td className="py-3 px-4">
                        <Badge variant={kyc.variant} className="text-[10px]">{kyc.label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sage-700">{u._count.kycDocuments}</td>
                      <td className="py-3 px-4 text-sage-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.isActive ? "text-green-600" : "text-gray-400"}`}>
                          <span className={`w-2 h-2 rounded-full ${u.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs h-7 px-3"
                            onClick={() => openUserDetail(u)}
                          >
                            Quick
                          </Button>
                          <Link href={`/admin/users/${u.id}`}>
                            <Button size="sm" variant="outline" className="rounded-full text-xs h-7 px-3">
                              Profile
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant={u.isActive ? "destructive" : "default"}
                            className="rounded-full text-xs h-7 px-3"
                            disabled={toggling === u.id}
                            onClick={() => toggleActive(u.id, u.isActive)}
                          >
                            {toggling === u.id ? "..." : u.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs h-7 px-3 border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteTarget(u)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs"
            disabled={pagination.page <= 1}
            onClick={() => fetchUsers(pagination.page - 1)}
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
            onClick={() => fetchUsers(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <DialogContent className="max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-5">
              {/* User header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 font-heading font-bold text-xl shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-sage-900 font-heading font-bold text-lg">{selectedUser.name}</h3>
                  <p className="text-sage-500 text-sm">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${selectedUser.isActive ? "text-green-600" : "text-red-500"}`}>
                      <span className={`w-2 h-2 rounded-full ${selectedUser.isActive ? "bg-green-500" : "bg-red-400"}`} />
                      {selectedUser.isActive ? "Active" : "Deactivated"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-500 text-xs font-medium uppercase tracking-wider">Role</span>
                  <p className="text-sage-900 font-medium mt-0.5">{selectedUser.role.replace(/_/g, " ")}</p>
                </div>
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-500 text-xs font-medium uppercase tracking-wider">Country</span>
                  <p className="text-sage-900 font-medium mt-0.5">{COUNTRY_NAMES[selectedUser.country] || selectedUser.country}</p>
                </div>
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-500 text-xs font-medium uppercase tracking-wider">Phone</span>
                  <p className="text-sage-900 font-medium mt-0.5">{selectedUser.phone || "Not set"}</p>
                </div>
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-500 text-xs font-medium uppercase tracking-wider">KYC Status</span>
                  <p className="mt-0.5">
                    <Badge variant={KYC_BADGE[selectedUser.kycStatus]?.variant || "secondary"} className="text-[10px]">
                      {KYC_BADGE[selectedUser.kycStatus]?.label || selectedUser.kycStatus}
                    </Badge>
                  </p>
                </div>
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-500 text-xs font-medium uppercase tracking-wider">Email Verified</span>
                  <p className="text-sage-900 font-medium mt-0.5">
                    {selectedUser.emailVerified ? "Yes" : "No"}
                  </p>
                </div>
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-500 text-xs font-medium uppercase tracking-wider">Joined</span>
                  <p className="text-sage-900 font-medium mt-0.5">
                    {new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* KYC Documents section */}
              {detailLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-sage-100 rounded animate-pulse" />
                  <div className="h-12 bg-sage-50 rounded-xl animate-pulse" />
                </div>
              ) : selectedUser.kycDocuments && selectedUser.kycDocuments.length > 0 ? (
                <div>
                  <h4 className="text-sage-700 text-xs font-semibold uppercase tracking-wider mb-2">
                    KYC Documents ({selectedUser.kycDocuments.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedUser.kycDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-sage-50 rounded-xl">
                        <div>
                          <span className="text-sage-900 text-sm font-medium capitalize">
                            {doc.docType.replace(/_/g, " ")}
                          </span>
                          <p className="text-sage-500 text-xs">
                            Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                            {doc.remarks && ` • ${doc.remarks}`}
                          </p>
                        </div>
                        <span className="text-sage-400 text-xs">
                          {doc.verifiedAt ? "Verified" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sage-700 text-xs font-semibold uppercase tracking-wider mb-2">
                    KYC Documents
                  </h4>
                  <p className="text-sage-400 text-xs">No documents uploaded yet.</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => toggleActive(selectedUser.id, selectedUser.isActive)}
                  disabled={toggling === selectedUser.id}
                  variant={selectedUser.isActive ? "destructive" : "default"}
                  className="flex-1 rounded-full"
                >
                  {toggling === selectedUser.id
                    ? "Processing..."
                    : selectedUser.isActive
                    ? "Deactivate User"
                    : "Activate User"}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => { setDeleteTarget(selectedUser); setSelectedUser(null); }}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-700">Delete User Permanently</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sage-700 text-sm">
                You are about to permanently delete{" "}
                <strong className="text-sage-900">{deleteTarget.name}</strong> ({deleteTarget.email}).
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
                <p className="font-semibold">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li>All lots, bids, and submissions by this user</li>
                  <li>All RFQs, responses, and negotiations</li>
                  <li>Tokens and token transfers</li>
                  <li>KYC documents and profile data</li>
                  <li>All notifications and activity history</li>
                </ul>
                <p className="mt-2 font-semibold">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  variant="destructive"
                  className="flex-1 rounded-full"
                  disabled={deleting}
                  onClick={deleteUser}
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
