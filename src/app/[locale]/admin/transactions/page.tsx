"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, CreditCard, CheckCircle2, Banknote } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

interface Transaction {
  id: string;
  lotId: string | null;
  lotNumber: string | null;
  commodityType: string | null;
  rfqId: string | null;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerId: string;
  paymentMethod: string;
  currency: string;
  grossAmount: number;
  commissionAmount: number;
  taxOnGoods: number;
  taxOnCommission: number;
  netToSeller: number;
  status: string;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  paidAt: string | null;
  escrowReleasedAt: string | null;
  createdAt: string;
  buyerPaymentCode: string | null;
  adminConfirmedAt: string | null;
  fundsReleasedAt: string | null;
  manualPaymentRef: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ESCROW_HELD: "bg-blue-50 text-blue-700 border-blue-200",
  MANUAL_CONFIRMED: "bg-sky-50 text-sky-700 border-sky-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FUNDS_RELEASED: "bg-emerald-50 text-emerald-800 border-emerald-300",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
};

const METHOD_LABELS: Record<string, string> = {
  RAZORPAY: "Razorpay",
  STRIPE: "Stripe",
  TAP: "Tap",
  ESEWA: "eSewa",
  KHALTI: "Khalti",
  BANK_TRANSFER: "Bank Transfer",
  MANUAL_OFFLINE: "Manual / Offline",
};

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminTransactionsPage() {
  const { accessToken } = useAuth();
  const { display } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [releaseReason, setReleaseReason] = useState("");

  const fetchTransactions = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (methodFilter) params.set("method", methodFilter);

      const res = await fetch(`/api/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search, statusFilter, methodFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const exportCsv = () => {
    if (transactions.length === 0) return;
    const headers = ["ID", "Lot #", "Commodity", "Buyer", "Seller", "Method", "Currency", "Gross", "Commission", "Tax", "Net to Seller", "Status", "Paid At", "Escrow Released", "Created"];
    const rows = transactions.map((t) => [
      t.id, t.lotNumber ?? "", t.commodityType ?? "", t.buyerName, t.sellerName,
      t.paymentMethod, t.currency, t.grossAmount, t.commissionAmount,
      t.taxOnGoods + t.taxOnCommission, t.netToSeller, t.status,
      t.paidAt ? formatDate(t.paidAt) : "", t.escrowReleasedAt ? formatDate(t.escrowReleasedAt) : "",
      formatDate(t.createdAt),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmPayment = async () => {
    if (!accessToken || !selected || !paymentRef.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/payments/confirm-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ transactionId: selected.id, paymentReference: paymentRef }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to confirm payment");
        return;
      }
      toast.success("Payment confirmed and token minted!");
      setSelected(null);
      setPaymentRef("");
      fetchTransactions();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!accessToken || !selected || releaseReason.trim().length < 10) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/payments/release", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ transactionId: selected.id, reason: releaseReason, paymentReference: paymentRef || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to release funds");
        return;
      }
      toast.success("Funds released to seller!");
      setSelected(null);
      setReleaseReason("");
      setPaymentRef("");
      fetchTransactions();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-sage-900 text-2xl font-bold">Transactions</h1>
          <p className="text-sage-500 text-sm mt-0.5">
            Monitor all payments, escrow holds, and fund releases.
            {pagination && <span className="ml-2 text-sage-400">({pagination.total} total)</span>}
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={transactions.length === 0}
          className="inline-flex items-center gap-2 h-9 px-4 bg-sage-700 text-white rounded-full text-xs font-medium hover:bg-sage-800 transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-sage-100">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, buyer name, email, gateway..."
              className="flex-1 min-w-[200px] h-9 px-3 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 px-3 text-sm rounded-xl border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="MANUAL_CONFIRMED">Manual Confirmed</option>
              <option value="ESCROW_HELD">Escrow Held</option>
              <option value="COMPLETED">Completed</option>
              <option value="FUNDS_RELEASED">Funds Released</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              className="h-9 px-3 text-sm rounded-xl border border-sage-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
            >
              <option value="">All Methods</option>
              {Object.entries(METHOD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button type="submit" className="h-9 px-4 bg-sage-100 text-sage-700 rounded-xl text-xs font-medium hover:bg-sage-200 transition-colors">
              Search
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-3xl border-sage-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sage-50/50 border-b border-sage-100">
                <th className="text-left px-4 py-3 text-sage-600 font-medium text-xs">Date</th>
                <th className="text-left px-4 py-3 text-sage-600 font-medium text-xs">Lot</th>
                <th className="text-left px-4 py-3 text-sage-600 font-medium text-xs">Buyer</th>
                <th className="text-left px-4 py-3 text-sage-600 font-medium text-xs">Seller</th>
                <th className="text-left px-4 py-3 text-sage-600 font-medium text-xs">Method</th>
                <th className="text-right px-4 py-3 text-sage-600 font-medium text-xs">Gross</th>
                <th className="text-left px-4 py-3 text-sage-600 font-medium text-xs">Status</th>
                <th className="text-left px-4 py-3 text-sage-600 font-medium text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-sage-50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-sage-100 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sage-400">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-sage-300" />
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="border-b border-sage-50 hover:bg-sage-50/30 transition-colors">
                    <td className="px-4 py-3 text-sage-600 text-xs whitespace-nowrap">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sage-800 text-xs font-medium">{t.lotNumber || "RFQ"}</span>
                      {t.commodityType && (
                        <span className="block text-sage-400 text-[10px]">{t.commodityType}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sage-700 text-xs">{t.buyerName}</td>
                    <td className="px-4 py-3 text-sage-700 text-xs">{t.sellerName}</td>
                    <td className="px-4 py-3 text-sage-500 text-xs">{METHOD_LABELS[t.paymentMethod] || t.paymentMethod}</td>
                    <td className="px-4 py-3 text-right text-sage-800 font-medium text-xs font-mono">
                      {display(t.grossAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] border ${STATUS_COLORS[t.status] || "bg-sage-50 text-sage-700"}`}>
                        {t.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(t)}
                        className="text-sage-500 hover:text-sage-700 text-xs underline transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 px-3 text-xs rounded-lg border border-sage-200 text-sage-600 hover:bg-sage-50 disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-sage-500">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="h-8 px-3 text-xs rounded-lg border border-sage-200 text-sage-600 hover:bg-sage-50 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-3xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-sage-900 text-lg font-bold">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="text-sage-400 hover:text-sage-700 text-lg">✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={`text-xs border ${STATUS_COLORS[selected.status] || ""}`}>
                  {selected.status.replace("_", " ")}
                </Badge>
                <span className="text-xs text-sage-400 font-mono">{selected.id.slice(0, 8)}...</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-sage-500 block">Buyer</span>
                  <span className="text-sage-800 font-medium">{selected.buyerName}</span>
                  <span className="text-sage-400 block">{selected.buyerEmail}</span>
                </div>
                <div>
                  <span className="text-sage-500 block">Seller</span>
                  <span className="text-sage-800 font-medium">{selected.sellerName}</span>
                </div>
                {selected.lotNumber && (
                  <div>
                    <span className="text-sage-500 block">Lot</span>
                    <span className="text-sage-800 font-medium">{selected.lotNumber}</span>
                    {selected.commodityType && <span className="text-sage-400 block">{selected.commodityType}</span>}
                  </div>
                )}
                {selected.rfqId && (
                  <div>
                    <span className="text-sage-500 block">RFQ</span>
                    <span className="text-sage-800 font-medium font-mono">{selected.rfqId.slice(0, 8)}...</span>
                  </div>
                )}
                <div>
                  <span className="text-sage-500 block">Method</span>
                  <span className="text-sage-800 font-medium">{METHOD_LABELS[selected.paymentMethod] || selected.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-sage-500 block">Currency</span>
                  <span className="text-sage-800 font-medium">{selected.currency}</span>
                </div>
              </div>

              <div className="border-t border-sage-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-sage-500">Gross Amount</span>
                  <span className="text-sage-900 font-medium font-mono">{display(selected.grossAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sage-500">Commission (2%)</span>
                  <span className="text-sage-700 font-mono">−{display(selected.commissionAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sage-500">Tax on Goods</span>
                  <span className="text-sage-700 font-mono">−{display(selected.taxOnGoods)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sage-500">Tax on Commission</span>
                  <span className="text-sage-700 font-mono">−{display(selected.taxOnCommission)}</span>
                </div>
                <div className="flex justify-between border-t border-sage-100 pt-2">
                  <span className="text-sage-800 font-semibold">Net to Seller</span>
                  <span className="text-sage-900 font-bold font-mono">{display(selected.netToSeller)}</span>
                </div>
              </div>

              <div className="border-t border-sage-100 pt-3 space-y-2 text-xs">
                {selected.buyerPaymentCode && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">Buyer Payment Code</span>
                    <span className="text-sage-800 font-bold font-mono bg-amber-50 px-2 py-0.5 rounded">{selected.buyerPaymentCode}</span>
                  </div>
                )}
                {selected.manualPaymentRef && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">Payment Reference</span>
                    <span className="text-sage-700 font-mono">{selected.manualPaymentRef}</span>
                  </div>
                )}
                {selected.gatewayOrderId && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">Gateway Order ID</span>
                    <span className="text-sage-700 font-mono">{selected.gatewayOrderId}</span>
                  </div>
                )}
                {selected.gatewayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">Gateway Payment ID</span>
                    <span className="text-sage-700 font-mono">{selected.gatewayPaymentId}</span>
                  </div>
                )}
                {selected.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">Paid At</span>
                    <span className="text-sage-700">{formatDate(selected.paidAt)}</span>
                  </div>
                )}
                {selected.adminConfirmedAt && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">Admin Confirmed</span>
                    <span className="text-sage-700">{formatDate(selected.adminConfirmedAt)}</span>
                  </div>
                )}
                {selected.fundsReleasedAt && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">Funds Released</span>
                    <span className="text-sage-700">{formatDate(selected.fundsReleasedAt)}</span>
                  </div>
                )}
                {selected.escrowReleasedAt && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">Escrow Released</span>
                    <span className="text-sage-700">{formatDate(selected.escrowReleasedAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sage-500">Created</span>
                  <span className="text-sage-700">{formatDate(selected.createdAt)}</span>
                </div>
              </div>

              {/* Admin Actions */}
              {selected.status === "PENDING" && (
                <div className="border-t border-sage-100 pt-4 space-y-3">
                  <h3 className="text-xs font-semibold text-sage-700">Confirm Buyer Payment</h3>
                  <p className="text-xs text-sage-500">Verify the buyer has paid to the platform account. Check for their code: <strong className="font-mono">{selected.buyerPaymentCode || "N/A"}</strong></p>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Bank reference / UTR number"
                    className="w-full h-9 px-3 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                  />
                  <button
                    onClick={handleConfirmPayment}
                    disabled={actionLoading || !paymentRef.trim()}
                    className="w-full h-9 bg-sage-700 text-white rounded-full text-xs font-medium hover:bg-sage-800 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? "Confirming..." : "Confirm Payment & Mint Token"}
                  </button>
                </div>
              )}

              {(selected.status === "MANUAL_CONFIRMED" || selected.status === "COMPLETED") && (
                <div className="border-t border-sage-100 pt-4 space-y-3">
                  <h3 className="text-xs font-semibold text-sage-700">Release Funds to Seller</h3>
                  <p className="text-xs text-sage-500">Transfer funds to the seller&apos;s bank account and record the release.</p>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Payment reference (optional)"
                    className="w-full h-9 px-3 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                  />
                  <textarea
                    value={releaseReason}
                    onChange={(e) => setReleaseReason(e.target.value)}
                    placeholder="Reason for release (min 10 characters)..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-sage-200 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white resize-none"
                  />
                  <button
                    onClick={handleReleaseFunds}
                    disabled={actionLoading || releaseReason.trim().length < 10}
                    className="w-full h-9 bg-emerald-600 text-white rounded-full text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? "Releasing..." : "Release Funds to Seller"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
