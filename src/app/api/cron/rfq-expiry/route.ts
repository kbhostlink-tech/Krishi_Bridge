import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/rfq-expiry — Expire RFQs that have passed their deadline
// Called by external cron job every 5 minutes
// Protected by CRON_SECRET header
//
// Week 3 TODO:
// 1. Find lots where listingMode IN (RFQ, BOTH) and rfqDeadline <= now and status = LISTED
// 2. If no quotes received → set status back to LISTED (auction-only) or CANCELLED
// 3. If quotes received → mark best quote, notify farmer
// 4. Create AuditLog entries for each transition
// 5. Send notification emails to affected parties
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Stub — full implementation in Week 3 when RFQ models are fleshed out
    const now = new Date();

    return NextResponse.json({
      message: "RFQ expiry cron stub — not yet implemented",
      checkedAt: now.toISOString(),
      processed: 0,
    });
  } catch (error) {
    console.error("[RFQ_EXPIRY_CRON]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
