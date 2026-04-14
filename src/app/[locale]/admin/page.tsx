"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Users, ClipboardCheck, Package, CreditCard, ArrowRight,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  pendingKyc: number;
  activeLots: number;
  totalTransactions: number;
}

export default function AdminOverviewPage() {
  const { user, accessToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);

  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast.error("Failed to load dashboard stats");
      }
    } catch {
      toast.error("Network error loading stats");
    }
  }, [accessToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? "—", Icon: Users, desc: "Registered accounts", color: "bg-blue-50 text-blue-600" },
    { label: "Pending KYC", value: stats?.pendingKyc ?? "—", Icon: ClipboardCheck, desc: "Awaiting review", color: "bg-amber-50 text-amber-600" },
    { label: "Active Lots", value: stats?.activeLots ?? "—", Icon: Package, desc: "Listed commodities", color: "bg-emerald-50 text-emerald-600" },
    { label: "Transactions", value: stats?.totalTransactions ?? "—", Icon: CreditCard, desc: "Total completed", color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sage-500 text-sm mt-1">
          Welcome back, {user?.name}. Here&apos;s a quick overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => (
          <Card key={stat.label} className="rounded-3xl border-sage-100">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sage-500 text-xs font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="font-heading text-sage-900 text-3xl font-bold mt-1">
                    {stat.value}
                  </p>
                  <p className="text-sage-400 text-xs mt-1">{stat.desc}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900 text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sage-400 text-sm">Activity log will appear here as the platform processes transactions.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900 text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Review KYC Submissions", href: "/admin/kyc", Icon: ClipboardCheck },
              { label: "Manage Users", href: "/admin/users", Icon: Users },
              { label: "View Transactions", href: "/admin/transactions", Icon: CreditCard },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-sage-50 transition-colors group"
              >
                <action.Icon className="w-4.5 h-4.5 text-sage-500" />
                <span className="text-sage-700 text-sm font-medium flex-1">{action.label}</span>
                <ArrowRight className="w-4 h-4 text-sage-300 group-hover:text-sage-500 transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
