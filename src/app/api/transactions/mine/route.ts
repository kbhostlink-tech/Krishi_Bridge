import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/transactions/mine — Return the authenticated user's transactions.
 *
 * - BUYER: transactions where they are the buyer.
 * - FARMER / AGGREGATOR: transactions for lots they sold.
 *
 * Response shape is role-aware so the UI can decide which counterparty name to show.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { userId, role } = authResult;
  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;

  if (role === "BUYER") {
    where.buyerId = userId;
  } else if (role === "FARMER" || role === "AGGREGATOR") {
    where.sellerId = userId;
  } else {
    return NextResponse.json({ error: "Role not supported" }, { status: 403 });
  }

  try {
    const txns = await prisma.transaction.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, email: true, country: true } },
        lot: {
          select: {
            id: true,
            lotNumber: true,
            commodityType: true,
            grade: true,
            quantityKg: true,
            seller: { select: { id: true, name: true, email: true, country: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      role,
      transactions: txns.map((t) => ({
        id: t.id,
        lotId: t.lotId,
        lotNumber: t.lot?.lotNumber ?? null,
        commodityType: t.lot?.commodityType ?? null,
        grade: t.lot?.grade ?? null,
        quantityKg: t.lot?.quantityKg ? Number(t.lot.quantityKg) : null,
        buyer: { id: t.buyer.id, name: t.buyer.name, email: t.buyer.email, country: t.buyer.country },
        seller: t.lot?.seller
          ? { id: t.lot.seller.id, name: t.lot.seller.name, email: t.lot.seller.email, country: t.lot.seller.country }
          : null,
        paymentMethod: t.paymentMethod,
        currency: t.currency,
        grossAmount: Number(t.grossAmount),
        commissionAmount: Number(t.commissionAmount),
        netToSeller: Number(t.netToSeller),
        status: t.status,
        paidAt: t.paidAt,
        adminConfirmedAt: t.adminConfirmedAt,
        fundsReleasedAt: t.fundsReleasedAt,
        buyerReceivedAt: t.buyerReceivedAt,
        manualPaymentRef: t.manualPaymentRef,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("[TRANSACTIONS_MINE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

