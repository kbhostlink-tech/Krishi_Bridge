import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const SUPPLIER_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface RouteParams {
  params: Promise<{ rfqId: string }>;
}

// GET /api/rfq/[rfqId] — Get RFQ detail
// PRICE PRIVACY: buyer sees anonymized responses (no prices, no seller names)
//                seller sees only own response (no targetPrice, anonymized buyer)
//                admin sees everything
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { rfqId } = await params;

    const rfq = await prisma.rfqRequest.findUnique({
      where: { id: rfqId },
      include: {
        buyer: { select: { id: true, name: true, country: true } },
        responses: {
          include: {
            seller: { select: { id: true, name: true, country: true } },
            lot: {
              select: { id: true, lotNumber: true, commodityType: true, grade: true, images: true },
            },
            negotiations: {
              include: {
                fromUser: { select: { id: true, name: true, role: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    const isAdmin = authResult.role === "ADMIN";
    const isBuyer = authResult.userId === rfq.buyerId;
    const isSeller = authResult.role === "FARMER" || authResult.role === "AGGREGATOR";
    const isRespondingSeller = rfq.responses.some((r) => r.sellerId === authResult.userId);

    if (!isAdmin && !isBuyer && !isSeller) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Seller who hasn't responded and isn't routed — deny
    if (isSeller && !isBuyer && !isRespondingSeller && !rfq.routedSellerIds.includes(authResult.userId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ADMIN VIEW: full visibility
    if (isAdmin) {
      return NextResponse.json({
        rfq: {
          id: rfq.id,
          buyerId: rfq.buyerId,
          buyer: rfq.buyer,
          commodityType: rfq.commodityType,
          grade: rfq.grade,
          quantityKg: Number(rfq.quantityKg),
          targetPriceInr: rfq.targetPriceInr ? Number(rfq.targetPriceInr) : null,
          deliveryCountry: rfq.deliveryCountry,
          deliveryCity: rfq.deliveryCity,
          description: rfq.description,
          status: rfq.status,
          responseCount: rfq.responseCount,
          routedSellerIds: rfq.routedSellerIds,
          selectedResponseId: rfq.selectedResponseId,
          finalPriceInr: rfq.finalPriceInr ? Number(rfq.finalPriceInr) : null,
          adminNotes: rfq.adminNotes,
          expiresAt: rfq.expiresAt,
          createdAt: rfq.createdAt,
          updatedAt: rfq.updatedAt,
          responses: rfq.responses.map((r) => ({
            id: r.id,
            sellerId: r.sellerId,
            seller: r.seller,
            lotId: r.lotId,
            lot: r.lot,
            offeredPriceInr: Number(r.offeredPriceInr),
            currency: r.currency,
            deliveryDays: r.deliveryDays,
            notes: r.notes,
            status: r.status,
            createdAt: r.createdAt,
            negotiations: r.negotiations.map((n) => ({
              id: n.id,
              fromUser: n.fromUser,
              message: n.message,
              proposedPriceInr: n.proposedPriceInr ? Number(n.proposedPriceInr) : null,
              proposedQuantityKg: n.proposedQuantityKg ? Number(n.proposedQuantityKg) : null,
              createdAt: n.createdAt,
            })),
          })),
        },
        isBuyer: false,
        isAdmin: true,
      });
    }

    // BUYER VIEW: anonymized sellers, NO prices
    if (isBuyer) {
      return NextResponse.json({
        rfq: {
          id: rfq.id,
          buyerId: rfq.buyerId,
          commodityType: rfq.commodityType,
          grade: rfq.grade,
          quantityKg: Number(rfq.quantityKg),
          targetPriceInr: rfq.targetPriceInr ? Number(rfq.targetPriceInr) : null,
          deliveryCountry: rfq.deliveryCountry,
          deliveryCity: rfq.deliveryCity,
          description: rfq.description,
          status: rfq.status,
          responseCount: rfq.responseCount,
          selectedResponseId: rfq.selectedResponseId,
          finalPriceInr: rfq.status === "ACCEPTED" && rfq.finalPriceInr ? Number(rfq.finalPriceInr) : null,
          expiresAt: rfq.expiresAt,
          createdAt: rfq.createdAt,
          updatedAt: rfq.updatedAt,
          isAnonymized: true,
          responses: rfq.responses.map((r, idx) => ({
            id: r.id,
            supplierLabel: `Supplier ${SUPPLIER_LABELS[idx] || idx + 1}`,
            deliveryDays: r.deliveryDays,
            notes: r.notes,
            status: r.status,
            createdAt: r.createdAt,
            negotiations: r.negotiations.map((n) => ({
              id: n.id,
              fromLabel: n.fromUser.id === authResult.userId ? "You" : `Supplier ${SUPPLIER_LABELS[idx] || idx + 1}`,
              message: n.message,
              proposedQuantityKg: n.proposedQuantityKg ? Number(n.proposedQuantityKg) : null,
              createdAt: n.createdAt,
              // NO proposedPriceInr for buyer
            })),
          })),
        },
        isBuyer: true,
        isAdmin: false,
      });
    }

    // SELLER VIEW: only own response, no targetPrice, anonymized buyer
    const myResponses = rfq.responses.filter((r) => r.sellerId === authResult.userId);

    return NextResponse.json({
      rfq: {
        id: rfq.id,
        buyerLabel: `Buyer Request #${rfq.id.slice(0, 8).toUpperCase()}`,
        commodityType: rfq.commodityType,
        grade: rfq.grade,
        quantityKg: Number(rfq.quantityKg),
        // NO targetPriceInr for sellers
        deliveryCountry: rfq.deliveryCountry,
        deliveryCity: rfq.deliveryCity,
        description: rfq.description,
        status: rfq.status,
        responseCount: rfq.responseCount,
        expiresAt: rfq.expiresAt,
        createdAt: rfq.createdAt,
        isAnonymized: true,
        responses: myResponses.map((r) => ({
          id: r.id,
          sellerId: r.sellerId,
          seller: r.seller,
          lotId: r.lotId,
          lot: r.lot,
          offeredPriceInr: Number(r.offeredPriceInr),
          currency: r.currency,
          deliveryDays: r.deliveryDays,
          notes: r.notes,
          status: r.status,
          createdAt: r.createdAt,
          negotiations: r.negotiations.map((n) => ({
            id: n.id,
            fromUser: {
              id: n.fromUser.id,
              name: n.fromUser.id === authResult.userId ? n.fromUser.name : "Platform",
              role: n.fromUser.role,
            },
            message: n.message,
            proposedPriceInr: n.fromUser.id === authResult.userId
              ? (n.proposedPriceInr ? Number(n.proposedPriceInr) : null)
              : null, // hide buyer's price proposals
            proposedQuantityKg: n.proposedQuantityKg ? Number(n.proposedQuantityKg) : null,
            createdAt: n.createdAt,
          })),
        })),
      },
      isBuyer: false,
      isAdmin: false,
    });
  } catch (error) {
    console.error("[RFQ_DETAIL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/rfq/[rfqId] — Cancel an RFQ (Buyer only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { rfqId } = await params;

    const rfq = await prisma.rfqRequest.findUnique({
      where: { id: rfqId },
      select: { id: true, buyerId: true, status: true, responses: { select: { sellerId: true } } },
    });

    if (!rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    if (rfq.buyerId !== authResult.userId) {
      return NextResponse.json({ error: "Only the buyer can cancel this RFQ" }, { status: 403 });
    }

    if (rfq.status === "CANCELLED" || rfq.status === "ACCEPTED") {
      return NextResponse.json(
        { error: `Cannot cancel an RFQ that is already ${rfq.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.rfqRequest.update({
        where: { id: rfqId },
        data: { status: "CANCELLED" },
      });

      // Reject all pending responses
      await tx.rfqResponse.updateMany({
        where: { rfqId, status: "PENDING" },
        data: { status: "REJECTED" },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "RFQ_CANCELLED",
          entity: "RfqRequest",
          entityId: rfqId,
        },
      });

      // Notify all responding sellers
      if (rfq.responses.length > 0) {
        await tx.notification.createMany({
          data: rfq.responses.map((r) => ({
            userId: r.sellerId,
            type: "IN_APP" as const,
            title: "RFQ cancelled by buyer",
            body: "An RFQ you responded to has been cancelled by the buyer.",
            data: { rfqId },
          })),
        });
      }
    });

    return NextResponse.json({ message: "RFQ cancelled successfully" });
  } catch (error) {
    console.error("[RFQ_CANCEL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
