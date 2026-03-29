import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadPresignedUrl } from "@/lib/r2";
import { lotUpdateSchema } from "@/lib/validations";

// GET /api/lots/[lotId] — Public lot detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  try {
    const { lotId } = await params;

    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      include: {
        farmer: { select: { id: true, name: true, country: true } },
        warehouse: { select: { id: true, name: true, country: true, state: true, district: true } },
        qualityCheck: true,
        qrCode: { select: { id: true, qrImageUrl: true, qrData: true } },
        bids: {
          select: { id: true, amountUsd: true, createdAt: true, bidder: { select: { name: true, country: true } } },
          orderBy: { amountUsd: "desc" },
          take: 10,
        },
        _count: { select: { bids: true } },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    // Generate signed URLs for all images
    const imageUrls = await Promise.all(
      lot.images.map(async (key) => ({
        key,
        url: await getDownloadPresignedUrl(key),
      }))
    );

    // Generate signed URLs for all videos
    const videoUrls = await Promise.all(
      lot.videos.map(async (key) => ({
        key,
        url: await getDownloadPresignedUrl(key),
      }))
    );

    // QR code signed URL
    let qrImageSignedUrl = null;
    if (lot.qrCode?.qrImageUrl) {
      qrImageSignedUrl = await getDownloadPresignedUrl(lot.qrCode.qrImageUrl);
    }

    // Lab cert signed URL
    let labCertUrl = null;
    if (lot.qualityCheck?.labCertUrl) {
      labCertUrl = await getDownloadPresignedUrl(lot.qualityCheck.labCertUrl);
    }

    return NextResponse.json({
      lot: {
        id: lot.id,
        lotNumber: lot.lotNumber,
        commodityType: lot.commodityType,
        grade: lot.grade,
        quantityKg: Number(lot.quantityKg),
        description: lot.description,
        images: imageUrls,
        videos: videoUrls,
        origin: lot.origin,
        status: lot.status,
        listingMode: lot.listingMode,
        startingPriceUsd: lot.startingPriceUsd ? Number(lot.startingPriceUsd) : null,
        reservePriceUsd: lot.reservePriceUsd ? Number(lot.reservePriceUsd) : null,
        auctionStartsAt: lot.auctionStartsAt,
        auctionEndsAt: lot.auctionEndsAt,
        createdAt: lot.createdAt,
        updatedAt: lot.updatedAt,
        farmer: lot.farmer,
        warehouse: lot.warehouse,
        qualityCheck: lot.qualityCheck ? {
          moisturePct: lot.qualityCheck.moisturePct,
          podSizeMm: lot.qualityCheck.podSizeMm,
          colourGrade: lot.qualityCheck.colourGrade,
          labCertUrl,
          inspectedBy: lot.qualityCheck.inspectedBy,
          inspectedAt: lot.qualityCheck.inspectedAt,
          notes: lot.qualityCheck.notes,
        } : null,
        qrCode: lot.qrCode ? { ...lot.qrCode, qrImageSignedUrl } : null,
        bids: lot.bids.map(b => ({
          ...b,
          amountUsd: Number(b.amountUsd),
        })),
        bidCount: lot._count.bids,
      },
    });
  } catch (error) {
    console.error("[LOT_DETAIL]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/lots/[lotId] — Farmer edits lot
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { lotId } = await params;

  try {
    // Verify lot exists and belongs to farmer
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      select: { id: true, farmerId: true, status: true },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    // Only lot owner or admin can edit
    if (lot.farmerId !== authResult.userId && authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "You can only edit your own lots" }, { status: 403 });
    }

    // Only INTAKE or LISTED lots can be edited
    if (!["INTAKE", "LISTED"].includes(lot.status)) {
      return NextResponse.json(
        { error: "Cannot edit lot in current status" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = lotUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.listingMode) updateData.listingMode = parsed.data.listingMode;
    if (parsed.data.startingPriceUsd !== undefined) updateData.startingPriceUsd = parsed.data.startingPriceUsd;
    if (parsed.data.reservePriceUsd !== undefined) updateData.reservePriceUsd = parsed.data.reservePriceUsd;
    if (parsed.data.auctionStartsAt) updateData.auctionStartsAt = new Date(parsed.data.auctionStartsAt);
    if (parsed.data.auctionEndsAt) updateData.auctionEndsAt = new Date(parsed.data.auctionEndsAt);

    const updated = await prisma.lot.update({
      where: { id: lotId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: authResult.userId,
        action: "LOT_UPDATED",
        entity: "Lot",
        entityId: lotId,
        metadata: updateData,
      },
    });

    return NextResponse.json({
      lot: {
        ...updated,
        quantityKg: Number(updated.quantityKg),
        startingPriceUsd: updated.startingPriceUsd ? Number(updated.startingPriceUsd) : null,
        reservePriceUsd: updated.reservePriceUsd ? Number(updated.reservePriceUsd) : null,
      },
    });
  } catch (error) {
    console.error("[LOT_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
