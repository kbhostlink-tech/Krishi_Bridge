"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useGeo } from "@/lib/use-geo";
import { Badge } from "@/components/ui/badge";
import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";
import { PageTransition } from "@/components/ui/page-transition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const COUNTRIES = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  UPI: "UPI",
  CARD: "Credit/Debit Card",
  NET_BANKING: "Net Banking",
  ESEWA: "eSewa",
  KHALTI: "Khalti",
  BANK_TRANSFER: "Bank Transfer",
  STRIPE: "Stripe",
  TAP: "Tap Payments",
  WISE: "Wise",
};

export default function CountrySettingsPage() {
  const tg = useTranslations("geo");
  const { user } = useAuth();
  const { geo, isLoading: geoLoading, switchCountry } = useGeo();

  const currentCountry = geo?.country || user?.country || "";
  const paymentMethods = geo?.paymentMethods ?? [];
  const kycRequirements = geo?.kycRequirements ?? [];
  const taxRules = geo?.tax
    ? [
        { label: tg("platformCommission"), value: "2%" },
        ...(geo.tax.goodsTaxRate > 0
          ? [{ label: geo.tax.goodsTaxLabel, value: `${(geo.tax.goodsTaxRate * 100).toFixed(0)}%` }]
          : []),
        ...(geo.tax.commissionTaxRate > 0
          ? [{ label: geo.tax.commissionTaxLabel, value: `${(geo.tax.commissionTaxRate * 100).toFixed(0)}%` }]
          : []),
        ...(geo.tax.tdsRate > 0
          ? [{ label: geo.tax.tdsLabel, value: `${(geo.tax.tdsRate * 100).toFixed(1)}%` }]
          : []),
      ]
    : [];

  const handleCountrySwitch = (code: string | null) => {
    if (!code) return;
    switchCountry(code);
    toast.success(`${tg("switchedTo")} ${COUNTRIES.find((country) => country.code === code)?.name || code}`);
  };

  if (geoLoading) {
    return (
      <PageTransition className="buyer-console space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-36 rounded skeleton-shimmer" />
          <div className="h-10 w-72 rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 rounded skeleton-shimmer" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-56 rounded skeleton-shimmer" />
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="buyer-console space-y-8">
      <PageHeader
        eyebrow="Regional Setup"
        title={tg("title")}
        description={tg("subtitle")}
        action={
          <Surface className="w-full p-4 sm:min-w-80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Detected market</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold tracking-[-0.03em] text-stone-950">{geo?.name || tg("selectCountry")}</p>
                <p className="mt-1 text-sm text-stone-600">{geo?.timezone || "Regional rules load after you select a country."}</p>
              </div>
              {geo?.currency ? <Badge className="console-chip border-0">{geo.currency}</Badge> : null}
            </div>
          </Surface>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active region"
          value={currentCountry || "-"}
          meta="Country driving tax, settlement, and KYC rule visibility."
          tone="olive"
        />
        <MetricCard
          label="Payment rails"
          value={paymentMethods.length}
          meta="Buyer-side payment methods currently supported in this market."
          tone="amber"
        />
        <MetricCard
          label="KYC checks"
          value={kycRequirements.length}
          meta="Documents or verifications required for this operating region."
          tone="teal"
        />
        <MetricCard
          label="Tax rules"
          value={taxRules.length}
          meta="Commission and tax entries affecting pricing and settlement."
          tone="slate"
        />
      </div>

      <Surface className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-950">Active operating region</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Switch countries to preview taxes, supported payment methods, and document expectations before you transact.
            </p>
          </div>
          <Select value={currentCountry} onValueChange={handleCountrySwitch}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder={tg("selectCountry")} />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {geo?.detected && geo.country ? (
          <div className="console-note mt-4 flex flex-wrap items-center gap-3 p-4 text-sm text-stone-600">
            <span className="text-2xl">{geo.flag}</span>
            <span className="font-semibold text-stone-950">{geo.name}</span>
            <span>•</span>
            <span>{geo.currency}</span>
            <span>•</span>
            <span>{geo.timezone}</span>
          </div>
        ) : null}
      </Surface>

      <div className="grid gap-4 xl:grid-cols-2">
        <Surface className="p-5">
          <p className="text-sm font-semibold text-stone-950">Tax rules</p>
          <div className="mt-4 space-y-3">
            {taxRules.length > 0 ? (
              taxRules.map((rule) => (
                <div key={rule.label} className="console-note flex items-center justify-between gap-4 p-3 text-sm">
                  <span className="text-stone-600">{rule.label}</span>
                  <span className="font-semibold text-stone-950">{rule.value}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-600">{tg("selectRegionTax")}</p>
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <p className="text-sm font-semibold text-stone-950">Supported payment methods</p>
          <div className="mt-4 space-y-3">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((method) => (
                <div key={method} className="console-note flex items-center gap-3 p-3 text-sm">
                  <span className="grid h-9 w-9 place-items-center border border-[#ddd4c4] bg-white text-xs font-semibold text-[#405742]">
                    {method.charAt(0)}
                  </span>
                  <span className="font-semibold text-stone-950">{PAYMENT_METHOD_LABELS[method] || method}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-600">{tg("selectRegionPayment")}</p>
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <p className="text-sm font-semibold text-stone-950">KYC requirements</p>
          <div className="mt-4 space-y-3">
            {kycRequirements.length > 0 ? (
              kycRequirements.map((requirement) => (
                <div key={requirement} className="console-note p-3 text-sm text-stone-700">
                  {requirement}
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-600">{tg("selectRegionKyc")}</p>
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <p className="text-sm font-semibold text-stone-950">Currency context</p>
          <div className="mt-4 space-y-4">
            {geo?.currency ? (
              <>
                <div className="console-note p-4 text-center">
                  <p className="text-4xl font-semibold tracking-[-0.05em] text-stone-950">{geo.currency}</p>
                  <p className="mt-2 text-sm text-stone-600">{tg("currencyNote")}</p>
                </div>
                <p className="text-sm leading-6 text-stone-600">{tg("fxNote")}</p>
              </>
            ) : (
              <p className="text-sm text-stone-600">{tg("selectRegionCurrency")}</p>
            )}
          </div>
        </Surface>
      </div>
    </PageTransition>
  );
}