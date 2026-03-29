import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole } from "@/lib/auth";
import { z } from "zod";

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["FARMER", "BUYER", "WAREHOUSE_STAFF", "ADMIN"]).optional(),
});

// GET /api/admin/users/[userId] — get single user detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  const { userId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        country: true,
        preferredCurrency: true,
        preferredLang: true,
        kycStatus: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        kycDocuments: {
          select: {
            id: true,
            docType: true,
            docUrl: true,
            remarks: true,
            verifiedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            kycDocuments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[ADMIN_USER_DETAIL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/users/[userId] — update user (activate/deactivate, change role)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  const { userId } = await params;

  try {
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Prevent admin from deactivating themselves
    if (parsed.data.isActive === false && userId === authResult.userId) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    // Prevent removing the last admin
    if (parsed.data.role && parsed.data.role !== "ADMIN") {
      const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (targetUser?.role === "ADMIN") {
        const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "Cannot remove the last admin" },
            { status: 400 }
          );
        }
      }
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;

    // If deactivating, also invalidate all sessions
    if (parsed.data.isActive === false) {
      updateData.tokenVersion = { increment: 1 };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: authResult.userId,
        action: parsed.data.isActive !== undefined
          ? `USER_${parsed.data.isActive ? "ACTIVATED" : "DEACTIVATED"}`
          : "USER_UPDATED",
        entity: "User",
        entityId: userId,
        metadata: parsed.data,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("[ADMIN_USER_UPDATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
