import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireAuth, checkRole, checkKycApproved } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadPresignedUrl } from "@/lib/r2";

// GET /api/lots — Public marketplace listing (no auth required, but auth-aware)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Filter params
    const commodityType = searchParams.get("commodityType");
    const grade = searchParams.get("grade");
    const country = searchParams.get("country");
    const listingMode = searchParams.get("listingMode");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const farmerId = searchParams.get("farmerId"); // For farmer's own lots

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Public marketplace: only show LISTED and AUCTION_ACTIVE lots
    // Unless farmerId is set (farmer viewing own lots)
    if (farmerId) {
      where.farmerId = farmerId;
    } else {
      where.status = { in: ["LISTED", "AUCTION_ACTIVE"] };
    }

    if (commodityType) {
      const types = commodityType.split(",");
      where.commodityType = types.length === 1 ? types[0] : { in: types };
    }

    if (grade) {
      const grades = grade.split(",");
      where.grade = grades.length === 1 ? grades[0] : { in: grades };
    }

    if (country) {
      where.origin = { path: ["country"], equals: country };
    }

    if (listingMode) {
      where.listingMode = listingMode;
    }

    if (search) {
      where.OR = [
        { lotNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { farmer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (minPrice || maxPrice) {
      where.startingPriceUsd = {};
      if (minPrice) where.startingPriceUsd.gte = parseFloat(minPrice);
      if (maxPrice) where.startingPriceUsd.lte = parseFloat(maxPrice);
    }

    // Sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: "desc" };
    switch (sort) {
      case "price_asc": orderBy = { startingPriceUsd: "asc" }; break;
      case "price_desc": orderBy = { startingPriceUsd: "desc" }; break;
      case "ending_soon": orderBy = { auctionEndsAt: "asc" }; break;
      case "newest": default: orderBy = { createdAt: "desc" }; break;
    }

    const [lots, totalCount] = await Promise.all([
      prisma.lot.findMany({
        where,
        include: {
          farmer: { select: { id: true, name: true, country: true } },
          warehouse: { select: { id: true, name: true } },
          qualityCheck: {
            select: {
              moisturePct: true,
              podSizeMm: true,
              colourGrade: true,
            },
          },
          qrCode: { select: { id: true, qrImageUrl: true } },
          _count: { select: { bids: true } },
        },
        orderBy,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.lot.count({ where }),
    ]);

    const hasMore = lots.length > limit;
    const items = hasMore ? lots.slice(0, -1) : lots;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Generate signed URLs for first image of each lot
    const lotsWithUrls = await Promise.all(
      items.map(async (lot) => {
        let primaryImageUrl = null;
        if (lot.images.length > 0) {
          primaryImageUrl = await getDownloadPresignedUrl(lot.images[0]);
        }

        return {
          id: lot.id,
          lotNumber: lot.lotNumber,
          commodityType: lot.commodityType,
          grade: lot.grade,
          quantityKg: Number(lot.quantityKg),
          description: lot.description,
          images: lot.images,
          primaryImageUrl,
          origin: lot.origin,
          status: lot.status,
          listingMode: lot.listingMode,
          startingPriceUsd: lot.startingPriceUsd ? Number(lot.startingPriceUsd) : null,
          reservePriceUsd: lot.reservePriceUsd ? Number(lot.reservePriceUsd) : null,
          auctionStartsAt: lot.auctionStartsAt,
          auctionEndsAt: lot.auctionEndsAt,
          createdAt: lot.createdAt,
          farmer: lot.farmer,
          warehouse: lot.warehouse,
          qualityCheck: lot.qualityCheck,
          bidCount: lot._count.bids,
        };
      })
    );

    return NextResponse.json({
      lots: lotsWithUrls,
      pagination: { total: totalCount, hasMore, nextCursor },
    });
  } catch (error) {
    console.error("[LOTS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/lots — Only for farmers creating lots directly (if allowed)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["FARMER", "ADMIN"]);
  if (roleCheck) return roleCheck;

  const kycCheck = checkKycApproved(authResult);
  if (kycCheck) return kycCheck;

  try {
    const body = await req.json();
    // Minimal lot creation for farmer direct listing
    const { commodityType, grade, quantityKg, description, origin, warehouseId, listingMode } = body;

    if (!commodityType || !grade || !quantityKg || !origin || !warehouseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Import lot number generator
    const { generateLotNumber, generateHmacSignature, generateQrCodeBuffer } = await import("@/lib/lot-utils");
    const { uploadToR2, buildR2Key } = await import("@/lib/r2");

    // Generate unique lot number
    let lotNumber = "";
    for (let i = 0; i < 5; i++) {
      lotNumber = generateLotNumber(commodityType, origin.state || "XX");
      const existing = await prisma.lot.findUnique({ where: { lotNumber } });
      if (!existing) break;
    }

    const lot = await prisma.$transaction(async (tx) => {
      const newLot = await tx.lot.create({
        data: {
          lotNumber,
          farmerId: authResult.userId,
          warehouseId,
          commodityType,
          grade,
          quantityKg,
          description: description || null,
          images: [],
          origin,
          status: "INTAKE",
          listingMode: listingMode || "AUCTION",
        },
      });

      // Generate QR code
      const qrPayload = {
        lotId: newLot.id,
        lotNumber: newLot.lotNumber,
        commodityType,
        grade,
        quantityKg: Number(quantityKg),
        warehouseId,
      };

      const hmacSignature = generateHmacSignature(qrPayload);
      const qrBuffer = await generateQrCodeBuffer(qrPayload, hmacSignature);
      const qrKey = buildR2Key("qr-codes", newLot.id, `${lotNumber}.png`);
      await uploadToR2(qrKey, qrBuffer, "image/png");

      await tx.qrCode.create({
        data: {
          lotId: newLot.id,
          qrData: JSON.stringify({ ...qrPayload, signature: hmacSignature }),
          qrImageUrl: qrKey,
          hmacSignature,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "LOT_CREATED",
          entity: "Lot",
          entityId: newLot.id,
          metadata: { lotNumber, commodityType, grade, quantityKg },
        },
      });

      return newLot;
    });

    return NextResponse.json({ lot: { ...lot, quantityKg: Number(lot.quantityKg) } }, { status: 201 });
  } catch (error) {
    console.error("[LOTS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
