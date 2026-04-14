"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useGeo } from "@/lib/use-geo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRIES = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  UPI: "UPI",
  CARD: "Credit / Debit Card",
  NET_BANKING: "Net Banking",
  ESEWA: "eSewa",
  KHALTI: "Khalti",
  BANK_TRANSFER: "Bank Transfer",
  STRIPE: "Stripe (Card)",
  TAP: "Tap Payments",
  WISE: "Wise Transfer",
};

export default function RegionSettingsPage() {
  const t = useTranslations("geo");
  const { user } = useAuth();
  const { geo, isLoading, switchCountry } = useGeo();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sage-500">Please log in to view region settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-sage-900">
          {t("title")}
        </h1>
        <p className="text-sage-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* Active Region Selector */}
      <Card className="bg-white border-sage-100 rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-sage-900 flex items-center gap-2">
                {t("activeRegion")}
                {geo?.detected && (
                  <Badge className="bg-emerald-50 text-emerald-700 text-xs">
                    Auto-detected
                  </Badge>
                )}
              </h2>
              <p className="text-sage-500 text-sm mt-1">
                {geo?.detected ? t("autoDetected") : t("notDetected")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {geo?.flag && (
                <span className="text-3xl">{geo.flag}</span>
              )}
              <Select
                value={geo?.country ?? ""}
                onValueChange={(val: string | null) => { if (val) switchCountry(val); }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-64 rounded-xl border-sage-200">
                  <SelectValue placeholder={t("selectCountry")} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white border-sage-100 rounded-3xl">
              <CardContent className="p-6">
                <div className="h-6 w-40 bg-sage-100 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-sage-50 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-sage-50 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Tax Rules */}
          <Card className="bg-white border-sage-100 rounded-3xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg font-semibold text-sage-900 mb-4">
                📊 {t("taxRules")}
              </h3>
              {geo?.tax ? (
                <div className="space-y-3">
                  {geo.tax.goodsTaxLabel && (
                    <div className="flex justify-between items-center py-2 border-b border-sage-50">
                      <span className="text-sage-600 text-sm">Goods Tax</span>
                      <Badge className="bg-sage-50 text-sage-700">
                        {geo.tax.goodsTaxLabel}
                      </Badge>
                    </div>
                  )}
                  {geo.tax.commissionTaxLabel && (
                    <div className="flex justify-between items-center py-2 border-b border-sage-50">
                      <span className="text-sage-600 text-sm">Commission Tax</span>
                      <Badge className="bg-sage-50 text-sage-700">
                        {geo.tax.commissionTaxLabel}
                      </Badge>
                    </div>
                  )}
                  {geo.tax.tdsLabel && (
                    <div className="flex justify-between items-center py-2 border-b border-sage-50">
                      <span className="text-sage-600 text-sm">TDS</span>
                      <Badge className="bg-sage-50 text-sage-700">
                        {geo.tax.tdsLabel}
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sage-600 text-sm">{t("platformCommission")}</span>
                    <Badge className="bg-terracotta/10 text-terracotta">2%</Badge>
                  </div>
                  {!geo.tax.goodsTaxLabel && !geo.tax.commissionTaxLabel && !geo.tax.tdsLabel && (
                    <p className="text-sage-400 text-sm italic">{t("noTaxes")}</p>
                  )}
                </div>
              ) : (
                <p className="text-sage-400 text-sm">{t("selectRegionTax")}</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="bg-white border-sage-100 rounded-3xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg font-semibold text-sage-900 mb-4">
                💳 {t("paymentMethods")}
              </h3>
              {geo?.paymentMethods && geo.paymentMethods.length > 0 ? (
                <div className="space-y-2">
                  {geo.paymentMethods.map((method) => (
                    <div
                      key={method}
                      className="flex items-center gap-3 py-2.5 px-3 bg-sage-50/50 rounded-xl"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sage-700 text-sm font-medium">
                        {PAYMENT_METHOD_LABELS[method] || method}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sage-400 text-sm">{t("selectRegionPayment")}</p>
              )}
            </CardContent>
          </Card>

          {/* KYC Requirements */}
          <Card className="bg-white border-sage-100 rounded-3xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg font-semibold text-sage-900 mb-4">
                📋 {t("kycRequirements")}
              </h3>
              {geo?.kycRequirements && geo.kycRequirements.length > 0 ? (
                <ul className="space-y-2">
                  {geo.kycRequirements.map((req, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sage-700 text-sm"
                    >
                      <span className="text-sage-400 mt-0.5">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sage-400 text-sm">{t("selectRegionKyc")}</p>
              )}
            </CardContent>
          </Card>

          {/* Currency Info */}
          <Card className="bg-white border-sage-100 rounded-3xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg font-semibold text-sage-900 mb-4">
                💱 {t("currency")}
              </h3>
              {geo?.currency ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-sage-50">
                    <span className="text-sage-600 text-sm">Active Currency</span>
                    <Badge className="bg-sage-50 text-sage-700 text-base px-3">
                      {geo.currency}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-sage-50">
                    <span className="text-sage-600 text-sm">Timezone</span>
                    <span className="text-sage-700 text-sm font-medium">
                      {geo.timezone}
                    </span>
                  </div>
                  <p className="text-sage-400 text-xs mt-2">{t("currencyNote")}</p>
                  <p className="text-sage-400 text-xs">{t("fxNote")}</p>
                </div>
              ) : (
                <p className="text-sage-400 text-sm">{t("selectRegionCurrency")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
