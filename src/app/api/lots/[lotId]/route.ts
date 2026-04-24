import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireAuth } from "@/lib/auth";
import { getFirstLotAuctionError, getLotAuctionFieldErrors, hasLotAuctionFieldErrors } from "@/lib/lot-validation";
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

    let lot = await prisma.lot.findUnique({
      where: { id: lotId },
      include: {
        seller: { select: { id: true, name: true, country: true } },
        farmer: { select: { id: true, name: true, country: true } },
        warehouse: { select: { id: true, name: true, country: true, state: true, district: true } },
        qualityCheck: true,
        qrCode: { select: { id: true, qrImageUrl: true, qrData: true } },
        bids: {
          select: { id: true, amountInr: true, createdAt: true, bidderId: true, bidder: { select: { id: true, name: true, country: true } } },
          orderBy: { amountInr: "desc" },
          take: 10,
        },
        _count: { select: { bids: true } },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    // Auto-transition LISTED → AUCTION_ACTIVE when the auction start time has passed.
    // This is a safety net for cases where the cron job hasn't fired yet.
    const now = new Date();
    if (
      lot.status === "LISTED" &&
      (lot.listingMode === "AUCTION" || lot.listingMode === "BOTH") &&
      lot.auctionStartsAt &&
      lot.auctionStartsAt <= now &&
      lot.auctionEndsAt &&
      lot.auctionEndsAt > now
    ) {
      await prisma.lot.update({
        where: { id: lotId },
        data: { status: "AUCTION_ACTIVE" },
      });
      lot = { ...lot, status: "AUCTION_ACTIVE" };
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

    // Lab cert signed URL (from QualityCheck)
    let labCertUrl = null;
    if (lot.qualityCheck?.labCertUrl) {
      labCertUrl = await getDownloadPresignedUrl(lot.qualityCheck.labCertUrl);
    }

    // Compliance document signed URLs (from Lot itself)
    let labReportUrl = null;
    if (lot.labReportUrl) {
      labReportUrl = await getDownloadPresignedUrl(lot.labReportUrl);
    }
    let phytosanitaryUrl = null;
    if (lot.phytosanitaryUrl) {
      phytosanitaryUrl = await getDownloadPresignedUrl(lot.phytosanitaryUrl);
    }
    let originCertUrl = null;
    if (lot.originCertUrl) {
      originCertUrl = await getDownloadPresignedUrl(lot.originCertUrl);
    }

    // Determine if current viewer is the lot owner or admin (to show seller info)
    let viewerUserId: string | null = null;
    let viewerRole: string | null = null;
    try {
      const authResult = await getAuthUser(req);
      if (authResult && !(authResult instanceof NextResponse)) {
        viewerUserId = authResult.userId;
        viewerRole = authResult.role ?? null;
      }
    } catch {
      // Not authenticated — fine, public view
    }
    const isOwnerOrAdmin = viewerUserId === lot.sellerId || viewerRole === "ADMIN";

    // Build stable anonymous aliases per-lot so bidders can still be compared
    // across bids without exposing identity. Alias = "Bidder #NNN" based on
    // stable order of first-bid timestamp within this lot.
    const aliasById = new Map<string, string>();
    const orderedBidderIds = Array.from(
      new Set(
        [...lot.bids]
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((b) => b.bidderId)
      )
    );
    orderedBidderIds.forEach((id, idx) => {
      aliasById.set(id, `Bidder #${String(idx + 1).padStart(2, "0")}`);
    });

    // For SOLD lots, fetch the winning transaction so the buyer can see payment link
    let winnerTransaction: { id: string; buyerId: string; status: string } | null = null;
    if (lot.status === "SOLD" || lot.status === "REDEEMED") {
      const tx = await prisma.transaction.findFirst({
        where: { lotId: lot.id },
        select: { id: true, buyerId: true, status: true },
        orderBy: { createdAt: "desc" },
      });
      if (tx) {
        winnerTransaction = tx;
      }
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
        startingPriceInr: lot.startingPriceInr ? Number(lot.startingPriceInr) : null,
        reservePriceInr: lot.reservePriceInr ? Number(lot.reservePriceInr) : null,
        auctionStartsAt: lot.auctionStartsAt,
        auctionEndsAt: lot.auctionEndsAt,
        createdAt: lot.createdAt,
        updatedAt: lot.updatedAt,
        // Only expose seller identity to the lot owner — buyers see commodity details only
        seller: isOwnerOrAdmin ? lot.seller : null,
        farmer: isOwnerOrAdmin ? lot.farmer : null,
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
        // Compliance documents (from farmer/aggregator submission)
        complianceDocs: {
          labReportUrl,
          phytosanitaryUrl,
          originCertUrl,
          sellerDeclaration: lot.sellerDeclaration,
        },
        bids: lot.bids.map(b => {
          const isSelf = viewerUserId === b.bidderId;
          const canSeeIdentity = isOwnerOrAdmin || isSelf;
          return {
            id: b.id,
            amountInr: Number(b.amountInr),
            createdAt: b.createdAt,
            isSelf,
            bidder: canSeeIdentity
              ? { name: isSelf ? "You" : b.bidder.name, country: b.bidder.country }
              : { name: aliasById.get(b.bidderId) ?? "Anonymous bidder", country: null },
          };
        }),
        bidCount: lot._count.bids,
        winnerTransaction,
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
    // Verify lot exists and belongs to seller
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      select: {
        id: true,
        sellerId: true,
        status: true,
        listingMode: true,
        startingPriceInr: true,
        reservePriceInr: true,
        auctionStartsAt: true,
        auctionEndsAt: true,
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    // Only lot owner (seller) or admin can edit
    if (lot.sellerId !== authResult.userId && authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "You can only edit your own listings" }, { status: 403 });
    }

    // Only DRAFT or LISTED lots can be edited
    if (!["DRAFT", "LISTED"].includes(lot.status)) {
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

    const effectiveListingMode = parsed.data.listingMode ?? lot.listingMode;
    const effectiveStartingPriceInr = parsed.data.startingPriceInr ?? (lot.startingPriceInr !== null ? Number(lot.startingPriceInr) : undefined);
    const effectiveReservePriceInr = parsed.data.reservePriceInr ?? (lot.reservePriceInr !== null ? Number(lot.reservePriceInr) : undefined);
    const effectiveAuctionStartsAt = parsed.data.auctionStartsAt ?? lot.auctionStartsAt?.toISOString() ?? null;
    const effectiveAuctionEndsAt = parsed.data.auctionEndsAt ?? lot.auctionEndsAt?.toISOString() ?? null;
    const auctionFieldErrors = getLotAuctionFieldErrors({
      listingMode: effectiveListingMode,
      startingPriceInr: effectiveStartingPriceInr,
      reservePriceInr: effectiveReservePriceInr,
      auctionStartsAt: effectiveAuctionStartsAt,
      auctionEndsAt: effectiveAuctionEndsAt,
      requireFutureStart: parsed.data.auctionStartsAt !== undefined,
      requireFutureEnd: parsed.data.auctionEndsAt !== undefined,
    });

    if (hasLotAuctionFieldErrors(auctionFieldErrors)) {
      return NextResponse.json(
        {
          error: getFirstLotAuctionError(auctionFieldErrors) || "Validation failed",
          details: { fieldErrors: auctionFieldErrors },
        },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.listingMode !== undefined) updateData.listingMode = parsed.data.listingMode;
    if (parsed.data.startingPriceInr !== undefined) updateData.startingPriceInr = parsed.data.startingPriceInr;
    if (parsed.data.reservePriceInr !== undefined) updateData.reservePriceInr = parsed.data.reservePriceInr;
    if (parsed.data.auctionStartsAt !== undefined) updateData.auctionStartsAt = parsed.data.auctionStartsAt ? new Date(parsed.data.auctionStartsAt) : null;
    if (parsed.data.auctionEndsAt !== undefined) updateData.auctionEndsAt = parsed.data.auctionEndsAt ? new Date(parsed.data.auctionEndsAt) : null;

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
        startingPriceInr: updated.startingPriceInr ? Number(updated.startingPriceInr) : null,
        reservePriceInr: updated.reservePriceInr ? Number(updated.reservePriceInr) : null,
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
