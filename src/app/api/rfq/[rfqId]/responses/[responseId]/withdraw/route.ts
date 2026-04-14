import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ rfqId: string; responseId: string }>;
}

// PUT /api/rfq/[rfqId]/responses/[responseId]/withdraw — Withdraw a response (Seller only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = checkRole(authResult, ["FARMER", "AGGREGATOR"]);
    if (roleCheck) return roleCheck;

    const { rfqId, responseId } = await params;

    const response = await prisma.rfqResponse.findUnique({
      where: { id: responseId },
      select: { id: true, rfqId: true, sellerId: true, status: true },
    });

    if (!response || response.rfqId !== rfqId) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    if (response.sellerId !== authResult.userId) {
      return NextResponse.json({ error: "Only the responding seller can withdraw" }, { status: 403 });
    }

    if (response.status === "WITHDRAWN" || response.status === "ACCEPTED" || response.status === "REJECTED") {
      return NextResponse.json(
        { error: `Cannot withdraw a response that is ${response.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.rfqResponse.update({
        where: { id: responseId },
        data: { status: "WITHDRAWN" },
      });

      // Decrement response count
      await tx.rfqRequest.update({
        where: { id: rfqId },
        data: { responseCount: { decrement: 1 } },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "RFQ_RESPONSE_WITHDRAWN",
          entity: "RfqResponse",
          entityId: responseId,
          metadata: { rfqId },
        },
      });

      // Notify buyer
      const rfq = await tx.rfqRequest.findUnique({
        where: { id: rfqId },
        select: { buyerId: true },
      });
      if (rfq) {
        await tx.notification.create({
          data: {
            userId: rfq.buyerId,
            type: "IN_APP",
            title: "Seller withdrew their response",
            body: "A seller has withdrawn their response to your RFQ.",
            data: { rfqId, responseId },
          },
        });
      }
    });

    // Send email + push notification to buyer (outside tx for reliability)
    const rfqData = await prisma.rfqRequest.findUnique({
      where: { id: rfqId },
      select: { buyerId: true },
    });
    if (rfqData) {
      await notifyUser({
        userId: rfqData.buyerId,
        event: "RFQ_REJECTED",
        title: "Seller Withdrew Response",
        body: "A seller has withdrawn their response to your RFQ. You may want to check remaining responses.",
        data: { rfqId, responseId },
        link: `/dashboard/rfq/${rfqId}`,
        channels: ["email", "push"],
      });
    }

    return NextResponse.json({ message: "Response withdrawn successfully" });
  } catch (error) {
    console.error("[RFQ_WITHDRAW]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
