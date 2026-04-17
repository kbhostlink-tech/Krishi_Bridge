import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getDownloadPresignedUrl } from "@/lib/r2";

interface RouteParams {
  params: Promise<{ transactionId: string }>;
}

// GET /api/payments/[transactionId] — Get payment/transaction details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { transactionId } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        lot: { select: { id: true, lotNumber: true, commodityType: true, grade: true, quantityKg: true, images: true } },
        buyer: { select: { id: true, name: true, email: true, country: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Only buyer or seller can view
    if (transaction.buyerId !== authResult.userId && transaction.sellerId !== authResult.userId && authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Sign lot images so they display correctly on the payment page
    let signedImages: string[] = [];
    if (transaction.lot?.images?.length) {
      signedImages = await Promise.all(
        transaction.lot.images.map((key) => getDownloadPresignedUrl(key))
      );
    }

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        lotId: transaction.lotId,
        lot: transaction.lot ? {
          ...transaction.lot,
          quantityKg: Number(transaction.lot.quantityKg),
          images: signedImages,
        } : null,
        rfqId: transaction.rfqId,
        buyerId: transaction.buyerId,
        buyer: transaction.buyer,
        sellerId: transaction.sellerId,
        gatewayOrderId: transaction.gatewayOrderId,
        paymentMethod: transaction.paymentMethod,
        currency: transaction.currency,
        grossAmount: Number(transaction.grossAmount),
        commissionAmount: Number(transaction.commissionAmount),
        taxOnGoods: Number(transaction.taxOnGoods),
        taxOnCommission: Number(transaction.taxOnCommission),
        netToSeller: Number(transaction.netToSeller),
        status: transaction.status,
        paidAt: transaction.paidAt,
        escrowReleasedAt: transaction.escrowReleasedAt,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("[PAYMENT_DETAIL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
