import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchExchangeRates, BASE_CURRENCY, FALLBACK_RATES } from "@/lib/currency";
import type { CurrencyCode } from "@/generated/prisma/client";

const CRON_SECRET = process.env.CRON_SECRET;

// Target currencies to sync (INR → each)
const TARGET_CURRENCIES: CurrencyCode[] = ["NPR", "BTN", "AED", "SAR", "OMR", "USD"];

// POST /api/cron/fx-sync — Sync FX rates using fawazahmed0 currency API
// Base currency: INR. Called every 30 minutes.
// Protected by CRON_SECRET header. No API key needed.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rates, source } = await fetchExchangeRates();

    const now = new Date();
    const results: Array<{ pair: string; rate: number; status: string }> = [];

    for (const toCurrency of TARGET_CURRENCIES) {
      const rate = rates[toCurrency];
      if (!rate || rate <= 0) {
        // Use fallback if API didn't return this pair
        const fallback = FALLBACK_RATES[toCurrency];
        if (fallback && fallback > 0) {
          await prisma.fxRate.upsert({
            where: {
              fromCurrency_toCurrency: {
                fromCurrency: BASE_CURRENCY,
                toCurrency,
              },
            },
            update: { rate: fallback, source: "fallback", fetchedAt: now },
            create: { fromCurrency: BASE_CURRENCY, toCurrency, rate: fallback, source: "fallback", fetchedAt: now },
          });
          results.push({ pair: `INR/${toCurrency}`, rate: fallback, status: "fallback" });
        } else {
          results.push({ pair: `INR/${toCurrency}`, rate: 0, status: "skipped_invalid" });
        }
        continue;
      }

      await prisma.fxRate.upsert({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency: BASE_CURRENCY,
            toCurrency,
          },
        },
        update: {
          rate,
          source,
          fetchedAt: now,
        },
        create: {
          fromCurrency: BASE_CURRENCY,
          toCurrency,
          rate,
          source,
          fetchedAt: now,
        },
      });

      results.push({ pair: `INR/${toCurrency}`, rate, status: "updated" });
    }

    return NextResponse.json({
      message: "FX rates synced (INR base)",
      source,
      baseCurrency: BASE_CURRENCY,
      syncedAt: now.toISOString(),
      rates: results,
    });
  } catch (error) {
    console.error("[FX_SYNC]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

