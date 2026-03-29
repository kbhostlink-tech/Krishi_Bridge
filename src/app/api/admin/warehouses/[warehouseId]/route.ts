import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/warehouses/[warehouseId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { warehouseId } = await params;

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
    include: {
      staff: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              country: true,
              createdAt: true,
            },
          },
        },
        orderBy: { assignedAt: "asc" },
      },
      invitations: {
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { lots: true } },
    },
  });

  if (!warehouse) {
    return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
  }

  return NextResponse.json({ warehouse });
}

// PATCH /api/admin/warehouses/[warehouseId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { warehouseId } = await params;
  const body = await request.json();

  const allowedFields = [
    "name",
    "country",
    "state",
    "district",
    "address",
    "phone",
    "email",
    "lat",
    "lng",
    "maxCapacity",
    "isActive",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Validate the warehouse exists before update
  const existing = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!existing) {
    return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
  }

  // Sanitize numeric and boolean fields
  if ("maxCapacity" in updateData && updateData.maxCapacity !== null) {
    const cap = Number(updateData.maxCapacity);
    if (isNaN(cap) || cap < 0) {
      return NextResponse.json({ error: "Invalid maxCapacity value" }, { status: 400 });
    }
    updateData.maxCapacity = cap;
  }
  if ("email" in updateData && updateData.email) {
    updateData.email = String(updateData.email).trim().toLowerCase();
  }
  if ("isActive" in updateData) {
    updateData.isActive = Boolean(updateData.isActive);
  }

  const warehouse = await prisma.warehouse.update({
    where: { id: warehouseId },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "UPDATE_WAREHOUSE",
      entity: "Warehouse",
      entityId: warehouseId,
      metadata: { updated: Object.keys(updateData) },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ warehouse });
}
