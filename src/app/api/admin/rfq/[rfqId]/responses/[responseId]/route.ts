import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkAdminPermission } from "@/lib/auth";
import { adminRfqResponseEditSchema } from "@/lib/validations";
import { loadAdminRfqResponseContext, notifyRfqEditRecipients } from "@/lib/rfq-admin";

interface RouteParams {
  params: Promise<{ rfqId: string; responseId: string }>;
}

// PATCH /api/admin/rfq/[rfqId]/responses/[responseId] — Admin edits seller response content
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    if (!checkAdminPermission(authResult, "rfq.route")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { rfqId, responseId } = await params;
    const body = await req.json();
    const parsed = adminRfqResponseEditSchema.safeParse(body);
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

    const { rfq, response } = context;
    const data = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.rfqResponse.update({
        where: { id: responseId },
        data: {
          ...(data.offeredPriceInr !== undefined ? { offeredPriceInr: data.offeredPriceInr } : {}),
          ...(data.adminEditedPriceInr !== undefined
            ? { adminEditedPriceInr: data.adminEditedPriceInr }
            : {}),
          ...(data.currency !== undefined ? { currency: data.currency } : {}),
          ...(data.deliveryDays !== undefined ? { deliveryDays: data.deliveryDays } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
        include: {
          seller: { select: { id: true, name: true, country: true } },
          negotiations: {
            include: { fromUser: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "RFQ_RESPONSE_EDITED",
          entity: "RfqResponse",
          entityId: responseId,
          metadata: {
            rfqId,
            changes: data,
          },
        },
      });

      return row;
    });

    await notifyRfqEditRecipients({
      rfqId,
      buyerId: rfq.buyerId,
      sellerId: response.sellerId,
      commodityType: rfq.commodityType,
      notifyBuyer: response.adminForwarded,
      notifySeller: true,
    });

    return NextResponse.json({
      response: {
        id: updated.id,
        sellerId: updated.sellerId,
        seller: updated.seller,
        offeredPriceInr: Number(updated.offeredPriceInr),
        adminEditedPriceInr: updated.adminEditedPriceInr
          ? Number(updated.adminEditedPriceInr)
          : null,
        currency: updated.currency,
        deliveryDays: updated.deliveryDays,
        notes: updated.notes,
        status: updated.status,
        adminForwarded: updated.adminForwarded,
        createdAt: updated.createdAt,
        negotiations: updated.negotiations.map((n) => ({
          id: n.id,
          fromUser: n.fromUser,
          message: n.message,
          proposedPriceInr: n.proposedPriceInr ? Number(n.proposedPriceInr) : null,
          proposedQuantityKg: n.proposedQuantityKg ? Number(n.proposedQuantityKg) : null,
          createdAt: n.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[ADMIN_RFQ_RESPONSE_EDIT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
