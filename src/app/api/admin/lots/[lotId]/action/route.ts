import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkAdminPermission, requireAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser, notifyMany } from "@/lib/notifications";

// POST /api/admin/lots/[lotId]/action — Admin lot actions
// Body: { action: "delist" | "relist" | "approve" | "reject", remarks?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  try {
    const { lotId } = await params;
    const { action, remarks } = await req.json();

    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      select: { id: true, lotNumber: true, status: true, sellerId: true, commodityType: true, listingMode: true },
    });
    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    // ---- APPROVE ----
    if (action === "approve") {
      if (!checkAdminPermission(authResult, "lots.approve")) {
        return NextResponse.json(
          { error: "Insufficient permissions to approve lots" },
          { status: 403 }
        );
      }

      if (lot.status !== "PENDING_APPROVAL") {
        return NextResponse.json(
          { error: `Only PENDING_APPROVAL lots can be approved. Current status: ${lot.status}` },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.lot.update({
          where: { id: lotId },
          data: { status: "LISTED" },
        });

        await tx.auditLog.create({
          data: {
            userId: authResult.userId,
            action: "LOT_APPROVED",
            entity: "Lot",
            entityId: lotId,
            metadata: {
              lotNumber: lot.lotNumber,
              previousStatus: lot.status,
              remarks: remarks || null,
            },
          },
        });

        await tx.notification.create({
          data: {
            userId: lot.sellerId,
            type: "IN_APP",
            title: "Lot Approved!",
            body: `Your lot ${lot.lotNumber} (${lot.commodityType.replace(/_/g, " ")}) has been approved and is now listed on the marketplace.`,
            data: { lotId, lotNumber: lot.lotNumber },
          },
        });
      });

      // Fire-and-forget email + push to seller
      notifyUser({
        userId: lot.sellerId,
        event: "LOT_STATUS_CHANGE",
        title: "Lot Approved — Now Live!",
        body: `Your lot ${lot.lotNumber} (${lot.commodityType.replace(/_/g, " ")}) has been approved and is now visible to buyers on the marketplace.`,
        data: { lotId, lotNumber: lot.lotNumber },
        channels: ["email", "push"],
      });

      return NextResponse.json({ message: "Lot approved and listed", status: "LISTED" });
    }

    // ---- REJECT ----
    if (action === "reject") {
      if (!checkAdminPermission(authResult, "lots.reject")) {
        return NextResponse.json(
          { error: "Insufficient permissions to reject lots" },
          { status: 403 }
        );
      }

      if (lot.status !== "PENDING_APPROVAL") {
        return NextResponse.json(
          { error: `Only PENDING_APPROVAL lots can be rejected. Current status: ${lot.status}` },
          { status: 400 }
        );
      }

      if (!remarks || typeof remarks !== "string" || remarks.trim().length < 5) {
        return NextResponse.json(
          { error: "Rejection requires remarks with at least 5 characters" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.lot.update({
          where: { id: lotId },
          data: {
            status: "DRAFT",
            adminRemarks: remarks.trim(),
          },
        });

        await tx.auditLog.create({
          data: {
            userId: authResult.userId,
            action: "LOT_REJECTED",
            entity: "Lot",
            entityId: lotId,
            metadata: {
              lotNumber: lot.lotNumber,
              previousStatus: lot.status,
              remarks: remarks.trim(),
            },
          },
        });

        await tx.notification.create({
          data: {
            userId: lot.sellerId,
            type: "IN_APP",
            title: "Lot Needs Revision",
            body: `Your lot ${lot.lotNumber} was not approved. Reason: ${remarks.trim()}. Please update and resubmit.`,
            data: { lotId, lotNumber: lot.lotNumber, remarks: remarks.trim() },
          },
        });
      });

      // Fire-and-forget email + push to seller
      notifyUser({
        userId: lot.sellerId,
        event: "LOT_STATUS_CHANGE",
        title: "Lot Not Approved — Action Required",
        body: `Your lot ${lot.lotNumber} was not approved. Reason: ${remarks.trim()}. Please update the lot and resubmit for review.`,
        data: { lotId, lotNumber: lot.lotNumber },
        channels: ["email", "push"],
      });

      return NextResponse.json({ message: "Lot rejected", status: "DRAFT", remarks: remarks.trim() });
    }

    if (action === "delist") {
      const permErr = requireAdminPermission(authResult, "lots.delist");
      if (permErr) return permErr;
      // Force-delist: any active status → CANCELLED
      if (lot.status === "CANCELLED" || lot.status === "REDEEMED") {
        return NextResponse.json(
          { error: `Cannot delist a lot with status ${lot.status}` },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.lot.update({
          where: { id: lotId },
          data: { status: "CANCELLED" },
        });

        // Cancel all active bids
        await tx.bid.updateMany({
          where: { lotId, status: "ACTIVE" },
          data: { status: "CANCELLED" },
        });

        await tx.auditLog.create({
          data: {
            userId: authResult.userId,
            action: "ADMIN_FORCE_DELIST",
            entity: "Lot",
            entityId: lotId,
            metadata: {
              lotNumber: lot.lotNumber,
              previousStatus: lot.status,
            },
          },
        });
      });

      // Notify seller that lot was delisted
      await notifyUser({
        userId: lot.sellerId,
        event: "LOT_STATUS_CHANGE",
        title: "Lot Delisted by Admin",
        body: `Your lot ${lot.lotNumber} has been force-delisted by an administrator.`,
        data: { lotId, lotNumber: lot.lotNumber, newStatus: "CANCELLED" },
        link: `/dashboard/lots/${lotId}`,
      });

      // Notify active bidders their bids were cancelled
      const activeBidders = await prisma.bid.findMany({
        where: { lotId, status: "CANCELLED" },
        select: { bidderId: true },
        distinct: ["bidderId"],
      });
      if (activeBidders.length > 0) {
        await notifyMany(
          activeBidders.map((b) => ({
            userId: b.bidderId,
            event: "LOT_STATUS_CHANGE" as const,
            title: "Bid Cancelled — Lot Delisted",
            body: `Lot ${lot.lotNumber} has been delisted. Your bid has been cancelled.`,
            data: { lotId, lotNumber: lot.lotNumber },
            link: `/dashboard/bids`,
          }))
        );
      }

      return NextResponse.json({ message: "Lot delisted", status: "CANCELLED" });
    }

    if (action === "relist") {
      const permErr = requireAdminPermission(authResult, "lots.relist");
      if (permErr) return permErr;
      // Re-list: only CANCELLED → LISTED
      if (lot.status !== "CANCELLED") {
        return NextResponse.json(
          { error: "Only cancelled lots can be relisted" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.lot.update({
          where: { id: lotId },
          data: { status: "LISTED" },
        });

        await tx.auditLog.create({
          data: {
            userId: authResult.userId,
            action: "ADMIN_RELIST",
            entity: "Lot",
            entityId: lotId,
            metadata: { lotNumber: lot.lotNumber },
          },
        });
      });

      // Notify seller that lot was relisted
      await notifyUser({
        userId: lot.sellerId,
        event: "LOT_STATUS_CHANGE",
        title: "Lot Relisted by Admin",
        body: `Your lot ${lot.lotNumber} has been relisted and is now active again.`,
        data: { lotId, lotNumber: lot.lotNumber, newStatus: "LISTED" },
        link: `/dashboard/lots/${lotId}`,
      });

      return NextResponse.json({ message: "Lot relisted", status: "LISTED" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[ADMIN_LOT_ACTION]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
