import { prisma } from "@/lib/prisma";
import type { CurrencyCode } from "@/generated/prisma/client";

// ─── BASE CURRENCY ──────────────────────────
// All prices in the platform are stored and computed in INR.
// FxRate table holds INR → target currency rates.
export const BASE_CURRENCY: CurrencyCode = "INR";

// Supported currencies and their symbols / display info
export const CURRENCY_INFO: Record<CurrencyCode, { symbol: string; name: string; decimals: number }> = {
  INR: { symbol: "₹", name: "Indian Rupee", decimals: 2 },
  NPR: { symbol: "रू", name: "Nepalese Rupee", decimals: 2 },
  BTN: { symbol: "Nu.", name: "Bhutanese Ngultrum", decimals: 2 },
  AED: { symbol: "د.إ", name: "UAE Dirham", decimals: 2 },
  SAR: { symbol: "﷼", name: "Saudi Riyal", decimals: 2 },
  OMR: { symbol: "ر.ع.", name: "Omani Rial", decimals: 3 },
  USD: { symbol: "$", name: "US Dollar", decimals: 2 },
};

// fawazahmed0 currency API uses lowercase ISO codes
const CURRENCY_API_CODES: Record<CurrencyCode, string> = {
  INR: "inr",
  NPR: "npr",
  BTN: "btn",
  AED: "aed",
  SAR: "sar",
  OMR: "omr",
  USD: "usd",
};

// Hardcoded fallback rates (INR → X) — updated as of April 2026 approximations
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  INR: 1,
  NPR: 1.6,       // 1 INR ≈ 1.6 NPR
  BTN: 1,          // 1 INR ≈ 1 BTN (pegged)
  AED: 0.044,      // 1 INR ≈ 0.044 AED
  SAR: 0.045,      // 1 INR ≈ 0.045 SAR
  OMR: 0.0046,     // 1 INR ≈ 0.0046 OMR
  USD: 0.012,      // 1 INR ≈ 0.012 USD
};

// ─── FETCH RATES FROM API ────────────────────

/**
 * Fetch latest exchange rates from fawazahmed0 currency API.
 * Base = INR. Returns rates for all supported currencies.
 * Free, no API key required, updated daily.
 *
 * Primary: https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/inr.json
 * Fallback: https://latest.currency-api.pages.dev/v1/currencies/inr.json
 */
export async function fetchExchangeRates(): Promise<{
  rates: Record<CurrencyCode, number>;
  source: string;
}> {
  const targets = Object.keys(CURRENCY_API_CODES) as CurrencyCode[];
  const baseApiCode = CURRENCY_API_CODES[BASE_CURRENCY]; // "inr"

  // Primary endpoint (jsDelivr CDN)
  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseApiCode}.json`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      const ratesObj = data?.[baseApiCode];
      if (ratesObj && typeof ratesObj === "object") {
        const rates: Partial<Record<CurrencyCode, number>> = { INR: 1 };
        for (const currency of targets) {
          if (currency === BASE_CURRENCY) continue;
          const apiCode = CURRENCY_API_CODES[currency];
          if (ratesObj[apiCode] && Number(ratesObj[apiCode]) > 0) {
            rates[currency] = Number(ratesObj[apiCode]);
          }
        }
        if (Object.keys(rates).length >= targets.length) {
          return { rates: rates as Record<CurrencyCode, number>, source: "fawazahmed0-cdn" };
        }
      }
    }
  } catch {
    console.warn("[FX] Primary API (jsDelivr CDN) failed, trying fallback...");
  }

  // Fallback endpoint (Cloudflare Pages)
  try {
    const res = await fetch(
      `https://latest.currency-api.pages.dev/v1/currencies/${baseApiCode}.json`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      const ratesObj = data?.[baseApiCode];
      if (ratesObj && typeof ratesObj === "object") {
        const rates: Partial<Record<CurrencyCode, number>> = { INR: 1 };
        for (const currency of targets) {
          if (currency === BASE_CURRENCY) continue;
          const apiCode = CURRENCY_API_CODES[currency];
          if (ratesObj[apiCode] && Number(ratesObj[apiCode]) > 0) {
            rates[currency] = Number(ratesObj[apiCode]);
          }
        }
        if (Object.keys(rates).length >= targets.length) {
          return { rates: rates as Record<CurrencyCode, number>, source: "fawazahmed0-pages" };
        }
      }
    }
  } catch {
    console.warn("[FX] Fallback API (Pages) also failed, using static rates");
  }

  // Static fallback — last resort
  return { rates: { ...FALLBACK_RATES }, source: "fallback" };
}

// ─── DATABASE RATE LOOKUP ────────────────────

/**
 * Get the FX rate for converting INR → target currency from the DB.
 * Returns the rate, or the fallback if not found.
 */
export async function getFxRate(toCurrency: CurrencyCode): Promise<number> {
  if (toCurrency === BASE_CURRENCY) return 1;

  try {
    const fxRate = await prisma.fxRate.findUnique({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: BASE_CURRENCY,
          toCurrency,
        },
      },
    });
    if (fxRate && Number(fxRate.rate) > 0) {
      return Number(fxRate.rate);
    }
  } catch {
    console.warn(`[FX] DB lookup failed for INR→${toCurrency}`);
  }

  return FALLBACK_RATES[toCurrency] ?? 1;
}

/**
 * Get all FX rates from DB (for bulk conversions).
 * Returns a map of CurrencyCode → rate (INR → X).
 */
export async function getAllFxRates(): Promise<Record<CurrencyCode, number>> {
  const rates: Record<string, number> = { INR: 1 };

  try {
    const dbRates = await prisma.fxRate.findMany({
      where: { fromCurrency: BASE_CURRENCY },
    });
    for (const r of dbRates) {
      rates[r.toCurrency] = Number(r.rate);
    }
  } catch {
    console.warn("[FX] Failed to load FX rates from DB");
  }

  // Fill in any missing with fallbacks
  for (const [currency, fallback] of Object.entries(FALLBACK_RATES)) {
    if (!rates[currency]) {
      rates[currency] = fallback;
    }
  }

  return rates as Record<CurrencyCode, number>;
}

// ─── CONVERSION UTILITIES ────────────────────

/**
 * Convert an amount from one currency to INR (base).
 * Used when a user enters a price in their local currency.
 */
export async function convertToInr(amount: number, fromCurrency: CurrencyCode): Promise<number> {
  if (fromCurrency === BASE_CURRENCY) return amount;

  const rate = await getFxRate(fromCurrency);
  if (rate <= 0) return amount;

  // rate = how many `fromCurrency` units per 1 INR
  // So INR = amount / rate
  return Math.round((amount / rate) * 100) / 100;
}

/**
 * Convert an amount from INR (base) to target currency.
 * Used when displaying a price to the user.
 */
export async function convertFromInr(amountInr: number, toCurrency: CurrencyCode): Promise<number> {
  if (toCurrency === BASE_CURRENCY) return amountInr;

  const rate = await getFxRate(toCurrency);
  // rate = how many `toCurrency` units per 1 INR
  return Math.round(amountInr * rate * 100) / 100;
}

/**
 * Synchronous conversion using a pre-fetched rates map.
 * Useful for bulk display conversions client-side or server-side.
 */
export function convertFromInrSync(amountInr: number, toCurrency: CurrencyCode, rates: Record<string, number>): number {
  if (toCurrency === BASE_CURRENCY) return amountInr;
  const rate = rates[toCurrency] ?? FALLBACK_RATES[toCurrency] ?? 1;
  return Math.round(amountInr * rate * 100) / 100;
}

export function convertToInrSync(amount: number, fromCurrency: CurrencyCode, rates: Record<string, number>): number {
  if (fromCurrency === BASE_CURRENCY) return amount;
  const rate = rates[fromCurrency] ?? FALLBACK_RATES[fromCurrency] ?? 1;
  if (rate <= 0) return amount;
  return Math.round((amount / rate) * 100) / 100;
}

// ─── FORMATTING ──────────────────────────────

/**
 * Format a monetary amount in the specified currency.
 */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  const info = CURRENCY_INFO[currency];
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  });
  return `${info.symbol}${formatted}`;
}

/**
 * Format an INR amount, converting to the user's currency for display.
 * Synchronous version using pre-fetched rates.
 */
export function formatInrAs(amountInr: number, displayCurrency: CurrencyCode, rates: Record<string, number>): string {
  const converted = convertFromInrSync(amountInr, displayCurrency, rates);
  return formatMoney(converted, displayCurrency);
}
