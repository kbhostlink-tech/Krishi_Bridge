import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PaymentStatus } from "@/generated/prisma/client";

/**
 * GET /api/payments/my-stats — Get user's transaction stats (completed count)
 * Works for both buyers and sellers/farmers.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const completedStatuses: PaymentStatus[] = ["MANUAL_CONFIRMED", "COMPLETED", "FUNDS_RELEASED"];

    const completedCount = await prisma.transaction.count({
      where: {
        OR: [
          { buyerId: authResult.userId },
          { sellerId: authResult.userId },
        ],
        status: { in: completedStatuses },
      },
    });

    const totalCount = await prisma.transaction.count({
      where: {
        OR: [
          { buyerId: authResult.userId },
          { sellerId: authResult.userId },
        ],
      },
    });

    return NextResponse.json({ completedCount, totalCount });
  } catch (error) {
    console.error("[MY_PAYMENT_STATS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

