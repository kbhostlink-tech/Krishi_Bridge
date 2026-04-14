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
import { Separator } from "@/components/ui/separator";
import { Warehouse as WarehouseIcon, CheckCircle2, Package, Phone, Mail, Pencil } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────

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
  _count: { lots: number };
}

interface Stats {
  total: number;
  active: number;
  totalLots: number;
}

const COUNTRY_LABELS: Record<string, string> = {
  IN: "🇮🇳 India", NP: "🇳🇵 Nepal", BT: "🇧🇹 Bhutan",
  AE: "🇦🇪 UAE", SA: "🇸🇦 Saudi Arabia", OM: "🇴🇲 Oman",
};
const COUNTRIES = ["IN", "NP", "BT", "AE", "SA", "OM"];

const emptyWarehouseForm = {
  name: "", country: "", state: "", district: "", address: "",
  phone: "", email: "", lat: "", lng: "", maxCapacity: "",
};

// ─── Main Page ─────────────────────────────────────────────────────

export default function AdminWarehousesPage() {
  const { accessToken } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, totalLots: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }),
    [accessToken]
  );

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-sage-100 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-sage-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-sage-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-sage-900 text-2xl font-bold">Warehouse Management</h1>
          <p className="text-sage-500 text-sm mt-1">
            Manage storage locations for commodity lots.
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors"
        >
          <span className="text-base">＋</span> Add Warehouse
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Warehouses", value: stats.total, icon: <WarehouseIcon className="w-5 h-5 text-blue-600" /> },
          { label: "Active", value: stats.active, icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> },
          { label: "Total Lots", value: stats.totalLots, icon: <Package className="w-5 h-5 text-amber-600" /> },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-sage-100 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                {stat.icon}
                <div>
                  <p className="font-heading text-sage-900 font-bold text-xl">{stat.value}</p>
                  <p className="text-sage-500 text-xs">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {warehouses.length === 0 ? (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-16 text-center">
            <div className="mb-4"><WarehouseIcon className="w-12 h-12 text-sage-300" /></div>
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
                        {wh.phone && <span className="mr-3 inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {wh.phone}</span>}
                        {wh.email && <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {wh.email}</span>}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4 shrink-0">
                    <div className="text-center">
                      <p className="font-heading text-sage-900 font-bold text-lg">{wh._count.lots}</p>
                      <p className="text-sage-400 text-xs">Lots</p>
                    </div>
                    {wh.maxCapacity && (
                      <div className="text-center">
                        <p className="font-heading text-sage-900 font-bold text-lg">{wh.maxCapacity}</p>
                        <p className="text-sage-400 text-xs">Capacity</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditWarehouse(wh)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-sage-50 text-sage-700 hover:bg-sage-100 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
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

      <WarehouseFormDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => { setShowCreateDialog(false); fetchWarehouses(); }}
        accessToken={accessToken}
        mode="create"
      />

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
            {mode === "create" ? "Add Warehouse" : "Edit Warehouse"}
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
