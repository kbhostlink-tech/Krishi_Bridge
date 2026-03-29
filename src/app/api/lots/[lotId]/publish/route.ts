import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkKycApproved } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lotPublishSchema } from "@/lib/validations";

// POST /api/lots/[lotId]/publish — Publish a lot (INTAKE → LISTED)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const kycCheck = checkKycApproved(authResult);
  if (kycCheck) return kycCheck;

  const { lotId } = await params;

  try {
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      select: { id: true, farmerId: true, status: true, lotNumber: true },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    if (lot.farmerId !== authResult.userId && authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "You can only publish your own lots" }, { status: 403 });
    }

    if (lot.status !== "INTAKE") {
      return NextResponse.json(
        { error: "Only lots in INTAKE status can be published" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = lotPublishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: "LISTED",
      listingMode: parsed.data.listingMode,
    };

    if (parsed.data.startingPriceUsd) updateData.startingPriceUsd = parsed.data.startingPriceUsd;
    if (parsed.data.reservePriceUsd) updateData.reservePriceUsd = parsed.data.reservePriceUsd;
    if (parsed.data.auctionStartsAt) updateData.auctionStartsAt = new Date(parsed.data.auctionStartsAt);
    if (parsed.data.auctionEndsAt) updateData.auctionEndsAt = new Date(parsed.data.auctionEndsAt);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedLot = await tx.lot.update({
        where: { id: lotId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "LOT_PUBLISHED",
          entity: "Lot",
          entityId: lotId,
          metadata: {
            lotNumber: lot.lotNumber,
            listingMode: parsed.data.listingMode,
            startingPriceUsd: parsed.data.startingPriceUsd,
          },
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        },
      });

      return updatedLot;
    });

    return NextResponse.json({
      lot: {
        id: updated.id,
        lotNumber: updated.lotNumber,
        status: updated.status,
        listingMode: updated.listingMode,
        startingPriceUsd: updated.startingPriceUsd ? Number(updated.startingPriceUsd) : null,
        auctionStartsAt: updated.auctionStartsAt,
        auctionEndsAt: updated.auctionEndsAt,
      },
    });
  } catch (error) {
    console.error("[LOT_PUBLISH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
