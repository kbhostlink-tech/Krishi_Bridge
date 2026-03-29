import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/lots/[lotId]/action — Admin lot actions
// Body: { action: "delist" | "relist" }
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
    const { action } = await req.json();

    const lot = await prisma.lot.findUnique({ where: { id: lotId } });
    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    if (action === "delist") {
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

      return NextResponse.json({ message: "Lot delisted", status: "CANCELLED" });
    }

    if (action === "relist") {
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

      return NextResponse.json({ message: "Lot relisted", status: "LISTED" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[ADMIN_LOT_ACTION]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
