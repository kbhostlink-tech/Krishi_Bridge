import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, checkKycApproved } from "@/lib/auth";
import { notifyMany } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ rfqId: string; responseId: string }>;
}

// POST /api/rfq/[rfqId]/accept/[responseId] — SELECT a preferred response (Buyer only)
// Platform-mediated: buyer selects based on terms (no price visibility).
// Admin then finalizes deal via /api/admin/rfq/[rfqId]/set-terms.
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = checkRole(authResult, ["BUYER"]);
    if (roleCheck) return roleCheck;

    const kycCheck = checkKycApproved(authResult);
    if (kycCheck) return kycCheck;

    const { rfqId, responseId } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const rfq = await tx.rfqRequest.findUnique({
        where: { id: rfqId },
        select: { id: true, buyerId: true, status: true, selectedResponseId: true, commodityType: true },
      });

      if (!rfq) throw new Error("RFQ_NOT_FOUND");
      if (rfq.buyerId !== authResult.userId) throw new Error("NOT_OWNER");
      if (rfq.status === "ACCEPTED") throw new Error("ALREADY_ACCEPTED");
      if (rfq.status === "SELECTED") throw new Error("ALREADY_SELECTED");
      if (rfq.status === "CANCELLED" || rfq.status === "EXPIRED") {
        throw new Error("RFQ_CLOSED");
      }

      const response = await tx.rfqResponse.findUnique({
        where: { id: responseId },
        select: { id: true, rfqId: true, sellerId: true, status: true },
      });

      if (!response || response.rfqId !== rfqId) throw new Error("RESPONSE_NOT_FOUND");
      if (response.status !== "PENDING" && response.status !== "COUNTERED") {
        throw new Error("RESPONSE_NOT_AVAILABLE");
      }

      // Mark RFQ as SELECTED with selectedResponseId
      await tx.rfqRequest.update({
        where: { id: rfqId },
        data: { status: "SELECTED", selectedResponseId: responseId },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "RFQ_RESPONSE_SELECTED",
          entity: "RfqRequest",
          entityId: rfqId,
          metadata: { responseId, sellerId: response.sellerId },
        },
      });

      // Notify admins to set final terms
      const admins = await tx.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: "IN_APP" as const,
            title: "Buyer selected an RFQ response — set final terms",
            body: `A buyer has selected a preferred supplier for ${rfq.commodityType.replace(/_/g, " ")}. Please review and set the final deal terms.`,
            data: { rfqId, responseId },
          })),
        });
      }

      return { adminIds: admins.map((a) => a.id), commodityType: rfq.commodityType };
    });

    // Fire-and-forget: email admins
    if (result.adminIds.length > 0) {
      notifyMany(
        result.adminIds.map((adminId) => ({
          userId: adminId,
          event: "RFQ_ACCEPTED" as const,
          title: "Buyer selected an RFQ response — set final terms",
          body: `A buyer has selected a preferred supplier for ${result.commodityType.replace(/_/g, " ")}. Please review and set the final deal terms.`,
          data: { rfqId, responseId },
          channels: ["email"] as const,
          link: `/admin/rfqs`,
        }))
      );
    }

    return NextResponse.json({
      message: "Response selected successfully. Admin will set final deal terms.",
      selectedResponseId: responseId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const errorMap: Record<string, { msg: string; code: number }> = {
      RFQ_NOT_FOUND: { msg: "RFQ not found", code: 404 },
      NOT_OWNER: { msg: "Only the buyer can select responses", code: 403 },
      ALREADY_ACCEPTED: { msg: "This RFQ already has an accepted response", code: 409 },
      ALREADY_SELECTED: { msg: "You have already selected a response. Await admin confirmation.", code: 409 },
      RFQ_CLOSED: { msg: "This RFQ is closed", code: 400 },
      RESPONSE_NOT_FOUND: { msg: "Response not found", code: 404 },
      RESPONSE_NOT_AVAILABLE: { msg: "This response is no longer available", code: 400 },
    };

    const mapped = errorMap[message];
    if (mapped) {
      return NextResponse.json({ error: mapped.msg }, { status: mapped.code });
    }

    console.error("[RFQ_SELECT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
