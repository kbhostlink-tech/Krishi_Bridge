import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/warehouses/[warehouseId]/invitations/[invitationId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string; invitationId: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { warehouseId, invitationId } = await params;

  const invitation = await prisma.warehouseInvitation.findFirst({
    where: { id: invitationId, warehouseId },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "Cannot cancel an already accepted invitation" }, { status: 409 });
  }

  await prisma.warehouseInvitation.delete({ where: { id: invitationId } });

  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "CANCEL_WAREHOUSE_INVITATION",
      entity: "WarehouseInvitation",
      entityId: invitationId,
      metadata: { warehouseId, email: invitation.email },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ success: true });
}
