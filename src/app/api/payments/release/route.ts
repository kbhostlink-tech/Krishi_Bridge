import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

const releaseSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  reason: z.string().min(10, "A reason with at least 10 characters is required").max(500),
  paymentReference: z.string().max(200).optional(),
});

/**
 * POST /api/payments/release — Admin releases funds to seller's bank account
 *
 * NEW FLOW:
 * 1. Buyer paid platform → Admin confirmed → Token minted → Buyer redeemed
 * 2. Transaction is now MANUAL_CONFIRMED (or COMPLETED after redeem)
 * 3. Admin verifies everything is in order, releases funds to seller's bank
 * 4. Transaction → FUNDS_RELEASED
 *
 * Only ADMIN with escrow.release permission can release funds.
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
    const parsed = releaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { transactionId, reason, paymentReference } = parsed.data;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        status: true,
        lotId: true,
        buyerId: true,
        sellerId: true,
        netToSeller: true,
        grossAmount: true,
        currency: true,
        lot: { select: { lotNumber: true, commodityType: true } },
        buyer: { select: { id: true, name: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Fetch seller with bank details separately (no seller relation on Transaction)
    const seller = await prisma.user.findUnique({
      where: { id: transaction.sellerId },
      select: {
        id: true, name: true, email: true,
        sellerProfile: {
          select: { bankAccountName: true, bankAccountNumber: true, bankName: true, bankBranch: true, bankIfscCode: true },
        },
      },
    });

    // Allow release from MANUAL_CONFIRMED, COMPLETED, or ESCROW_HELD
    const releasableStatuses = ["MANUAL_CONFIRMED", "COMPLETED", "ESCROW_HELD"];
    if (!releasableStatuses.includes(transaction.status)) {
      return NextResponse.json(
        { error: `Cannot release funds. Transaction is in ${transaction.status} status. Expected one of: ${releasableStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Mark transaction as FUNDS_RELEASED
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "FUNDS_RELEASED",
          fundsReleasedBy: authResult.userId,
          fundsReleasedAt: now,
          escrowReleasedAt: now,
        },
      });

      // 2. Audit log with admin reason + seller bank details reference
      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "FUNDS_RELEASED_TO_SELLER",
          entity: "Transaction",
          entityId: transactionId,
          metadata: {
            triggeredBy: "ADMIN",
            adminUserId: authResult.userId,
            reason: reason.trim(),
            paymentReference: paymentReference || null,
            lotId: transaction.lotId,
            lotNumber: transaction.lot?.lotNumber,
            netToSeller: Number(transaction.netToSeller),
            currency: transaction.currency,
            sellerBankName: seller?.sellerProfile?.bankName || null,
            sellerAccountNumber: seller?.sellerProfile?.bankAccountNumber
              ? `****${seller.sellerProfile.bankAccountNumber.slice(-4)}`
              : null,
          },
        },
      });

      // 3. In-app notifications
      await tx.notification.create({
        data: {
          userId: transaction.sellerId,
          type: "IN_APP",
          title: "Funds released to your account!",
          body: `${transaction.currency} ${Number(transaction.netToSeller).toFixed(2)} for ${transaction.lot?.lotNumber || "your transaction"} has been released to your bank account.${paymentReference ? ` Ref: ${paymentReference}` : ""}`,
          data: { transactionId, paymentReference },
        },
      });

      await tx.notification.create({
        data: {
          userId: transaction.buyerId,
          type: "IN_APP",
          title: "Transaction finalized",
          body: `Funds for ${transaction.lot?.lotNumber || "your transaction"} have been released to the seller. Transaction is complete.`,
          data: { transactionId },
        },
      });
    });

    // Fire-and-forget email + push to seller
    notifyUser({
      userId: transaction.sellerId,
      event: "PAYMENT_CONFIRMED",
      title: "Funds released to your account!",
      body: `${transaction.currency} ${Number(transaction.netToSeller).toFixed(2)} for lot ${transaction.lot?.lotNumber || "N/A"} has been released to your bank account by the platform.${paymentReference ? ` Payment reference: ${paymentReference}` : ""}`,
      data: { transactionId, lotNumber: transaction.lot?.lotNumber, netToSeller: Number(transaction.netToSeller).toFixed(2) },
      channels: ["email", "push"],
    });

    return NextResponse.json({
      message: "Funds released successfully",
      transactionId,
      status: "FUNDS_RELEASED",
      fundsReleasedAt: now.toISOString(),
      netToSeller: Number(transaction.netToSeller).toFixed(2),
      currency: transaction.currency,
    });
  } catch (error) {
    console.error("[FUNDS_RELEASE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
