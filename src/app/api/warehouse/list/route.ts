import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/warehouse/list — List active warehouses for intake form
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["WAREHOUSE_STAFF", "ADMIN"]);
  if (roleCheck) return roleCheck;

  try {
    // ADMIN sees all active warehouses; WAREHOUSE_STAFF sees only their assigned ones
    let where: Record<string, unknown> = { isActive: true };

    if (authResult.role === "WAREHOUSE_STAFF") {
      const assignments = await prisma.warehouseStaff.findMany({
        where: { userId: authResult.userId },
        select: { warehouseId: true },
      });
      const assignedIds = assignments.map((a) => a.warehouseId);
      where = { isActive: true, id: { in: assignedIds } };
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      select: { id: true, name: true, country: true, state: true, district: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error("[WAREHOUSE_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
