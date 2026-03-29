"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// ─── Types ─────────────────────────────────────────────────────────

interface WarehouseStaff {
  id: string;
  staffRole: string;
  assignedAt: string;
  user: { id: string; name: string; email: string; role: string; country: string };
}

interface WarehouseInvitation {
  id: string;
  email: string;
  staffRole: string;
  expiresAt: string;
  acceptedAt: string | null;
  invitedBy: string;
  createdAt: string;
}

interface Warehouse {
  id: string;
  name: string;
  country: string;
  state: string | null;
  district: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  maxCapacity: number | null;
  isActive: boolean;
  createdAt: string;
  _count: { lots: number; staff: number; invitations: number };
}

interface Stats {
  total: number;
  active: number;
  totalStaff: number;
  totalLots: number;
}

const COUNTRY_LABELS: Record<string, string> = {
  IN: "🇮🇳 India", NP: "🇳🇵 Nepal", BT: "🇧🇹 Bhutan",
  AE: "🇦🇪 UAE", SA: "🇸🇦 Saudi Arabia", OM: "🇴🇲 Oman",
};
const COUNTRIES = ["IN", "NP", "BT", "AE", "SA", "OM"];

// ─── Empty form states ─────────────────────────────────────────────

const emptyWarehouseForm = {
  name: "", country: "", state: "", district: "", address: "",
  phone: "", email: "", lat: "", lng: "", maxCapacity: "",
};

// ─── Main Page ─────────────────────────────────────────────────────

export default function AdminWarehousesPage() {
  const { accessToken } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, totalStaff: 0, totalLots: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [staffWarehouse, setStaffWarehouse] = useState<Warehouse | null>(null);

  // Staff dialog state
  const [staffList, setStaffList] = useState<WarehouseStaff[]>([]);
  const [invitations, setInvitations] = useState<WarehouseInvitation[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("STAFF");
  const [inviting, setInviting] = useState(false);

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }),
    [accessToken]
  );

  // ─── Fetch warehouses ────────────────────────────────────────────

  const fetchWarehouses = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/warehouses", { headers: headers() });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setWarehouses(data.warehouses);
      setStats(data.stats);
    } catch {
      toast.error("Failed to load warehouses");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, headers]);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  // ─── Fetch staff for dialog ──────────────────────────────────────

  const openStaffDialog = useCallback(async (warehouse: Warehouse) => {
    setStaffWarehouse(warehouse);
    setStaffLoading(true);
    try {
      const res = await fetch(`/api/admin/warehouses/${warehouse.id}/staff`, { headers: headers() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStaffList(data.staff);
      setInvitations(data.invitations);
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setStaffLoading(false);
    }
  }, [headers]);

  // ─── Send invitation ─────────────────────────────────────────────

  const sendInvitation = async () => {
    if (!staffWarehouse || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/admin/warehouses/${staffWarehouse.id}/staff`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ email: inviteEmail.trim(), staffRole: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to send invitation"); return; }
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      // Refresh staff list
      await openStaffDialog(staffWarehouse);
      // Update count
      fetchWarehouses();
    } finally {
      setInviting(false);
    }
  };

  // ─── Remove staff member ─────────────────────────────────────────

  const removeStaff = async (staffId: string, staffName: string) => {
    if (!staffWarehouse) return;
    if (!confirm(`Remove ${staffName} from this warehouse?`)) return;
    try {
      const res = await fetch(`/api/admin/warehouses/${staffWarehouse.id}/staff/${staffId}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) { toast.error("Failed to remove staff"); return; }
      toast.success(`${staffName} removed from warehouse`);
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      fetchWarehouses();
    } catch {
      toast.error("Failed to remove staff");
    }
  };

  // ─── Cancel invitation ───────────────────────────────────────────

  const cancelInvitation = async (invitationId: string, email: string) => {
    if (!staffWarehouse) return;
    if (!confirm(`Cancel invitation for ${email}?`)) return;
    try {
      const res = await fetch(
        `/api/admin/warehouses/${staffWarehouse.id}/invitations/${invitationId}`,
        { method: "DELETE", headers: headers() }
      );
      if (!res.ok) { toast.error("Failed to cancel invitation"); return; }
      toast.success("Invitation cancelled");
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      fetchWarehouses();
    } catch {
      toast.error("Failed to cancel invitation");
    }
  };

  // ─── Toggle active ───────────────────────────────────────────────

  const toggleActive = async (warehouse: Warehouse) => {
    const action = warehouse.isActive ? "deactivate" : "activate";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${warehouse.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/warehouses/${warehouse.id}`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ isActive: !warehouse.isActive }),
      });
      if (!res.ok) { toast.error("Failed to update warehouse"); return; }
      toast.success(`${warehouse.name} ${action}d`);
      fetchWarehouses();
    } catch {
      toast.error("Failed to update warehouse");
    }
  };

  // ─── Loading skeleton ────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-sage-100 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-sage-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-sage-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-sage-900 text-2xl font-bold">Warehouse Management</h1>
          <p className="text-sage-500 text-sm mt-1">
            Add warehouses and invite staff members for each location.
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors"
        >
          <span className="text-base">＋</span> Add Warehouse
        </button>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Warehouses", value: stats.total, icon: "🏪" },
          { label: "Active", value: stats.active, icon: "✅" },
          { label: "Total Staff", value: stats.totalStaff, icon: "👥" },
          { label: "Total Lots", value: stats.totalLots, icon: "📦" },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-sage-100 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="font-heading text-sage-900 font-bold text-xl">{stat.value}</p>
                  <p className="text-sage-500 text-xs">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Warehouse List ─── */}
      {warehouses.length === 0 ? (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">🏪</div>
            <h3 className="font-heading text-sage-900 font-bold text-lg mb-1">No warehouses yet</h3>
            <p className="text-sage-500 text-sm">Add your first warehouse to get started.</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="mt-4 px-5 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800"
            >
              Add Warehouse
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {warehouses.map((wh) => (
            <Card key={wh.id} className="rounded-2xl border-sage-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading text-sage-900 font-bold text-base truncate">{wh.name}</h3>
                      <Badge className={wh.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                        {wh.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sage-500 text-xs mb-1.5 truncate">
                      {[wh.district, wh.state, COUNTRY_LABELS[wh.country] || wh.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="text-sage-400 text-xs truncate max-w-sm">{wh.address}</p>
                    {(wh.phone || wh.email) && (
                      <p className="text-sage-400 text-xs mt-1">
                        {wh.phone && <span className="mr-3">📞 {wh.phone}</span>}
                        {wh.email && <span>✉ {wh.email}</span>}
                      </p>
                    )}
                  </div>

                  {/* Center: stats */}
                  <div className="flex gap-4 shrink-0">
                    <div className="text-center">
                      <p className="font-heading text-sage-900 font-bold text-lg">{wh._count.lots}</p>
                      <p className="text-sage-400 text-xs">Lots</p>
                    </div>
                    <div className="text-center">
                      <p className="font-heading text-sage-900 font-bold text-lg">{wh._count.staff}</p>
                      <p className="text-sage-400 text-xs">Staff</p>
                    </div>
                    {wh.maxCapacity && (
                      <div className="text-center">
                        <p className="font-heading text-sage-900 font-bold text-lg">{wh.maxCapacity}</p>
                        <p className="text-sage-400 text-xs">Capacity</p>
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openStaffDialog(wh)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-sage-50 text-sage-700 hover:bg-sage-100 transition-colors"
                    >
                      👥 Manage Staff
                    </button>
                    <button
                      onClick={() => setEditWarehouse(wh)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-sage-50 text-sage-700 hover:bg-sage-100 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => toggleActive(wh)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        wh.isActive
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {wh.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Create Warehouse Dialog ─── */}
      <WarehouseFormDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => { setShowCreateDialog(false); fetchWarehouses(); }}
        accessToken={accessToken}
        mode="create"
      />

      {/* ─── Edit Warehouse Dialog ─── */}
      {editWarehouse && (
        <WarehouseFormDialog
          open={!!editWarehouse}
          onClose={() => setEditWarehouse(null)}
          onSuccess={() => { setEditWarehouse(null); fetchWarehouses(); }}
          accessToken={accessToken}
          mode="edit"
          warehouse={editWarehouse}
        />
      )}

      {/* ─── Manage Staff Dialog ─── */}
      <Dialog open={!!staffWarehouse} onOpenChange={(open) => { if (!open) setStaffWarehouse(null); }}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900 text-xl">
              👥 Manage Staff — {staffWarehouse?.name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="staff" className="mt-2">
            <TabsList className="bg-sage-50 rounded-2xl p-1">
              <TabsTrigger value="staff" className="rounded-xl text-sm">
                Current Staff ({staffList.length})
              </TabsTrigger>
              <TabsTrigger value="invite" className="rounded-xl text-sm">
                Invite Member
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-xl text-sm">
                Pending ({invitations.filter((i) => !i.acceptedAt && new Date(i.expiresAt) > new Date()).length})
              </TabsTrigger>
            </TabsList>

            {/* ── Current Staff ── */}
            <TabsContent value="staff" className="mt-4">
              {staffLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-sage-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : staffList.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-2">👤</p>
                  <p className="text-sage-500 text-sm">No staff assigned yet.</p>
                  <p className="text-sage-400 text-xs mt-1">Use the Invite tab to add members.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {staffList.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-sage-50 rounded-2xl">
                      <div className="w-9 h-9 rounded-full bg-sage-200 flex items-center justify-center text-sage-700 font-heading font-bold text-sm shrink-0">
                        {s.user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sage-900 text-sm font-medium truncate">{s.user.name}</p>
                        <p className="text-sage-400 text-xs truncate">{s.user.email}</p>
                      </div>
                      <Badge className={s.staffRole === "MANAGER" ? "bg-sage-700 text-white" : "bg-sage-100 text-sage-700"}>
                        {s.staffRole === "MANAGER" ? "Manager" : "Staff"}
                      </Badge>
                      <p className="text-sage-400 text-xs hidden sm:block shrink-0">
                        Since {new Date(s.assignedAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => removeStaff(s.id, s.user.name)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Invite Member ── */}
            <TabsContent value="invite" className="mt-4">
              <div className="space-y-4">
                <div className="bg-sage-50 rounded-2xl p-4 text-sm text-sage-600">
                  <p>
                    Enter an email address to send an invitation. The recipient will receive a secure link
                    valid for <strong>7 days</strong>. If they don't have an account, they can create one.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sage-700 text-sm">Email address</Label>
                    <Input
                      type="email"
                      placeholder="staff@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="mt-1 rounded-xl border-sage-200"
                      onKeyDown={(e) => { if (e.key === "Enter") sendInvitation(); }}
                    />
                  </div>

                  <div>
                    <Label className="text-sage-700 text-sm">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v ?? "STAFF")}>
                      <SelectTrigger className="mt-1 rounded-xl border-sage-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAFF">
                          <div>
                            <p className="font-medium">Warehouse Staff</p>
                            <p className="text-xs text-sage-500">Can record intake, manage inventory</p>
                          </div>
                        </SelectItem>
                        <SelectItem value="MANAGER">
                          <div>
                            <p className="font-medium">Warehouse Manager</p>
                            <p className="text-xs text-sage-500">Full warehouse access + staff oversight</p>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <button
                    onClick={sendInvitation}
                    disabled={inviting || !inviteEmail.trim()}
                    className="w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 disabled:opacity-50 transition-colors"
                  >
                    {inviting ? "Sending..." : "📧 Send Invitation"}
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* ── Pending Invitations ── */}
            <TabsContent value="pending" className="mt-4">
              {invitations.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-2">📬</p>
                  <p className="text-sage-500 text-sm">No invitations sent yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invitations.map((inv) => {
                    const expired = new Date(inv.expiresAt) < new Date();
                    const accepted = !!inv.acceptedAt;
                    return (
                      <div key={inv.id} className={`flex items-center gap-3 p-3 rounded-2xl ${accepted ? "bg-emerald-50" : expired ? "bg-red-50" : "bg-sage-50"}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sage-900 text-sm font-medium truncate">{inv.email}</p>
                          <p className="text-sage-400 text-xs">
                            {accepted
                              ? `✅ Accepted ${new Date(inv.acceptedAt!).toLocaleDateString()}`
                              : expired
                              ? `⏰ Expired ${new Date(inv.expiresAt).toLocaleDateString()}`
                              : `📧 Sent · Expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                          </p>
                        </div>
                        <Badge className={inv.staffRole === "MANAGER" ? "bg-sage-700 text-white" : "bg-sage-100 text-sage-700"}>
                          {inv.staffRole === "MANAGER" ? "Manager" : "Staff"}
                        </Badge>
                        {!accepted && (
                          <button
                            onClick={() => cancelInvitation(inv.id, inv.email)}
                            className="text-red-400 hover:text-red-600 text-xs font-medium shrink-0"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Warehouse Form Dialog (Create / Edit) ─────────────────────────

function WarehouseFormDialog({
  open,
  onClose,
  onSuccess,
  accessToken,
  mode,
  warehouse,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  mode: "create" | "edit";
  warehouse?: Warehouse;
}) {
  const [form, setForm] = useState(() =>
    warehouse
      ? {
          name: warehouse.name,
          country: warehouse.country,
          state: warehouse.state || "",
          district: warehouse.district || "",
          address: warehouse.address,
          phone: warehouse.phone || "",
          email: warehouse.email || "",
          lat: "",
          lng: "",
          maxCapacity: warehouse.maxCapacity ? String(warehouse.maxCapacity) : "",
        }
      : emptyWarehouseForm
  );
  const [isSaving, setIsSaving] = useState(false);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.country || !form.address.trim()) {
      toast.error("Name, country, and address are required");
      return;
    }
    setIsSaving(true);
    try {
      const url = mode === "create" ? "/api/admin/warehouses" : `/api/admin/warehouses/${warehouse!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          country: form.country,
          state: form.state.trim() || null,
          district: form.district.trim() || null,
          address: form.address.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to save warehouse"); return; }
      toast.success(mode === "create" ? "Warehouse created!" : "Warehouse updated!");
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-sage-900 text-xl">
            {mode === "create" ? "🏪 Add Warehouse" : "✏️ Edit Warehouse"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-sage-700 text-sm">Warehouse Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Gangtok Central Warehouse"
              className="mt-1 rounded-xl border-sage-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sage-700 text-sm">Country *</Label>
              <Select value={form.country} onValueChange={(v) => set("country", v ?? "")}>
                <SelectTrigger className="mt-1 rounded-xl border-sage-200">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{COUNTRY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sage-700 text-sm">State / Province</Label>
              <Input
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. Sikkim"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sage-700 text-sm">District</Label>
              <Input
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
                placeholder="e.g. East Sikkim"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
            <div>
              <Label className="text-sage-700 text-sm">Max Capacity (lots)</Label>
              <Input
                type="number"
                min="0"
                value={form.maxCapacity}
                onChange={(e) => set("maxCapacity", e.target.value)}
                placeholder="e.g. 500"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
          </div>

          <div>
            <Label className="text-sage-700 text-sm">Full Address *</Label>
            <Input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street, area, city, PIN"
              className="mt-1 rounded-xl border-sage-200"
              required
            />
          </div>

          <Separator className="bg-sage-100" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sage-700 text-sm">Contact Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
            <div>
              <Label className="text-sage-700 text-sm">Contact Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="warehouse@example.com"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-sage-200 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 disabled:opacity-60 transition-colors"
            >
              {isSaving ? "Saving..." : mode === "create" ? "Create Warehouse" : "Save Changes"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
