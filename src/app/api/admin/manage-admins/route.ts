import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminRole } from "@/generated/prisma/client";

const VALID_ADMIN_ROLES: AdminRole[] = [
  "COMPLIANCE_ADMIN",
  "OPS_ADMIN",
  "DATA_AUDIT_ADMIN",
  "READ_ONLY_ADMIN",
];

// ─── GET: List all admins (Super Admin only) ─────

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  const superCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (superCheck) return superCheck;

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      email: true,
      name: true,
      adminRole: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ admins });
}

// ─── PATCH: Update admin role or deactivate (Super Admin only) ─────

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  const superCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (superCheck) return superCheck;

  let body: { adminId?: string; adminRole?: string; isActive?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { adminId, adminRole, isActive } = body;

  if (!adminId) {
    return NextResponse.json({ error: "adminId is required" }, { status: 400 });
  }

  // Prevent self-modification
  if (adminId === authResult.userId) {
    return NextResponse.json(
      { error: "Cannot modify your own admin account" },
      { status: 400 }
    );
  }

  const targetAdmin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { id: true, role: true, adminRole: true },
  });

  if (!targetAdmin || targetAdmin.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
  }

  // Prevent modifying another Super Admin
  if (targetAdmin.adminRole === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Cannot modify another Super Admin" },
      { status: 403 }
    );
  }

  const updateData: Record<string, unknown> = {};

  if (adminRole !== undefined) {
    if (!VALID_ADMIN_ROLES.includes(adminRole as AdminRole)) {
      return NextResponse.json(
        { error: "Invalid admin role" },
        { status: 400 }
      );
    }
    updateData.adminRole = adminRole;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: adminId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      adminRole: true,
      isActive: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "ADMIN_UPDATED",
      entity: "User",
      entityId: adminId,
      metadata: { changes: updateData as Record<string, string | boolean> },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    },
  });

  return NextResponse.json({ success: true, admin: updated });
}

// ─── DELETE: Remove admin (Super Admin only) ─────

export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  const superCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (superCheck) return superCheck;

  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get("adminId");

  if (!adminId) {
    return NextResponse.json({ error: "adminId is required" }, { status: 400 });
  }

  // Prevent self-deletion
  if (adminId === authResult.userId) {
    return NextResponse.json(
      { error: "Cannot delete your own admin account" },
      { status: 400 }
    );
  }

  const targetAdmin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { id: true, role: true, adminRole: true, email: true, name: true },
  });

  if (!targetAdmin || targetAdmin.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
  }

  // Prevent deleting another Super Admin
  if (targetAdmin.adminRole === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Cannot remove another Super Admin" },
      { status: 403 }
    );
  }

  // Deactivate instead of hard delete (preserve audit trail)
  await prisma.user.update({
    where: { id: adminId },
    data: { isActive: false, role: "BUYER", adminRole: null }, // Demote to regular user
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "ADMIN_REMOVED",
      entity: "User",
      entityId: adminId,
      metadata: {
        email: targetAdmin.email,
        name: targetAdmin.name,
        previousRole: targetAdmin.adminRole,
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    },
  });

  return NextResponse.json({ success: true });
}
