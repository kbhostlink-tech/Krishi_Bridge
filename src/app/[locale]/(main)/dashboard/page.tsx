"use client";

import { useEffect, useState } from "react";

import { BuyerOnboardingWizard, SellerOnboardingWizard } from "@/components/localized-onboarding-wizards";
import { ActionCard, MetricCard, PageHeader, StatusBarChart, Surface } from "@/components/ui/console-kit";
import { RoleMark } from "@/components/ui/role-mark";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/ui/page-transition";
import { SkeletonStatCard } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Mail,
  Store,
  ClipboardList,
  Package,
  FileText,
  Building2,
  Shield,
  Gavel,
  Award,
  CreditCard,
  LayoutGrid,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";

type SellerLotStats = {
  total: number;
  draft: number;
  pending: number;
  listed: number;
  auctionActive: number;
  sold: number;
  redeemed: number;
};

type SubmissionStats = {
  submitted: number;
  underReview: number;
  approved: number;
  listed: number;
  rejected: number;
};

type PendingPayment = {
  id: string;
  lotNumber: string;
  grossAmount: number;
  currency: string;
};

const EMPTY_LOT_STATS: SellerLotStats = {
  total: 0,
  draft: 0,
  pending: 0,
  listed: 0,
  auctionActive: 0,
  sold: 0,
  redeemed: 0,
};

const EMPTY_SUBMISSION_STATS: SubmissionStats = {
  submitted: 0,
  underReview: 0,
  approved: 0,
  listed: 0,
  rejected: 0,
};

export default function DashboardPage() {
  const td = useTranslations("dashboard");
  const { user, accessToken, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
      router.replace("/admin");
    }
  }, [isLoading, user, router]);

  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);
  const [activeListings, setActiveListings] = useState<number | null>(null);
  const [completedTxnCount, setCompletedTxnCount] = useState<number | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [lotStats, setLotStats] = useState<SellerLotStats>(EMPTY_LOT_STATS);
  const [submissionStats, setSubmissionStats] = useState<SubmissionStats>(EMPTY_SUBMISSION_STATS);
  const [marketplaceMixStats, setMarketplaceMixStats] = useState({ auction: 0, rfq: 0, hybrid: 0 });
  const [rfqCoverageStats, setRfqCoverageStats] = useState({ fresh: 0, responded: 0, urgent: 0 });
  const [buyerBidStats, setBuyerBidStats] = useState({ active: 0, won: 0, outbid: 0, cancelled: 0 });
  const [buyerRfqStats, setBuyerRfqStats] = useState({ open: 0, quoted: 0, accepted: 0, closed: 0 });
  const [buyerTokenStats, setBuyerTokenStats] = useState({ active: 0, transferred: 0, redeemed: 0, expired: 0 });

  const isSeller = user?.role === "FARMER" || user?.role === "AGGREGATOR";
  const isBuyer = user?.role === "BUYER";
  const shouldShowOnboarding = Boolean(
    user &&
      !dismissedOnboarding &&
      !user.onboardingComplete &&
      (user.role === "FARMER" || user.role === "AGGREGATOR" || user.role === "BUYER")
  );
  const kycGated = Boolean(user && (isSeller || isBuyer) && user.kycStatus !== "APPROVED");

  useEffect(() => {
    if (!user || !accessToken) return;

    const headers = { Authorization: `Bearer ${accessToken}` };
    const fetchJson = async (url: string) => {
      const response = await fetch(url, { headers });
      if (!response.ok) return null;
      return response.json();
    };

    const loadDashboard = async () => {
      const paymentsPromise = fetchJson("/api/payments/my-stats");

      if (isSeller) {
        const sellerRequests = [
          fetchJson(`/api/lots?sellerId=${user.id}&limit=1`),
          fetchJson(`/api/lots?sellerId=${user.id}&status=DRAFT&limit=1`),
          fetchJson(`/api/lots?sellerId=${user.id}&status=PENDING_APPROVAL&limit=1`),
          fetchJson(`/api/lots?sellerId=${user.id}&status=LISTED&limit=1`),
          fetchJson(`/api/lots?sellerId=${user.id}&status=AUCTION_ACTIVE&limit=1`),
          fetchJson(`/api/lots?sellerId=${user.id}&status=SOLD&limit=1`),
          fetchJson(`/api/lots?sellerId=${user.id}&status=REDEEMED&limit=1`),
          fetchJson("/api/commodity-submissions?status=SUBMITTED&limit=1"),
          fetchJson("/api/commodity-submissions?status=UNDER_REVIEW&limit=1"),
          fetchJson("/api/commodity-submissions?status=APPROVED&limit=1"),
          fetchJson("/api/commodity-submissions?status=LISTED&limit=1"),
          fetchJson("/api/commodity-submissions?status=REJECTED&limit=1"),
        ];
        const [payments, ...sellerPayload] = await Promise.all([paymentsPromise, ...sellerRequests]);

        setCompletedTxnCount(payments?.completedCount ?? null);
        setLotStats({
          total: sellerPayload[0]?.pagination?.total ?? 0,
          draft: sellerPayload[1]?.pagination?.total ?? 0,
          pending: sellerPayload[2]?.pagination?.total ?? 0,
          listed: sellerPayload[3]?.pagination?.total ?? 0,
          auctionActive: sellerPayload[4]?.pagination?.total ?? 0,
          sold: sellerPayload[5]?.pagination?.total ?? 0,
          redeemed: sellerPayload[6]?.pagination?.total ?? 0,
        });
        setActiveListings((sellerPayload[3]?.pagination?.total ?? 0) + (sellerPayload[4]?.pagination?.total ?? 0));
        setSubmissionStats({
          submitted: sellerPayload[7]?.total ?? 0,
          underReview: sellerPayload[8]?.total ?? 0,
          approved: sellerPayload[9]?.total ?? 0,
          listed: sellerPayload[10]?.total ?? 0,
          rejected: sellerPayload[11]?.total ?? 0,
        });

        // Marketplace distribution + RFQ coverage
        const [auctionData, rfqModeData, hybridData, openRfqData] = await Promise.all([
          fetchJson("/api/lots?listingMode=AUCTION&limit=1"),
          fetchJson("/api/lots?listingMode=RFQ&limit=1"),
          fetchJson("/api/lots?listingMode=BOTH&limit=1"),
          fetchJson("/api/rfq/open?limit=50"),
        ]);
        setMarketplaceMixStats({
          auction: auctionData?.pagination?.total ?? 0,
          rfq: rfqModeData?.pagination?.total ?? 0,
          hybrid: hybridData?.pagination?.total ?? 0,
        });
        const openRfqs: Array<{ alreadyResponded: boolean; expiresAt: string }> = openRfqData?.rfqs ?? [];
        const nowMs = Date.now();
        setRfqCoverageStats({
          fresh: openRfqs.filter(r => !r.alreadyResponded).length,
          responded: openRfqs.filter(r => r.alreadyResponded).length,
          urgent: openRfqs.filter(r => {
            const diff = new Date(r.expiresAt).getTime() - nowMs;
            return diff > 0 && Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 2;
          }).length,
        });
        return;
      }

      const [payments, marketplace, buyerPending, auctionData, rfqModeData, hybridData] = await Promise.all([
        paymentsPromise,
        fetchJson("/api/lots?limit=1"),
        isBuyer ? fetchJson("/api/payments/my-pending") : Promise.resolve(null),
        fetchJson("/api/lots?listingMode=AUCTION&limit=1"),
        fetchJson("/api/lots?listingMode=RFQ&limit=1"),
        fetchJson("/api/lots?listingMode=BOTH&limit=1"),
      ]);

      setCompletedTxnCount(payments?.completedCount ?? null);
      setActiveListings(marketplace?.pagination?.total ?? null);
      setPendingPayments(buyerPending?.transactions ?? []);
      setMarketplaceMixStats({
        auction: auctionData?.pagination?.total ?? 0,
        rfq: rfqModeData?.pagination?.total ?? 0,
        hybrid: hybridData?.pagination?.total ?? 0,
      });

      if (isBuyer) {
        const [myBids, myRfqs, myTokens] = await Promise.all([
          fetchJson("/api/bids?my=true&limit=200"),
          fetchJson("/api/rfqs?my=true&limit=200"),
          fetchJson("/api/tokens?limit=200"),
        ]);
        const bids: Array<{ status: string }> = myBids?.bids ?? [];
        setBuyerBidStats({
          active: bids.filter((b) => b.status === "ACTIVE").length,
          won: bids.filter((b) => b.status === "WON").length,
          outbid: bids.filter((b) => b.status === "OUTBID").length,
          cancelled: bids.filter((b) => b.status === "CANCELLED").length,
        });
        const rfqs: Array<{ status: string }> = myRfqs?.rfqs ?? [];
        setBuyerRfqStats({
          open: rfqs.filter((r) => r.status === "OPEN").length,
          quoted: rfqs.filter((r) => r.status === "QUOTED" || r.status === "RESPONDED").length,
          accepted: rfqs.filter((r) => r.status === "ACCEPTED").length,
          closed: rfqs.filter((r) => r.status === "CLOSED" || r.status === "EXPIRED").length,
        });
        const tokens: Array<{ status: string }> = myTokens?.tokens ?? [];
        setBuyerTokenStats({
          active: tokens.filter((tk) => tk.status === "ACTIVE").length,
          transferred: tokens.filter((tk) => tk.status === "TRANSFERRED").length,
          redeemed: tokens.filter((tk) => tk.status === "REDEEMED").length,
          expired: tokens.filter((tk) => tk.status === "EXPIRED").length,
        });
      }
    };

    loadDashboard().catch(() => undefined);
  }, [accessToken, isBuyer, isSeller, user]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded skeleton-shimmer" />
          <div className="h-9 w-56 rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <h2 className="mb-2 text-2xl font-semibold text-stone-950">{td("sessionExpired")}</h2>
        <p className="mb-4 text-stone-600">{td("sessionExpiredDesc")}</p>
        <Link
          href="/login"
          className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-6 text-sm font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2f422e]"
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
  const sellerSubmissionChart = [
    { label: td("chartSubmitted"), value: submissionStats.submitted, fill: "#627b55" },
    { label: td("chartReview"), value: submissionStats.underReview, fill: "#c08a2b" },
    { label: td("chartApproved"), value: submissionStats.approved, fill: "#4b7f74" },
    { label: td("chartListed"), value: submissionStats.listed, fill: "#55616f" },
    { label: td("chartRejected"), value: submissionStats.rejected, fill: "#a85d56" },
  ];
  const sellerLotChart = [
    { label: td("chartDraft"), value: lotStats.draft, fill: "#93866a" },
    { label: td("chartReview"), value: lotStats.pending, fill: "#c08a2b" },
    { label: td("chartListed"), value: lotStats.listed, fill: "#627b55" },
    { label: td("chartLive"), value: lotStats.auctionActive, fill: "#2f7d71" },
    { label: td("chartSold"), value: lotStats.sold, fill: "#55616f" },
    { label: td("chartRedeemedLabel"), value: lotStats.redeemed, fill: "#7d6a49" },
  ];

  const sellerActions = [
    { href: "/marketplace",               eyebrow: td("eyeDemand"),      title: td("actBrowseMarket"),    icon: Store,         tone: "olive" as const },
    { href: "/dashboard/my-submissions",  eyebrow: td("eyeSupply"),       title: td("actMySubmissions"),  icon: ClipboardList, tone: "amber" as const },
    { href: "/dashboard/my-lots",         eyebrow: td("eyeListing"),      title: td("actMyLots"),          icon: Package,       tone: "sage"  as const },
    { href: "/rfq/browse",                eyebrow: td("eyeBuyerDemand"),  title: td("actBrowseRfqs"),      icon: FileText,      tone: "teal"  as const },
    { href: "/dashboard/seller-profile",  eyebrow: td("eyeProfile"),      title: td("actSellerProfile"),  icon: Building2,     tone: "sand"  as const },
    { href: "/kyc",                       eyebrow: td("eyeCompliance"),   title: td("actKyc"),             icon: Shield,        tone: "slate" as const },
  ];

  const buyerActions = [
    { href: "/marketplace",               eyebrow: td("eyeMarket"),       title: td("actBrowseMarket"),   icon: Store,     tone: "olive" as const },
    { href: "/dashboard/my-bids",         eyebrow: td("eyeAuction"),      title: td("actMyBids"),          icon: Gavel,     tone: "amber" as const },
    { href: "/dashboard/my-rfqs",         eyebrow: td("eyeSourcing"),     title: td("actMyRfqs"),          icon: FileText,  tone: "teal"  as const },
    { href: "/dashboard/my-tokens",       eyebrow: td("eyeSettlement"),   title: td("actMyTokens"),        icon: Award,     tone: "sage"  as const },
    { href: "/dashboard/buyer-profile",   eyebrow: td("eyeAccount"),      title: td("actBuyerProfile"),   icon: Building2, tone: "sand"  as const },
    { href: "/kyc",                       eyebrow: td("eyeCompliance"),   title: td("actKyc"),             icon: Shield,    tone: "slate" as const },
  ];

  const openViewLabel = td("openViewCta");

  return (
    <>
      {/* Wizards rendered OUTSIDE PageTransition to avoid CSS transform ancestor breaking position:fixed */}
      {shouldShowOnboarding && isSeller ? (
        <SellerOnboardingWizard onComplete={() => setDismissedOnboarding(true)} />
      ) : null}
      {shouldShowOnboarding && isBuyer ? (
        <BuyerOnboardingWizard onComplete={() => setDismissedOnboarding(true)} />
      ) : null}

      <PageTransition className="space-y-6">
      <PageHeader
        eyebrow={isSeller ? td("operationsConsole") : td("buyerDesk")}
        title={`${td("welcome")}, ${user.name.split(" ")[0]}`}
        action={
          <Surface className="w-full p-4 sm:min-w-72">
            <div className="flex items-center justify-between gap-4">
              <RoleMark role={user.role} size="lg" showLabel meta={`KYC ${kycInfo.label}`} />
              <Badge variant={kycInfo.variant}>{kycInfo.label}</Badge>
            </div>
          </Surface>
        }
      />

      {user.kycStatus !== "APPROVED" ? (
        <Surface className="border-[#e4d2a7] bg-[#fff9ed] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-[#a6781f]" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#563f14]">
                  {kycGated ? td("kycActivate") : td("kycAlert")}
                </p>
                <p className="text-sm text-[#7d6435]">
                  {kycGated && isSeller
                    ? td("kycGatedSeller")
                    : kycGated && isBuyer
                      ? td("kycGatedBuyer")
                      : td("kycRequiredDesc")}
                </p>
              </div>
            </div>
            <Link
              href="/kyc"
              className="inline-flex h-10 items-center border border-[#b28124] bg-[#b28124] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#93681d]"
            >
              {td("uploadKycDocs")}
            </Link>
          </div>
        </Surface>
      ) : null}

      {!user.emailVerified ? (
        <Surface className="border-[#c5d9eb] bg-[#f4f9fe] p-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-[#2c6da5]" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#163a58]">{td("emailVerifyTitle")}</p>
              <p className="text-sm text-[#456682]">{td("emailVerifyDesc", { email: user.email })}</p>
            </div>
          </div>
        </Surface>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Surface className="p-3 sm:col-span-2 lg:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">{td("accountStatus")}</p>
              <RoleMark role={user.role} size="md" showLabel meta={`${user.country} market`} />
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant={kycInfo.variant}>{kycInfo.label}</Badge>
              <span className={`text-[11px] font-semibold ${user.emailVerified ? "text-emerald-700" : "text-amber-700"}`}>
                {user.emailVerified ? td("emailVerifiedYes") : td("emailPendingText")}
              </span>
            </div>
          </div>
        </Surface>

        <MetricCard
          compact
          label={isSeller ? td("liveListings") : td("marketplaceInventory")}
          value={activeListings ?? "-"}
          icon={isSeller ? LayoutGrid : ShoppingBag}
          tone="olive"
        />
        <MetricCard
          compact
          label={td("completedTransactions")}
          value={completedTxnCount ?? "-"}
          icon={CheckCircle2}
          tone="slate"
        />
        <MetricCard
          compact
          label={isSeller ? td("redeemedLots") : td("pendingPaymentsMetric")}
          value={isSeller ? lotStats.redeemed : pendingPayments.length}
          icon={isSeller ? Award : CreditCard}
          tone="amber"
        />
      </div>

      <Surface className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-stone-950">{td("quickActions")}</p>
          {kycGated ? <Badge variant="outline">{td("kycUnlockRequired")}</Badge> : null}
        </div>
        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 ${kycGated ? "opacity-75" : ""}`}>
          {(isSeller ? sellerActions : buyerActions).map((action) => (
            <ActionCard
              key={action.href}
              href={action.href}
              eyebrow={action.eyebrow}
              title={action.title}
              icon={action.icon}
              tone={action.tone}
              openLabel={openViewLabel}
            />
          ))}
        </div>
      </Surface>

      {isSeller ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <StatusBarChart title={td("submissionPipeline")} data={sellerSubmissionChart} />
            <StatusBarChart title={td("lotLifecycle")} data={sellerLotChart} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <StatusBarChart
              title={td("chartMarketplaceDistribution")}
              data={[
                { label: td("chartAuction"), value: marketplaceMixStats.auction, fill: "#627b55" },
                { label: td("chartRfq"), value: marketplaceMixStats.rfq, fill: "#55616f" },
                { label: td("chartHybrid"), value: marketplaceMixStats.hybrid, fill: "#c08a2b" },
              ]}
            />
            <StatusBarChart
              title={td("chartOpenRfqCoverage")}
              data={[
                { label: td("chartFresh"), value: rfqCoverageStats.fresh, fill: "#627b55" },
                { label: td("chartResponded"), value: rfqCoverageStats.responded, fill: "#55616f" },
                { label: td("chartUrgent"), value: rfqCoverageStats.urgent, fill: "#c08a2b" },
              ]}
            />
          </div>
        </>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <StatusBarChart
            title={td("chartMarketplaceDistribution")}
            data={[
              { label: td("chartAuction"), value: marketplaceMixStats.auction, fill: "#627b55" },
              { label: td("chartRfq"), value: marketplaceMixStats.rfq, fill: "#55616f" },
              { label: td("chartHybrid"), value: marketplaceMixStats.hybrid, fill: "#c08a2b" },
            ]}
          />
          <StatusBarChart
            title={td("chartMyBids")}
            data={[
              { label: td("chartActive"), value: buyerBidStats.active, fill: "#627b55" },
              { label: td("chartWon"), value: buyerBidStats.won, fill: "#2f7d71" },
              { label: td("chartOutbid"), value: buyerBidStats.outbid, fill: "#a85d56" },
              { label: td("chartCancelled"), value: buyerBidStats.cancelled, fill: "#55616f" },
            ]}
          />
          <StatusBarChart
            title={td("chartMyRfqs")}
            data={[
              { label: td("chartOpen"), value: buyerRfqStats.open, fill: "#627b55" },
              { label: td("chartQuoted"), value: buyerRfqStats.quoted, fill: "#c08a2b" },
              { label: td("chartAccepted"), value: buyerRfqStats.accepted, fill: "#2f7d71" },
              { label: td("chartClosed"), value: buyerRfqStats.closed, fill: "#55616f" },
            ]}
          />
          <StatusBarChart
            title={td("chartMyTokens")}
            data={[
              { label: td("chartActive"), value: buyerTokenStats.active, fill: "#506547" },
              { label: td("chartTransferred"), value: buyerTokenStats.transferred, fill: "#55616f" },
              { label: td("chartRedeemed"), value: buyerTokenStats.redeemed, fill: "#2f7d71" },
              { label: td("chartExpired"), value: buyerTokenStats.expired, fill: "#a85d56" },
            ]}
          />
        </div>
      )}

      {!isSeller && pendingPayments.length > 0 ? (
        <Surface className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-stone-950">{td("pendingPayments")}</p>
            <Badge variant="secondary">{td("openCount", { count: pendingPayments.length })}</Badge>
          </div>
          <div className="grid gap-3">
            {pendingPayments.map((tx) => (
              <Link
                key={tx.id}
                href={`/dashboard/payments/${tx.id}`}
                className="grid gap-2 border border-[#ddd4c4] bg-[#fffdf8] p-4 transition-colors hover:bg-[#faf6ee] md:grid-cols-[1fr_auto] md:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-stone-950">{tx.lotNumber}</p>
                  <p className="text-xs text-stone-500">{td("paymentPendingNote")}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-lg font-semibold text-stone-950">
                    {tx.currency} {Number(tx.grossAmount).toFixed(2)}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#405742]">{td("reviewPayment")}</p>
                </div>
              </Link>
            ))}
          </div>
        </Surface>
      ) : null}
    </PageTransition>
    </>
  );
}