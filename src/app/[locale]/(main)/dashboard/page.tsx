"use client";

import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const t = useTranslations("nav");
  const { user, accessToken, isLoading } = useAuth();
  const [activeListings, setActiveListings] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };

    // Fetch active listings count
    if (user.role === "FARMER") {
      fetch(`/api/lots?farmerId=${user.id}&limit=1`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.pagination?.total != null) setActiveListings(data.pagination.total);
        })
        .catch(() => {});
    } else {
      fetch(`/api/lots?limit=1`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.pagination?.total != null) setActiveListings(data.pagination.total);
        })
        .catch(() => {});
    }
  }, [user, accessToken]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-sage-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="font-heading text-sage-900 text-2xl font-bold mb-2">
          Session Expired
        </h2>
        <p className="text-sage-500 mb-4">
          Please log in again to access your dashboard.
        </p>
        <Link
          href="/login"
          className="inline-flex h-10 px-6 items-center bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const kycStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: "Pending", variant: "secondary" },
    UNDER_REVIEW: { label: "Under Review", variant: "outline" },
    APPROVED: { label: "Approved", variant: "default" },
    REJECTED: { label: "Rejected", variant: "destructive" },
  };

  const kycInfo = kycStatusMap[user.kycStatus] || kycStatusMap.PENDING;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <p className="font-script text-sage-500 text-lg">Welcome back,</p>
        <h1 className="font-heading text-sage-900 text-3xl font-bold">
          {user.name}
        </h1>
      </div>

      {/* KYC Alert */}
      {user.kycStatus !== "APPROVED" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-amber-600 text-xl mt-0.5">⚠</span>
          <div>
            <p className="text-amber-800 font-medium text-sm">
              Complete your KYC verification
            </p>
            <p className="text-amber-600 text-sm mt-0.5">
              You need to verify your identity before you can trade on the
              platform.
            </p>
            <Link
              href="/kyc"
              className="inline-block mt-2 text-sm font-medium text-amber-700 hover:underline"
            >
              Upload Documents →
            </Link>
          </div>
        </div>
      )}

      {!user.emailVerified && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-blue-600 text-xl mt-0.5">✉</span>
          <div>
            <p className="text-blue-800 font-medium text-sm">
              Verify your email address
            </p>
            <p className="text-blue-600 text-sm mt-0.5">
              Check your inbox for the verification code we sent to {user.email}.
            </p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-sage-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-sage-500 font-medium">
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center text-sage-700 text-lg">
                {user.role === "FARMER" ? "🌾" : user.role === "BUYER" ? "🏪" : "📦"}
              </div>
              <div>
                <p className="font-heading font-bold text-sage-900">
                  {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                </p>
                <Badge variant={kycInfo.variant} className="mt-1 text-xs">
                  KYC: {kycInfo.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-sage-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-sage-500 font-medium">
              {t("marketplace")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center text-sage-700 text-lg">
                📊
              </div>
              <div>
                <p className="font-heading font-bold text-sage-900 text-2xl">
                  {activeListings ?? "—"}
                </p>
                <p className="text-sage-500 text-sm">
                  {user.role === "FARMER" ? "My Lots" : "Active Listings"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-sage-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-sage-500 font-medium">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center text-sage-700 text-lg">
                💰
              </div>
              <div>
                <p className="font-heading font-bold text-sage-900 text-2xl">
                  0
                </p>
                <p className="text-sage-500 text-sm">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-sage-100" />

      {/* Quick actions */}
      <div>
        <h2 className="font-heading text-sage-900 text-xl font-bold mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {user.role === "FARMER" && (
            <Link
              href="/marketplace"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <span className="text-2xl">🌾</span>
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                View My Lots
              </p>
              <p className="text-sage-400 text-xs mt-1">
                Track your commodity listings
              </p>
            </Link>
          )}

          {user.role === "BUYER" && (
            <Link
              href="/marketplace"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <span className="text-2xl">🔍</span>
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                Browse Marketplace
              </p>
              <p className="text-sage-400 text-xs mt-1">
                Find commodities to purchase
              </p>
            </Link>
          )}

          <Link
            href="/profile"
            className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl">👤</span>
            <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
              Edit Profile
            </p>
            <p className="text-sage-400 text-xs mt-1">
              Update your personal details
            </p>
          </Link>

          <Link
            href="/kyc"
            className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl">📄</span>
            <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
              KYC Documents
            </p>
            <p className="text-sage-400 text-xs mt-1">
              Manage your verification documents
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
