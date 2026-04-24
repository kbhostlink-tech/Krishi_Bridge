"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useGeo } from "@/lib/use-geo";
import { PageHeader, Surface } from "@/components/ui/console-kit";
import { PageTransition } from "@/components/ui/page-transition";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart2, CreditCard, ClipboardList, ArrowLeftRight, Globe } from "lucide-react";

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
  const bt = useTranslations("buyerConsole");
  const { user } = useAuth();
  const { geo, isLoading, switchCountry } = useGeo();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-stone-500">{bt("common.signInRequired")}</p>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow={bt("region.eyebrow")}
        title={t("title")}
        description={t("subtitle")}
      />

      {/* Active Region Selector */}
      <Surface className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 shrink-0 text-[#405742]" />
            <div>
              <p className="font-semibold text-stone-950">{t("activeRegion")}</p>
              <p className="text-sm text-stone-600">
                {geo?.detected ? t("autoDetected") : t("notDetected")}
              </p>
            </div>
            {geo?.detected && (
              <Badge className="bg-emerald-50 text-emerald-700 text-xs">{bt("region.autoDetected")}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {geo?.flag && <span className="text-2xl">{geo.flag}</span>}
            <Select
              value={geo?.country ?? ""}
              onValueChange={(val: string | null) => { if (val) switchCountry(val); }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-56 border-[#d9d1c2]">
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
      </Surface>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Surface key={i} className="p-5">
              <div className="mb-4 h-5 w-40 animate-pulse bg-[#ece4d6]" />
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse bg-[#f5f0e8]" />
                <div className="h-4 w-3/4 animate-pulse bg-[#f5f0e8]" />
              </div>
            </Surface>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Tax Rules */}
          <Surface className="p-4 sm:p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#405742]" />
                <p className="text-sm font-semibold text-stone-950">{t("taxRules")}</p>
              </div>
              {geo?.tax ? (
                <div className="space-y-1">
                  {geo.tax.goodsTaxLabel && (
                    <div className="flex items-center justify-between border-b border-[#ece4d6] py-2">
                      <span className="text-sm text-stone-600">Goods Tax</span>
                      <Badge className="bg-[#f5f0e8] text-stone-700">{geo.tax.goodsTaxLabel}</Badge>
                    </div>
                  )}
                  {geo.tax.commissionTaxLabel && (
                    <div className="flex items-center justify-between border-b border-[#ece4d6] py-2">
                      <span className="text-sm text-stone-600">Commission Tax</span>
                      <Badge className="bg-[#f5f0e8] text-stone-700">{geo.tax.commissionTaxLabel}</Badge>
                    </div>
                  )}
                  {geo.tax.tdsLabel && (
                    <div className="flex items-center justify-between border-b border-[#ece4d6] py-2">
                      <span className="text-sm text-stone-600">TDS</span>
                      <Badge className="bg-[#f5f0e8] text-stone-700">{geo.tax.tdsLabel}</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-stone-600">{t("platformCommission")}</span>
                    <Badge className="bg-[#fdf3ee] text-[#c4724e]">2%</Badge>
                  </div>
                  {!geo.tax.goodsTaxLabel && !geo.tax.commissionTaxLabel && !geo.tax.tdsLabel && (
                    <p className="text-sm italic text-stone-500">{t("noTaxes")}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-stone-500">{t("selectRegionTax")}</p>
              )}
            </div>
          </Surface>

          {/* Payment Methods */}
          <Surface className="p-4 sm:p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#405742]" />
                <p className="text-sm font-semibold text-stone-950">{t("paymentMethods")}</p>
              </div>
              {geo?.paymentMethods && geo.paymentMethods.length > 0 ? (
                <div className="space-y-1.5">
                  {geo.paymentMethods.map((method) => (
                    <div key={method} className="flex items-center gap-3 border border-[#ece4d6] bg-[#f8f4ec] px-3 py-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-stone-700">
                        {PAYMENT_METHOD_LABELS[method] || method}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500">{t("selectRegionPayment")}</p>
              )}
            </div>
          </Surface>

          {/* KYC Requirements */}
          <Surface className="p-4 sm:p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#405742]" />
                <p className="text-sm font-semibold text-stone-950">{t("kycRequirements")}</p>
              </div>
              {geo?.kycRequirements && geo.kycRequirements.length > 0 ? (
                <ul className="space-y-2">
                  {geo.kycRequirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#627b55]" />
                      {req}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-stone-500">{t("selectRegionKyc")}</p>
              )}
            </div>
          </Surface>

          {/* Currency Info */}
          <Surface className="p-4 sm:p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-[#405742]" />
                <p className="text-sm font-semibold text-stone-950">{t("currency")}</p>
              </div>
              {geo?.currency ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between border-b border-[#ece4d6] py-2">
                    <span className="text-sm text-stone-600">{bt("region.activeCurrency")}</span>
                    <Badge className="bg-[#f5f0e8] px-3 text-sm text-stone-700">{geo.currency}</Badge>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#ece4d6] py-2">
                    <span className="text-sm text-stone-600">{bt("region.timezone")}</span>
                    <span className="text-sm font-medium text-stone-700">{geo.timezone}</span>
                  </div>
                  <p className="pt-1 text-xs text-stone-500">{t("currencyNote")}</p>
                  <p className="text-xs text-stone-500">{t("fxNote")}</p>
                </div>
              ) : (
                <p className="text-sm text-stone-500">{t("selectRegionCurrency")}</p>
              )}
            </div>
          </Surface>
        </div>
      )}
    </PageTransition>
  );
}

