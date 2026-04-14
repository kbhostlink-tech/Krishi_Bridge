import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";

// POST /api/tokens/[tokenId]/redeem — Token owner (buyer) redeems to finalize transaction
// ESCROW: Token redemption automatically triggers escrow release in a single atomic transaction
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { tokenId } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const token = await tx.token.findUnique({
        where: { id: tokenId },
        include: {
          lot: {
            select: {
              id: true, lotNumber: true, commodityType: true, grade: true,
              quantityKg: true, farmerId: true,
              warehouse: { select: { id: true, name: true } },
            },
          },
          rfq: {
            select: {
              id: true, commodityType: true, quantityKg: true,
              buyerId: true, deliveryCity: true,
            },
          },
          owner: { select: { id: true, name: true, email: true } },
        },
      });

      if (!token) {
        return { error: "Token not found", status: 404 };
      }

      // Only token owner or admin can redeem
      if (token.ownerId !== authResult.userId && authResult.role !== "ADMIN") {
        return { error: "Only the token owner can redeem this token", status: 403 };
      }

      if (token.status === "REDEEMED") {
        return { error: "Token has already been redeemed", status: 409 };
      }

      if (token.status === "EXPIRED" || new Date() > token.expiresAt) {
        return { error: "Token has expired and cannot be redeemed", status: 410 };
      }

      if (token.status !== "ACTIVE") {
        return { error: `Token is in ${token.status} status and cannot be redeemed`, status: 400 };
      }

      const now = new Date();

      // 1. Mark token as redeemed
      const updated = await tx.token.update({
        where: { id: tokenId },
        data: {
          status: "REDEEMED",
          redeemedAt: now,
        },
      });

      // 2. Update lot status to REDEEMED
      if (token.lot) {
        await tx.lot.update({
          where: { id: token.lot.id },
          data: { status: "REDEEMED" },
        });
      }

      // 3. Record which transaction this redemption relates to (but DON'T finalize — admin releases funds)
      let relatedTransaction = null;
      const txWhere = token.lotId
        ? { lotId: token.lotId, status: { in: ["MANUAL_CONFIRMED", "ESCROW_HELD"] as ("MANUAL_CONFIRMED" | "ESCROW_HELD")[] } }
        : token.rfqId
          ? { rfqId: token.rfqId, status: { in: ["MANUAL_CONFIRMED", "ESCROW_HELD"] as ("MANUAL_CONFIRMED" | "ESCROW_HELD")[] } }
          : null;

      if (txWhere) {
        relatedTransaction = await tx.transaction.findFirst({
          where: txWhere,
          select: {
            id: true,
            netToSeller: true,
            currency: true,
            sellerId: true,
            status: true,
            paymentMethod: true,
          },
        });

        // Mark buyer has received goods (timestamp only, don't change status)
        if (relatedTransaction) {
          await tx.transaction.update({
            where: { id: relatedTransaction.id },
            data: {
              buyerReceivedAt: now,
            },
          });
        }
      }

      // 4. Audit log for token redemption
      const itemRef = token.lot?.lotNumber || (token.rfqId ? `RFQ-${token.rfqId.slice(0, 8)}` : "N/A");
      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "TOKEN_REDEEMED",
          entity: "Token",
          entityId: tokenId,
          metadata: {
            redeemedBy: authResult.userId,
            ownerId: token.ownerId,
            lotId: token.lotId,
            rfqId: token.rfqId,
            lotNumber: token.lot?.lotNumber,
            warehouseName: token.lot?.warehouse?.name,
            escrowReleased: false,
            transactionId: relatedTransaction?.id || null,
          },
        },
      });

      return {
        success: true,
        token: updated,
        owner: token.owner,
        lot: token.lot,
        rfq: token.rfq,
        relatedTransaction,
      };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const itemLabel = result.lot?.lotNumber
      ? `lot ${result.lot.lotNumber}`
      : result.rfq
        ? `RFQ order`
        : "your order";

    // Fire-and-forget notifications
    // Notify token owner — material collected
    if (result.owner) {
      notifyUser({
        userId: result.owner.id,
        event: "TOKEN_REDEEMED",
        title: "Material collected!",
        body: `Your token for ${itemLabel} has been redeemed${result.lot?.warehouse?.name ? ` at ${result.lot.warehouse.name}` : ""}. Material has been released to you.`,
        data: {
          tokenId,
          lotNumber: result.lot?.lotNumber || "N/A",
          commodityType: result.lot?.commodityType || result.rfq?.commodityType || "commodity",
          warehouseName: result.lot?.warehouse?.name || "",
        },
        link: "/dashboard/my-tokens",
      });
    }

    // Notify admins — buyer has redeemed, ready for fund release to seller
    if (result.relatedTransaction) {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      });
      for (const admin of admins) {
        notifyUser({
          userId: admin.id,
          event: "TOKEN_REDEEMED",
          title: "Buyer redeemed token — Ready for fund release",
          body: `Buyer ${result.owner?.name || "Unknown"} has redeemed token for ${itemLabel}. Transaction ${result.relatedTransaction.id} is ready for fund release to seller.`,
          data: {
            tokenId,
            transactionId: result.relatedTransaction.id,
            lotNumber: result.lot?.lotNumber || "N/A",
            netToSeller: Number(result.relatedTransaction.netToSeller).toFixed(2),
            currency: result.relatedTransaction.currency,
          },
          channels: ["email", "push", "in_app"],
        });
      }

      // Notify seller — buyer collected, funds pending admin release
      notifyUser({
        userId: result.relatedTransaction.sellerId,
        event: "TOKEN_REDEEMED",
        title: "Buyer collected material",
        body: `Buyer collected material for ${itemLabel}. The platform will release ${result.relatedTransaction.currency} ${Number(result.relatedTransaction.netToSeller).toFixed(2)} to your bank account shortly.`,
        data: {
          transactionId: result.relatedTransaction.id,
          lotNumber: result.lot?.lotNumber,
          netToSeller: Number(result.relatedTransaction.netToSeller).toFixed(2),
        },
        link: "/dashboard",
      });
    }

    return NextResponse.json({
      message: "Token redeemed successfully",
      token: {
        id: result.token.id,
        status: result.token.status,
        redeemedAt: result.token.redeemedAt,
      },
    });
  } catch (error) {
    console.error("[TOKEN_REDEEM]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
