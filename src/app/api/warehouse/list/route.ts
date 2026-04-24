import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/warehouse/list — List active warehouses (for seller listing forms)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: { id: true, name: true, country: true, state: true, district: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error("[WAREHOUSE_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

