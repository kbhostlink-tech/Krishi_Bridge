import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, checkKycApproved } from "@/lib/auth";
import { rfqResponseSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyMany } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ rfqId: string }>;
}

// POST /api/rfq/[rfqId]/respond — Submit a response to an RFQ (Farmer/Aggregator only)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = checkRole(authResult, ["FARMER", "AGGREGATOR"]);
    if (roleCheck) return roleCheck;

    const kycCheck = checkKycApproved(authResult);
    if (kycCheck) return kycCheck;

    // Rate limit: 20 responses per hour per seller
    const rateLimit = checkRateLimit(`rfq_respond:${authResult.userId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many response submissions. Please try again later." },
        { status: 429 }
      );
    }

    const { rfqId } = await params;

    const body = await req.json();
    const parsed = rfqResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const rfq = await prisma.rfqRequest.findUnique({
      where: { id: rfqId },
      select: { id: true, buyerId: true, status: true, expiresAt: true, routedSellerIds: true, commodityType: true, quantityKg: true, deliveryCity: true },
    });

    if (!rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    // Cannot respond to own RFQ
    if (rfq.buyerId === authResult.userId) {
      return NextResponse.json({ error: "Cannot respond to your own RFQ" }, { status: 400 });
    }

    // Only routed sellers can respond (platform-mediated flow)
    if (!rfq.routedSellerIds.includes(authResult.userId)) {
      return NextResponse.json(
        { error: "You have not been invited to respond to this RFQ" },
        { status: 403 }
      );
    }

    // RFQ must be routed/responded
    if (!["ROUTED", "RESPONDED", "NEGOTIATING"].includes(rfq.status)) {
      return NextResponse.json(
        { error: "This RFQ is no longer accepting responses" },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > rfq.expiresAt) {
      return NextResponse.json({ error: "This RFQ has expired" }, { status: 400 });
    }

    // If lotId provided, verify it belongs to this seller
    if (parsed.data.lotId) {
      const lot = await prisma.lot.findFirst({
        where: { id: parsed.data.lotId, sellerId: authResult.userId },
        select: { id: true },
      });
      if (!lot) {
        return NextResponse.json({ error: "Lot not found or does not belong to you" }, { status: 400 });
      }
    }

    // @@unique([rfqId, sellerId]) constraint prevents duplicates at DB level
    // But let's give a friendly error message
    const existing = await prisma.rfqResponse.findUnique({
      where: { rfqId_sellerId: { rfqId, sellerId: authResult.userId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already responded to this RFQ" },
        { status: 409 }
      );
    }

    const response = await prisma.$transaction(async (tx) => {
      const created = await tx.rfqResponse.create({
        data: {
          rfqId,
          sellerId: authResult.userId,
          offeredPriceInr: parsed.data.offeredPriceInr,
          currency: parsed.data.currency,
          deliveryDays: parsed.data.deliveryDays,
          lotId: parsed.data.lotId,
          notes: parsed.data.notes,
        },
        include: {
          seller: { select: { id: true, name: true, country: true } },
        },
      });

      // Update RFQ status and response count
      await tx.rfqRequest.update({
        where: { id: rfqId },
        data: {
          status: "RESPONDED",
          responseCount: { increment: 1 },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "RFQ_RESPONSE_SUBMITTED",
          entity: "RfqResponse",
          entityId: created.id,
          metadata: {
            rfqId,
            offeredPriceInr: parsed.data.offeredPriceInr,
            deliveryDays: parsed.data.deliveryDays,
          },
        },
      });

      // Notify admins for mediated flow — admin reviews before forwarding to buyer
      const admins = await tx.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "IN_APP" as const,
            title: "New seller response requires review",
            body: `A seller responded to an RFQ for ${rfq.commodityType.replace(/_/g, " ")} (${Number(rfq.quantityKg)}kg). Review and forward to buyer.`,
            data: { rfqId, responseId: created.id },
          })),
        });
      }

      return { ...created, adminIds: admins.map((a) => a.id) };
    });

    // Fire-and-forget: email admins about new response to review
    if (response.adminIds.length > 0) {
      notifyMany(
        response.adminIds.map((adminId) => ({
          userId: adminId,
          event: "RFQ_RESPONSE_RECEIVED" as const,
          title: "New seller response requires review",
          body: `A seller responded to an RFQ for ${rfq.commodityType.replace(/_/g, " ")}. Review and forward to buyer.`,
          data: {
            rfqId,
            responseId: response.id,
            commodityType: rfq.commodityType.replace(/_/g, " "),
            formattedOfferedPrice: `₹${Number(parsed.data.offeredPriceInr).toLocaleString()}/kg`,
          },
          channels: ["email"] as const,
          link: `/admin/rfqs`,
        }))
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { adminIds, ...responseData } = response;

    return NextResponse.json({
      response: {
        ...responseData,
        offeredPriceInr: Number(responseData.offeredPriceInr),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[RFQ_RESPOND]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
