import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";
import { z } from "zod";
import { notifyUser } from "@/lib/notifications";

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
  const permErr = requireAdminPermission(authResult, "kyc.approve");
  if (permErr) return permErr;

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

    // Fire-and-forget: notify user about KYC decision (email + push + in-app)
    if (action === "APPROVED") {
      notifyUser({
        userId,
        event: "KYC_APPROVED",
        title: "KYC Approved — You're ready to trade!",
        body: "Your identity has been verified. You can now buy, sell, and trade on the platform.",
        channels: ["email", "push", "in_app"],
      });
    } else {
      notifyUser({
        userId,
        event: "KYC_REJECTED",
        title: "KYC Verification Update",
        body: `We couldn't verify your documents${remarks ? `. Reason: ${remarks}` : ""}. Please re-submit with correct documents.`,
        data: { reason: remarks || "Documents could not be verified" },
        channels: ["email", "push", "in_app"],
      });
    }

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
