import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole } from "@/lib/auth";
import { verifyTokenHmac } from "@/lib/token-utils";
import { tokenVerifySchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/tokens/verify — Verify token via QR scan (any authenticated user)
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    // Rate limit: 30 verify attempts per minute per user
    const rateLimit = checkRateLimit(`token_verify:${authResult.userId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = tokenVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { tokenId, hmacHash } = parsed.data;

    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        lot: {
          select: {
            id: true, lotNumber: true, commodityType: true, grade: true, quantityKg: true,
            images: true,
            warehouse: { select: { id: true, name: true } },
            farmer: { select: { name: true, country: true } },
          },
        },
        owner: { select: { id: true, name: true, email: true, country: true } },
      },
    });

    if (!token) {
      return NextResponse.json({
        verified: false,
        error: "Token not found",
      }, { status: 404 });
    }

    // Verify HMAC
    const hmacValid = verifyTokenHmac(
      {
        lotId: token.lotId,
        ownerId: token.ownerId,
        mintedAt: token.mintedAt.toISOString(),
      },
      hmacHash
    );

    if (!hmacValid) {
      await prisma.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "TOKEN_VERIFY_FAILED",
          entity: "Token",
          entityId: tokenId,
          metadata: { reason: "HMAC mismatch", verifiedBy: authResult.userId },
        },
      });

      return NextResponse.json({
        verified: false,
        error: "Token signature verification failed. This may be a counterfeit token.",
      });
    }

    // Check token status
    if (token.status === "REDEEMED") {
      return NextResponse.json({
        verified: true,
        status: "ALREADY_REDEEMED",
        error: "This token has already been redeemed",
        redeemedAt: token.redeemedAt,
      });
    }

    if (token.status === "EXPIRED" || new Date() > token.expiresAt) {
      return NextResponse.json({
        verified: true,
        status: "EXPIRED",
        error: "This token has expired",
        expiresAt: token.expiresAt,
      });
    }

    if (token.status !== "ACTIVE") {
      return NextResponse.json({
        verified: true,
        status: token.status,
        error: `Token is in ${token.status} status`,
      });
    }

    // Token is valid and ready for redemption
    return NextResponse.json({
      verified: true,
      status: "VALID",
      token: {
        id: token.id,
        lot: token.lot ? {
          ...token.lot,
          quantityKg: Number(token.lot.quantityKg),
        } : null,
        owner: token.owner,
        mintedAt: token.mintedAt,
        expiresAt: token.expiresAt,
      },
    });
  } catch (error) {
    console.error("[TOKEN_VERIFY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
