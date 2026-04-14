"use client";

import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { useEffect, useState, use, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { CircleDot, RefreshCw, CheckCircle2, Clock, Ticket, AlertTriangle, Smartphone, Wheat, MapPin, Package, RotateCcw } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

interface TokenTransfer {
  id: string;
  fromUser: { name: string; email: string };
  toUser: { name: string; email: string };
  priceInr: number | null;
  transferredAt: string;
}

interface TokenDetail {
  id: string;
  status: string;
  hmacHash: string | null;
  mintedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  owner: { id: string; name: string; email: string; country: string };
  lot: {
    id: string;
    lotNumber: string;
    commodityType: string;
    grade: string;
    quantityKg: number;
    images: string[];
    warehouse: { name: string; city: string } | null;
    farmer: { name: string };
  } | null;
  transfers: TokenTransfer[];
  qrData: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: ReactNode }> = {
  ACTIVE: { label: "Active", variant: "default", icon: <CircleDot className="w-4 h-4 text-green-600" /> },
  TRANSFERRED: { label: "Transferred", variant: "secondary", icon: <RefreshCw className="w-4 h-4 text-blue-600" /> },
  REDEEMED: { label: "Redeemed", variant: "outline", icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
  EXPIRED: { label: "Expired", variant: "destructive", icon: <Clock className="w-4 h-4 text-red-600" /> },
};

export default function TokenDetailPage({
  params,
}: {
  params: Promise<{ tokenId: string }>;
}) {
  const { tokenId } = use(params);
  const t = useTranslations("tokens");
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const { display } = useCurrency();
  const [token, setToken] = useState<TokenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Transfer form
  const [transferEmail, setTransferEmail] = useState("");
  const [transferPrice, setTransferPrice] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Redeem
  const [redeeming, setRedeeming] = useState(false);
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false);

  const fetchToken = () => {
    if (!accessToken || !tokenId) return;

    fetch(`/api/tokens/${tokenId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load token details");
        return r.json();
      })
      .then((data) => setToken(data.token))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchToken, [accessToken, tokenId]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !transferEmail) return;

    setTransferring(true);
    setTransferResult(null);

    try {
      const res = await fetch(`/api/tokens/${tokenId}/transfer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail: transferEmail,
          priceInr: transferPrice ? parseFloat(transferPrice) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTransferResult({ ok: false, message: data.error || "Transfer failed" });
      } else {
        setTransferResult({ ok: true, message: "Token transferred successfully!" });
        setTransferEmail("");
        setTransferPrice("");
        // Refresh token data
        setLoading(true);
        fetchToken();
      }
    } catch {
      setTransferResult({ ok: false, message: "Network error" });
    } finally {
      setTransferring(false);
    }
  };

  const handleRedeem = async () => {
    if (!accessToken || redeeming) return;
    setRedeeming(true);
    try {
      const res = await fetch(`/api/tokens/${tokenId}/redeem`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Redemption failed");
        return;
      }
      toast.success("Token redeemed! Goods received confirmed.");
      setShowRedeemConfirm(false);
      setLoading(true);
      fetchToken();
    } catch {
      toast.error("Failed to redeem token");
    } finally {
      setRedeeming(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-sage-100 rounded animate-pulse" />
        <div className="h-64 bg-white rounded-3xl animate-pulse" />
        <div className="h-48 bg-white rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <Ticket className="w-10 h-10 text-sage-300" />
        <h2 className="font-heading text-sage-900 text-2xl font-bold mb-2">
          {t("tokenNotFound")}
        </h2>
        <p className="text-sage-500 mb-6">{error || t("tokenNotFoundDesc")}</p>
        <Link
          href="/dashboard/my-tokens"
          className="inline-flex h-10 px-6 items-center bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors"
        >
          ← {t("backToTokens")}
        </Link>
      </div>
    );
  }

  const status = statusConfig[token.status] || statusConfig.ACTIVE;
  const isOwner = user?.id === token.owner?.id;
  const daysLeft = Math.ceil(
    (new Date(token.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Human-readable token display ID: TOK-{lotNumber}-{ownerInitials}-{year}
  const ownerTag = (token.owner?.name || "").replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "XXXX";
  const mintYear = new Date(token.mintedAt).getFullYear();
  const tokenDisplayId = token.lot?.lotNumber
    ? `TOK-${token.lot.lotNumber}-${ownerTag}-${mintYear}`
    : `TOK-${token.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/my-tokens"
            className="text-sage-500 hover:text-sage-700 text-sm transition-colors"
          >
            ← {t("backToTokens")}
          </Link>
          <h1 className="font-heading text-sage-900 text-3xl font-bold mt-2">
            {tokenDisplayId}
          </h1>
        </div>
        <Badge variant={status.variant} className="text-sm px-3 py-1">
          {status.icon} {status.label}
        </Badge>
      </div>

      {/* Expiry warning */}
      {token.status === "ACTIVE" && daysLeft <= 14 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-medium text-sm">
              {t("expiryWarning", { days: daysLeft })}
            </p>
            <p className="text-amber-600 text-sm mt-0.5">{t("expiryWarningDesc")}</p>
          </div>
        </div>
      )}

      {/* QR Code */}
      {token.status === "ACTIVE" && token.qrData && (
        <Card className="rounded-3xl border-sage-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900 font-heading">{t("qrCode")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="bg-white p-6 rounded-2xl border border-sage-100">
              {/* QR data is JSON string for warehouse scanning app */}
              <div className="w-48 h-48 bg-sage-50 rounded-xl flex items-center justify-center border-2 border-dashed border-sage-200">
                <div className="text-center">
                  <Smartphone className="w-8 h-8 text-sage-400" />
                  <p className="text-sage-500 text-xs mt-2">{t("qrPlaceholder")}</p>
                </div>
              </div>
            </div>
            <p className="text-sage-400 text-xs text-center max-w-sm">
              {t("qrDesc")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lot Details */}
      {token.lot && (
        <Card className="rounded-3xl border-sage-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900 font-heading">{t("lotDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {token.lot.images?.[0] ? (
                <img
                  src={token.lot.images[0]}
                  alt={token.lot.commodityType}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-sage-50 flex items-center justify-center">
                  <Wheat className="w-8 h-8 text-amber-600" />
                </div>
              )}
              <div>
                <h3 className="font-heading font-bold text-sage-900 text-lg">
                  {token.lot.commodityType} — {token.lot.grade}
                </h3>
                <p className="text-sage-500 text-sm">
                  Lot #{token.lot.lotNumber} · {token.lot.quantityKg} kg
                </p>
                <p className="text-sage-400 text-xs mt-1">
                  Seller: {token.lot.farmer?.name}
                </p>
              </div>
            </div>

            {token.lot.warehouse && (
              <div className="bg-sage-50 rounded-xl p-3">
                <p className="text-sage-600 text-sm font-medium flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Warehouse</p>
                <p className="text-sage-900 text-sm mt-1">{token.lot.warehouse.name}</p>
                {token.lot.warehouse.city && (
                  <p className="text-sage-400 text-xs">{token.lot.warehouse.city}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Token Info */}
      <Card className="rounded-3xl border-sage-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900 font-heading">{t("tokenInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-sage-500">{t("tokenId")}</span>
            <span className="text-sage-900 font-mono text-xs font-bold">{tokenDisplayId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-500">{t("owner")}</span>
            <span className="text-sage-900">{token.owner.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-500">{t("mintedDate")}</span>
            <span className="text-sage-600">{new Date(token.mintedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-500">{t("expiresDate")}</span>
            <span className={`font-medium ${daysLeft <= 7 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-sage-600"}`}>
              {new Date(token.expiresAt).toLocaleString()}
              {token.status === "ACTIVE" && ` (${daysLeft}d)`}
            </span>
          </div>
          {token.redeemedAt && (
            <div className="flex justify-between">
              <span className="text-sage-500">{t("redeemedDate")}</span>
              <span className="text-sage-600">{new Date(token.redeemedAt).toLocaleString()}</span>
            </div>
          )}
          {token.hmacHash && isOwner && (
            <div className="flex justify-between">
              <span className="text-sage-500">{t("hmacHash")}</span>
              <span className="text-sage-400 font-mono text-xs truncate max-w-[200px]">
                {token.hmacHash}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Goods Received / Redeem Token (owner only, active only) */}
      {isOwner && token.status === "ACTIVE" && (
        <Card className="rounded-3xl border-emerald-200 bg-emerald-50/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-emerald-900 font-heading flex items-center gap-2"><Package className="w-5 h-5" /> Confirm Goods Received</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-emerald-700 text-sm">
              When you collect your commodity at the warehouse, confirm receipt here.
              This will redeem your token and notify the seller and admin that the goods have been delivered.
            </p>
            {!showRedeemConfirm ? (
              <button
                onClick={() => setShowRedeemConfirm(true)}
                className="h-10 px-6 bg-emerald-700 text-white rounded-full font-medium text-sm hover:bg-emerald-800 transition-colors"
              >
                                <CheckCircle2 className="w-4 h-4 inline" /> I Have Received My Goods
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-emerald-200 space-y-3">
                <p className="text-emerald-800 text-sm font-medium">
                  Are you sure? This action cannot be undone.
                </p>
                <p className="text-emerald-600 text-xs">
                  By confirming, you acknowledge that you have collected the commodity from the warehouse and inspected it to your satisfaction.
                  The admin will then release funds to the seller.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming}
                    className="h-9 px-5 bg-emerald-700 text-white rounded-full text-sm font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50"
                  >
                    {redeeming ? "Confirming..." : "Yes, Confirm Receipt"}
                  </button>
                  <button
                    onClick={() => setShowRedeemConfirm(false)}
                    className="h-9 px-5 border border-sage-200 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Redeemed confirmation */}
      {token.status === "REDEEMED" && (
        <Card className="rounded-3xl border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-emerald-800 font-medium">Goods Received & Token Redeemed</p>
                <p className="text-emerald-600 text-sm mt-1">
                  You confirmed receipt of your commodity{token.redeemedAt ? ` on ${new Date(token.redeemedAt).toLocaleDateString()}` : ""}.
                  Funds will be released to the seller by the admin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Form (owner only, active only) */}
      {isOwner && token.status === "ACTIVE" && (
        <Card className="rounded-3xl border-sage-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900 font-heading">{t("transferToken")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-sage-700 mb-1.5 block">
                  {t("recipientEmail")}
                </label>
                <input
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  placeholder="buyer@example.com"
                  required
                  className="w-full h-10 px-4 rounded-xl border border-sage-200 text-sage-900 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-sage-700 mb-1.5 block">
                  {t("transferPrice")} <span className="text-sage-400 font-normal">({t("optional")})</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transferPrice}
                  onChange={(e) => setTransferPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 px-4 rounded-xl border border-sage-200 text-sage-900 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300 transition-colors"
                />
              </div>

              {transferResult && (
                <div
                  className={`rounded-xl p-3 text-sm ${
                    transferResult.ok
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {transferResult.message}
                </div>
              )}

              <button
                type="submit"
                disabled={transferring || !transferEmail}
                className="h-10 px-6 bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {transferring ? t("transferring") : t("transfer")}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transfer History */}
      {token.transfers.length > 0 && (
        <Card className="rounded-3xl border-sage-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900 font-heading">{t("transferHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {token.transfers.map((tr, i) => (
                <div key={tr.id}>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center">
                        <RotateCcw className="w-4 h-4 text-sage-500" />
                      </div>
                      <div>
                        <p className="text-sage-900 text-sm font-medium">
                          {tr.fromUser.name} → {tr.toUser.name}
                        </p>
                        <p className="text-sage-400 text-xs">
                          {new Date(tr.transferredAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {tr.priceInr != null && (
                      <span className="text-sage-600 text-sm font-medium">
                        {display(Number(tr.priceInr))}
                      </span>
                    )}
                  </div>
                  {i < token.transfers.length - 1 && <Separator className="bg-sage-50" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back */}
      <div className="flex gap-3 pb-8">
        <Link
          href="/dashboard/my-tokens"
          className="inline-flex h-10 px-6 items-center border border-sage-200 text-sage-700 rounded-full font-medium text-sm hover:bg-sage-50 transition-colors"
        >
          ← {t("backToTokens")}
        </Link>
      </div>
    </div>
  );
}
