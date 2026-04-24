import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, checkKycApproved } from "@/lib/auth";
import { createRfqSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyMany } from "@/lib/notifications";

const SUPPLIER_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// POST /api/rfq — Create a new RFQ (Buyer only)
// Platform-mediated: notifies admins for routing, NOT sellers directly
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = checkRole(authResult, ["BUYER"]);
    if (roleCheck) return roleCheck;

    const kycCheck = checkKycApproved(authResult);
    if (kycCheck) return kycCheck;

    // Rate limit: 5 RFQ creations per hour
    const rateLimitKey = `rfq_create:${authResult.userId}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many RFQ requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = createRfqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Enforce max 20 concurrent open RFQs per buyer
    const openCount = await prisma.rfqRequest.count({
      where: { buyerId: authResult.userId, status: { in: ["OPEN", "ROUTED", "RESPONDED", "NEGOTIATING"] } },
    });
    if (openCount >= 20) {
      return NextResponse.json(
        { error: "Maximum 20 concurrent RFQs allowed. Please close or cancel existing ones." },
        { status: 400 }
      );
    }

    const { expiresInDays, ...rfqData } = parsed.data;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 7));

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.rfqRequest.create({
        data: {
          buyerId: authResult.userId,
          commodityType: rfqData.commodityType,
          grade: rfqData.grade,
          quantityKg: rfqData.quantityKg,
          targetPriceInr: rfqData.targetPriceInr,
          targetCurrency: rfqData.targetCurrency,
          deliveryCountry: rfqData.deliveryCountry,
          deliveryCity: rfqData.deliveryCity,
          description: rfqData.description,
          expiresAt,
        },
        include: {
          buyer: { select: { name: true, country: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "RFQ_CREATED",
          entity: "RfqRequest",
          entityId: created.id,
          metadata: {
            commodityType: rfqData.commodityType,
            quantityKg: rfqData.quantityKg,
            deliveryCountry: rfqData.deliveryCountry,
          },
        },
      });

      // Notify admins for routing (platform-mediated flow — sellers are NOT notified directly)
      const admins = await tx.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "IN_APP" as const,
            title: "New RFQ requires routing",
            body: `A buyer has requested ${rfqData.quantityKg}kg of ${rfqData.commodityType.replace(/_/g, " ")}. Route this RFQ to appropriate sellers.`,
            data: { rfqId: created.id, commodityType: rfqData.commodityType },
          })),
        });
      }

      return { rfq: created, adminIds: admins.map((a) => a.id) };
    });

    // Fire-and-forget: email admins (in-app already created in transaction)
    if (result.adminIds.length > 0) {
      notifyMany(
        result.adminIds.map((adminId) => ({
          userId: adminId,
          event: "RFQ_CREATED" as const,
          title: "New RFQ requires routing",
          body: `A buyer has requested ${rfqData.quantityKg}kg of ${rfqData.commodityType.replace(/_/g, " ")}. Route this RFQ to appropriate sellers.`,
          data: {
            rfqId: result.rfq.id,
            commodityType: rfqData.commodityType.replace(/_/g, " "),
            quantity: rfqData.quantityKg,
            deliveryCity: rfqData.deliveryCity,
            formattedTargetPrice: rfqData.targetPriceInr ? `₹${rfqData.targetPriceInr.toLocaleString()}/kg` : "Not specified",
          },
          channels: ["email"] as const,
          link: `/admin/rfqs`,
        }))
      );
    }

    return NextResponse.json({ rfq: result.rfq }, { status: 201 });
  } catch (error) {
    console.error("[RFQ_CREATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/rfq — List my RFQs (Buyer) or all RFQs (Admin)
// PRICE PRIVACY: Buyer never sees seller prices or identities
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const isAdmin = authResult.role === "ADMIN";

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = isAdmin ? {} : { buyerId: authResult.userId };
    if (status && ["OPEN", "ROUTED", "RESPONDED", "NEGOTIATING", "SELECTED", "ACCEPTED", "EXPIRED", "CANCELLED"].includes(status)) {
      where.status = status;
    }

    const [rfqs, total] = await Promise.all([
      prisma.rfqRequest.findMany({
        where,
        include: {
          buyer: { select: { id: true, name: true, country: true } },
          responses: {
            select: {
              id: true,
              sellerId: true,
              offeredPriceInr: true,
              currency: true,
              status: true,
              deliveryDays: true,
              notes: true,
              adminForwarded: true,
              adminEditedPriceInr: true,
              createdAt: true,
              seller: { select: { id: true, name: true, country: true } },
              negotiations: {
                select: {
                  id: true,
                  fromUserId: true,
                  fromUser: { select: { id: true, name: true, role: true } },
                  message: true,
                  proposedPriceInr: true,
                  createdAt: true,
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { offeredPriceInr: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.rfqRequest.count({ where }),
    ]);

    return NextResponse.json({
      rfqs: rfqs.map((r) => ({
        id: r.id,
        buyerId: r.buyerId,
        buyer: isAdmin ? r.buyer : undefined,
        commodityType: r.commodityType,
        grade: r.grade,
        quantityKg: Number(r.quantityKg),
        targetPriceInr: isAdmin ? (r.targetPriceInr ? Number(r.targetPriceInr) : null) : r.targetPriceInr ? Number(r.targetPriceInr) : null,
        deliveryCountry: r.deliveryCountry,
        deliveryCity: r.deliveryCity,
        description: r.description,
        status: r.status,
        responseCount: r.responseCount,
        routedSellerIds: r.routedSellerIds ?? [],
        selectedResponseId: r.selectedResponseId,
        finalPriceInr: isAdmin || r.status === "ACCEPTED" ? (r.finalPriceInr ? Number(r.finalPriceInr) : null) : null,
        adminNotes: isAdmin ? r.adminNotes : undefined,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        isAnonymized: !isAdmin,
        responses: isAdmin
          ? r.responses.map((resp) => ({
              ...resp,
              offeredPriceInr: Number(resp.offeredPriceInr),
              adminEditedPriceInr: resp.adminEditedPriceInr ? Number(resp.adminEditedPriceInr) : null,
              negotiations: (resp.negotiations ?? []).map((n) => ({
                ...n,
                proposedPriceInr: n.proposedPriceInr ? Number(n.proposedPriceInr) : null,
              })),
            }))
          : r.responses
              .filter((resp) => resp.adminForwarded)
              .map((resp, idx) => ({
                id: resp.id,
                status: resp.status,
                deliveryDays: resp.deliveryDays,
                notes: resp.notes,
                supplierLabel: `Supplier ${SUPPLIER_LABELS[idx] || idx + 1}`,
              })),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[RFQ_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

