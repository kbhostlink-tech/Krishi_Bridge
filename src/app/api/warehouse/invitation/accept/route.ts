import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/warehouse/invitation/accept — auth required
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const invitation = await prisma.warehouseInvitation.findUnique({
    where: { token },
    include: {
      warehouse: { select: { id: true, name: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found or invalid" }, { status: 404 });
  }
  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 409 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
  }

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      { error: "This invitation was sent to a different email address. Please log in with the correct account." },
      { status: 403 }
    );
  }

  const alreadyStaff = await prisma.warehouseStaff.findUnique({
    where: {
      warehouseId_userId: {
        warehouseId: invitation.warehouseId,
        userId: user.id,
      },
    },
  });
  if (alreadyStaff) {
    return NextResponse.json(
      { error: "You are already a staff member of this warehouse" },
      { status: 409 }
    );
  }

  // Accept invitation atomically
  await prisma.$transaction(async (tx) => {
    await tx.warehouseStaff.create({
      data: {
        warehouseId: invitation.warehouseId,
        userId: user.id,
        staffRole: invitation.staffRole,
        assignedBy: invitation.invitedBy,
      },
    });
    await tx.warehouseInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date(), acceptedBy: user.id },
    });
    // Promote role if needed (FARMER/BUYER → WAREHOUSE_STAFF)
    if (user.role !== "WAREHOUSE_STAFF" && user.role !== "ADMIN") {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "WAREHOUSE_STAFF" },
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ACCEPT_WAREHOUSE_INVITATION",
      entity: "WarehouseInvitation",
      entityId: invitation.id,
      metadata: {
        warehouseId: invitation.warehouseId,
        staffRole: invitation.staffRole,
        previousRole: user.role,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({
    success: true,
    warehouse: invitation.warehouse,
    staffRole: invitation.staffRole,
  });
}
