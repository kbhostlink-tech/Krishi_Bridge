import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["FARMER", "BUYER", "AGGREGATOR", "ADMIN"]).optional(),
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
  const permErr = requireAdminPermission(authResult, "users.view");
  if (permErr) return permErr;

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
  const permErr = requireAdminPermission(authResult, "users.manage");
  if (permErr) return permErr;

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

    // Notify user about account status change
    if (parsed.data.isActive !== undefined) {
      await notifyUser({
        userId,
        event: "LOT_STATUS_CHANGE",
        title: parsed.data.isActive ? "Account Reactivated" : "Account Suspended",
        body: parsed.data.isActive
          ? "Your account has been reactivated by an administrator. You can now access the platform."
          : "Your account has been suspended by an administrator. Please contact support for more information.",
        data: { isActive: parsed.data.isActive },
        channels: ["email", "in_app"],
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("[ADMIN_USER_UPDATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[userId] — permanently delete a user and all associated data
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "users.delete");
  if (permErr) return permErr;

  const { userId } = await params;

  // Prevent self-deletion
  if (userId === authResult.userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent removing the last admin
    if (user.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the last admin account" }, { status: 400 });
      }
    }

    // Cascade-delete everything related to this user in dependency order
    await prisma.$transaction(async (tx) => {
      // RFQ negotiations
      await tx.rfqNegotiation.deleteMany({ where: { fromUserId: userId } });

      // RFQ responses (and their nested negotiations)
      const rfqResponses = await tx.rfqResponse.findMany({
        where: { sellerId: userId },
        select: { id: true },
      });
      if (rfqResponses.length > 0) {
        await tx.rfqNegotiation.deleteMany({
          where: { responseId: { in: rfqResponses.map((r) => r.id) } },
        });
        await tx.rfqResponse.deleteMany({ where: { sellerId: userId } });
      }

      // RFQ requests (and their responses/negotiations)
      const rfqRequests = await tx.rfqRequest.findMany({
        where: { buyerId: userId },
        select: { id: true },
      });
      if (rfqRequests.length > 0) {
        const rfqIds = rfqRequests.map((r) => r.id);
        const buyerRfqResponses = await tx.rfqResponse.findMany({
          where: { rfqId: { in: rfqIds } },
          select: { id: true },
        });
        if (buyerRfqResponses.length > 0) {
          await tx.rfqNegotiation.deleteMany({
            where: { responseId: { in: buyerRfqResponses.map((r) => r.id) } },
          });
          await tx.rfqResponse.deleteMany({ where: { rfqId: { in: rfqIds } } });
        }
        await tx.rfqRequest.deleteMany({ where: { buyerId: userId } });
      }

      // Bids
      await tx.bid.deleteMany({ where: { bidderId: userId } });

      // Token transfers
      await tx.tokenTransfer.deleteMany({
        where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      });

      // Tokens (nullify the lot's token reference by deleting the token)
      await tx.token.deleteMany({ where: { ownerId: userId } });

      // Transactions — set buyerId/sellerId to a system placeholder isn't possible with current schema;
      // we delete transactions only if the user is the buyer. Seller-side references remain via a different relation.
      await tx.transaction.deleteMany({ where: { buyerId: userId } });

      // Lots owned/farmed by user
      const userLots = await tx.lot.findMany({
        where: { OR: [{ sellerId: userId }, { farmerId: userId }] },
        select: { id: true },
      });
      if (userLots.length > 0) {
        const lotIds = userLots.map((l) => l.id);
        await tx.bid.deleteMany({ where: { lotId: { in: lotIds } } });
        await tx.rfqResponse.deleteMany({ where: { lotId: { in: lotIds } } });
        await tx.tokenTransfer.deleteMany({
          where: { token: { lotId: { in: lotIds } } },
        });
        await tx.token.deleteMany({ where: { lotId: { in: lotIds } } });
        await tx.transaction.deleteMany({ where: { lotId: { in: lotIds } } });
        await tx.lot.deleteMany({ where: { id: { in: lotIds } } });
      }

      // Commodity submissions
      await tx.commoditySubmission.deleteMany({ where: { farmerId: userId } });

      // Profiles and cascaded (OtpCode, KycDocument, Notification, PushSubscription are cascade-deleted by Prisma)
      await tx.user.delete({ where: { id: userId } });
    });

    // Audit log (outside transaction so it persists even if something above failed)
    await prisma.auditLog.create({
      data: {
        userId: authResult.userId,
        action: "USER_DELETED",
        entity: "User",
        entityId: userId,
        metadata: { email: user.email, name: user.name, role: user.role },
      },
    }).catch(() => {});

    return NextResponse.json({ message: "User permanently deleted" });
  } catch (error) {
    console.error("[ADMIN_USER_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
