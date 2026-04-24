import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkKycApproved } from "@/lib/auth";
import { getDownloadPresignedUrl } from "@/lib/r2";

// GET /api/tokens — List my tokens
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const kycCheck = checkKycApproved(authResult);
    if (kycCheck) return kycCheck;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { ownerId: authResult.userId };
    if (status && ["ACTIVE", "TRANSFERRED", "REDEEMED", "EXPIRED"].includes(status)) {
      where.status = status;
    }

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where,
        include: {
          lot: {
            select: {
              id: true, lotNumber: true, commodityType: true, grade: true, quantityKg: true,
              images: true, warehouse: { select: { name: true, country: true } },
            },
          },
          rfq: {
            select: {
              id: true, commodityType: true, quantityKg: true,
              deliveryCity: true, deliveryCountry: true,
            },
          },
        },
        orderBy: { mintedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.token.count({ where }),
    ]);

    return NextResponse.json({
      tokens: await Promise.all(tokens.map(async (t) => ({
        id: t.id,
        lotId: t.lotId,
        rfqId: t.rfqId,
        lot: t.lot ? {
          ...t.lot,
          quantityKg: Number(t.lot.quantityKg),
          images: Array.isArray(t.lot.images)
            ? await Promise.all(
                (t.lot.images as string[]).map(async (key) => {
                  try {
                    return await getDownloadPresignedUrl(key, 3600);
                  } catch {
                    return null;
                  }
                })
              ).then((urls) => urls.filter((u): u is string => !!u))
            : [],
        } : null,
        rfq: t.rfq ? {
          ...t.rfq,
          quantityKg: Number(t.rfq.quantityKg),
        } : null,
        status: t.status,
        mintedAt: t.mintedAt,
        expiresAt: t.expiresAt,
        redeemedAt: t.redeemedAt,
      }))),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[TOKENS_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

