"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CheckCircle2 } from "lucide-react";

interface Dispute {
  id: string;
  lotNumber: string | null;
  commodityType: string | null;
  grade: string | null;
  buyer: { id: string; name: string; email: string } | null;
  seller: { id: string; name: string; email: string } | null;
  grossAmount: number;
  commissionAmount: number;
  netToSeller: number;
  currency: string;
  paymentMethod: string | null;
  status: string;
  gatewayOrderId: string | null;
  paidAt: string | null;
  escrowReleasedAt: string | null;
  createdAt: string;
  auditLogs: { id: string; action: string; entityId: string | null; userId: string; createdAt: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
  ESCROW_HELD: "bg-amber-100 text-amber-800",
};

const ACTION_OPTIONS = [
  { value: "RESOLUTION_NOTE", label: "Add Resolution Note" },
  { value: "ESCALATED", label: "Escalate" },
  { value: "REFUND_APPROVED", label: "Approve Refund" },
  { value: "DISPUTE_CLOSED", label: "Close Dispute" },
];

export default function AdminDisputesPage() {
  const { accessToken } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [noteAction, setNoteAction] = useState("RESOLUTION_NOTE");
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetch_ = useCallback(async (page = 1) => {
    if (!accessToken) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/admin/disputes?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to load disputes");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => {
    fetch_(1);
  }, [fetch_]);

  const submitNote = async () => {
    if (!accessToken || !selected || !noteText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ transactionId: selected.id, action: noteAction, note: noteText.trim() }),
      });
      if (res.ok) {
        toast.success("Resolution action recorded");
        setNoteText("");
        // Refresh to get updated audit logs
        fetch_(pagination.page);
        setSelected(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtCurrency = (n: number, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">Dispute Resolution</h1>
        <p className="text-sage-500 text-sm mt-1">Review failed, refunded, and escrow-held transactions. Add resolution notes and track actions.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Failed", status: "FAILED", color: "text-red-600" },
          { label: "Refunded", status: "REFUNDED", color: "text-purple-600" },
          { label: "Escrow Held", status: "ESCROW_HELD", color: "text-amber-600" },
        ].map((s) => {
          const count = statusFilter === "ALL"
            ? disputes.filter((d) => d.status === s.status).length
            : (statusFilter === s.status ? disputes.length : 0);
          return (
            <button
              key={s.status}
              onClick={() => setStatusFilter(statusFilter === s.status ? "ALL" : s.status)}
              className={`rounded-2xl border p-4 text-left transition-colors ${statusFilter === s.status ? "bg-sage-900 text-white border-sage-900" : "bg-white border-sage-100 hover:border-sage-300"}`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${statusFilter === s.status ? "text-white" : s.color}`}>{count}</span>
              </div>
              <p className={`text-xs mt-1 font-medium ${statusFilter === s.status ? "text-white/70" : "text-sage-500"}`}>{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-sage-500">
        <span>Total: <strong className="text-sage-900">{pagination.total}</strong></span>
        {statusFilter !== "ALL" && (
          <Button size="sm" variant="ghost" className="text-xs h-6 px-2 text-sage-400" onClick={() => setStatusFilter("ALL")}>
            Clear filter
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="text-center py-16">
            <div className="mb-3"><CheckCircle2 className="w-10 h-10 text-sage-300" /></div>
            <p className="text-sage-500 text-sm">No disputes to review. All transactions are healthy.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-sage-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sage-100 bg-sage-50/50">
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Lot</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Buyer</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Seller</th>
                  <th className="text-right py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Notes</th>
                  <th className="text-left py-3 px-4 text-sage-500 font-medium text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d.id} className="border-b border-sage-50 hover:bg-sage-50/30 transition-colors">
                    <td className="py-3 px-4 text-sage-500 text-xs">{fmtDate(d.createdAt)}</td>
                    <td className="py-3 px-4">
                      {d.lotNumber ? (
                        <div>
                          <span className="font-mono text-xs text-sage-700">{d.lotNumber}</span>
                          <p className="text-sage-400 text-[10px]">{d.commodityType} {d.grade}</p>
                        </div>
                      ) : <span className="text-sage-400 text-xs">—</span>}
                    </td>
                    <td className="py-3 px-4 text-sage-700 text-xs">{d.buyer?.name || "—"}</td>
                    <td className="py-3 px-4 text-sage-700 text-xs">{d.seller?.name || "—"}</td>
                    <td className="py-3 px-4 text-right text-sage-900 font-medium text-xs">{fmtCurrency(d.grossAmount, d.currency)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-700"}`}>
                        {d.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.auditLogs.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">{d.auditLogs.length}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="outline" className="rounded-full text-xs h-7 px-3" onClick={() => { setSelected(d); setNoteText(""); setNoteAction("RESOLUTION_NOTE"); }}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button size="sm" variant="outline" className="rounded-full text-xs" disabled={pagination.page <= 1} onClick={() => fetch_(pagination.page - 1)}>
            Previous
          </Button>
          <span className="text-sage-500 text-xs">Page {pagination.page} of {pagination.totalPages}</span>
          <Button size="sm" variant="outline" className="rounded-full text-xs" disabled={pagination.page >= pagination.totalPages} onClick={() => fetch_(pagination.page + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-xl rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              Dispute Review
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              {/* Transaction info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-400 text-xs">Status</span>
                  <p className="mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status] || "bg-gray-100"}`}>
                      {selected.status.replace(/_/g, " ")}
                    </span>
                  </p>
                </div>
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-400 text-xs">Amount</span>
                  <p className="text-sage-900 font-medium mt-0.5">{fmtCurrency(selected.grossAmount, selected.currency)}</p>
                </div>
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-400 text-xs">Buyer</span>
                  <p className="text-sage-700 text-sm mt-0.5">{selected.buyer?.name || "—"}</p>
                  <p className="text-sage-400 text-[10px]">{selected.buyer?.email || ""}</p>
                </div>
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-400 text-xs">Seller</span>
                  <p className="text-sage-700 text-sm mt-0.5">{selected.seller?.name || "—"}</p>
                  <p className="text-sage-400 text-[10px]">{selected.seller?.email || ""}</p>
                </div>
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-400 text-xs">Lot</span>
                  <p className="text-sage-700 font-mono text-xs mt-0.5">{selected.lotNumber || "N/A"}</p>
                </div>
                <div className="bg-sage-50/50 rounded-xl p-3">
                  <span className="text-sage-400 text-xs">Gateway ID</span>
                  <p className="text-sage-700 font-mono text-[10px] mt-0.5 break-all">{selected.gatewayOrderId || "—"}</p>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="bg-sage-50/50 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-sage-400">Gross</span><span className="text-sage-700">{fmtCurrency(selected.grossAmount, selected.currency)}</span></div>
                <div className="flex justify-between"><span className="text-sage-400">Commission</span><span className="text-sage-700">{fmtCurrency(selected.commissionAmount, selected.currency)}</span></div>
                <div className="flex justify-between border-t border-sage-200 pt-1 mt-1"><span className="text-sage-500 font-medium">Net to Seller</span><span className="text-sage-900 font-medium">{fmtCurrency(selected.netToSeller, selected.currency)}</span></div>
              </div>

              {/* Existing audit logs */}
              {selected.auditLogs.length > 0 && (
                <div>
                  <h4 className="text-sage-700 text-xs font-semibold uppercase tracking-wider mb-2">Resolution History</h4>
                  <div className="space-y-2">
                    {selected.auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-sage-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-sage-400 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sage-700 text-xs font-medium">{log.action.replace(/^DISPUTE_/, "").replace(/_/g, " ")}</p>
                          <p className="text-sage-400 text-[10px]">{fmtDate(log.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add resolution note */}
              <div className="border-t border-sage-100 pt-4 space-y-3">
                <h4 className="text-sage-700 text-xs font-semibold uppercase tracking-wider">Add Resolution Action</h4>
                <Select value={noteAction} onValueChange={(v) => { if (v) setNoteAction(v); }}>
                  <SelectTrigger className="rounded-xl border-sage-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Describe the resolution, findings, or next steps..."
                  className="w-full rounded-xl border border-sage-200 p-3 text-sm text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-300 resize-none"
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sage-400 text-[10px]">{noteText.length}/2000</span>
                  <Button
                    className="rounded-full bg-sage-900 hover:bg-sage-800 text-white text-xs px-6"
                    disabled={!noteText.trim() || submitting}
                    onClick={submitNote}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
