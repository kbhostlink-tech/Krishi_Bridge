"use client";

import { useState, useEffect } from "react";
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
  const { user, accessToken } = useAuth();
  const { geo, isLoading: geoLoading, switchCountry } = useGeo();
  const [currentCountry, setCurrentCountry] = useState<string>("");
  const [fxRates, setFxRates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user?.country) setCurrentCountry(user.country);
  }, [user?.country]);

  // Fetch FX rates for display
  useEffect(() => {
    fetch("/api/cron/fx-sync", { method: "GET" }).catch(() => {});
    // Use a simple GET to fetch rates from DB — we'll load from geo context
  }, []);

  const handleCountrySwitch = (code: string | null) => {
    if (!code) return;
    setCurrentCountry(code);
    switchCountry(code);
    toast.success(`${tg("switchedTo")} ${COUNTRIES.find(c => c.code === code)?.name || code}`);
  };

  if (geoLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-sage-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-white/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-sage-900">
          {tg("title")}
        </h1>
        <p className="text-sage-500 mt-1">
          {tg("subtitle")}
        </p>
      </div>

      {/* Country Selector */}
      <Card className="bg-white border-sage-100 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-sage-900">
                {tg("activeRegion")}
              </h2>
              <p className="text-sm text-sage-500 mt-0.5">
                {geo?.detected
                  ? tg("autoDetected")
                  : tg("notDetected")}
              </p>
            </div>
            <Select value={currentCountry} onValueChange={handleCountrySwitch}>
              <SelectTrigger className="w-56 rounded-full">
                <SelectValue placeholder={tg("selectCountry")} />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {geo?.detected && geo.country && (
            <div className="mt-4 flex items-center gap-3 text-sm text-sage-600 bg-sage-50/50 rounded-2xl px-4 py-3">
              <span className="text-2xl">{geo.flag}</span>
              <div>
                <span className="font-medium text-sage-800">{geo.name}</span>
                <span className="mx-2">•</span>
                <span>{geo.currency}</span>
                <span className="mx-2">•</span>
                <span>{geo.timezone}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tax Rules */}
        <Card className="bg-white border-sage-100 rounded-3xl">
          <CardContent className="p-6">
            <h3 className="font-heading text-lg font-semibold text-sage-900 mb-4">
              {tg("taxRules")}
            </h3>
            {geo?.tax ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-sage-50">
                  <span className="text-sm text-sage-600">{tg("platformCommission")}</span>
                  <Badge variant="secondary" className="bg-sage-50 text-sage-700">2%</Badge>
                </div>
                {geo.tax.goodsTaxRate > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-sage-50">
                    <span className="text-sm text-sage-600">{geo.tax.goodsTaxLabel}</span>
                    <Badge variant="secondary" className="bg-sage-50 text-sage-700">
                      {(geo.tax.goodsTaxRate * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
                {geo.tax.commissionTaxRate > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-sage-50">
                    <span className="text-sm text-sage-600">{geo.tax.commissionTaxLabel}</span>
                    <Badge variant="secondary" className="bg-sage-50 text-sage-700">
                      {(geo.tax.commissionTaxRate * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
                {geo.tax.tdsRate > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-sage-50">
                    <span className="text-sm text-sage-600">{geo.tax.tdsLabel}</span>
                    <Badge variant="secondary" className="bg-sage-50 text-sage-700">
                      {(geo.tax.tdsRate * 100).toFixed(1)}%
                    </Badge>
                  </div>
                )}
                {geo.tax.goodsTaxRate === 0 && geo.tax.commissionTaxRate === 0 && geo.tax.tdsRate === 0 && (
                  <p className="text-sm text-sage-500 italic">{tg("noTaxes")}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-sage-500">{tg("selectRegionTax")}</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="bg-white border-sage-100 rounded-3xl">
          <CardContent className="p-6">
            <h3 className="font-heading text-lg font-semibold text-sage-900 mb-4">
              {tg("paymentMethods")}
            </h3>
            {geo?.paymentMethods && geo.paymentMethods.length > 0 ? (
              <div className="space-y-2">
                {geo.paymentMethods.map((method) => (
                  <div key={method} className="flex items-center gap-3 p-3 bg-sage-50/50 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-600 text-xs font-bold">
                      {method.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-sage-800">
                      {PAYMENT_METHOD_LABELS[method] || method}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-sage-500">{tg("selectRegionPayment")}</p>
            )}
          </CardContent>
        </Card>

        {/* KYC Requirements */}
        <Card className="bg-white border-sage-100 rounded-3xl">
          <CardContent className="p-6">
            <h3 className="font-heading text-lg font-semibold text-sage-900 mb-4">
              {tg("kycRequirements")}
            </h3>
            {geo?.kycRequirements && geo.kycRequirements.length > 0 ? (
              <ul className="space-y-2">
                {geo.kycRequirements.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-sage-700">
                    <span className="text-sage-400 mt-0.5">•</span>
                    {doc}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-sage-500">{tg("selectRegionKyc")}</p>
            )}
          </CardContent>
        </Card>

        {/* Currency Info */}
        <Card className="bg-white border-sage-100 rounded-3xl">
          <CardContent className="p-6">
            <h3 className="font-heading text-lg font-semibold text-sage-900 mb-4">
              {tg("currency")}
            </h3>
            {geo?.currency ? (
              <div className="space-y-3">
                <div className="text-center py-4">
                  <p className="text-4xl font-heading font-bold text-sage-700">
                    {geo.currency}
                  </p>
                  <p className="text-sm text-sage-500 mt-1">
                    {tg("currencyNote")}
                  </p>
                </div>
                <p className="text-xs text-sage-400 text-center">{tg("fxNote")}</p>
              </div>
            ) : (
              <p className="text-sm text-sage-500">{tg("selectRegionCurrency")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
