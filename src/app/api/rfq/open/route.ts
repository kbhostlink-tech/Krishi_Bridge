import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, checkKycApproved } from "@/lib/auth";

// GET /api/rfq/open — Browse RFQs routed to this seller (Seller / Farmer only)
// PRICE PRIVACY: no targetPriceInr, anonymized buyer, only routed RFQs
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = checkRole(authResult, ["FARMER", "AGGREGATOR"]);
    if (roleCheck) return roleCheck;

    const kycCheck = checkKycApproved(authResult);
    if (kycCheck) return kycCheck;

    const { searchParams } = new URL(req.url);
    const commodityType = searchParams.get("commodityType");
    const country = searchParams.get("country");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Only show RFQs explicitly routed to this seller by admin
    const where: Record<string, unknown> = {
      status: { in: ["ROUTED", "RESPONDED", "NEGOTIATING"] },
      expiresAt: { gt: new Date() },
      routedSellerIds: { has: authResult.userId },
    };
    if (commodityType) where.commodityType = commodityType;
    if (country) where.deliveryCountry = country;

    const [rfqs, total] = await Promise.all([
      prisma.rfqRequest.findMany({
        where,
        include: {
          responses: {
            where: { sellerId: authResult.userId },
            select: { id: true, status: true },
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
        buyerLabel: `Buyer Request #${r.id.slice(0, 8).toUpperCase()}`,
        commodityType: r.commodityType,
        grade: r.grade,
        quantityKg: Number(r.quantityKg),
        // NO targetPriceInr — seller must not see buyer's target price
        deliveryCountry: r.deliveryCountry,
        deliveryCity: r.deliveryCity,
        description: r.description,
        status: r.status,
        responseCount: r.responseCount,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        isAnonymized: true,
        alreadyResponded: r.responses.length > 0,
        myResponseStatus: r.responses[0]?.status || null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[RFQ_OPEN]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

