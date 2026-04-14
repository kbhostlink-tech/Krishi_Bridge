import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";

// DELETE /api/admin/lots/[lotId] — permanently delete a lot and all associated data
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "lots.delete");
  if (permErr) return permErr;

  const { lotId } = await params;

  try {
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      select: { id: true, lotNumber: true, commodityType: true, sellerId: true, status: true },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete bids
      await tx.bid.deleteMany({ where: { lotId } });

      // Delete RFQ responses linked to this lot (and their negotiations)
      const lotRfqResponses = await tx.rfqResponse.findMany({
        where: { lotId },
        select: { id: true },
      });
      if (lotRfqResponses.length > 0) {
        await tx.rfqNegotiation.deleteMany({
          where: { responseId: { in: lotRfqResponses.map((r) => r.id) } },
        });
        await tx.rfqResponse.deleteMany({ where: { lotId } });
      }

      // Delete token transfers then token
      const lotToken = await tx.token.findUnique({ where: { lotId }, select: { id: true } });
      if (lotToken) {
        await tx.tokenTransfer.deleteMany({ where: { tokenId: lotToken.id } });
        await tx.token.delete({ where: { lotId } });
      }

      // Nullify transaction lot reference (preserve financial records)
      await tx.transaction.updateMany({ where: { lotId }, data: { lotId: null } });

      // QualityCheck and QrCode are cascade-deleted by Prisma schema rules
      await tx.lot.delete({ where: { id: lotId } });
    });

    await prisma.auditLog.create({
      data: {
        userId: authResult.userId,
        action: "LOT_DELETED",
        entity: "Lot",
        entityId: lotId,
        metadata: { lotNumber: lot.lotNumber, commodityType: lot.commodityType, status: lot.status },
      },
    }).catch(() => {});

    return NextResponse.json({ message: "Lot permanently deleted" });
  } catch (error) {
    console.error("[ADMIN_LOT_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
