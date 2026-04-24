import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/token-expiry — Expire tokens past their expiry date
// Called by external cron job every 24 hours
// Protected by CRON_SECRET header
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all active tokens that have expired
    const expiredTokens = await prisma.token.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        lotId: true,
        ownerId: true,
        expiresAt: true,
        owner: { select: { name: true, email: true } },
        lot: { select: { lotNumber: true, commodityType: true } },
      },
    });

    if (expiredTokens.length === 0) {
      return NextResponse.json({
        message: "No tokens to expire",
        checkedAt: now.toISOString(),
        processed: 0,
      });
    }

    // Batch update all expired tokens
    const tokenIds = expiredTokens.map((t) => t.id);

    await prisma.token.updateMany({
      where: { id: { in: tokenIds } },
      data: { status: "EXPIRED" },
    });

    // Create audit logs for each expired token
    await prisma.auditLog.createMany({
      data: expiredTokens.map((t) => ({
        userId: t.ownerId,
        action: "TOKEN_EXPIRED",
        entity: "Token" as const,
        entityId: t.id,
        metadata: {
          lotId: t.lotId,
          expiresAt: t.expiresAt.toISOString(),
          expiredBySystem: true,
        },
      })),
    });

    // Create in-app notifications + email + push (fire-and-forget)
    for (const token of expiredTokens) {
      notifyUser({
        userId: token.ownerId,
        event: "TOKEN_EXPIRED",
        title: "Token expired",
        body: `Your token for lot ${token.lot?.lotNumber || "N/A"} (${token.lot?.commodityType || "commodity"}) has expired. Please contact support if you need assistance.`,
        data: {
          tokenId: token.id,
          lotNumber: token.lot?.lotNumber || "N/A",
          commodityType: token.lot?.commodityType || "commodity",
          expiryDate: token.expiresAt.toISOString(),
        },
        link: "/dashboard/my-tokens",
      });
    }

    return NextResponse.json({
      message: "Token expiry check completed",
      checkedAt: now.toISOString(),
      processed: expiredTokens.length,
      expiredTokenIds: tokenIds,
    });
  } catch (error) {
    console.error("[TOKEN_EXPIRY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

