import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkKycApproved } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/payments/my-pending — Get buyer's pending transactions (awaiting payment)
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["BUYER"]);
  if (roleCheck) return roleCheck;

  const kycCheck = checkKycApproved(authResult);
  if (kycCheck) return kycCheck;

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        buyerId: authResult.userId,
        status: "PENDING",
      },
      select: {
        id: true,
        grossAmount: true,
        currency: true,
        status: true,
        createdAt: true,
        lot: {
          select: { id: true, lotNumber: true, commodityType: true, grade: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      transactions: transactions.map((tx) => ({
        id: tx.id,
        lotId: tx.lot?.id,
        lotNumber: tx.lot?.lotNumber || "N/A",
        commodityType: tx.lot?.commodityType,
        grade: tx.lot?.grade,
        grossAmount: tx.grossAmount,
        currency: tx.currency,
        status: tx.status,
        createdAt: tx.createdAt,
      })),
    });
  } catch (error) {
    console.error("[MY_PENDING_PAYMENTS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

