import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadPresignedUrl } from "@/lib/r2";

// GET /api/admin/lots — List all lots (ADMIN only)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { lotNumber: { contains: search, mode: "insensitive" } },
        { farmer: { name: { contains: search, mode: "insensitive" } } },
        { farmer: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [lots, total] = await Promise.all([
      prisma.lot.findMany({
        where,
        include: {
          farmer: { select: { id: true, name: true, email: true, country: true } },
          warehouse: { select: { id: true, name: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.lot.count({ where }),
    ]);

    const enriched = await Promise.all(
      lots.map(async (lot) => {
        let primaryImageUrl: string | null = null;
        const images = (lot.images as string[]) || [];
        if (images.length > 0) {
          try {
            primaryImageUrl = await getDownloadPresignedUrl(images[0]);
          } catch { /* ignore */ }
        }
        return {
          id: lot.id,
          lotNumber: lot.lotNumber,
          commodityType: lot.commodityType,
          grade: lot.grade,
          quantityKg: lot.quantityKg,
          status: lot.status,
          listingMode: lot.listingMode,
          startingPriceUsd: lot.startingPriceUsd ? Number(lot.startingPriceUsd) : null,
          createdAt: lot.createdAt.toISOString(),
          farmer: lot.farmer,
          warehouse: lot.warehouse,
          bidCount: lot._count.bids,
          primaryImageUrl,
        };
      })
    );

    return NextResponse.json({ lots: enriched, pagination: { total } });
  } catch (error) {
    console.error("[ADMIN_LOTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
