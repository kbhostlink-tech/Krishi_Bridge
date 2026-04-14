import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";

// DELETE /api/admin/rfq/[rfqId] — permanently delete an RFQ and all responses/negotiations
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ rfqId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "rfq.delete");
  if (permErr) return permErr;

  const { rfqId } = await params;

  try {
    const rfq = await prisma.rfqRequest.findUnique({
      where: { id: rfqId },
      select: { id: true, commodityType: true, buyerId: true, status: true, quantityKg: true },
    });

    if (!rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete negotiations first, then responses, then the RFQ
      const responses = await tx.rfqResponse.findMany({
        where: { rfqId },
        select: { id: true },
      });
      if (responses.length > 0) {
        await tx.rfqNegotiation.deleteMany({
          where: { responseId: { in: responses.map((r) => r.id) } },
        });
        await tx.rfqResponse.deleteMany({ where: { rfqId } });
      }

      // Nullify transaction rfqId references (preserve financial records)
      await tx.transaction.updateMany({ where: { rfqId }, data: { rfqId: null } });

      await tx.rfqRequest.delete({ where: { id: rfqId } });
    });

    await prisma.auditLog.create({
      data: {
        userId: authResult.userId,
        action: "RFQ_DELETED",
        entity: "RfqRequest",
        entityId: rfqId,
        metadata: {
          commodityType: rfq.commodityType,
          buyerId: rfq.buyerId,
          status: rfq.status,
          quantityKg: Number(rfq.quantityKg),
        },
      },
    }).catch(() => {});

    return NextResponse.json({ message: "RFQ permanently deleted" });
  } catch (error) {
    console.error("[ADMIN_RFQ_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
