import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── PATCH: Revoke an invitation (Super Admin only) ─────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  const superCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (superCheck) return superCheck;

  const { inviteId } = await params;

  const invitation = await prisma.adminInvitation.findUnique({
    where: { id: inviteId },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      { error: `Cannot revoke invitation with status: ${invitation.status}` },
      { status: 400 }
    );
  }

  await prisma.adminInvitation.update({
    where: { id: inviteId },
    data: { status: "REVOKED", revokedAt: new Date() },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "ADMIN_INVITE_REVOKED",
      entity: "AdminInvitation",
      entityId: inviteId,
      metadata: { email: invitation.email, adminRole: invitation.adminRole },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    },
  });

  return NextResponse.json({ success: true });
}

// ─── DELETE: Resend invitation (Super Admin only) ─────
// We reuse DELETE to trigger a resend (revokes old, creates new)

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  const superCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (superCheck) return superCheck;

  const { inviteId } = await params;

  const invitation = await prisma.adminInvitation.findUnique({
    where: { id: inviteId },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  // Can only delete non-accepted invitations
  if (invitation.status === "ACCEPTED") {
    return NextResponse.json(
      { error: "Cannot delete an accepted invitation" },
      { status: 400 }
    );
  }

  await prisma.adminInvitation.delete({
    where: { id: inviteId },
  });

  return NextResponse.json({ success: true });
}
