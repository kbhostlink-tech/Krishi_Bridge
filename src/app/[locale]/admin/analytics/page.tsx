"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3, Users, ClipboardList, Package, Gavel, FileText, Lock, CheckCircle2, DollarSign, TrendingUp, Landmark, ShieldCheck } from "lucide-react";

interface Analytics {
  summary: {
    totalUsers: number;
    pendingKyc: number;
    approvedKyc: number;
    rejectedKyc: number;
    activeLots: number;
    pendingApprovalLots: number;
    auctionActiveLots: number;
    soldLots: number;
    totalTransactions: number;
    escrowHeldTransactions: number;
    completedTransactions: number;
    failedTransactions: number;
    totalRfqs: number;
    openRfqs: number;
    acceptedRfqs: number;
  };
  financials: {
    totalVolume: number;
    totalCommission: number;
    totalNetToSeller: number;
    escrowHeldAmount: number;
  };
  charts: {
    usersByRole: Array<{ role: string; count: number }>;
    usersByCountry: Array<{ country: string; count: number }>;
    lotsByCommodity: Array<{ commodity: string; count: number }>;
    recentUsers: Array<{ date: string; count: number }>;
    recentTransactions: Array<{ date: string; count: number; volume: number }>;
  };
}

const SAGE_COLORS = [
  "#4a5e4a", "#6b7f6b", "#8ca18c", "#a8bda8", "#c4d4c4",
  "#d4a574", "#b8956a", "#9c7c5c", "#7a6348", "#5d4e3a",
];

const ROLE_LABELS: Record<string, string> = {
  FARMER: "Farmer",
  BUYER: "Buyer",
  AGGREGATOR: "Aggregator",
  ADMIN: "Admin",
};

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/admin/stats/analytics", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      setData(await res.json());
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-sage-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/60 rounded-3xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 bg-white/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sage-400">
        <BarChart3 className="w-10 h-10 text-sage-300 mb-3" />
        <p className="text-sm font-medium">Unable to load analytics data.</p>
        <button onClick={fetchData} className="mt-3 text-xs text-sage-600 hover:text-sage-800 underline">
          Retry
        </button>
      </div>
    );
  }

  const { summary: s, financials: f, charts: c } = data;

  const statCards = [
    { label: "Total Users", value: s.totalUsers, icon: <Users className="w-5 h-5 text-blue-600" />, color: "bg-sage-50" },
    { label: "Pending KYC", value: s.pendingKyc, icon: <ClipboardList className="w-5 h-5 text-amber-600" />, color: "bg-amber-50" },
    { label: "Active Lots", value: s.activeLots, icon: <Package className="w-5 h-5 text-emerald-600" />, color: "bg-sage-50" },
    { label: "Auctions Live", value: s.auctionActiveLots, icon: <Gavel className="w-5 h-5 text-purple-600" />, color: "bg-emerald-50" },
    { label: "Pending Lots", value: s.pendingApprovalLots, icon: <ClipboardList className="w-5 h-5 text-amber-600" />, color: "bg-amber-50" },
    { label: "Total RFQs", value: s.totalRfqs, icon: <FileText className="w-5 h-5 text-indigo-600" />, color: "bg-sage-50" },
    { label: "Escrow Held", value: s.escrowHeldTransactions, icon: <Lock className="w-5 h-5 text-orange-600" />, color: "bg-blue-50" },
    { label: "Completed", value: s.completedTransactions, icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, color: "bg-emerald-50" },
  ];

  const financialCards = [
    { label: "Total Volume", value: formatUsd(f.totalVolume), icon: <DollarSign className="w-5 h-5 text-blue-600" /> },
    { label: "Commission Revenue", value: formatUsd(f.totalCommission), icon: <TrendingUp className="w-5 h-5 text-emerald-600" /> },
    { label: "Net to Sellers", value: formatUsd(f.totalNetToSeller), icon: <Landmark className="w-5 h-5 text-amber-600" /> },
    { label: "Escrow Held", value: formatUsd(f.escrowHeldAmount), icon: <ShieldCheck className="w-5 h-5 text-purple-600" /> },
  ];

  const kycData = [
    { name: "Approved", value: s.approvedKyc },
    { name: "Pending", value: s.pendingKyc },
    { name: "Rejected", value: s.rejectedKyc },
  ];

  const lotStatusData = [
    { name: "Listed", value: s.activeLots },
    { name: "Auction", value: s.auctionActiveLots },
    { name: "Pending", value: s.pendingApprovalLots },
    { name: "Sold", value: s.soldLots },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-sage-500 text-sm mt-1">Platform-wide metrics and trends</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className={`rounded-2xl border-sage-100 ${card.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sage-500 text-[10px] font-medium uppercase tracking-wider">{card.label}</p>
                  <p className="font-heading text-sage-900 text-2xl font-bold mt-0.5">{card.value}</p>
                </div>
                {card.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {financialCards.map((card) => (
          <Card key={card.label} className="rounded-2xl border-sage-100 bg-white">
            <CardContent className="p-4">
              <p className="text-sage-500 text-[10px] font-medium uppercase tracking-wider">{card.label}</p>
              <p className="font-heading text-sage-900 text-lg font-bold mt-1">{card.value}</p>
              {card.icon}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: User Registration Trend + Transaction Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="p-5">
            <h3 className="font-heading text-sage-900 text-sm font-semibold mb-4">
              New Users (Last 30 Days)
            </h3>
            {c.recentUsers.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={c.recentUsers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8a9a8a" }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "#8a9a8a" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #d4cec4", fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="#4a5e4a" strokeWidth={2} dot={{ r: 3, fill: "#4a5e4a" }} name="Registrations" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-sage-400 text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-sage-100">
          <CardContent className="p-5">
            <h3 className="font-heading text-sage-900 text-sm font-semibold mb-4">
              Transaction Volume (Last 30 Days)
            </h3>
            {c.recentTransactions.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={c.recentTransactions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8a9a8a" }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "#8a9a8a" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #d4cec4", fontSize: 12 }} formatter={(v) => typeof v === "number" ? formatUsd(v) : String(v)} />
                  <Bar dataKey="volume" fill="#6b7f6b" radius={[4, 4, 0, 0]} name="Volume (USD)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-sage-400 text-sm">No transactions yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Pie Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users by Role */}
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="p-5">
            <h3 className="font-heading text-sage-900 text-sm font-semibold mb-3">Users by Role</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={c.usersByRole.map((r) => ({ name: ROLE_LABELS[r.role] || r.role, value: r.count }))}
                  cx="50%" cy="50%" innerRadius={35} outerRadius={65}
                  paddingAngle={2} dataKey="value"
                >
                  {c.usersByRole.map((_, i) => (
                    <Cell key={i} fill={SAGE_COLORS[i % SAGE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {c.usersByRole.map((r, i) => (
                <span key={r.role} className="flex items-center gap-1 text-[10px] text-sage-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SAGE_COLORS[i % SAGE_COLORS.length] }} />
                  {ROLE_LABELS[r.role] || r.role} ({r.count})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* KYC Status */}
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="p-5">
            <h3 className="font-heading text-sage-900 text-sm font-semibold mb-3">KYC Status</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={kycData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} dataKey="value">
                  <Cell fill="#4a5e4a" />
                  <Cell fill="#d4a574" />
                  <Cell fill="#c4736c" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {[{ name: "Approved", color: "#4a5e4a", val: s.approvedKyc }, { name: "Pending", color: "#d4a574", val: s.pendingKyc }, { name: "Rejected", color: "#c4736c", val: s.rejectedKyc }].map((item) => (
                <span key={item.name} className="flex items-center gap-1 text-[10px] text-sage-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name} ({item.val})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lot Status */}
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="p-5">
            <h3 className="font-heading text-sage-900 text-sm font-semibold mb-3">Lots Status</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={lotStatusData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} dataKey="value">
                  {lotStatusData.map((_, i) => (
                    <Cell key={i} fill={SAGE_COLORS[i % SAGE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {lotStatusData.map((item, i) => (
                <span key={item.name} className="flex items-center gap-1 text-[10px] text-sage-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SAGE_COLORS[i % SAGE_COLORS.length] }} />
                  {item.name} ({item.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users by Country */}
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="p-5">
            <h3 className="font-heading text-sage-900 text-sm font-semibold mb-3">Users by Country</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={c.usersByCountry.map((u) => ({ name: u.country, count: u.count }))} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: "#8a9a8a" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#8a9a8a" }} width={30} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} formatter={(v, _name, entry) => { const name = (entry?.payload as Record<string, string>)?.name || ""; return [`${v} users`, `${name}`]; }} />
                <Bar dataKey="count" fill="#6b7f6b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Commodities Bar Chart */}
      <Card className="rounded-3xl border-sage-100">
        <CardContent className="p-5">
          <h3 className="font-heading text-sage-900 text-sm font-semibold mb-4">Lots by Commodity Type</h3>
          {c.lotsByCommodity.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={c.lotsByCommodity.map((l) => ({ name: l.commodity, count: l.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8a9a8a" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8a9a8a" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" fill="#4a5e4a" radius={[6, 6, 0, 0]} name="Lots" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sage-400 text-sm">No lots yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
