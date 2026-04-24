import type { CurrencyCode } from "@/generated/prisma/client";

export const BASE_CURRENCY: CurrencyCode = "INR";

export const CURRENCY_INFO: Record<CurrencyCode, { symbol: string; name: string; decimals: number }> = {
  INR: { symbol: "₹", name: "Indian Rupee", decimals: 2 },
  NPR: { symbol: "रू", name: "Nepalese Rupee", decimals: 2 },
  BTN: { symbol: "Nu.", name: "Bhutanese Ngultrum", decimals: 2 },
  AED: { symbol: "د.إ", name: "UAE Dirham", decimals: 2 },
  SAR: { symbol: "﷼", name: "Saudi Riyal", decimals: 2 },
  OMR: { symbol: "ر.ع.", name: "Omani Rial", decimals: 3 },
  USD: { symbol: "$", name: "US Dollar", decimals: 2 },
};

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "INR", label: "INR (₹)", symbol: "₹" },
  { code: "NPR", label: "NPR (रू)", symbol: "रू" },
  { code: "BTN", label: "BTN (Nu.)", symbol: "Nu." },
  { code: "AED", label: "AED (د.إ)", symbol: "د.إ" },
  { code: "SAR", label: "SAR (﷼)", symbol: "﷼" },
  { code: "OMR", label: "OMR (ر.ع.)", symbol: "ر.ع." },
  { code: "USD", label: "USD ($)", symbol: "$" },
];

export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  IN: "INR",
  NP: "NPR",
  BT: "BTN",
  AE: "AED",
  SA: "SAR",
  OM: "OMR",
};

export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  INR: 1,
  NPR: 1.6,
  BTN: 1,
  AED: 0.044,
  SAR: 0.045,
  OMR: 0.0046,
  USD: 0.012,
};

export function getDefaultCurrencyForCountry(countryCode?: string | null): CurrencyCode {
  return COUNTRY_CURRENCY[countryCode ?? ""] ?? BASE_CURRENCY;
}