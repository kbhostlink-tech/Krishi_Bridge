"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { AlertTriangle, Landmark, Inbox } from "lucide-react";

interface UserActivity {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    adminRole: string | null;
    country: string;
    kycStatus: string;
    isActive: boolean;
    emailVerified: boolean;
    preferredLang: string | null;
    createdAt: string;
    updatedAt: string;
    buyerProfile: {
      buyerType: string;
      companyName: string | null;
      tradeName: string | null;
      fullAddress: string | null;
      city: string | null;
      website: string | null;
      contactDesignation: string | null;
      alternateContact: string | null;
      mobile: string | null;
      registrationNumber: string | null;
      taxId: string | null;
      importExportLicense: string | null;
      yearsInBusiness: number | null;
      typicalMonthlyVolumeMin: number | null;
      typicalMonthlyVolumeMax: number | null;
      preferredOrigins: string[];
      preferredGrades: string[];
      packagingPreference: string | null;
    } | null;
    sellerProfile: {
      sellerType: string;
      entityName: string | null;
      contactPersonName: string | null;
      mobile: string | null;
      languagePreference: string | null;
      state: string | null;
      district: string | null;
      village: string | null;
      registrationId: string | null;
      fpoName: string | null;
      yearsOfActivity: number | null;
      typicalAnnualVolume: number | null;
      originRegion: string | null;
      harvestSeason: string | null;
      postHarvestProcess: string | null;
      minAcceptableQuantity: number | null;
      willingToNegotiate: boolean;
      bankAccountName: string | null;
      bankAccountNumber: string | null;
      bankName: string | null;
      bankBranch: string | null;
      bankIfscCode: string | null;
    } | null;
    uniquePaymentCode: string | null;
  };
  activity: {
    lots: { id: string; lotNumber: string; commodityType: string; grade: string; status: string; quantityKg: number; createdAt: string }[];
    bids: { id: string; amountInr: number; status: string; createdAt: string; lot: { lotNumber: string; commodityType: string } }[];
    transactions: { id: string; grossAmount: number; commissionAmount: number; netToSeller: number; status: string; paymentMethod: string | null; currency: string; createdAt: string; lot: { lotNumber: string } | null }[];
    tokens: { id: string; hmacHash: string; status: string; lot: { lotNumber: string; commodityType: string }; createdAt: string }[];
    rfqRequests: { id: string; commodityType: string; quantityKg: number; status: string; responseCount: number; createdAt: string }[];
    rfqResponses: { id: string; status: string; deliveryDays: number | null; createdAt: string; rfq: { commodityType: string; quantityKg: number } }[];
    auditLogs: { id: string; action: string; entity: string; entityId: string | null; createdAt: string }[];
  };
}

const KYC_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  UNDER_REVIEW: { label: "Under Review", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  AUCTION_LIVE: "bg-blue-100 text-blue-800",
  SOLD: "bg-sage-100 text-sage-800",
  COMPLETED: "bg-green-100 text-green-800",
  MANUAL_CONFIRMED: "bg-sky-100 text-sky-800",
  FUNDS_RELEASED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-gray-100 text-gray-700",
  REJECTED: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
  ESCROW_HELD: "bg-amber-100 text-amber-800",
  REFUNDED: "bg-purple-100 text-purple-800",
  MINTED: "bg-blue-100 text-blue-800",
  REDEEMED: "bg-green-100 text-green-800",
  REVOKED: "bg-red-100 text-red-800",
  WON: "bg-green-100 text-green-800",
  OUTBID: "bg-amber-100 text-amber-800",
  OPEN: "bg-blue-100 text-blue-800",
  CLOSED: "bg-gray-100 text-gray-700",
  ACCEPTED: "bg-green-100 text-green-800",
  WITHDRAWN: "bg-gray-100 text-gray-700",
};

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India", NP: "Nepal", BT: "Bhutan", AE: "UAE", SA: "Saudi Arabia", OM: "Oman",
};

export default function AdminUserDetailPage() {
  const { accessToken } = useAuth();
  const params = useParams();
  const userId = params.userId as string;

  const [data, setData] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("lots");

  useEffect(() => {
    if (!accessToken || !userId) return;

    let active = true;

    fetch(`/api/admin/users/${userId}/activity`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load user");
        return res.json();
      })
      .then((d) => {
        if (!active) return;
        setData(d);
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, userId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-sage-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="w-10 h-10 text-sage-300" />
        <p className="text-sage-500 text-sm">{error || "User not found"}</p>
        <Button variant="outline" className="rounded-full" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const { user, activity } = data;
  const kyc = KYC_BADGE[user.kycStatus] || KYC_BADGE.PENDING;

  const tabs = [
    { key: "lots", label: "Lots", count: activity.lots.length },
    { key: "bids", label: "Bids", count: activity.bids.length },
    { key: "transactions", label: "Transactions", count: activity.transactions.length },
    { key: "tokens", label: "Tokens", count: activity.tokens.length },
    { key: "rfqRequests", label: "RFQ Sent", count: activity.rfqRequests.length },
    { key: "rfqResponses", label: "RFQ Responses", count: activity.rfqResponses.length },
    { key: "auditLogs", label: "Audit Log", count: activity.auditLogs.length },
  ];

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtCurrency = (n: number, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="rounded-full text-sage-500 hover:text-sage-900">
            ← Back
          </Button>
        </Link>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">User Profile</h1>
      </div>

      {/* User Card */}
      <Card className="rounded-2xl border-sage-100">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 font-heading font-bold text-2xl shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h2 className="text-sage-900 font-heading font-bold text-xl">{user.name}</h2>
                <p className="text-sage-500 text-sm">{user.email} {user.phone && `• ${user.phone}`}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-sage-100 text-sage-700">
                  {user.role.replace(/_/g, " ")}
                  {user.adminRole && ` — ${user.adminRole.replace(/_/g, " ")}`}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-sage-50 text-sage-600">
                  {COUNTRY_NAMES[user.country] || user.country}
                </span>
                <Badge variant={kyc.variant} className="text-[10px]">{kyc.label}</Badge>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-400"}`} />
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-sage-400">Email Verified</span>
                  <p className="text-sage-700 font-medium">{user.emailVerified ? "Yes" : "No"}</p>
                </div>
                <div>
                  <span className="text-sage-400">Language</span>
                  <p className="text-sage-700 font-medium">{user.preferredLang || "en"}</p>
                </div>
                <div>
                  <span className="text-sage-400">Joined</span>
                  <p className="text-sage-700 font-medium">{fmtDate(user.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sage-400">Last Updated</span>
                  <p className="text-sage-700 font-medium">{fmtDate(user.updatedAt)}</p>
                </div>
              </div>
              {/* Buyer/Seller Profile */}
              {user.uniquePaymentCode && (
                <div className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-amber-600 font-medium">Unique Payment Code: </span>
                  <span className="font-mono font-bold text-amber-800 text-sm">{user.uniquePaymentCode}</span>
                </div>
              )}
              {user.buyerProfile && (
                <div className="text-xs bg-sage-50/50 rounded-xl p-4 space-y-2">
                  <p className="text-sage-400 font-medium uppercase tracking-wider">Buyer Profile</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                    <div>
                      <span className="text-sage-400">Buyer Type</span>
                      <p className="text-sage-700 font-medium">{user.buyerProfile.buyerType?.replace(/_/g, " ") || "N/A"}</p>
                    </div>
                    {user.buyerProfile.companyName && (
                      <div>
                        <span className="text-sage-400">Company</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.companyName}</p>
                      </div>
                    )}
                    {user.buyerProfile.tradeName && (
                      <div>
                        <span className="text-sage-400">Trade Name</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.tradeName}</p>
                      </div>
                    )}
                    {user.buyerProfile.mobile && (
                      <div>
                        <span className="text-sage-400">Mobile</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.mobile}</p>
                      </div>
                    )}
                    {user.buyerProfile.contactDesignation && (
                      <div>
                        <span className="text-sage-400">Designation</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.contactDesignation}</p>
                      </div>
                    )}
                    {user.buyerProfile.alternateContact && (
                      <div>
                        <span className="text-sage-400">Alt Contact</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.alternateContact}</p>
                      </div>
                    )}
                    {user.buyerProfile.fullAddress && (
                      <div>
                        <span className="text-sage-400">Address</span>
                        <p className="text-sage-700 font-medium">{[user.buyerProfile.fullAddress, user.buyerProfile.city].filter(Boolean).join(", ")}</p>
                      </div>
                    )}
                    {user.buyerProfile.website && (
                      <div>
                        <span className="text-sage-400">Website</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.website}</p>
                      </div>
                    )}
                    {user.buyerProfile.registrationNumber && (
                      <div>
                        <span className="text-sage-400">Registration #</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.registrationNumber}</p>
                      </div>
                    )}
                    {user.buyerProfile.taxId && (
                      <div>
                        <span className="text-sage-400">Tax ID / GST</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.taxId}</p>
                      </div>
                    )}
                    {user.buyerProfile.importExportLicense && (
                      <div>
                        <span className="text-sage-400">Import/Export License</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.importExportLicense}</p>
                      </div>
                    )}
                    {user.buyerProfile.yearsInBusiness != null && (
                      <div>
                        <span className="text-sage-400">Years in Business</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.yearsInBusiness} years</p>
                      </div>
                    )}
                    {(user.buyerProfile.typicalMonthlyVolumeMin != null || user.buyerProfile.typicalMonthlyVolumeMax != null) && (
                      <div>
                        <span className="text-sage-400">Monthly Volume</span>
                        <p className="text-sage-700 font-medium">
                          {user.buyerProfile.typicalMonthlyVolumeMin?.toLocaleString() || "0"} – {user.buyerProfile.typicalMonthlyVolumeMax?.toLocaleString() || "∞"} kg
                        </p>
                      </div>
                    )}
                    {user.buyerProfile.preferredOrigins?.length > 0 && (
                      <div>
                        <span className="text-sage-400">Preferred Origins</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.preferredOrigins.join(", ")}</p>
                      </div>
                    )}
                    {user.buyerProfile.preferredGrades?.length > 0 && (
                      <div>
                        <span className="text-sage-400">Preferred Grades</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.preferredGrades.join(", ")}</p>
                      </div>
                    )}
                    {user.buyerProfile.packagingPreference && (
                      <div>
                        <span className="text-sage-400">Packaging Preference</span>
                        <p className="text-sage-700 font-medium">{user.buyerProfile.packagingPreference}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {user.sellerProfile && (
                <div className="text-xs bg-sage-50/50 rounded-xl p-4 space-y-2">
                  <p className="text-sage-400 font-medium uppercase tracking-wider">Seller Profile</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                    <div>
                      <span className="text-sage-400">Seller Type</span>
                      <p className="text-sage-700 font-medium">{user.sellerProfile.sellerType.replace(/_/g, " ")}</p>
                    </div>
                    {user.sellerProfile.entityName && (
                      <div>
                        <span className="text-sage-400">Entity Name</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.entityName}</p>
                      </div>
                    )}
                    {user.sellerProfile.contactPersonName && (
                      <div>
                        <span className="text-sage-400">Contact Person</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.contactPersonName}</p>
                      </div>
                    )}
                    {user.sellerProfile.mobile && (
                      <div>
                        <span className="text-sage-400">Mobile</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.mobile}</p>
                      </div>
                    )}
                    {user.sellerProfile.languagePreference && (
                      <div>
                        <span className="text-sage-400">Language</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.languagePreference}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sage-400">Location</span>
                      <p className="text-sage-700 font-medium">
                        {[user.sellerProfile.village, user.sellerProfile.district, user.sellerProfile.state].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    {user.sellerProfile.registrationId && (
                      <div>
                        <span className="text-sage-400">Registration ID</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.registrationId}</p>
                      </div>
                    )}
                    {user.sellerProfile.fpoName && (
                      <div>
                        <span className="text-sage-400">FPO Name</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.fpoName}</p>
                      </div>
                    )}
                    {user.sellerProfile.yearsOfActivity != null && (
                      <div>
                        <span className="text-sage-400">Years Active</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.yearsOfActivity} years</p>
                      </div>
                    )}
                    {user.sellerProfile.typicalAnnualVolume != null && (
                      <div>
                        <span className="text-sage-400">Annual Volume</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.typicalAnnualVolume.toLocaleString()} kg</p>
                      </div>
                    )}
                    {user.sellerProfile.originRegion && (
                      <div>
                        <span className="text-sage-400">Origin Region</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.originRegion}</p>
                      </div>
                    )}
                    {user.sellerProfile.harvestSeason && (
                      <div>
                        <span className="text-sage-400">Harvest Season</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.harvestSeason}</p>
                      </div>
                    )}
                    {user.sellerProfile.postHarvestProcess && (
                      <div>
                        <span className="text-sage-400">Post-Harvest</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.postHarvestProcess}</p>
                      </div>
                    )}
                    {user.sellerProfile.minAcceptableQuantity != null && (
                      <div>
                        <span className="text-sage-400">Min Quantity</span>
                        <p className="text-sage-700 font-medium">{user.sellerProfile.minAcceptableQuantity} kg</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sage-400">Negotiation</span>
                      <p className="text-sage-700 font-medium">{user.sellerProfile.willingToNegotiate ? "Open to Negotiate" : "Fixed Terms"}</p>
                    </div>
                  </div>
                  {/* Bank Details (admin-only) */}
                  {(user.sellerProfile.bankAccountName || user.sellerProfile.bankAccountNumber) && (
                    <div className="mt-3 pt-3 border-t border-sage-200">
                      <p className="text-sage-400 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5"><Landmark className="w-4 h-4" /> Bank Details (Confidential)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                        {user.sellerProfile.bankAccountName && (
                          <div>
                            <span className="text-sage-400">Account Holder</span>
                            <p className="text-sage-700 font-medium">{user.sellerProfile.bankAccountName}</p>
                          </div>
                        )}
                        {user.sellerProfile.bankAccountNumber && (
                          <div>
                            <span className="text-sage-400">Account Number</span>
                            <p className="text-sage-700 font-medium font-mono">{user.sellerProfile.bankAccountNumber}</p>
                          </div>
                        )}
                        {user.sellerProfile.bankName && (
                          <div>
                            <span className="text-sage-400">Bank</span>
                            <p className="text-sage-700 font-medium">{user.sellerProfile.bankName}</p>
                          </div>
                        )}
                        {user.sellerProfile.bankBranch && (
                          <div>
                            <span className="text-sage-400">Branch</span>
                            <p className="text-sage-700 font-medium">{user.sellerProfile.bankBranch}</p>
                          </div>
                        )}
                        {user.sellerProfile.bankIfscCode && (
                          <div>
                            <span className="text-sage-400">IFSC/SWIFT</span>
                            <p className="text-sage-700 font-medium font-mono">{user.sellerProfile.bankIfscCode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-xl p-3 text-center transition-colors border ${
              activeTab === t.key
                ? "bg-sage-900 text-white border-sage-900"
                : "bg-white text-sage-700 border-sage-100 hover:border-sage-300"
            }`}
          >
            <p className="text-lg font-bold">{t.count}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{t.label}</p>
          </button>
        ))}
      </div>

      {/* Activity Tabs Content */}
      <Card className="rounded-2xl border-sage-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sage-900 font-heading text-base">
            {tabs.find((t) => t.key === activeTab)?.label} (latest 20)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === "lots" && (
            activity.lots.length === 0 ? <EmptyTab label="lots" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100 text-sage-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-3">Lot #</th>
                      <th className="text-left py-2 px-3">Commodity</th>
                      <th className="text-left py-2 px-3">Grade</th>
                      <th className="text-right py-2 px-3">Qty (kg)</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.lots.map((l) => (
                      <tr key={l.id} className="border-b border-sage-50 hover:bg-sage-50/30">
                        <td className="py-2.5 px-3 font-mono text-xs text-sage-700">{l.lotNumber}</td>
                        <td className="py-2.5 px-3 text-sage-700">{l.commodityType}</td>
                        <td className="py-2.5 px-3 text-sage-500">{l.grade}</td>
                        <td className="py-2.5 px-3 text-right text-sage-700">{l.quantityKg.toLocaleString()}</td>
                        <td className="py-2.5 px-3"><StatusPill status={l.status} /></td>
                        <td className="py-2.5 px-3 text-sage-500 text-xs">{fmtDate(l.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === "bids" && (
            activity.bids.length === 0 ? <EmptyTab label="bids" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100 text-sage-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-3">Lot</th>
                      <th className="text-left py-2 px-3">Commodity</th>
                      <th className="text-right py-2 px-3">Amount</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.bids.map((b) => (
                      <tr key={b.id} className="border-b border-sage-50 hover:bg-sage-50/30">
                        <td className="py-2.5 px-3 font-mono text-xs text-sage-700">{b.lot.lotNumber}</td>
                        <td className="py-2.5 px-3 text-sage-700">{b.lot.commodityType}</td>
                        <td className="py-2.5 px-3 text-right text-sage-900 font-medium">{fmtCurrency(b.amountInr)}</td>
                        <td className="py-2.5 px-3"><StatusPill status={b.status} /></td>
                        <td className="py-2.5 px-3 text-sage-500 text-xs">{fmtDate(b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === "transactions" && (
            activity.transactions.length === 0 ? <EmptyTab label="transactions" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100 text-sage-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-3">Lot</th>
                      <th className="text-left py-2 px-3">Method</th>
                      <th className="text-right py-2 px-3">Gross</th>
                      <th className="text-right py-2 px-3">Commission</th>
                      <th className="text-right py-2 px-3">Net</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.transactions.map((t) => (
                      <tr key={t.id} className="border-b border-sage-50 hover:bg-sage-50/30">
                        <td className="py-2.5 px-3 font-mono text-xs text-sage-700">{t.lot?.lotNumber || "—"}</td>
                        <td className="py-2.5 px-3 text-sage-500 text-xs">{t.paymentMethod || "—"}</td>
                        <td className="py-2.5 px-3 text-right text-sage-900 font-medium">{fmtCurrency(t.grossAmount, t.currency)}</td>
                        <td className="py-2.5 px-3 text-right text-sage-500">{fmtCurrency(t.commissionAmount, t.currency)}</td>
                        <td className="py-2.5 px-3 text-right text-green-700 font-medium">{fmtCurrency(t.netToSeller, t.currency)}</td>
                        <td className="py-2.5 px-3"><StatusPill status={t.status} /></td>
                        <td className="py-2.5 px-3 text-sage-500 text-xs">{fmtDate(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === "tokens" && (
            activity.tokens.length === 0 ? <EmptyTab label="tokens" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100 text-sage-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-3">Token Hash</th>
                      <th className="text-left py-2 px-3">Lot</th>
                      <th className="text-left py-2 px-3">Commodity</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.tokens.map((tk) => (
                      <tr key={tk.id} className="border-b border-sage-50 hover:bg-sage-50/30">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-sage-600 max-w-[180px] truncate">{tk.hmacHash}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-sage-700">{tk.lot.lotNumber}</td>
                        <td className="py-2.5 px-3 text-sage-700">{tk.lot.commodityType}</td>
                        <td className="py-2.5 px-3"><StatusPill status={tk.status} /></td>
                        <td className="py-2.5 px-3 text-sage-500 text-xs">{fmtDate(tk.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === "rfqRequests" && (
            activity.rfqRequests.length === 0 ? <EmptyTab label="RFQ requests" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100 text-sage-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-3">Commodity</th>
                      <th className="text-right py-2 px-3">Qty (kg)</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-right py-2 px-3">Responses</th>
                      <th className="text-left py-2 px-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.rfqRequests.map((r) => (
                      <tr key={r.id} className="border-b border-sage-50 hover:bg-sage-50/30">
                        <td className="py-2.5 px-3 text-sage-700">{r.commodityType}</td>
                        <td className="py-2.5 px-3 text-right text-sage-700">{r.quantityKg.toLocaleString()}</td>
                        <td className="py-2.5 px-3"><StatusPill status={r.status} /></td>
                        <td className="py-2.5 px-3 text-right text-sage-700">{r.responseCount}</td>
                        <td className="py-2.5 px-3 text-sage-500 text-xs">{fmtDate(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === "rfqResponses" && (
            activity.rfqResponses.length === 0 ? <EmptyTab label="RFQ responses" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100 text-sage-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-3">Commodity</th>
                      <th className="text-right py-2 px-3">Qty (kg)</th>
                      <th className="text-right py-2 px-3">Delivery Days</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.rfqResponses.map((r) => (
                      <tr key={r.id} className="border-b border-sage-50 hover:bg-sage-50/30">
                        <td className="py-2.5 px-3 text-sage-700">{r.rfq.commodityType}</td>
                        <td className="py-2.5 px-3 text-right text-sage-700">{Number(r.rfq.quantityKg).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-sage-700">{r.deliveryDays ?? "—"}</td>
                        <td className="py-2.5 px-3"><StatusPill status={r.status} /></td>
                        <td className="py-2.5 px-3 text-sage-500 text-xs">{fmtDate(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === "auditLogs" && (
            activity.auditLogs.length === 0 ? <EmptyTab label="audit logs" /> : (
              <div className="space-y-2">
                {activity.auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-sage-50/50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-sage-300 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sage-900 text-sm font-medium">{log.action}</p>
                      <p className="text-sage-500 text-xs">{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}</p>
                    </div>
                    <span className="text-sage-400 text-xs shrink-0">{fmtDate(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="text-center py-10">
      <div className="flex justify-center mb-2"><Inbox className="w-8 h-8 text-sage-300" /></div>
      <p className="text-sage-400 text-sm">No {label} found for this user.</p>
    </div>
  );
}
