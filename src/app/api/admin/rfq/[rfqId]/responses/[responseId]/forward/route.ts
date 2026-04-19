import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkAdminPermission } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

const forwardSchema = z.object({
  adminEditedPriceInr: z.number().positive("Price must be positive").optional(),
  adminNote: z.string().max(500).optional(),
});

interface RouteParams {
  params: Promise<{ rfqId: string; responseId: string }>;
}

// POST /api/admin/rfq/[rfqId]/responses/[responseId]/forward — Admin reviews and forwards a seller response to buyer
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    if (!checkAdminPermission(authResult, "rfq.route")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { rfqId, responseId } = await params;
    const body = await req.json();
    const parsed = forwardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [rfq, response] = await Promise.all([
      prisma.rfqRequest.findUnique({
        where: { id: rfqId },
        select: { id: true, buyerId: true, commodityType: true, quantityKg: true },
      }),
      prisma.rfqResponse.findUnique({
        where: { id: responseId },
        select: { id: true, rfqId: true, sellerId: true, offeredPriceInr: true, adminForwarded: true },
      }),
    ]);

    if (!rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }
    if (!response || response.rfqId !== rfqId) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }
    if (response.adminForwarded) {
      return NextResponse.json({ error: "Response already forwarded to buyer" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.rfqResponse.update({
        where: { id: responseId },
        data: {
          adminForwarded: true,
          ...(parsed.data.adminEditedPriceInr ? { adminEditedPriceInr: parsed.data.adminEditedPriceInr } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "RFQ_RESPONSE_FORWARDED",
          entity: "RfqResponse",
          entityId: responseId,
          metadata: {
            rfqId,
            originalPriceInr: Number(response.offeredPriceInr),
            editedPriceInr: parsed.data.adminEditedPriceInr || null,
          },
        },
      });

      // Notify buyer that a new response is available
      await tx.notification.create({
        data: {
          userId: rfq.buyerId,
          type: "IN_APP",
          title: "New response to your RFQ",
          body: `A supplier has submitted a response to your ${rfq.commodityType.replace(/_/g, " ")} request. Review the terms now.`,
          data: { rfqId, responseId },
        },
      });
    });

    // Fire-and-forget: email + push for buyer
    notifyUser({
      userId: rfq.buyerId,
      event: "RFQ_RESPONSE_RECEIVED",
      title: "New response to your RFQ",
      body: `A supplier has submitted a response to your ${rfq.commodityType.replace(/_/g, " ")} request. Review the terms now.`,
      data: {
        rfqId,
        responseId,
        commodityType: rfq.commodityType.replace(/_/g, " "),
        formattedOfferedPrice: "View details on platform",
      },
      channels: ["email", "push"],
      link: `/rfq/${rfqId}`,
    });

    return NextResponse.json({
      message: "Response forwarded to buyer",
      responseId,
    });
  } catch (error) {
    console.error("[ADMIN_RFQ_FORWARD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
