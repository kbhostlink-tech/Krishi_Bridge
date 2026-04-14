import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkKycApproved } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lotPublishSchema } from "@/lib/validations";
import { notifyMany } from "@/lib/notifications";

// POST /api/lots/[lotId]/publish — Submit a lot for admin approval (INTAKE/DRAFT → PENDING_APPROVAL)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const kycCheck = checkKycApproved(authResult);
  if (kycCheck) return kycCheck;

  const { lotId } = await params;

  try {
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      select: { id: true, sellerId: true, status: true, lotNumber: true },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    if (lot.sellerId !== authResult.userId && authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "You can only publish your own listings" }, { status: 403 });
    }

    if (lot.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only lots in DRAFT status can be submitted for approval" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = lotPublishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: "PENDING_APPROVAL",
      listingMode: parsed.data.listingMode,
      adminRemarks: null, // Clear any previous rejection remarks
    };

    if (parsed.data.startingPriceInr) updateData.startingPriceInr = parsed.data.startingPriceInr;
    if (parsed.data.reservePriceInr) updateData.reservePriceInr = parsed.data.reservePriceInr;
    if (parsed.data.auctionStartsAt) updateData.auctionStartsAt = new Date(parsed.data.auctionStartsAt);
    if (parsed.data.auctionEndsAt) updateData.auctionEndsAt = new Date(parsed.data.auctionEndsAt);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedLot = await tx.lot.update({
        where: { id: lotId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "LOT_SUBMITTED_FOR_APPROVAL",
          entity: "Lot",
          entityId: lotId,
          metadata: {
            lotNumber: lot.lotNumber,
            listingMode: parsed.data.listingMode,
            startingPriceInr: parsed.data.startingPriceInr,
            previousStatus: lot.status,
          },
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        },
      });

      return updatedLot;
    });

    // Notify admins with lots.approve permission about new lot pending review
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });
    if (admins.length > 0) {
      await notifyMany(
        admins.map((admin) => ({
          userId: admin.id,
          event: "LOT_STATUS_CHANGE" as const,
          title: "New Lot Pending Review",
          body: `Lot ${lot.lotNumber} has been submitted for approval. Please review.`,
          data: { lotId, lotNumber: lot.lotNumber },
          link: `/admin/lots`,
          channels: ["in_app" as const, "email" as const],
        }))
      );
    }

    return NextResponse.json({
      lot: {
        id: updated.id,
        lotNumber: updated.lotNumber,
        status: updated.status,
        listingMode: updated.listingMode,
        startingPriceInr: updated.startingPriceInr ? Number(updated.startingPriceInr) : null,
        auctionStartsAt: updated.auctionStartsAt,
        auctionEndsAt: updated.auctionEndsAt,
      },
    });
  } catch (error) {
    console.error("[LOT_PUBLISH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
