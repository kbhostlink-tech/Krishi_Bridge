import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkKycApproved } from "@/lib/auth";
import { rfqNegotiationSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ rfqId: string; responseId: string }>;
}

const MAX_NEGOTIATION_ROUNDS = 10;

// POST /api/rfq/[rfqId]/responses/[responseId]/negotiate — Add a negotiation message
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const kycCheck = checkKycApproved(authResult);
    if (kycCheck) return kycCheck;

    // Rate limit: 30 negotiations per hour per user
    const rateLimit = checkRateLimit(`rfq_negotiate:${authResult.userId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many negotiation messages. Please try again later." },
        { status: 429 }
      );
    }

    const { rfqId, responseId } = await params;

    const body = await req.json();
    const parsed = rfqNegotiationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Fetch RFQ and response in parallel
    const [rfq, response] = await Promise.all([
      prisma.rfqRequest.findUnique({
        where: { id: rfqId },
        select: { id: true, buyerId: true, status: true },
      }),
      prisma.rfqResponse.findUnique({
        where: { id: responseId },
        include: {
          negotiations: { select: { id: true } },
        },
      }),
    ]);

    if (!rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }
    if (!response || response.rfqId !== rfqId) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    // Only buyer or the responding seller can negotiate
    const isBuyer = authResult.userId === rfq.buyerId;
    const isSeller = authResult.userId === response.sellerId;
    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // PRICE PRIVACY: buyer cannot propose prices (terms only)
    if (isBuyer && parsed.data.proposedPriceInr) {
      return NextResponse.json(
        { error: "Buyers cannot propose prices. You may discuss terms and conditions only." },
        { status: 400 }
      );
    }

    // Response must be in negotiable state
    if (!["PENDING", "COUNTERED"].includes(response.status)) {
      return NextResponse.json(
        { error: "This response is no longer open for negotiation" },
        { status: 400 }
      );
    }

    // Check max negotiation rounds
    if (response.negotiations.length >= MAX_NEGOTIATION_ROUNDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_NEGOTIATION_ROUNDS} negotiation rounds reached` },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.rfqNegotiation.create({
        data: {
          responseId,
          fromUserId: authResult.userId,
          message: parsed.data.message,
          // Only sellers can propose prices; buyer proposals are terms-only
          proposedPriceInr: isSeller ? parsed.data.proposedPriceInr : undefined,
          proposedQuantityKg: parsed.data.proposedQuantityKg,
        },
        include: {
          fromUser: { select: { id: true, name: true, role: true } },
        },
      });

      // Update response status to COUNTERED
      await tx.rfqResponse.update({
        where: { id: responseId },
        data: { status: "COUNTERED" },
      });

      // Update RFQ status to NEGOTIATING if not already
      if (rfq.status !== "NEGOTIATING") {
        await tx.rfqRequest.update({
          where: { id: rfqId },
          data: { status: "NEGOTIATING" },
        });
      }

      // Notify the other party — ANONYMIZED (no price info to buyer)
      const recipientId = isBuyer ? response.sellerId : rfq.buyerId;
      const notifBody = isSeller
        ? "A new message was received in your RFQ negotiation."
        : "A new message was received in your RFQ negotiation.";

      await tx.notification.create({
        data: {
          userId: recipientId,
          type: "IN_APP",
          title: "New message on your RFQ negotiation",
          body: notifBody,
          data: { rfqId, responseId },
        },
      });

      return { negotiation: created, recipientId };
    });

    // Fire-and-forget: push for the other party
    notifyUser({
      userId: result.recipientId,
      event: "RFQ_COUNTER_OFFER",
      title: "New message on your RFQ negotiation",
      body: "A new message was received in your RFQ negotiation.",
      data: { rfqId, responseId },
      channels: ["push"],
      link: `/rfq/${rfqId}`,
    });

    const negotiation = result.negotiation;
    return NextResponse.json({
      negotiation: {
        ...negotiation,
        proposedPriceInr: negotiation.proposedPriceInr
          ? Number(negotiation.proposedPriceInr)
          : null,
        proposedQuantityKg: negotiation.proposedQuantityKg
          ? Number(negotiation.proposedQuantityKg)
          : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[RFQ_NEGOTIATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/rfq/[rfqId]/responses/[responseId]/negotiate — Get negotiation thread
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { rfqId, responseId } = await params;

    const [rfq, response] = await Promise.all([
      prisma.rfqRequest.findUnique({
        where: { id: rfqId },
        select: { buyerId: true },
      }),
      prisma.rfqResponse.findUnique({
        where: { id: responseId },
        select: { rfqId: true, sellerId: true },
      }),
    ]);

    if (!rfq || !response || response.rfqId !== rfqId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAdmin = authResult.role === "ADMIN";
    const isBuyerGet = authResult.userId === rfq.buyerId;

    // Only buyer, seller, or admin can view negotiations
    if (!isAdmin && authResult.userId !== rfq.buyerId && authResult.userId !== response.sellerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const negotiations = await prisma.rfqNegotiation.findMany({
      where: { responseId },
      include: {
        fromUser: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      negotiations: negotiations.map((n) => ({
        id: n.id,
        fromUser: isAdmin ? n.fromUser : {
          id: n.fromUser.id,
          name: isBuyerGet
            ? (n.fromUser.id === authResult.userId ? n.fromUser.name : "Supplier")
            : (n.fromUser.id === authResult.userId ? n.fromUser.name : "Platform"),
          role: n.fromUser.role,
        },
        message: n.message,
        // PRICE PRIVACY: buyer never sees proposed prices
        proposedPriceInr: isBuyerGet ? null : (n.proposedPriceInr ? Number(n.proposedPriceInr) : null),
        proposedQuantityKg: n.proposedQuantityKg ? Number(n.proposedQuantityKg) : null,
        createdAt: n.createdAt,
      })),
      totalRounds: negotiations.length,
      maxRounds: MAX_NEGOTIATION_ROUNDS,
    });
  } catch (error) {
    console.error("[RFQ_NEGOTIATIONS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
