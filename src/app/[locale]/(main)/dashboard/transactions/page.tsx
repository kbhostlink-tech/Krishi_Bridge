"use client";

import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/use-currency";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, Clock, CheckCircle2, PackageCheck, Wallet, ArrowRight, Search } from "lucide-react";
import { CommodityIcon, COMMODITY_LABELS } from "@/lib/commodity-icons";

interface Transaction {
  id: string;
  lotId: string | null;
  lotNumber: string | null;
  commodityType: string | null;
  grade: string | null;
  quantityKg: number | null;
  buyer: { id: string; name: string; email: string; country: string };
  seller: { id: string; name: string; email: string; country: string } | null;
  paymentMethod: string;
  currency: string;
  grossAmount: number;
  netToSeller: number;
  status: string;
  paidAt: string | null;
  adminConfirmedAt: string | null;
  fundsReleasedAt: string | null;
  buyerReceivedAt: string | null;
  manualPaymentRef: string | null;
  createdAt: string;
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Awaiting Payment", className: "bg-amber-100 text-amber-800 border border-amber-200" },
  MANUAL_SUBMITTED: { label: "Payment Submitted", className: "bg-sky-100 text-sky-800 border border-sky-200" },
  MANUAL_CONFIRMED: { label: "Payment Confirmed", className: "bg-teal-100 text-teal-800 border border-teal-200" },
  COMPLETED: { label: "Completed", className: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800 border border-red-200" },
  REFUNDED: { label: "Refunded", className: "bg-stone-100 text-stone-800 border border-stone-200" },
  CANCELLED: { label: "Cancelled", className: "bg-stone-100 text-stone-700 border border-stone-200" },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export default function TransactionsPage() {
  const { user, accessToken } = useAuth();
  const { display } = useCurrency();
  const [role, setRole] = useState<"BUYER" | "FARMER" | "AGGREGATOR" | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetch("/api/transactions/mine", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((data) => {
        setRole(data.role ?? null);
        setTxns(data.transactions ?? []);
      })
      .catch(() => setTxns([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const isBuyer = role === "BUYER";
  const isSeller = role === "FARMER" || role === "AGGREGATOR";
  const counterpartyLabel = isBuyer ? "Seller" : "Buyer";

  const filtered = txns.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.lotNumber || "").toLowerCase().includes(q) ||
      (t.commodityType || "").toLowerCase().includes(q) ||
      (t.buyer.name || "").toLowerCase().includes(q) ||
      (t.seller?.name || "").toLowerCase().includes(q) ||
      (t.id || "").toLowerCase().includes(q)
    );
  });

  // Summary metrics
  const completedTxns = txns.filter((t) => t.status === "COMPLETED");
  const pendingCount = txns.filter((t) => t.status === "PENDING" || t.status === "MANUAL_SUBMITTED").length;
  const totalValue = completedTxns.reduce((s, t) => s + (isSeller ? t.netToSeller : t.grossAmount), 0);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-sage-900">My Transactions</h1>
        <p className="text-sm text-sage-500 mt-1">
          {isBuyer
            ? "Payments you've made for auction wins and RFQ purchases."
            : isSeller
              ? "Payouts from your commodity sales."
              : "Your transaction history."}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#ddd4c4]">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-sage-500">Completed</p>
              <p className="font-heading text-xl font-bold text-sage-900">{completedTxns.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#ddd4c4]">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-sage-500">Pending</p>
              <p className="font-heading text-xl font-bold text-sage-900">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#ddd4c4]">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sage-50 flex items-center justify-center">
              {isSeller ? <Wallet className="w-5 h-5 text-sage-600" /> : <CircleDollarSign className="w-5 h-5 text-sage-600" />}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-sage-500">{isSeller ? "Total Received" : "Total Paid"}</p>
              <p className="font-heading text-xl font-bold text-sage-900">{display(totalValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="w-4 h-4 text-sage-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by lot, commodity, or counterparty…"
            className="h-10 w-full rounded-lg border border-[#d9d1c2] bg-white pl-9 pr-3 text-sm placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-[#d9d1c2] bg-white px-3 text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-300"
        >
          <option value="all">All statuses</option>
          <option value="PENDING">Awaiting Payment</option>
          <option value="MANUAL_SUBMITTED">Payment Submitted</option>
          <option value="MANUAL_CONFIRMED">Payment Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <Card className="border-[#ddd4c4] overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-sage-500 text-sm">Loading transactions…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <PackageCheck className="w-10 h-10 text-sage-300 mx-auto mb-2" />
              <p className="text-sage-700 font-medium">No transactions yet</p>
              <p className="text-sage-500 text-sm mt-1">
                {isBuyer ? "When you win an auction or complete an RFQ, payments will appear here." : "When you sell a lot, payouts will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8f4ec] border-b border-[#ece4d6]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-sage-600 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-sage-600 text-xs uppercase tracking-wider">Commodity / Lot</th>
                    <th className="text-left px-4 py-3 font-medium text-sage-600 text-xs uppercase tracking-wider">{counterpartyLabel}</th>
                    <th className="text-right px-4 py-3 font-medium text-sage-600 text-xs uppercase tracking-wider">
                      {isSeller ? "Net Payout" : "Amount"}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-sage-600 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const counterparty = isBuyer ? t.seller : t.buyer;
                    const amount = isSeller ? t.netToSeller : t.grossAmount;
                    const statusStyle = STATUS_STYLE[t.status] || { label: t.status, className: "bg-stone-100 text-stone-700 border border-stone-200" };
                    return (
                      <tr key={t.id} className="border-b border-[#ece4d6] last:border-b-0 hover:bg-[#faf6ee]/50">
                        <td className="px-4 py-3 text-sage-700 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {t.commodityType && <CommodityIcon type={t.commodityType} className="w-6 h-6" />}
                            <div>
                              <p className="font-medium text-sage-900">{t.commodityType ? COMMODITY_LABELS[t.commodityType] || t.commodityType : "—"}</p>
                              <p className="text-xs text-sage-500">
                                {t.lotNumber ? `Lot ${t.lotNumber}` : ""}
                                {t.quantityKg ? ` · ${t.quantityKg.toLocaleString()} kg` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sage-900">{counterparty?.name || "—"}</p>
                          <p className="text-xs text-sage-500">{counterparty?.country || ""}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-sage-900 whitespace-nowrap">{display(amount)}</td>
                        <td className="px-4 py-3">
                          <Badge className={statusStyle.className}>{statusStyle.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isBuyer && (t.status === "PENDING" || t.status === "MANUAL_SUBMITTED") ? (
                            <Link
                              href={`/dashboard/payments/${t.id}`}
                              className="inline-flex items-center gap-1 text-sage-700 hover:text-sage-900 text-sm font-medium"
                            >
                              Pay now <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : t.lotId ? (
                            <Link
                              href={`/marketplace/${t.lotId}`}
                              className="inline-flex items-center gap-1 text-sage-600 hover:text-sage-900 text-xs"
                            >
                              View lot <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
