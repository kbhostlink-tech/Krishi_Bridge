import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyMany } from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/auction-start — Transition LISTED → AUCTION_ACTIVE
// Called by external cron job every 1 minute
// Protected by CRON_SECRET header
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find lots that should become AUCTION_ACTIVE
    const lotsToActivate = await prisma.lot.findMany({
      where: {
        status: "LISTED",
        listingMode: { in: ["AUCTION", "BOTH"] },
        auctionStartsAt: { lte: now },
        auctionEndsAt: { gt: now },
      },
      select: { id: true, lotNumber: true, sellerId: true },
    });

    if (lotsToActivate.length === 0) {
      return NextResponse.json({
        message: "No auctions to start",
        processedAt: now.toISOString(),
        lotsActivated: 0,
      });
    }

    // Update all matching lots atomically
    const lotIds = lotsToActivate.map((l) => l.id);

    await prisma.$transaction(async (tx) => {
      await tx.lot.updateMany({
        where: { id: { in: lotIds } },
        data: { status: "AUCTION_ACTIVE" },
      });

      // Create audit log entries for each activated lot
      await tx.auditLog.createMany({
        data: lotsToActivate.map((lot) => ({
          userId: lot.sellerId,
          action: "AUCTION_STARTED",
          entity: "Lot",
          entityId: lot.id,
          metadata: { lotNumber: lot.lotNumber, activatedAt: now.toISOString() },
        })),
      });
    });

    // Notify each seller that their auction is now live
    await notifyMany(
      lotsToActivate.map((lot) => ({
        userId: lot.sellerId,
        event: "LOT_STATUS_CHANGE" as const,
        title: "Your Auction is Now Live!",
        body: `Auction for lot ${lot.lotNumber} has started. Buyers can now place bids.`,
        data: { lotId: lot.id, lotNumber: lot.lotNumber },
        link: `/dashboard/lots/${lot.id}`,
      }))
    );

    console.log(`[CRON_AUCTION_START] Activated ${lotsToActivate.length} auctions:`, lotIds);

    return NextResponse.json({
      message: `Activated ${lotsToActivate.length} auctions`,
      processedAt: now.toISOString(),
      lotsActivated: lotsToActivate.length,
      lotIds,
    });
  } catch (error) {
    console.error("[CRON_AUCTION_START]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
