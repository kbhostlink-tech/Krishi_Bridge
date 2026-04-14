import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";

// DELETE /api/admin/submissions/[submissionId] — permanently delete a commodity submission
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "submissions.delete");
  if (permErr) return permErr;

  const { submissionId } = await params;

  try {
    const submission = await prisma.commoditySubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, commodityType: true, farmerId: true, status: true, quantityKg: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    await prisma.commoditySubmission.delete({ where: { id: submissionId } });

    await prisma.auditLog.create({
      data: {
        userId: authResult.userId,
        action: "SUBMISSION_DELETED",
        entity: "CommoditySubmission",
        entityId: submissionId,
        metadata: {
          commodityType: submission.commodityType,
          farmerId: submission.farmerId,
          status: submission.status,
          quantityKg: Number(submission.quantityKg),
        },
      },
    }).catch(() => {});

    return NextResponse.json({ message: "Submission permanently deleted" });
  } catch (error) {
    console.error("[ADMIN_SUBMISSION_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
