import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkAdminPermission } from "@/lib/auth";
import { adminRfqNegotiationEditSchema } from "@/lib/validations";
import { loadAdminRfqResponseContext, notifyRfqEditRecipients } from "@/lib/rfq-admin";

interface RouteParams {
  params: Promise<{ rfqId: string; responseId: string; negotiationId: string }>;
}

// PATCH /api/admin/rfq/[rfqId]/responses/[responseId]/negotiations/[negotiationId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    if (!checkAdminPermission(authResult, "rfq.route")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { rfqId, responseId, negotiationId } = await params;
    const body = await req.json();
    const parsed = adminRfqNegotiationEditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const context = await loadAdminRfqResponseContext(rfqId, responseId);
    if (!context) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    const existing = await prisma.rfqNegotiation.findUnique({
      where: { id: negotiationId },
      select: { id: true, responseId: true, fromUserId: true },
    });

    if (!existing || existing.responseId !== responseId) {
      return NextResponse.json({ error: "Negotiation message not found" }, { status: 404 });
    }

    const { rfq, response } = context;
    const data = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.rfqNegotiation.update({
        where: { id: negotiationId },
        data: {
          ...(data.message !== undefined ? { message: data.message } : {}),
          ...(data.proposedPriceInr !== undefined
            ? { proposedPriceInr: data.proposedPriceInr }
            : {}),
          ...(data.proposedQuantityKg !== undefined
            ? { proposedQuantityKg: data.proposedQuantityKg }
            : {}),
        },
        include: {
          fromUser: { select: { id: true, name: true, role: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "RFQ_NEGOTIATION_EDITED",
          entity: "RfqNegotiation",
          entityId: negotiationId,
          metadata: {
            rfqId,
            responseId,
            changes: data,
          },
        },
      });

      return row;
    });

    const messageFromBuyer = existing.fromUserId === rfq.buyerId;
    await notifyRfqEditRecipients({
      rfqId,
      buyerId: rfq.buyerId,
      sellerId: response.sellerId,
      commodityType: rfq.commodityType,
      notifyBuyer: response.adminForwarded && !messageFromBuyer,
      notifySeller: messageFromBuyer,
    });

    return NextResponse.json({
      negotiation: {
        id: updated.id,
        fromUser: updated.fromUser,
        message: updated.message,
        proposedPriceInr: updated.proposedPriceInr ? Number(updated.proposedPriceInr) : null,
        proposedQuantityKg: updated.proposedQuantityKg
          ? Number(updated.proposedQuantityKg)
          : null,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error("[ADMIN_RFQ_NEGOTIATION_EDIT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
