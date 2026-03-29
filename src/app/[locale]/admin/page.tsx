"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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
    { label: "Total Users", value: stats?.totalUsers ?? "—", icon: "👥", desc: "Registered accounts" },
    { label: "Pending KYC", value: stats?.pendingKyc ?? "—", icon: "📋", desc: "Awaiting review" },
    { label: "Active Lots", value: stats?.activeLots ?? "—", icon: "📦", desc: "Listed commodities" },
    { label: "Transactions", value: stats?.totalTransactions ?? "—", icon: "💳", desc: "Total completed" },
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
                <span className="text-2xl">{stat.icon}</span>
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
              { label: "Review KYC Submissions", href: "/admin/kyc", icon: "📋" },
              { label: "Manage Users", href: "/admin/users", icon: "👥" },
              { label: "View Transactions", href: "/admin/transactions", icon: "💳" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-sage-50 transition-colors"
              >
                <span>{action.icon}</span>
                <span className="text-sage-700 text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
