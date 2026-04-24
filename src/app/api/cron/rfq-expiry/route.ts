import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser, notifyMany } from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/rfq-expiry — Expire RFQs that have passed their deadline
// Called by external cron job every 15 minutes
// Protected by CRON_SECRET header
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all expired RFQs that are still in active states
    const expiredRfqs = await prisma.rfqRequest.findMany({
      where: {
        status: { in: ["OPEN", "RESPONDED", "NEGOTIATING"] },
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        buyerId: true,
        commodityType: true,
        responses: {
          select: { id: true, sellerId: true, status: true },
        },
      },
    });

    if (expiredRfqs.length === 0) {
      return NextResponse.json({
        message: "No RFQs to expire",
        checkedAt: now.toISOString(),
        processed: 0,
      });
    }

    const results: { rfqId: string; responseCount: number }[] = [];

    for (const rfq of expiredRfqs) {
      await prisma.$transaction(async (tx) => {
        // Mark RFQ as expired
        await tx.rfqRequest.update({
          where: { id: rfq.id },
          data: { status: "EXPIRED" },
        });

        // Reject all pending/countered responses
        await tx.rfqResponse.updateMany({
          where: {
            rfqId: rfq.id,
            status: { in: ["PENDING", "COUNTERED"] },
          },
          data: { status: "REJECTED" },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            action: "RFQ_EXPIRED",
            entity: "RfqRequest",
            entityId: rfq.id,
            metadata: {
              commodityType: rfq.commodityType,
              responseCount: rfq.responses.length,
            },
          },
        });

        // Notify buyer
        await tx.notification.create({
          data: {
            userId: rfq.buyerId,
            type: "IN_APP",
            title: "Your RFQ has expired",
            body: `Your RFQ for ${rfq.commodityType.replace(/_/g, " ")} has expired. You can create a new one if needed.`,
            data: { rfqId: rfq.id },
          },
        });

        // Notify all responding sellers
        const sellerIds = [...new Set(rfq.responses.map((r) => r.sellerId))];
        if (sellerIds.length > 0) {
          await tx.notification.createMany({
            data: sellerIds.map((sellerId) => ({
              userId: sellerId,
              type: "IN_APP" as const,
              title: "RFQ expired",
              body: `An RFQ you responded to for ${rfq.commodityType.replace(/_/g, " ")} has expired.`,
              data: { rfqId: rfq.id },
            })),
          });
        }
      });

      results.push({ rfqId: rfq.id, responseCount: rfq.responses.length });

      // Fire-and-forget: email notifications (in-app already in transaction)
      notifyUser({
        userId: rfq.buyerId,
        event: "RFQ_EXPIRED",
        title: "Your RFQ has expired",
        body: `Your RFQ for ${rfq.commodityType.replace(/_/g, " ")} has expired. You can create a new one if needed.`,
        data: { rfqId: rfq.id, commodityType: rfq.commodityType },
        channels: ["email"],
      });
      const sellerIds = [...new Set(rfq.responses.map((r) => r.sellerId))];
      if (sellerIds.length > 0) {
        notifyMany(
          sellerIds.map((sellerId) => ({
            userId: sellerId,
            event: "RFQ_EXPIRED" as const,
            title: "RFQ expired",
            body: `An RFQ you responded to for ${rfq.commodityType.replace(/_/g, " ")} has expired.`,
            data: { rfqId: rfq.id },
            channels: ["email"] as const,
          }))
        );
      }
    }

    console.log(`[CRON_RFQ_EXPIRY] Expired ${expiredRfqs.length} RFQs:`, results);

    return NextResponse.json({
      message: `Expired ${expiredRfqs.length} RFQs`,
      checkedAt: now.toISOString(),
      processed: expiredRfqs.length,
      results,
    });
  } catch (error) {
    console.error("[CRON_RFQ_EXPIRY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

