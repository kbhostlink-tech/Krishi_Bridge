import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/warehouses/[warehouseId]/staff/[staffId] — remove a staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string; staffId: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { warehouseId, staffId } = await params;

  const staff = await prisma.warehouseStaff.findFirst({
    where: { id: staffId, warehouseId },
  });

  if (!staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  await prisma.warehouseStaff.delete({ where: { id: staffId } });

  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "REMOVE_WAREHOUSE_STAFF",
      entity: "WarehouseStaff",
      entityId: staffId,
      metadata: { warehouseId, removedUserId: staff.userId },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ success: true });
}
