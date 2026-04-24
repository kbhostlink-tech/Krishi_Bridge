import { NextResponse } from "next/server";
import { getAllFxRates, CURRENCY_INFO, BASE_CURRENCY } from "@/lib/currency";

// GET /api/fx-rates — Public endpoint to fetch current FX rates (INR base)
// Used by the frontend for local currency display and conversion
export async function GET() {
  try {
    const rates = await getAllFxRates();

    return NextResponse.json({
      baseCurrency: BASE_CURRENCY,
      rates,
      currencies: CURRENCY_INFO,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[FX_RATES]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

