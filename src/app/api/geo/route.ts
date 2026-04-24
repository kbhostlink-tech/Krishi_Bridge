import { NextRequest, NextResponse } from "next/server";
import {
  detectCountryFromHeaders,
  getCountryConfig,
  getKycRequirements,
  getPaymentMethodsForCountry,
  mapToCountryCode,
} from "@/lib/geo";
import { getTaxRules } from "@/lib/tax-engine";

// GET /api/geo — Full geo-context: country, currency, locale, tax rules, KYC requirements, payment methods
// Uses Cloudflare CF-IPCountry → Vercel x-vercel-ip-country → null
export async function GET(req: NextRequest) {
  const detectedCountry = detectCountryFromHeaders(req.headers);

  // Also read optional override from query param (user can switch country manually)
  const overrideCountry = req.nextUrl.searchParams.get("country");
  const countryCode = overrideCountry
    ? mapToCountryCode(overrideCountry)
    : detectedCountry;

  if (!countryCode) {
    return NextResponse.json({
      detected: false,
      country: null,
      raw: req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null,
    });
  }

  const config = getCountryConfig(countryCode);
  const taxRules = getTaxRules(countryCode);
  const kycRequirements = getKycRequirements(countryCode);
  const paymentMethods = getPaymentMethodsForCountry(countryCode);

  return NextResponse.json({
    detected: true,
    country: countryCode,
    name: config.name,
    flag: config.flag,
    locale: config.locale,
    currency: config.currency,
    timezone: config.timezone,
    tax: {
      goodsTaxRate: taxRules.goodsTaxRate,
      goodsTaxLabel: taxRules.goodsTaxLabel,
      commissionTaxRate: taxRules.commissionTaxRate,
      commissionTaxLabel: taxRules.commissionTaxLabel,
      tdsRate: taxRules.tdsRate,
      tdsLabel: taxRules.tdsLabel,
    },
    kycRequirements,
    paymentMethods,
  });
}

