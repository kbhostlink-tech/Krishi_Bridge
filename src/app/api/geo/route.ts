import { NextRequest, NextResponse } from "next/server";

// Map CF-IPCountry values to our CountryCode enum
const COUNTRY_MAP: Record<string, string> = {
  IN: "IN",
  NP: "NP",
  BT: "BT",
  AE: "AE",
  SA: "SA",
  OM: "OM",
};

// GET /api/geo — Detect user's country from Cloudflare headers
// Falls back gracefully if headers are not present (local dev)
export async function GET(req: NextRequest) {
  // Cloudflare sets CF-IPCountry header
  const cfCountry = req.headers.get("cf-ipcountry");
  // Vercel sets x-vercel-ip-country
  const vercelCountry = req.headers.get("x-vercel-ip-country");

  const raw = cfCountry || vercelCountry || null;
  const country = raw ? COUNTRY_MAP[raw.toUpperCase()] || null : null;

  return NextResponse.json({ country, raw });
}
