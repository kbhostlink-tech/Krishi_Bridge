"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { ActionCard, MetricCard, PageHeader, StatusBarChart, Surface } from "@/components/ui/console-kit";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/ui/page-transition";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Package,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Users,
  Gavel,
  FileText,
  Warehouse,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

type AdminStats = {
  totalUsers: number;
  usersLast7d: number;
  usersByRole: { role: string; count: number }[];
  kyc: { pending: number; underReview: number; approved: number; rejected: number };
  lots: { total: number; listed: number; auctionActive: number; sold: number; redeemed: number; pendingApproval: number };
  transactions: { total: number; completed: number; pending: number; last24h: number };
  rfqs: { open: number; accepted: number };
  warehouses: { total: number; active: number };
  disputes: { open: number };
  submissions: { pending: number };
  revenue30d: { gross: number; commission: number };
};

const EMPTY: AdminStats = {
  totalUsers: 0,
  usersLast7d: 0,
  usersByRole: [],
  kyc: { pending: 0, underReview: 0, approved: 0, rejected: 0 },
  lots: { total: 0, listed: 0, auctionActive: 0, sold: 0, redeemed: 0, pendingApproval: 0 },
  transactions: { total: 0, completed: 0, pending: 0, last24h: 0 },
  rfqs: { open: 0, accepted: 0 },
  warehouses: { total: 0, active: 0 },
  disputes: { open: 0 },
  submissions: { pending: 0 },
  revenue30d: { gross: 0, commission: 0 },
};

const ROLE_LABELS: Record<string, string> = {
  FARMER: "Farmers",
  AGGREGATOR: "Aggregators",
  BUYER: "Buyers",
  WAREHOUSE_STAFF: "Warehouse staff",
  ADMIN: "Admins",
};

const ROLE_COLORS: Record<string, string> = {
  FARMER: "#627b55",
  AGGREGATOR: "#7d6a49",
  BUYER: "#55616f",
  WAREHOUSE_STAFF: "#4b7f74",
  ADMIN: "#c08a2b",
};

function formatNumber(n: number) {
  return n.toLocaleString();
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function AdminOverviewPage() {
  const { user, accessToken } = useAuth();
  const [stats, setStats] = useState<AdminStats>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) throw new Error("Failed to load dashboard stats");

        const data = await res.json();
        if (!active) return;

        setStats({
          totalUsers: data.totalUsers ?? 0,
          usersLast7d: data.usersLast7d ?? 0,
          usersByRole: data.usersByRole ?? [],
          kyc: data.kyc ?? EMPTY.kyc,
          lots: data.lots ?? EMPTY.lots,
          transactions: data.transactions ?? EMPTY.transactions,
          rfqs: data.rfqs ?? EMPTY.rfqs,
          warehouses: data.warehouses ?? EMPTY.warehouses,
          disputes: data.disputes ?? EMPTY.disputes,
          submissions: data.submissions ?? EMPTY.submissions,
          revenue30d: data.revenue30d ?? EMPTY.revenue30d,
        });
      } catch {
        if (!active) return;
        setError("Live stats are temporarily unavailable.");
        toast.error("Failed to load dashboard stats");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadStats();
    return () => { active = false; };
  }, [accessToken]);

  const dash = (v: string | number) => (loading ? "-" : v);

  const heroMetrics = [
    { label: "Total users", value: dash(formatNumber(stats.totalUsers)), meta: `+${stats.usersLast7d} last 7d`, tone: "olive" as const, icon: Users },
    { label: "Active lots", value: dash(formatNumber(stats.lots.listed + stats.lots.auctionActive)), meta: `${stats.lots.auctionActive} live auctions`, tone: "teal" as const, icon: Package },
    { label: "Open RFQs", value: dash(formatNumber(stats.rfqs.open)), meta: `${stats.rfqs.accepted} accepted`, tone: "slate" as const, icon: FileText },
    { label: "Revenue 30d", value: dash(formatCurrency(stats.revenue30d.gross)), meta: `Commission ${formatCurrency(stats.revenue30d.commission)}`, tone: "amber" as const, icon: TrendingUp },
  ];

  const attentionItems = [
    { label: "KYC pending", value: stats.kyc.pending + stats.kyc.underReview, href: "/admin/kyc", icon: ClipboardCheck, tone: stats.kyc.pending + stats.kyc.underReview > 0 ? "warning" : "ok" },
    { label: "Lot approvals", value: stats.lots.pendingApproval, href: "/admin/lots", icon: Gavel, tone: stats.lots.pendingApproval > 0 ? "warning" : "ok" },
    { label: "Submissions pending", value: stats.submissions.pending, href: "/admin/commodity-submissions", icon: FileText, tone: stats.submissions.pending > 0 ? "warning" : "ok" },
    { label: "Payments pending", value: stats.transactions.pending, href: "/admin/transactions", icon: CreditCard, tone: stats.transactions.pending > 0 ? "warning" : "ok" },
    { label: "Open disputes", value: stats.disputes.open, href: "/admin/disputes", icon: AlertTriangle, tone: stats.disputes.open > 0 ? "danger" : "ok" },
  ] as const;

  const usersChart = stats.usersByRole
    .filter((r) => r.count > 0)
    .map((r) => ({
      label: ROLE_LABELS[r.role] ?? r.role,
      value: r.count,
      fill: ROLE_COLORS[r.role] ?? "#7b6d4d",
    }));

  const lotChart = [
    { label: "Pending", value: stats.lots.pendingApproval, fill: "#c08a2b" },
    { label: "Listed", value: stats.lots.listed, fill: "#627b55" },
    { label: "Live", value: stats.lots.auctionActive, fill: "#2f7d71" },
    { label: "Sold", value: stats.lots.sold, fill: "#55616f" },
    { label: "Redeemed", value: stats.lots.redeemed, fill: "#7d6a49" },
  ];

  const txnChart = [
    { label: "Pending", value: stats.transactions.pending, fill: "#c08a2b" },
    { label: "Completed", value: stats.transactions.completed, fill: "#627b55" },
    { label: "Last 24h", value: stats.transactions.last24h, fill: "#55616f" },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Admin Console"
        title="Platform overview"
        description={`Welcome back, ${user?.name?.split(" ")[0] || "admin"}.`}
        action={
          <Surface className="w-full p-3 sm:min-w-64">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Role</p>
                <p className="mt-1 text-sm font-semibold text-stone-950">
                  {user?.adminRole ? user.adminRole.replaceAll("_", " ") : "Administrator"}
                </p>
              </div>
              <Badge variant="secondary" className="console-chip border-0">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Active
              </Badge>
            </div>
          </Surface>
        }
      />

      {error ? (
        <Surface className="border-[#e5dccd] bg-[#fff8ee] p-3">
          <div className="flex items-center gap-2 text-sm text-[#7d6435]">
            <AlertTriangle className="h-4 w-4 text-[#a6781f]" />
            <span>{error}</span>
          </div>
        </Surface>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {heroMetrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} meta={m.meta} tone={m.tone} icon={m.icon} />
        ))}
      </div>

      <Surface className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-950">Needs attention</p>
            <p className="text-xs text-stone-500">Queues waiting for admin action.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {attentionItems.map((item) => {
            const Icon = item.icon;
            const color =
              item.tone === "danger" ? "border-red-200 bg-red-50 text-red-800"
              : item.tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-[#d8e2d1] bg-[#f4f7ee] text-[#3d5233]";
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 border p-3 transition-colors hover:opacity-90 ${color}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">{item.label}</p>
                  <p className="mt-0.5 text-xl font-semibold tracking-[-0.03em]">{dash(item.value)}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-70" />
              </Link>
            );
          })}
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-3">
        <StatusBarChart title="User distribution" data={usersChart.length > 0 ? usersChart : [{ label: "No data", value: 0, fill: "#d9d1c2" }]} />
        <StatusBarChart title="Lot lifecycle" data={lotChart} />
        <StatusBarChart title="Transaction flow" data={txnChart} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <MetricCard compact label="KYC approved" value={dash(stats.kyc.approved)} tone="teal" icon={CheckCircle2} />
        <MetricCard compact label="KYC rejected" value={dash(stats.kyc.rejected)} tone="rose" icon={AlertTriangle} />
        <MetricCard compact label="Total lots" value={dash(stats.lots.total)} tone="olive" icon={Package} />
        <MetricCard compact label="Warehouses" value={dash(`${stats.warehouses.active}/${stats.warehouses.total}`)} meta="Active" tone="slate" icon={Warehouse} />
        <MetricCard compact label="Txn completed" value={dash(stats.transactions.completed)} tone="teal" icon={CheckCircle2} />
        <MetricCard compact label="Txn 24h" value={dash(stats.transactions.last24h)} tone="amber" icon={TrendingUp} />
      </div>

      <Surface className="p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold text-stone-950">Quick actions</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ActionCard href="/admin/kyc" eyebrow="Compliance" title="KYC queue" icon={ClipboardCheck} />
          <ActionCard href="/admin/lots" eyebrow="Inventory" title="Lots" icon={Package} />
          <ActionCard href="/admin/transactions" eyebrow="Settlement" title="Transactions" icon={CreditCard} />
          <ActionCard href="/admin/users" eyebrow="Access" title="Users" icon={Users} />
          <ActionCard href="/admin/warehouses" eyebrow="Ops" title="Warehouses" icon={Warehouse} />
          <ActionCard href="/admin/rfqs" eyebrow="Commercial" title="RFQs" icon={FileText} />
          <ActionCard href="/admin/team" eyebrow="Governance" title="Admin team" icon={ShieldCheck} />
          <ActionCard href="/admin/analytics" eyebrow="Insights" title="Analytics" icon={TrendingUp} />
        </div>
      </Surface>
    </PageTransition>
  );
}
