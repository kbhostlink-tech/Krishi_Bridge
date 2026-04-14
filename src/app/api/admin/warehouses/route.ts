import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createWarehouseSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  country: z.enum(["IN", "NP", "BT", "AE", "SA", "OM"]),
  state: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  address: z.string().min(1).max(500).trim(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")).or(z.literal(null)),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  maxCapacity: z.number().int().min(0).max(1000000).optional().nullable(),
});

// GET /api/admin/warehouses — list all warehouses with staff + lot counts
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;
  const permErr = requireAdminPermission(authResult, "warehouses.view");
  if (permErr) return permErr;

  const warehouses = await prisma.warehouse.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { lots: true },
      },
    },
  });

  // Summary stats
  const total = warehouses.length;
  const active = warehouses.filter((w) => w.isActive).length;
  const totalLots = warehouses.reduce((sum, w) => sum + w._count.lots, 0);

  return NextResponse.json({ warehouses, stats: { total, active, totalLots } });
}

// POST /api/admin/warehouses — create a new warehouse
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;
  const permErr = requireAdminPermission(authResult, "warehouses.manage");
  if (permErr) return permErr;

  const body = await request.json();
  const parsed = createWarehouseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }
  const { name, country, state, district, address, phone, email, lat, lng, maxCapacity } = parsed.data;

  const warehouse = await prisma.warehouse.create({
    data: {
      name,
      country,
      state: state?.trim() || null,
      district: district?.trim() || null,
      address,
      phone: phone?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      lat: lat ?? null,
      lng: lng ?? null,
      maxCapacity: maxCapacity ?? null,
      managerId: authResult.userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "CREATE_WAREHOUSE",
      entity: "Warehouse",
      entityId: warehouse.id,
      metadata: { name: warehouse.name, country: warehouse.country },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
    },
  });

  return NextResponse.json({ warehouse }, { status: 201 });
}
