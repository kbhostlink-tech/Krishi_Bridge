import type { CountryCode, CurrencyCode } from "@/generated/prisma/client";

// ─── COUNTRY → LOCALE / CURRENCY / KYC MAPPINGS ─────────

export interface CountryConfig {
  countryCode: CountryCode;
  name: string;
  flag: string;
  locale: string;
  currency: CurrencyCode;
  kycDocuments: string[];
  paymentMethods: string[];
  timezone: string;
}

const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  IN: {
    countryCode: "IN",
    name: "India",
    flag: "🇮🇳",
    locale: "hi",
    currency: "INR",
    kycDocuments: ["Aadhaar Card", "PAN Card", "GST Certificate (if business)"],
    paymentMethods: ["UPI", "CARD", "NET_BANKING"],
    timezone: "Asia/Kolkata",
  },
  NP: {
    countryCode: "NP",
    name: "Nepal",
    flag: "🇳🇵",
    locale: "ne",
    currency: "NPR",
    kycDocuments: ["Citizenship Certificate", "PAN/VAT Certificate"],
    paymentMethods: ["ESEWA", "KHALTI", "BANK_TRANSFER"],
    timezone: "Asia/Kathmandu",
  },
  BT: {
    countryCode: "BT",
    name: "Bhutan",
    flag: "🇧🇹",
    locale: "dz",
    currency: "BTN",
    kycDocuments: ["Citizenship Identity Card", "Business License"],
    paymentMethods: ["BANK_TRANSFER"],
    timezone: "Asia/Thimphu",
  },
  AE: {
    countryCode: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    locale: "ar",
    currency: "AED",
    kycDocuments: ["Emirates ID", "Trade License"],
    paymentMethods: ["STRIPE", "CARD"],
    timezone: "Asia/Dubai",
  },
  SA: {
    countryCode: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    locale: "ar",
    currency: "SAR",
    kycDocuments: ["National ID / Iqama", "Commercial Registration (CR)"],
    paymentMethods: ["TAP", "CARD"],
    timezone: "Asia/Riyadh",
  },
  OM: {
    countryCode: "OM",
    name: "Oman",
    flag: "🇴🇲",
    locale: "ar",
    currency: "OMR",
    kycDocuments: ["National ID Card", "Commercial Registration"],
    paymentMethods: ["TAP", "BANK_TRANSFER"],
    timezone: "Asia/Muscat",
  },
};

// ─── HELPERS ──────────────────────────────────

/**
 * Get full country configuration.
 */
export function getCountryConfig(countryCode: CountryCode): CountryConfig {
  return COUNTRY_CONFIGS[countryCode];
}

/**
 * Get all supported country configs.
 */
export function getAllCountryConfigs(): CountryConfig[] {
  return Object.values(COUNTRY_CONFIGS);
}

/**
 * Map a detected country code (from CF-IPCountry or Vercel) to our CountryCode enum.
 * Returns null for unsupported countries.
 */
export function mapToCountryCode(raw: string | null): CountryCode | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper in COUNTRY_CONFIGS) return upper as CountryCode;
  return null;
}

/**
 * Get suggested locale for a country code.
 */
export function getLocaleForCountry(countryCode: CountryCode): string {
  return COUNTRY_CONFIGS[countryCode]?.locale || "en";
}

/**
 * Get currency for a country code.
 */
export function getCurrencyForCountry(countryCode: CountryCode): CurrencyCode {
  return COUNTRY_CONFIGS[countryCode]?.currency || "USD" as CurrencyCode;
}

/**
 * Get KYC document requirements for a country.
 */
export function getKycRequirements(countryCode: CountryCode): string[] {
  return COUNTRY_CONFIGS[countryCode]?.kycDocuments || [];
}

/**
 * Get available payment methods for a country.
 */
export function getPaymentMethodsForCountry(countryCode: CountryCode): string[] {
  return COUNTRY_CONFIGS[countryCode]?.paymentMethods || ["BANK_TRANSFER"];
}

/**
 * Detect country from request headers (Cloudflare → Vercel → fallback).
 */
export function detectCountryFromHeaders(headers: Headers): CountryCode | null {
  const cfCountry = headers.get("cf-ipcountry");
  const vercelCountry = headers.get("x-vercel-ip-country");
  const raw = cfCountry || vercelCountry;
  return mapToCountryCode(raw);
}
