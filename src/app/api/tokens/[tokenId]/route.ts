import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getDownloadPresignedUrl } from "@/lib/r2";

interface RouteParams {
  params: Promise<{ tokenId: string }>;
}

// GET /api/tokens/[tokenId] — Get token details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { tokenId } = await params;

    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        lot: {
          select: {
            id: true, lotNumber: true, commodityType: true, grade: true, quantityKg: true,
            images: true, description: true, origin: true,
            farmer: { select: { id: true, name: true, country: true } },
            warehouse: { select: { id: true, name: true, country: true, state: true, district: true } },
            qualityCheck: true,
            qrCode: { select: { qrImageUrl: true } },
          },
        },
        rfq: {
          select: {
            id: true, commodityType: true, quantityKg: true, grade: true,
            deliveryCity: true, deliveryCountry: true, finalPriceInr: true,
          },
        },
        owner: { select: { id: true, name: true, email: true } },
        transfers: {
          include: {
            fromUser: { select: { id: true, name: true } },
            toUser: { select: { id: true, name: true } },
          },
          orderBy: { transferredAt: "desc" },
        },
      },
    });

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Only owner, admin, or seller of the lot can view full details
    const isOwner = token.ownerId === authResult.userId;
    const isAdmin = authResult.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      token: {
        id: token.id,
        lotId: token.lotId,
        rfqId: token.rfqId,
        lot: token.lot ? {
          ...token.lot,
          quantityKg: Number(token.lot.quantityKg),
          images: await Promise.all(
            (token.lot.images || []).map(async (key) => {
              // Already a fully-qualified URL (legacy data) — return as-is.
              if (/^https?:\/\//i.test(key)) return key;
              try {
                return await getDownloadPresignedUrl(key, 3600);
              } catch {
                return key;
              }
            })
          ),
        } : null,
        rfq: token.rfq ? {
          ...token.rfq,
          quantityKg: Number(token.rfq.quantityKg),
          finalPriceInr: token.rfq.finalPriceInr ? Number(token.rfq.finalPriceInr) : null,
        } : null,
        ownerId: token.ownerId,
        owner: token.owner,
        status: token.status,
        hmacHash: isOwner || isAdmin ? token.hmacHash : undefined,
        mintedAt: token.mintedAt,
        expiresAt: token.expiresAt,
        redeemedAt: token.redeemedAt,
        transfers: token.transfers.map((t) => ({
          id: t.id,
          fromUser: t.fromUser,
          toUser: t.toUser,
          priceInr: t.priceInr ? Number(t.priceInr) : null,
          transferredAt: t.transferredAt,
        })),
      },
    });
  } catch (error) {
    console.error("[TOKEN_DETAIL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
