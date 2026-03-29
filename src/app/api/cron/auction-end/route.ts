import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/auction-end — Process ended auctions
// Called by external cron job every 1 minute
// Protected by CRON_SECRET header to prevent unauthorized access
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all lots where auction has ended but status is still AUCTION_ACTIVE
    const endedLots = await prisma.lot.findMany({
      where: {
        status: "AUCTION_ACTIVE",
        auctionEndsAt: { lte: now },
      },
      select: {
        id: true,
        lotNumber: true,
        farmerId: true,
        reservePriceUsd: true,
        bids: {
          orderBy: { amountUsd: "desc" },
          take: 1,
          select: { id: true, bidderId: true, amountUsd: true },
        },
      },
    });

    if (endedLots.length === 0) {
      return NextResponse.json({
        message: "No auctions to end",
        processedAt: now.toISOString(),
        lotsProcessed: 0,
      });
    }

    const results: { lotId: string; lotNumber: string; outcome: string }[] = [];

    for (const lot of endedLots) {
      const highestBid = lot.bids[0];

      if (!highestBid) {
        // No bids — return to LISTED
        await prisma.$transaction(async (tx) => {
          await tx.lot.update({
            where: { id: lot.id },
            data: { status: "LISTED" },
          });
          await tx.auditLog.create({
            data: {
              userId: lot.farmerId,
              action: "AUCTION_ENDED_NO_BIDS",
              entity: "Lot",
              entityId: lot.id,
              metadata: { lotNumber: lot.lotNumber },
            },
          });
        });
        results.push({ lotId: lot.id, lotNumber: lot.lotNumber, outcome: "NO_BIDS" });
        continue;
      }

      const reservePrice = lot.reservePriceUsd ? Number(lot.reservePriceUsd) : 0;
      const bidAmount = Number(highestBid.amountUsd);

      if (reservePrice > 0 && bidAmount < reservePrice) {
        // Below reserve — return to LISTED
        await prisma.$transaction(async (tx) => {
          await tx.lot.update({
            where: { id: lot.id },
            data: { status: "LISTED" },
          });
          await tx.bid.updateMany({
            where: { lotId: lot.id },
            data: { status: "CANCELLED" },
          });
          await tx.auditLog.create({
            data: {
              userId: lot.farmerId,
              action: "AUCTION_ENDED_BELOW_RESERVE",
              entity: "Lot",
              entityId: lot.id,
              metadata: {
                lotNumber: lot.lotNumber,
                reservePrice: reservePrice,
                highestBid: bidAmount,
              },
            },
          });
        });
        results.push({ lotId: lot.id, lotNumber: lot.lotNumber, outcome: "BELOW_RESERVE" });
        continue;
      }

      // Winner found — mark SOLD
      await prisma.$transaction(async (tx) => {
        await tx.lot.update({
          where: { id: lot.id },
          data: { status: "SOLD" },
        });
        await tx.bid.update({
          where: { id: highestBid.id },
          data: { status: "WON" },
        });
        await tx.bid.updateMany({
          where: { lotId: lot.id, id: { not: highestBid.id } },
          data: { status: "CANCELLED" },
        });
        await tx.auditLog.create({
          data: {
            userId: lot.farmerId,
            action: "AUCTION_ENDED_SOLD",
            entity: "Lot",
            entityId: lot.id,
            metadata: {
              lotNumber: lot.lotNumber,
              winnerId: highestBid.bidderId,
              amount: bidAmount,
            },
          },
        });
        // TODO Week 3: Create Transaction + Token, send notifications
      });
      results.push({ lotId: lot.id, lotNumber: lot.lotNumber, outcome: "SOLD" });
    }

    console.log(`[CRON_AUCTION_END] Processed ${endedLots.length} auctions:`, results);

    return NextResponse.json({
      message: `Processed ${endedLots.length} auctions`,
      processedAt: now.toISOString(),
      lotsProcessed: endedLots.length,
      results,
    });
  } catch (error) {
    console.error("[CRON_AUCTION_END]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
