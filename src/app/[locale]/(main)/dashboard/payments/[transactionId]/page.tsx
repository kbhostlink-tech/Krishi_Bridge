"use client";

import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback, use, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { Check, Lock, CheckCircle2, DollarSign, XCircle, ArrowLeftRight, CreditCard, Landmark, Clock } from "lucide-react";

interface TransactionDetail {
  id: string;
  lotId: string | null;
  rfqId: string | null;
  buyerId: string;
  sellerId: string;
  grossAmount: number;
  commissionAmount: number;
  taxOnGoods: number;
  taxOnCommission: number;
  netToSeller: number;
  currency: string;
  paymentMethod: string;
  status: string;
  gatewayOrderId: string | null;
  paidAt: string | null;
  escrowReleasedAt: string | null;
  createdAt: string;
  lot: {
    id: string;
    lotNumber: string;
    commodityType: string;
    grade: string;
    quantityKg: number;
    images: string[];
  } | null;
  buyer: {
    id: string;
    name: string;
    email: string;
    country: string;
  };
}

interface PlatformAccount {
  accountHolderName?: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  ifscCode?: string;
  swiftCode?: string;
  upiId?: string;
  additionalInstructions?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: ReactNode; color: string }> = {
  PENDING:          { label: "Awaiting Payment", variant: "secondary",    icon: <Clock className="w-4 h-4 inline" />, color: "amber" },
  MANUAL_CONFIRMED: { label: "Payment Confirmed", variant: "outline",    icon: <Check className="w-4 h-4 inline" />,  color: "blue" },
  ESCROW_HELD:      { label: "Escrow Held",       variant: "outline",    icon: <Lock className="w-4 h-4 inline" />, color: "blue" },
  COMPLETED:        { label: "Completed",          variant: "default",    icon: <CheckCircle2 className="w-4 h-4 inline" />, color: "emerald" },
  FUNDS_RELEASED:   { label: "Funds Released",     variant: "default",    icon: <DollarSign className="w-4 h-4 inline" />, color: "emerald" },
  FAILED:           { label: "Failed",             variant: "destructive", icon: <XCircle className="w-4 h-4 inline" />, color: "red" },
  REFUNDED:         { label: "Refunded",           variant: "outline",    icon: <ArrowLeftRight className="w-4 h-4 inline" />, color: "gray" },
};

const methodLabels: Record<string, string> = {
  UPI: "UPI",
  CARD: "Credit/Debit Card",
  NET_BANKING: "Net Banking",
  ESEWA: "eSewa",
  KHALTI: "Khalti",
  BANK_TRANSFER: "Bank Transfer",
  STRIPE: "Stripe",
  TAP: "Tap Payments",
  WISE: "Wise",
  MANUAL_OFFLINE: "Manual Bank Transfer",
};

export default function PaymentDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = use(params);
  const t = useTranslations("payments");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [platformAccount, setPlatformAccount] = useState<PlatformAccount | null>(null);
  const [buyerPaymentCode, setBuyerPaymentCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!accessToken || !transactionId) return;

    const fetchData = async () => {
      try {
        // Fetch transaction details
        const txRes = await fetch(`/api/payments/${transactionId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!txRes.ok) throw new Error("Failed to load payment details");
        const txData = await txRes.json();
        setTransaction(txData.transaction);

        // If buyer with a PENDING payment, fetch platform account
        if (txData.transaction.buyerId === user?.id) {
          try {
            const paRes = await fetch("/api/platform-account", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (paRes.ok) {
              const paData = await paRes.json();
              setPlatformAccount(paData.platformAccount);
              setBuyerPaymentCode(paData.buyerPaymentCode);
            }
          } catch {
            // Platform account not configured, non-critical
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken, transactionId, user?.id]);

  const copyCode = useCallback(() => {
    if (!buyerPaymentCode) return;
    navigator.clipboard.writeText(buyerPaymentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buyerPaymentCode]);

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-sage-100 rounded animate-pulse" />
        <div className="h-64 bg-white rounded-3xl animate-pulse" />
        <div className="h-48 bg-white rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <CreditCard className="w-10 h-10 text-sage-400 mx-auto mb-4" />
        <h2 className="font-heading text-sage-900 text-2xl font-bold mb-2">
          {t("notFound")}
        </h2>
        <p className="text-sage-500 mb-6">{error || t("notFoundDesc")}</p>
        <Link
          href="/dashboard"
          className="inline-flex h-10 px-6 items-center bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors"
        >
          {t("backToDashboard")}
        </Link>
      </div>
    );
  }

  const status = statusConfig[transaction.status] || statusConfig.PENDING;
  const isBuyer = user?.id === transaction.buyerId;
  const totalBuyerPays = Number(transaction.grossAmount) + Number(transaction.commissionAmount) + Number(transaction.taxOnGoods) + Number(transaction.taxOnCommission);
  const isPendingPayment = transaction.status === "PENDING" && isBuyer;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-script text-sage-500 text-lg">{t("title")}</p>
          <h1 className="font-heading text-sage-900 text-3xl font-bold">
            {t("paymentDetails")}
          </h1>
        </div>
        <Badge variant={status.variant} className="text-sm px-3 py-1">
          {status.icon} {status.label}
        </Badge>
      </div>

      {/* PENDING — Payment Instructions for Buyer */}
      {isPendingPayment && (
        <Card className="rounded-3xl border-amber-300 bg-amber-50 shadow-md">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Landmark className="w-6 h-6 text-amber-700 flex-shrink-0" />
              <div>
                <p className="text-amber-900 font-heading font-bold text-lg">Complete Your Payment</p>
                <p className="text-amber-700 text-sm mt-1">
                  Transfer the exact amount below to the platform bank account. Include your unique payment code in the payment remarks/reference.
                </p>
              </div>
            </div>

            {/* Amount to Pay */}
            <div className="bg-white rounded-2xl p-4 border border-amber-200">
              <p className="text-sage-500 text-xs uppercase tracking-wide font-medium mb-1">Amount to Pay</p>
              <p className="font-heading text-sage-900 text-3xl font-bold">
                {transaction.currency} {totalBuyerPays.toFixed(2)}
              </p>
            </div>

            {/* Unique Payment Code */}
            {buyerPaymentCode && (
              <div className="bg-sage-900 text-white rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sage-300 text-xs uppercase tracking-wide font-medium mb-1">Your Unique Payment Code</p>
                  <p className="font-mono text-2xl font-bold tracking-widest">{buyerPaymentCode}</p>
                  <p className="text-sage-400 text-xs mt-1">Write this in payment remarks/reference</p>
                </div>
                <button
                  onClick={copyCode}
                  className="flex-shrink-0 ml-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            )}

            {/* Platform Bank Account Details */}
            {platformAccount && (
              <div className="bg-white rounded-2xl p-4 border border-amber-200 space-y-2">
                <p className="text-sage-900 font-heading font-bold text-sm mb-3">Platform Bank Account</p>
                {platformAccount.bankName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-sage-500">Bank</span>
                    <span className="text-sage-900 font-medium">{platformAccount.bankName}</span>
                  </div>
                )}
                {platformAccount.accountHolderName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-sage-500">Account Holder</span>
                    <span className="text-sage-900 font-medium">{platformAccount.accountHolderName}</span>
                  </div>
                )}
                {platformAccount.accountNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-sage-500">Account Number</span>
                    <span className="text-sage-900 font-mono font-medium">{platformAccount.accountNumber}</span>
                  </div>
                )}
                {platformAccount.branchName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-sage-500">Branch</span>
                    <span className="text-sage-900">{platformAccount.branchName}</span>
                  </div>
                )}
                {platformAccount.ifscCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-sage-500">IFSC Code</span>
                    <span className="text-sage-900 font-mono">{platformAccount.ifscCode}</span>
                  </div>
                )}
                {platformAccount.swiftCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-sage-500">SWIFT Code</span>
                    <span className="text-sage-900 font-mono">{platformAccount.swiftCode}</span>
                  </div>
                )}
                {platformAccount.upiId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-sage-500">UPI ID</span>
                    <span className="text-sage-900 font-mono">{platformAccount.upiId}</span>
                  </div>
                )}
                {platformAccount.additionalInstructions && (
                  <div className="mt-3 p-3 bg-sage-50 rounded-xl text-sm text-sage-600">
                    {platformAccount.additionalInstructions}
                  </div>
                )}
              </div>
            )}

            {!platformAccount && (
              <div className="bg-white rounded-2xl p-4 border border-amber-200 text-center text-sm text-sage-500">
                Platform bank account details are not yet configured. Please contact support.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MANUAL_CONFIRMED — Admin is reviewing */}
      {transaction.status === "MANUAL_CONFIRMED" && (
        <Card className="rounded-3xl border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium">Payment Confirmed — Under Review</p>
                <p className="text-blue-600 text-sm mt-1">
                  {isBuyer
                    ? "Your payment has been received and confirmed. The admin is reviewing and will release funds to the seller. You will receive your commodity token once processing is complete."
                    : "The buyer's payment has been confirmed. The admin will review and release funds to your registered bank account shortly."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ESCROW_HELD */}
      {transaction.status === "ESCROW_HELD" && (
        <Card className="rounded-3xl border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium">Payment Secured in Escrow</p>
                <p className="text-blue-600 text-sm mt-1">
                  {isBuyer
                    ? "Your payment is held securely in escrow. Funds will be released to the seller once you collect the commodity at the warehouse and your token is redeemed."
                    : "The buyer's payment is secured in escrow. Funds will be released to you once the buyer collects the commodity and the token is redeemed at the warehouse."}
                </p>
              </div>
            </div>
            {isBuyer && (
              <Link
                href="/dashboard/my-tokens"
                className="inline-flex h-9 px-5 items-center bg-blue-700 text-white rounded-full font-medium text-sm hover:bg-blue-800 transition-colors mt-4"
              >
                {t("viewToken")} →
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* COMPLETED */}
      {transaction.status === "COMPLETED" && (
        <Card className="rounded-3xl border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-emerald-800 font-medium">{t("completedTitle")}</p>
                <p className="text-emerald-600 text-sm mt-1">{t("completedDesc")}</p>
              </div>
            </div>
            {isBuyer && (
              <Link
                href="/dashboard/my-tokens"
                className="inline-flex h-9 px-5 items-center bg-emerald-700 text-white rounded-full font-medium text-sm hover:bg-emerald-800 transition-colors mt-4"
              >
                {t("viewToken")} →
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* FUNDS_RELEASED */}
      {transaction.status === "FUNDS_RELEASED" && (
        <Card className="rounded-3xl border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-emerald-800 font-medium">Transaction Complete</p>
                <p className="text-emerald-600 text-sm mt-1">
                  {isBuyer
                    ? "This transaction is fully complete. Funds have been released to the seller."
                    : `Funds of ${transaction.currency} ${Number(transaction.netToSeller).toFixed(2)} have been released to your registered bank account.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAILED */}
      {transaction.status === "FAILED" && (
        <Card className="rounded-3xl border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">{t("failedTitle")}</p>
                <p className="text-red-600 text-sm mt-1">{t("failedDesc")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lot Details */}
      {transaction.lot && (
        <Card className="rounded-3xl border-sage-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900 font-heading">{t("lotDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              {transaction.lot.images?.[0] && (
                <img
                  src={transaction.lot.images[0]}
                  alt={transaction.lot.commodityType}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              )}
              <div>
                <p className="font-heading font-bold text-sage-900">
                  {transaction.lot.commodityType} — {transaction.lot.grade}
                </p>
                <p className="text-sage-500 text-sm">
                  Lot #{transaction.lot.lotNumber} · {transaction.lot.quantityKg} kg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Breakdown */}
      <Card className="rounded-3xl border-sage-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900 font-heading">{t("priceBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-sage-500">{t("grossAmount")}</span>
            <span className="text-sage-900 font-medium">
              {transaction.currency} {Number(transaction.grossAmount).toFixed(2)}
            </span>
          </div>

          <Separator className="bg-sage-100" />

          <div className="flex justify-between text-sm">
            <span className="text-sage-500">{t("commission")}</span>
            <span className="text-sage-600">{transaction.currency} {Number(transaction.commissionAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sage-500">Tax on Goods</span>
            <span className="text-sage-600">{transaction.currency} {Number(transaction.taxOnGoods).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sage-500">Tax on Commission</span>
            <span className="text-sage-600">{transaction.currency} {Number(transaction.taxOnCommission).toFixed(2)}</span>
          </div>

          <Separator className="bg-sage-100" />

          {isBuyer ? (
            <div className="flex justify-between font-bold">
              <span className="text-sage-900">{t("totalPaid")}</span>
              <span className="text-sage-900">
                {transaction.currency} {totalBuyerPays.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between font-bold">
              <span className="text-sage-900">{t("netReceived")}</span>
              <span className="text-emerald-700">{transaction.currency} {Number(transaction.netToSeller).toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method & Reference */}
      <Card className="rounded-3xl border-sage-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900 font-heading">{t("paymentInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-sage-500">{t("method")}</span>
            <span className="text-sage-900">{methodLabels[transaction.paymentMethod] || transaction.paymentMethod}</span>
          </div>
          {transaction.gatewayOrderId && (
            <div className="flex justify-between">
              <span className="text-sage-500">{t("reference")}</span>
              <span className="text-sage-600 font-mono text-xs">{transaction.gatewayOrderId}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sage-500">{t("date")}</span>
            <span className="text-sage-600">
              {new Date(transaction.createdAt).toLocaleString()}
            </span>
          </div>
          {transaction.paidAt && (
            <div className="flex justify-between">
              <span className="text-sage-500">Paid At</span>
              <span className="text-sage-600">
                {new Date(transaction.paidAt).toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 px-6 items-center border border-sage-200 text-sage-700 rounded-full font-medium text-sm hover:bg-sage-50 transition-colors"
        >
          ← {t("backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
