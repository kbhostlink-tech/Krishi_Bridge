"use client";

import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { SkeletonStatCard } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";
import { SellerOnboardingWizard } from "@/components/seller-onboarding-wizard";
import { BuyerOnboardingWizard } from "@/components/buyer-onboarding-wizard";
import {
  Lock, Mail, Leaf, ShoppingBag, Building2, Package,
  BarChart3, Wallet, Key, AlertTriangle, Search, Gavel,
  FileText, PenLine, Tag, Ticket, Sprout, User, FileCheck,
  Briefcase, ArrowRight, ClipboardList,
} from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("nav");
  const td = useTranslations("dashboard");
  const { user, accessToken, isLoading } = useAuth();
  const [activeListings, setActiveListings] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<{ id: string; lotNumber: string; grossAmount: number; currency: string }[]>([]);
  const [completedTxnCount, setCompletedTxnCount] = useState<number | null>(null);

  // Show onboarding wizard for users who haven't completed it
  useEffect(() => {
    if (user && !user.onboardingComplete && (user.role === "FARMER" || user.role === "AGGREGATOR" || user.role === "BUYER")) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };

    // Fetch active listings count
    if (user.role === "FARMER" || user.role === "AGGREGATOR") {
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

    // Fetch buyer's pending payments (PENDING transactions they need to pay)
    if (user.role === "BUYER") {
      fetch("/api/payments/my-pending", { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.transactions) setPendingPayments(data.transactions);
        })
        .catch(() => {});
    }

    // Fetch completed transaction count for all roles
    fetch("/api/payments/my-stats", { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.completedCount != null) setCompletedTxnCount(data.completedCount);
      })
      .catch(() => {});
  }, [user, accessToken]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded skeleton-shimmer" />
          <div className="h-9 w-48 rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="font-heading text-sage-900 text-2xl font-bold mb-2">
          {td("sessionExpired")}
        </h2>
        <p className="text-sage-500 mb-4">
          {td("sessionExpiredDesc")}
        </p>
        <Link
          href="/login"
          className="inline-flex h-10 px-6 items-center bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors"
        >
          {td("goToLogin")}
        </Link>
      </div>
    );
  }

  const kycStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: td("kycStatusPending"), variant: "secondary" },
    UNDER_REVIEW: { label: td("kycStatusUnderReview"), variant: "outline" },
    APPROVED: { label: td("kycStatusApproved"), variant: "default" },
    REJECTED: { label: td("kycStatusRejected"), variant: "destructive" },
  };

  const kycInfo = kycStatusMap[user.kycStatus] || kycStatusMap.PENDING;

  const isSeller = user.role === "FARMER" || user.role === "AGGREGATOR";
  const isBuyer = user.role === "BUYER";
  const kycGated = (isSeller || isBuyer) && user.kycStatus !== "APPROVED";

  return (
    <PageTransition className="space-y-8">
      {/* Onboarding Wizards */}
      {showOnboarding && isSeller && (
        <SellerOnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
      {showOnboarding && isBuyer && (
        <BuyerOnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Welcome header */}
      <div>
        <p className="font-script text-sage-500 text-lg">{td("welcome")},</p>
        <h1 className="font-heading text-sage-900 text-3xl font-bold">
          {user.name}
        </h1>
      </div>

      {/* KYC Alert — prominent for sellers and buyers */}
      {user.kycStatus !== "APPROVED" && (
        <div className={`rounded-2xl p-5 flex items-start gap-3 ${
          kycGated
            ? "bg-amber-50 border-2 border-amber-300"
            : "bg-amber-50 border border-amber-200"
        }`}>
          <Lock className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-semibold text-base">
              {kycGated ? td("kycActivate") : td("kycAlert")}
            </p>
            <p className="text-amber-600 text-sm mt-1">
              {kycGated && isSeller
                ? td("kycGatedSeller")
                : kycGated && isBuyer
                ? td("kycGatedBuyer")
                : td("kycRequiredDesc")}
            </p>
            <Link
              href="/kyc"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-full hover:bg-amber-700 transition-colors"
            >
              {td("uploadKycDocs")} →
            </Link>
          </div>
        </div>
      )}

      {!user.emailVerified && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-800 font-medium text-sm">
              {td("emailVerifyTitle")}
            </p>
            <p className="text-blue-600 text-sm mt-0.5">
              {td("emailVerifyDesc", { email: user.email })}
            </p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-sage-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-sage-500 font-medium">
              {td("accountStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center text-sage-700 text-lg">
                {user.role === "FARMER" ? <Leaf className="w-5 h-5" /> : user.role === "BUYER" ? <ShoppingBag className="w-5 h-5" /> : user.role === "AGGREGATOR" ? <Building2 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
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
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-heading font-bold text-sage-900 text-2xl">
                  {activeListings ?? "—"}
                </p>
                <p className="text-sage-500 text-sm">
                  {(user.role === "FARMER" || user.role === "AGGREGATOR") ? t("viewListings") : t("activeListings")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-sage-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-sage-500 font-medium">
              {t("transactions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center text-sage-700 text-lg">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-heading font-bold text-sage-900 text-2xl">
                  {completedTxnCount ?? "—"}
                </p>
                <p className="text-sage-500 text-sm">{t("totalCompleted")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buyer payment code + pending payments */}
      {isBuyer && user.kycStatus === "APPROVED" && (
        <>
          {user.uniquePaymentCode && (
            <Card className="rounded-3xl border-sage-100 shadow-sm bg-gradient-to-r from-sage-50 to-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-sage-700"><Key className="w-5 h-5" /></div>
                    <div>
                      <p className="text-xs text-sage-500">{td("paymentCode")}</p>
                      <p className="font-heading font-bold text-sage-900 text-xl tracking-wider">{user.uniquePaymentCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-sage-400 max-w-[200px]">{td("paymentCodeDesc")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {pendingPayments.length > 0 && (
            <Card className="rounded-3xl border-amber-200 shadow-sm bg-amber-50">
              <CardContent className="pt-5 pb-5">
                <h3 className="font-heading text-amber-900 font-bold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {td("pendingPayments", { count: pendingPayments.length })}
                </h3>
                <div className="space-y-2">
                  {pendingPayments.map((tx) => (
                    <Link
                      key={tx.id}
                      href={`/dashboard/payments/${tx.id}`}
                      className="flex items-center justify-between bg-white rounded-2xl p-3 border border-amber-100 hover:border-amber-300 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-sage-900">{tx.lotNumber}</p>
                        <p className="text-xs text-sage-500">{td("paymentPending")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-bold text-amber-800">
                          {tx.currency} {Number(tx.grossAmount).toFixed(2)}
                        </p>
                        <p className="text-xs text-amber-600">{td("payNow")} →</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Separator className="bg-sage-100" />

      {/* Quick actions - with KYC gate for sellers */}
      <div className="relative">
        {kycGated && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center p-6">
            <Lock className="w-10 h-10 text-sage-400 mb-3" />
            <p className="font-heading font-bold text-sage-900 text-lg">{td("featuresLocked")}</p>
            <p className="text-sage-500 text-sm mt-1 max-w-md">
              {td("featuresLockedDesc")}
            </p>
            <Link
              href="/kyc"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-sage-700 text-white text-sm font-medium rounded-full hover:bg-sage-800 transition-colors"
            >
              {td("kycLink")} →
            </Link>
          </div>
        )}
        <h2 className="font-heading text-sage-900 text-xl font-bold mb-4">
          {t("quickActions")}
        </h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${kycGated ? "pointer-events-none opacity-40" : ""}`}>
          {/* Marketplace is ALWAYS accessible for all roles */}
          {(isSeller || isBuyer) && (
            <Link
              href="/marketplace"
              className={`group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all ${kycGated ? "!pointer-events-auto !opacity-100 relative z-20" : ""}`}
            >
              <Search className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {td("browseMarketplace")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("exploreListings")}
              </p>
            </Link>
          )}

          {user.role === "FARMER" && (
            <Link
              href="/marketplace"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <Leaf className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {t("viewListings")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("trackListings")}
              </p>
            </Link>
          )}

          {user.role === "AGGREGATOR" && (
            <Link
              href="/dashboard/my-lots"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <Building2 className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {td("myListings")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("manageListings")}
              </p>
            </Link>
          )}

          {user.role === "AGGREGATOR" && (
            <Link
              href="/rfq/browse"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <ClipboardList className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {t("browseRfqs")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("respondBuyerRequests")}
              </p>
            </Link>
          )}

          {user.role === "AGGREGATOR" && (
            <Link
              href="/dashboard/seller-profile"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <PenLine className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {td("sellerProfile")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("completeBusinessProfile")}
              </p>
            </Link>
          )}

          {user.role === "BUYER" && (
            <Link
              href="/dashboard/my-bids"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <Tag className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {td("myBids")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("trackBids")}
              </p>
            </Link>
          )}

          {user.role === "BUYER" && (
            <Link
              href="/dashboard/my-rfqs"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <ClipboardList className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {t("myRfqs")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("manageQuotes")}
              </p>
            </Link>
          )}

          {user.role === "BUYER" && (
            <Link
              href="/rfq/create"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <PenLine className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {td("createRfq")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("requestQuotes")}
              </p>
            </Link>
          )}

          {(user.role === "FARMER" || user.role === "AGGREGATOR") && (
            <Link
              href="/rfq/browse"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <ClipboardList className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {t("browseRfqs")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("findBuyerRequests")}
              </p>
            </Link>
          )}

          {(user.role === "BUYER" || user.role === "FARMER" || user.role === "AGGREGATOR") && (
            <Link
              href="/dashboard/my-tokens"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <Ticket className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {t("myTokens")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("viewTokens")}
              </p>
            </Link>
          )}

          {(user.role === "FARMER" || user.role === "AGGREGATOR") && (
            <Link
              href="/dashboard/my-submissions"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <Sprout className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {t("mySubmissions")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("submitCommodities")}
              </p>
            </Link>
          )}

          <Link
            href="/profile"
            className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
          >
            <User className="w-6 h-6 text-sage-600" />
            <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
              {td("editProfile")}
            </p>
            <p className="text-sage-400 text-xs mt-1">
              {td("updatePersonal")}
            </p>
          </Link>

          <Link
            href="/kyc"
            className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
          >
            <FileCheck className="w-6 h-6 text-sage-600" />
            <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
              {t("kycDocuments")}
            </p>
            <p className="text-sage-400 text-xs mt-1">
              {td("manageVerification")}
            </p>
          </Link>

          {user.role === "BUYER" && (
            <Link
              href="/dashboard/buyer-profile"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <Briefcase className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {td("buyerProfile")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("completeBusinessProfile")}
              </p>
            </Link>
          )}

          {user.role === "FARMER" && (
            <Link
              href="/dashboard/seller-profile"
              className="group bg-white border border-sage-100 rounded-2xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
            >
              <Sprout className="w-6 h-6 text-sage-600" />
              <p className="font-medium text-sage-900 mt-2 text-sm group-hover:text-sage-700">
                {td("farmProfile")}
              </p>
              <p className="text-sage-400 text-xs mt-1">
                {td("addOriginDetails")}
              </p>
            </Link>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
