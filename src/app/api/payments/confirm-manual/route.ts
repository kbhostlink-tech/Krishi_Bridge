import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";
import { generateTokenHmac, getTokenExpiryDate } from "@/lib/token-utils";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

const confirmManualSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  paymentReference: z.string().min(1, "Payment reference is required").max(200),
  remarks: z.string().max(500).optional(),
});

/**
 * POST /api/payments/confirm-manual — Admin confirms buyer's payment to platform account
 *
 * NEW FLOW:
 * 1. Buyer initiates payment record (PENDING, MANUAL_OFFLINE)
 * 2. Buyer pays to platform bank account with their unique code in remarks
 * 3. Admin verifies payment received, comes here and confirms
 * 4. Transaction → MANUAL_CONFIRMED, token minted to buyer, lot stays SOLD
 *
 * Only ADMIN with escrow.release (or payments.*) permission can confirm.
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = checkRole(authResult, ["ADMIN"]);
    if (roleCheck) return roleCheck;

    const permCheck = requireAdminPermission(authResult, "escrow.release");
    if (permCheck) return permCheck;

    const body = await req.json();
    const parsed = confirmManualSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { transactionId, paymentReference, remarks } = parsed.data;

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        status: true,
        sellerId: true,
        buyerId: true,
        lotId: true,
        rfqId: true,
        grossAmount: true,
        currency: true,
        paymentMethod: true,
        buyer: { select: { id: true, name: true, uniquePaymentCode: true } },
        lot: { select: { id: true, lotNumber: true, commodityType: true, status: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Only PENDING manual transactions can be confirmed
    if (transaction.status !== "PENDING") {
      return NextResponse.json(
        { error: `Transaction is already ${transaction.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (transaction.paymentMethod !== "MANUAL_OFFLINE") {
      return NextResponse.json(
        { error: "Only manual offline payments can be confirmed this way" },
        { status: 400 }
      );
    }

    const now = new Date();
    let tokenId: string | undefined;

    await prisma.$transaction(async (tx) => {
      // 1. Mark transaction as MANUAL_CONFIRMED by admin
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "MANUAL_CONFIRMED",
          manualPaymentRef: paymentReference,
          manualConfirmedBy: authResult.userId,
          manualConfirmedAt: now,
          adminConfirmedBy: authResult.userId,
          adminConfirmedAt: now,
          paidAt: now,
        },
      });

      // 2. Mint ownership token if this is a lot-based transaction
      if (transaction.lotId) {
        const mintedAt = now.toISOString();
        const hmacHash = generateTokenHmac({
          lotId: transaction.lotId,
          ownerId: transaction.buyerId,
          mintedAt,
        });

        const token = await tx.token.create({
          data: {
            lotId: transaction.lotId,
            ownerId: transaction.buyerId,
            hmacHash,
            mintedAt: now,
            expiresAt: getTokenExpiryDate(),
          },
        });
        tokenId = token.id;
      }

      // 2b. Mint ownership token for RFQ-based transaction
      if (!transaction.lotId && transaction.rfqId) {
        const mintedAt = now.toISOString();
        const hmacHash = generateTokenHmac({
          lotId: transaction.rfqId,
          ownerId: transaction.buyerId,
          mintedAt,
        });

        const token = await tx.token.create({
          data: {
            rfqId: transaction.rfqId,
            ownerId: transaction.buyerId,
            hmacHash,
            mintedAt: now,
            expiresAt: getTokenExpiryDate(),
          },
        });
        tokenId = token.id;
      }

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "ADMIN_PAYMENT_CONFIRMED",
          entity: "Transaction",
          entityId: transaction.id,
          metadata: {
            paymentReference,
            remarks: remarks || null,
            grossAmount: Number(transaction.grossAmount),
            currency: transaction.currency,
            confirmedByAdmin: authResult.userId,
            buyerPaymentCode: transaction.buyer?.uniquePaymentCode || null,
            tokenId,
          },
        },
      });

      // 4. In-app notification for buyer
      const itemLabel = transaction.lot
        ? `lot ${transaction.lot.lotNumber}`
        : transaction.rfqId
          ? `RFQ order`
          : `your order`;
      await tx.notification.create({
        data: {
          userId: transaction.buyerId,
          type: "IN_APP",
          title: "Payment confirmed by platform",
          body: tokenId
            ? `Your payment for ${itemLabel} has been confirmed. A digital ownership token has been minted for you. Visit the warehouse to redeem.`
            : `Your payment has been confirmed. Reference: ${paymentReference}`,
          data: { transactionId: transaction.id, tokenId },
        },
      });
    });

    // Fire-and-forget: email + push notifications to buyer
    const emailItemLabel = transaction.lot?.lotNumber
      ? `lot ${transaction.lot.lotNumber}`
      : transaction.rfqId
        ? "your RFQ order"
        : "your order";
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    notifyUser({
      userId: transaction.buyerId,
      event: "PAYMENT_CONFIRMED",
      title: "Payment confirmed — Token minted",
      body: tokenId
        ? `Your payment for ${emailItemLabel} has been confirmed by the platform. Your ownership token is ready. Visit the warehouse to redeem.`
        : `Your payment has been confirmed. Reference: ${paymentReference}`,
      data: { transactionId: transaction.id, tokenId, lotNumber: transaction.lot?.lotNumber, ctaUrl: tokenId ? `${APP_URL}/en/dashboard/my-tokens` : `${APP_URL}/en/dashboard` },
      channels: ["email", "push"],
    });

    // Notify seller that payment was received (but funds NOT yet released)
    notifyUser({
      userId: transaction.sellerId,
      event: "PAYMENT_CONFIRMED",
      title: "Buyer payment confirmed",
      body: `Buyer payment for ${emailItemLabel} has been confirmed by the platform. Funds will be released to you after the buyer collects the material.`,
      data: { transactionId: transaction.id, lotNumber: transaction.lot?.lotNumber, ctaUrl: `${APP_URL}/en/dashboard` },
      channels: ["email", "push", "in_app"],
    });

    return NextResponse.json({
      message: "Payment confirmed successfully",
      transactionId: transaction.id,
      status: "MANUAL_CONFIRMED",
      tokenId: tokenId || null,
      paymentReference,
    });
  } catch (error) {
    console.error("[ADMIN_PAYMENT_CONFIRM]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
