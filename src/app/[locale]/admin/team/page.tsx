"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  UserPlus, Shield, ShieldCheck, Eye, BarChart3, Settings,
  Mail, Clock, CheckCircle2, XCircle, RotateCcw, Trash2,
  ChevronDown, AlertTriangle, Users, Send, Loader2, Ban,
} from "lucide-react";

// ─── TYPES ──────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string;
  adminRole: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  name: string;
  adminRole: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
  invitedByUser: { name: string; email: string };
}

// ─── CONSTANTS ──────────────────────────────

const ADMIN_ROLES = [
  {
    value: "COMPLIANCE_ADMIN",
    label: "Compliance Admin",
    desc: "KYC approvals, user management, audit access",
    Icon: ShieldCheck,
    color: "text-emerald-700 bg-emerald-50",
  },
  {
    value: "OPS_ADMIN",
    label: "Operations Admin",
    desc: "Lot management, RFQ routing, escrow, warehouses",
    Icon: Settings,
    color: "text-blue-700 bg-blue-50",
  },
  {
    value: "DATA_AUDIT_ADMIN",
    label: "Data & Audit Admin",
    desc: "Read-only analytics, audit logs, transaction history",
    Icon: BarChart3,
    color: "text-violet-700 bg-violet-50",
  },
  {
    value: "READ_ONLY_ADMIN",
    label: "Read-Only Admin",
    desc: "View-only access across all admin sections",
    Icon: Eye,
    color: "text-amber-700 bg-amber-50",
  },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPLIANCE_ADMIN: "Compliance Admin",
  OPS_ADMIN: "Operations Admin",
  DATA_AUDIT_ADMIN: "Data & Audit Admin",
  READ_ONLY_ADMIN: "Read-Only Admin",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; Icon: typeof CheckCircle2 }> = {
  PENDING: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", Icon: Clock },
  ACCEPTED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", Icon: CheckCircle2 },
  EXPIRED: { bg: "bg-gray-50 border-gray-200", text: "text-gray-500", Icon: XCircle },
  REVOKED: { bg: "bg-red-50 border-red-200", text: "text-red-600", Icon: Ban },
};

// ─── COMPONENT ──────────────────────────────

export default function AdminTeamPage() {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"admins" | "invitations" | "invite">("admins");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form state
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("");
  const [sending, setSending] = useState(false);

  // Edit modal state
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  // Confirm delete state
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isSuperAdmin = user?.adminRole === "SUPER_ADMIN";

  const fetchAdmins = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/admin/manage-admins", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    }
  }, [accessToken]);

  const fetchInvitations = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/admin/invitations", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !isSuperAdmin) return;
    setLoading(true);
    Promise.all([fetchAdmins(), fetchInvitations()]).finally(() => setLoading(false));
  }, [accessToken, isSuperAdmin, fetchAdmins, fetchInvitations]);

  // ─── SEND INVITE ────────────────────────────

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invEmail || !invName || !invRole) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: invEmail, name: invName, adminRole: invRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Invitation sent to ${invEmail}`);
        setInvName("");
        setInvEmail("");
        setInvRole("");
        setActiveTab("invitations");
        fetchInvitations();
      } else {
        toast.error(data.error || "Failed to send invitation");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ─── REVOKE INVITE ──────────────────────────

  const handleRevoke = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/admin/invitations/${inviteId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        toast.success("Invitation revoked");
        fetchInvitations();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to revoke");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // ─── DELETE INVITE ──────────────────────────

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/admin/invitations/${inviteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        toast.success("Invitation removed");
        fetchInvitations();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // ─── UPDATE ADMIN ROLE ──────────────────────

  const handleUpdateRole = async () => {
    if (!editAdmin || !editRole) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/manage-admins", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId: editAdmin.id, adminRole: editRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Role updated for ${editAdmin.name}`);
        setEditAdmin(null);
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to update role");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  // ─── TOGGLE ACTIVE ─────────────────────────

  const handleToggleActive = async (admin: AdminUser) => {
    try {
      const res = await fetch("/api/admin/manage-admins", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId: admin.id, isActive: !admin.isActive }),
      });
      if (res.ok) {
        toast.success(`${admin.name} ${admin.isActive ? "deactivated" : "activated"}`);
        fetchAdmins();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // ─── REMOVE ADMIN ──────────────────────────

  const handleRemoveAdmin = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/manage-admins?adminId=${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        toast.success(`${deleteTarget.name} removed from admin team`);
        setDeleteTarget(null);
        fetchAdmins();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove admin");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  // ─── ACCESS CHECK ──────────────────────────

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-sage-300 mx-auto mb-3" />
          <h2 className="font-heading text-sage-900 text-xl font-bold mb-1">Super Admin Only</h2>
          <p className="text-sage-500 text-sm">Only Super Admins can manage the admin team.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-sage-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">Admin Team</h1>
        <p className="text-sage-500 text-sm mt-1">
          Manage admin users and send invitations for new admins.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-sage-100 p-4">
          <div className="text-sage-500 text-xs font-medium mb-1">Total Admins</div>
          <div className="font-heading text-sage-900 text-2xl font-bold">{admins.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-sage-100 p-4">
          <div className="text-sage-500 text-xs font-medium mb-1">Active</div>
          <div className="font-heading text-emerald-700 text-2xl font-bold">
            {admins.filter((a) => a.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-sage-100 p-4">
          <div className="text-sage-500 text-xs font-medium mb-1">Pending Invites</div>
          <div className="font-heading text-amber-600 text-2xl font-bold">
            {invitations.filter((i) => i.status === "PENDING").length}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-sage-100 p-4">
          <div className="text-sage-500 text-xs font-medium mb-1">Deactivated</div>
          <div className="font-heading text-gray-400 text-2xl font-bold">
            {admins.filter((a) => !a.isActive).length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-sage-100 p-1">
        {[
          { key: "admins" as const, label: "Admin Users", Icon: Users },
          { key: "invitations" as const, label: "Invitations", Icon: Mail },
          { key: "invite" as const, label: "Invite New", Icon: UserPlus },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-sage-700 text-white shadow-sm"
                : "text-sage-500 hover:text-sage-700 hover:bg-sage-50"
            }`}
          >
            <tab.Icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab: Admin Users ─────────────────────── */}
      {activeTab === "admins" && (
        <div className="space-y-3">
          {admins.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sage-100 p-12 text-center">
              <Users className="w-10 h-10 text-sage-300 mx-auto mb-3" />
              <p className="text-sage-500 text-sm">No admin users found.</p>
            </div>
          ) : (
            admins.map((admin) => {
              const isSelf = admin.id === user?.id;
              const isSuperAdminUser = admin.adminRole === "SUPER_ADMIN";
              return (
                <div
                  key={admin.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all ${
                    !admin.isActive ? "border-gray-200 opacity-60" : "border-sage-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSuperAdminUser
                            ? "bg-sage-900 text-white"
                            : "bg-sage-100 text-sage-600"
                        }`}
                      >
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading text-sage-900 font-semibold text-sm truncate">
                            {admin.name}
                          </h3>
                          {isSelf && (
                            <span className="text-[10px] bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full font-medium">
                              You
                            </span>
                          )}
                          {!admin.isActive && (
                            <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sage-500 text-xs truncate">{admin.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                              isSuperAdminUser
                                ? "bg-sage-900 text-white"
                                : "bg-sage-50 text-sage-700 border border-sage-200"
                            }`}
                          >
                            {ROLE_LABELS[admin.adminRole || ""] || admin.adminRole}
                          </span>
                          <span className="text-sage-400 text-[11px]">
                            Joined {new Date(admin.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isSelf && !isSuperAdminUser && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditAdmin(admin);
                            setEditRole(admin.adminRole || "");
                          }}
                          className="text-xs text-sage-500 hover:text-sage-700 px-2.5 py-1.5 rounded-lg hover:bg-sage-50 transition-colors"
                        >
                          Edit Role
                        </button>
                        <button
                          onClick={() => handleToggleActive(admin)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                            admin.isActive
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {admin.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(admin)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── Tab: Invitations ─────────────────────── */}
      {activeTab === "invitations" && (
        <div className="space-y-3">
          {invitations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sage-100 p-12 text-center">
              <Mail className="w-10 h-10 text-sage-300 mx-auto mb-3" />
              <p className="text-sage-500 text-sm">No invitations sent yet.</p>
              <button
                onClick={() => setActiveTab("invite")}
                className="mt-3 text-sm text-sage-700 font-medium hover:underline"
              >
                Send your first invitation
              </button>
            </div>
          ) : (
            invitations.map((inv) => {
              const style = STATUS_STYLES[inv.status] || STATUS_STYLES.PENDING;
              const isExpired = inv.status === "PENDING" && new Date(inv.expiresAt) < new Date();
              const displayStatus = isExpired ? "EXPIRED" : inv.status;
              const displayStyle = STATUS_STYLES[displayStatus];
              return (
                <div
                  key={inv.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 ${
                    displayStatus === "EXPIRED" || displayStatus === "REVOKED" ? "opacity-60" : ""
                  } border-sage-100`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading text-sage-900 font-semibold text-sm">
                          {inv.name}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 ${displayStyle.bg} ${displayStyle.text}`}
                        >
                          <displayStyle.Icon className="w-3 h-3" />
                          {displayStatus}
                        </span>
                      </div>
                      <p className="text-sage-500 text-xs mt-0.5">{inv.email}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-sage-400">
                        <span className="bg-sage-50 text-sage-600 px-2 py-0.5 rounded-full">
                          {ROLE_LABELS[inv.adminRole] || inv.adminRole}
                        </span>
                        <span>Sent {new Date(inv.createdAt).toLocaleDateString()}</span>
                        {displayStatus === "PENDING" && (
                          <span className="text-amber-600">
                            Expires {new Date(inv.expiresAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {inv.status === "PENDING" && !isExpired && (
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          className="text-xs text-amber-600 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                      {(inv.status !== "ACCEPTED") && (
                        <button
                          onClick={() => handleDeleteInvite(inv.id)}
                          className="text-xs text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── Tab: Invite New Admin ────────────────── */}
      {activeTab === "invite" && (
        <div className="bg-white rounded-3xl border border-sage-100 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="font-heading text-sage-900 text-lg font-bold">Invite New Admin</h2>
            <p className="text-sage-500 text-sm mt-1">
              Send an invitation email. The link will be valid for 30 minutes.
            </p>
          </div>

          <form onSubmit={handleSendInvite} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sage-700 text-sm font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={invName}
                onChange={(e) => setInvName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full h-11 px-4 rounded-xl border border-sage-200 bg-linen text-sage-900 text-sm placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400 transition-all"
                required
                maxLength={100}
                minLength={2}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sage-700 text-sm font-medium mb-1.5">Email Address</label>
              <input
                type="email"
                value={invEmail}
                onChange={(e) => setInvEmail(e.target.value)}
                placeholder="e.g. priya@company.com"
                className="w-full h-11 px-4 rounded-xl border border-sage-200 bg-linen text-sage-900 text-sm placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400 transition-all"
                required
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sage-700 text-sm font-medium mb-2">Admin Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ADMIN_ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setInvRole(role.value)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${
                      invRole === role.value
                        ? "border-sage-700 bg-sage-50 shadow-sm"
                        : "border-sage-100 hover:border-sage-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${role.color}`}>
                        <role.Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sage-900 text-sm font-semibold">{role.label}</span>
                    </div>
                    <p className="text-sage-500 text-xs leading-relaxed">{role.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 leading-relaxed">
                <strong>Security Notice:</strong> The invitation link expires in 30 minutes. The invited admin
                will need to set a strong password (min 8 chars, uppercase, lowercase, number, special character).
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={sending || !invName || !invEmail || !invRole}
              className="w-full h-12 bg-sage-700 hover:bg-sage-800 disabled:bg-sage-300 text-white rounded-full font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ─── Edit Role Modal ──────────────────────── */}
      {editAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditAdmin(null)} />
          <div className="relative bg-white rounded-3xl border border-sage-100 shadow-2xl max-w-md w-full p-6">
            <h3 className="font-heading text-sage-900 text-lg font-bold mb-1">Change Admin Role</h3>
            <p className="text-sage-500 text-sm mb-5">
              Update the role for <strong>{editAdmin.name}</strong>
            </p>

            <div className="space-y-2 mb-6">
              {ADMIN_ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setEditRole(role.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    editRole === role.value
                      ? "border-sage-700 bg-sage-50"
                      : "border-sage-100 hover:border-sage-200"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role.color}`}>
                    <role.Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sage-900 text-sm font-semibold">{role.label}</span>
                    <p className="text-sage-500 text-xs">{role.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditAdmin(null)}
                className="flex-1 h-10 rounded-full border border-sage-200 text-sage-700 text-sm font-medium hover:bg-sage-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={saving || editRole === editAdmin.adminRole}
                className="flex-1 h-10 rounded-full bg-sage-700 text-white text-sm font-medium hover:bg-sage-800 disabled:bg-sage-300 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-3xl border border-sage-100 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-heading text-sage-900 text-lg font-bold mb-1">Remove Admin</h3>
            <p className="text-sage-500 text-sm mb-5">
              Are you sure you want to remove <strong>{deleteTarget.name}</strong> from the admin team?
              They will be demoted to a regular user.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 rounded-full border border-sage-200 text-sage-700 text-sm font-medium hover:bg-sage-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveAdmin}
                disabled={deleting}
                className="flex-1 h-10 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:bg-red-300 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
