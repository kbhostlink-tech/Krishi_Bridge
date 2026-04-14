import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkAdminPermission } from "@/lib/auth";
import { notifyMany } from "@/lib/notifications";
import { z } from "zod";

const routeSellerSchema = z.object({
  sellerIds: z.array(z.string().uuid()).min(1, "At least one seller required").max(50),
});

interface RouteParams {
  params: Promise<{ rfqId: string }>;
}

// POST /api/admin/rfq/[rfqId]/route — Admin routes RFQ to specific sellers
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    if (!checkAdminPermission(authResult, "rfq.route")) {
      return NextResponse.json(
        { error: "Insufficient permissions to route RFQs" },
        { status: 403 }
      );
    }

    const { rfqId } = await params;
    const body = await req.json();
    const parsed = routeSellerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const rfq = await prisma.rfqRequest.findUnique({
      where: { id: rfqId },
      select: { id: true, status: true, commodityType: true, quantityKg: true, routedSellerIds: true },
    });

    if (!rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    if (["ACCEPTED", "CANCELLED", "EXPIRED"].includes(rfq.status)) {
      return NextResponse.json(
        { error: `Cannot route an RFQ that is ${rfq.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Verify all seller IDs exist and have FARMER/AGGREGATOR role with approved KYC
    const sellers = await prisma.user.findMany({
      where: {
        id: { in: parsed.data.sellerIds },
        role: { in: ["FARMER", "AGGREGATOR"] },
        kycStatus: "APPROVED",
      },
      select: { id: true },
    });

    const validSellerIds = sellers.map((s) => s.id);
    if (validSellerIds.length === 0) {
      return NextResponse.json(
        { error: "No valid sellers found among the provided IDs" },
        { status: 400 }
      );
    }

    // Merge with existing routed sellers (no duplicates)
    const mergedSellerIds = [...new Set([...rfq.routedSellerIds, ...validSellerIds])];

    await prisma.$transaction(async (tx) => {
      await tx.rfqRequest.update({
        where: { id: rfqId },
        data: {
          routedSellerIds: mergedSellerIds,
          status: rfq.status === "OPEN" ? "ROUTED" : rfq.status,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "RFQ_ROUTED",
          entity: "RfqRequest",
          entityId: rfqId,
          metadata: {
            sellerIds: validSellerIds,
            totalRouted: mergedSellerIds.length,
          },
        },
      });

      // Only notify newly routed sellers (not previously routed)
      const newSellerIds = validSellerIds.filter((id) => !rfq.routedSellerIds.includes(id));
      if (newSellerIds.length > 0) {
        await tx.notification.createMany({
          data: newSellerIds.map((sellerId) => ({
            userId: sellerId,
            type: "IN_APP" as const,
            title: "You have been invited to respond to an RFQ",
            body: `A buyer is requesting ${Number(rfq.quantityKg)}kg of ${rfq.commodityType.replace(/_/g, " ")}. Submit your offer now.`,
            data: { rfqId, commodityType: rfq.commodityType },
          })),
        });

        // Fire-and-forget: email newly routed sellers
        notifyMany(
          newSellerIds.map((sellerId) => ({
            userId: sellerId,
            event: "RFQ_CREATED" as const,
            title: "You have been invited to respond to an RFQ",
            body: `A buyer is requesting ${Number(rfq.quantityKg)}kg of ${rfq.commodityType.replace(/_/g, " ")}. Submit your offer now.`,
            data: { rfqId, commodityType: rfq.commodityType },
            channels: ["email"] as const,
            link: `/rfq/browse`,
          }))
        );
      }
    });

    return NextResponse.json({
      message: "RFQ routed successfully",
      routedSellerIds: mergedSellerIds,
      newlyRouted: validSellerIds.filter((id) => !rfq.routedSellerIds.includes(id)).length,
    });
  } catch (error) {
    console.error("[ADMIN_RFQ_ROUTE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
