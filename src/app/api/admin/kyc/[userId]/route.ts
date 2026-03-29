import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole } from "@/lib/auth";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  remarks: z.string().max(500).optional(),
});

// PUT /api/admin/kyc/[userId] — approve or reject KYC
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  try {
    const { userId } = await params;
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { action, remarks } = parsed.data;

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, kycStatus: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update KYC status and mark docs as reviewed
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { kycStatus: action },
      }),
      prisma.kycDocument.updateMany({
        where: { userId, verifiedAt: null },
        data: {
          verifiedAt: new Date(),
          verifiedBy: authResult.userId,
          remarks: remarks || null,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: `KYC_${action}`,
          entity: "User",
          entityId: userId,
          userId: authResult.userId,
          metadata: { previousStatus: targetUser.kycStatus, newStatus: action, remarks },
        },
      }),
    ]);

    return NextResponse.json({
      message: `KYC ${action.toLowerCase()} successfully`,
      userId,
      kycStatus: action,
    });
  } catch (error) {
    console.error("[ADMIN_KYC_REVIEW]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
