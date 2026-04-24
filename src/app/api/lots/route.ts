import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkKycApproved } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadPresignedUrl } from "@/lib/r2";
import { createListingSchema } from "@/lib/validations";

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
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "newest";
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const sellerId = searchParams.get("sellerId"); // For seller's own lots
    const farmerId = searchParams.get("farmerId"); // For farmer tracking their lots

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Public marketplace: only show LISTED and AUCTION_ACTIVE lots
    // Unless sellerId/farmerId is set (viewing own lots)
    if (sellerId) {
      where.sellerId = sellerId;
    } else if (farmerId) {
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

    if (status && (sellerId || farmerId)) {
      const statuses = status.split(",");
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    if (search) {
      where.OR = [
        { lotNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { seller: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (minPrice || maxPrice) {
      where.startingPriceInr = {};
      if (minPrice) where.startingPriceInr.gte = parseFloat(minPrice);
      if (maxPrice) where.startingPriceInr.lte = parseFloat(maxPrice);
    }

    // Sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: "desc" };
    switch (sort) {
      case "price_asc": orderBy = { startingPriceInr: "asc" }; break;
      case "price_desc": orderBy = { startingPriceInr: "desc" }; break;
      case "ending_soon": orderBy = { auctionEndsAt: "asc" }; break;
      case "newest": default: orderBy = { createdAt: "desc" }; break;
    }

    const paginationArgs = (page > 1 || (!cursor && (sellerId || farmerId)))
      ? { skip: (page - 1) * limit, take: limit }
      : { take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) };

    const [lots, totalCount] = await Promise.all([
      prisma.lot.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, country: true } },
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
        skip: paginationArgs.skip,
        take: paginationArgs.take,
        ...(("cursor" in paginationArgs && paginationArgs.cursor) ? { cursor: paginationArgs.cursor } : {}),
      }),
      prisma.lot.count({ where }),
    ]);

    // For page-based pagination (own lots view), don't use cursor logic
    const usingPagePagination = page > 1 || (!cursor && (sellerId || farmerId));
    const hasMore = usingPagePagination ? page * limit < totalCount : lots.length > limit;
    const items = (!usingPagePagination && lots.length > limit) ? lots.slice(0, -1) : lots;
    const nextCursor = (!usingPagePagination && hasMore) ? items[items.length - 1].id : null;
    const totalPages = Math.ceil(totalCount / limit);

    // Determine if this is the seller's own request
    const isOwnLotsView = !!sellerId || !!farmerId;

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
          startingPriceInr: lot.startingPriceInr ? Number(lot.startingPriceInr) : null,
          reservePriceInr: lot.reservePriceInr ? Number(lot.reservePriceInr) : null,
          auctionStartsAt: lot.auctionStartsAt,
          auctionEndsAt: lot.auctionEndsAt,
          createdAt: lot.createdAt,
          // Only include seller/farmer details for own lots view, hide from public marketplace
          seller: isOwnLotsView ? lot.seller : null,
          farmer: isOwnLotsView ? lot.farmer : null,
          warehouse: lot.warehouse ? { id: lot.warehouse.id, name: lot.warehouse.name } : null,
          qualityCheck: lot.qualityCheck,
          bidCount: lot._count.bids,
          adminRemarks: lot.adminRemarks,
        };
      })
    );

    return NextResponse.json({
      lots: lotsWithUrls,
      pagination: { total: totalCount, hasMore, nextCursor, totalPages, page },
    });
  } catch (error) {
    console.error("[LOTS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/lots — Farmer or Aggregator creates a commodity listing
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["FARMER", "AGGREGATOR", "ADMIN"]);
  if (roleCheck) return roleCheck;

  const kycCheck = checkKycApproved(authResult);
  if (kycCheck) return kycCheck;

  try {
    const body = await req.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If creating from a farmer submission, verify it exists and is approved
    if (data.submissionId) {
      const submission = await prisma.commoditySubmission.findUnique({
        where: { id: data.submissionId },
        select: { id: true, status: true, farmerId: true, lotId: true },
      });

      if (!submission) {
        return NextResponse.json({ error: "Commodity submission not found" }, { status: 404 });
      }
      if (submission.status !== "APPROVED") {
        return NextResponse.json({ error: "Submission must be approved before listing" }, { status: 400 });
      }
      if (submission.lotId) {
        return NextResponse.json({ error: "Submission already linked to a listing" }, { status: 409 });
      }
      // Farmers/Aggregators can only use their OWN approved submissions
      if (authResult.role !== "ADMIN" && submission.farmerId !== authResult.userId) {
        return NextResponse.json({ error: "You can only create listings from your own submissions" }, { status: 403 });
      }
    }

    // If warehouseId provided, verify it exists
    if (data.warehouseId) {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: data.warehouseId },
        select: { id: true, isActive: true },
      });
      if (!warehouse || !warehouse.isActive) {
        return NextResponse.json({ error: "Invalid or inactive warehouse" }, { status: 400 });
      }
    }

    const { generateLotNumber, generateHmacSignature, generateQrCodeBuffer } = await import("@/lib/lot-utils");
    const { uploadToR2, buildR2Key } = await import("@/lib/r2");

    // Generate unique lot number
    let lotNumber = "";
    for (let i = 0; i < 5; i++) {
      lotNumber = generateLotNumber(data.commodityType, data.origin.state || "XX");
      const existing = await prisma.lot.findUnique({ where: { lotNumber } });
      if (!existing) break;
    }

    // If creating from a submission, copy its images/videos/compliance docs to the lot
    let submissionMedia: { images: string[]; videos: string[]; sellerDeclaration: string | null; labReportUrl: string | null; phytosanitaryUrl: string | null; originCertUrl: string | null } = {
      images: [], videos: [], sellerDeclaration: null, labReportUrl: null, phytosanitaryUrl: null, originCertUrl: null,
    };
    if (data.submissionId) {
      const sub = await prisma.commoditySubmission.findUnique({
        where: { id: data.submissionId },
        select: { images: true, videos: true, sellerDeclaration: true, labReportUrl: true, phytosanitaryUrl: true, originCertUrl: true },
      });
      if (sub) {
        submissionMedia = {
          images: sub.images || [],
          videos: sub.videos || [],
          sellerDeclaration: sub.sellerDeclaration,
          labReportUrl: sub.labReportUrl,
          phytosanitaryUrl: sub.phytosanitaryUrl,
          originCertUrl: sub.originCertUrl,
        };
      }
    }

    const lot = await prisma.$transaction(async (tx) => {
      const newLot = await tx.lot.create({
        data: {
          lotNumber,
          sellerId: authResult.userId,
          farmerId: data.farmerId || null,
          submissionId: data.submissionId || null,
          warehouseId: data.warehouseId || null,
          commodityType: data.commodityType,
          grade: data.grade,
          quantityKg: data.quantityKg,
          description: data.description || null,
          images: submissionMedia.images,
          videos: submissionMedia.videos,
          sellerDeclaration: submissionMedia.sellerDeclaration,
          labReportUrl: submissionMedia.labReportUrl,
          phytosanitaryUrl: submissionMedia.phytosanitaryUrl,
          originCertUrl: submissionMedia.originCertUrl,
          origin: data.origin,
          status: "DRAFT",
          listingMode: data.listingMode || "AUCTION",
        },
      });

      // Create quality check if provided
      if (data.moisturePct || data.podSizeMm || data.colourGrade) {
        await tx.qualityCheck.create({
          data: {
            lotId: newLot.id,
            moisturePct: data.moisturePct || null,
            podSizeMm: data.podSizeMm || null,
            colourGrade: data.colourGrade || null,
            inspectedBy: authResult.userId,
            notes: data.inspectorNotes || null,
          },
        });
      }

      // Generate QR code
      const qrPayload = {
        lotId: newLot.id,
        lotNumber: newLot.lotNumber,
        commodityType: data.commodityType,
        grade: data.grade,
        quantityKg: Number(data.quantityKg),
        sellerId: authResult.userId,
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

      // Link commodity submission if applicable
      if (data.submissionId) {
        await tx.commoditySubmission.update({
          where: { id: data.submissionId },
          data: { lotId: newLot.id, status: "LISTED" },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "LOT_CREATED",
          entity: "Lot",
          entityId: newLot.id,
          metadata: {
            lotNumber,
            commodityType: data.commodityType,
            grade: data.grade,
            quantityKg: data.quantityKg,
            submissionId: data.submissionId || null,
          },
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
