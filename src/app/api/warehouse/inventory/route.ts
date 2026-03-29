import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadPresignedUrl } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["WAREHOUSE_STAFF", "ADMIN"]);
  if (roleCheck) return roleCheck;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const commodityType = searchParams.get("commodityType");
    const search = searchParams.get("search");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status && ["INTAKE", "LISTED", "AUCTION_ACTIVE", "SOLD", "REDEEMED", "CANCELLED"].includes(status)) {
      where.status = status;
    }

    if (commodityType) {
      where.commodityType = commodityType;
    }

    if (search) {
      where.OR = [
        { lotNumber: { contains: search, mode: "insensitive" } },
        { farmer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Parallel: get lots + stats
    const [lots, totalCount, stats] = await Promise.all([
      prisma.lot.findMany({
        where,
        include: {
          farmer: { select: { id: true, name: true, country: true } },
          warehouse: { select: { id: true, name: true } },
          qualityCheck: true,
          qrCode: { select: { id: true, qrImageUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.lot.count({ where }),
      prisma.lot.aggregate({
        _sum: { quantityKg: true },
        _count: { _all: true },
        where: {},
      }),
    ]);

    // Get stats by status
    const [intakeCount, listedCount, soldCount, redeemedCount] = await Promise.all([
      prisma.lot.count({ where: { status: "INTAKE" } }),
      prisma.lot.count({ where: { status: "LISTED" } }),
      prisma.lot.count({ where: { status: "SOLD" } }),
      prisma.lot.count({ where: { status: "REDEEMED" } }),
    ]);

    const hasMore = lots.length > limit;
    const items = hasMore ? lots.slice(0, -1) : lots;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Generate signed URLs for QR images
    const lotsWithUrls = await Promise.all(
      items.map(async (lot) => {
        let qrImageSignedUrl = null;
        if (lot.qrCode?.qrImageUrl) {
          qrImageSignedUrl = await getDownloadPresignedUrl(lot.qrCode.qrImageUrl);
        }
        return {
          ...lot,
          quantityKg: Number(lot.quantityKg),
          startingPriceUsd: lot.startingPriceUsd ? Number(lot.startingPriceUsd) : null,
          reservePriceUsd: lot.reservePriceUsd ? Number(lot.reservePriceUsd) : null,
          qrCode: lot.qrCode ? { ...lot.qrCode, qrImageSignedUrl } : null,
        };
      })
    );

    return NextResponse.json({
      lots: lotsWithUrls,
      pagination: { total: totalCount, hasMore, nextCursor },
      stats: {
        totalLots: stats._count._all,
        totalQuantityKg: Number(stats._sum.quantityKg || 0),
        intake: intakeCount,
        listed: listedCount,
        sold: soldCount,
        redeemed: redeemedCount,
      },
    });
  } catch (error) {
    console.error("[WAREHOUSE_INVENTORY]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
