import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkAdminRole, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateAdminInviteEmailHtml } from "@/lib/email";
import { createHash, randomBytes } from "crypto";
import type { AdminRole } from "@/generated/prisma/client";

const VALID_ADMIN_ROLES: AdminRole[] = [
  "COMPLIANCE_ADMIN",
  "OPS_ADMIN",
  "DATA_AUDIT_ADMIN",
  "READ_ONLY_ADMIN",
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPLIANCE_ADMIN: "Compliance Admin",
  OPS_ADMIN: "Operations Admin",
  DATA_AUDIT_ADMIN: "Data & Audit Admin",
  READ_ONLY_ADMIN: "Read-Only Admin",
};

const INVITE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── POST: Send admin invitation (Super Admin only) ─────

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  // Only SUPER_ADMIN can invite other admins
  const superCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (superCheck) return superCheck;

  let body: { email?: string; name?: string; adminRole?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, name, adminRole } = body;

  // Validate required fields
  if (!email || !name || !adminRole) {
    return NextResponse.json(
      { error: "Email, name, and adminRole are required" },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Sanitize name
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return NextResponse.json(
      { error: "Name must be between 2 and 100 characters" },
      { status: 400 }
    );
  }

  // Validate admin role
  if (!VALID_ADMIN_ROLES.includes(adminRole as AdminRole)) {
    return NextResponse.json(
      { error: "Invalid admin role. Cannot invite another Super Admin." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if email is already registered as admin
  const existingAdmin = await prisma.user.findFirst({
    where: { email: normalizedEmail, role: "ADMIN" },
  });
  if (existingAdmin) {
    return NextResponse.json(
      { error: "This email is already registered as an admin" },
      { status: 409 }
    );
  }

  // Check if there's already a pending invitation for this email
  const existingInvite = await prisma.adminInvitation.findFirst({
    where: {
      email: normalizedEmail,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    return NextResponse.json(
      { error: "A pending invitation already exists for this email. Revoke it first or wait for it to expire." },
      { status: 409 }
    );
  }

  // Generate secure invite token (48 bytes → 64-char hex)
  const rawToken = randomBytes(48).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

  // Get inviter's name for the email
  const inviter = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { name: true },
  });

  // Create invitation record
  const invitation = await prisma.adminInvitation.create({
    data: {
      email: normalizedEmail,
      name: trimmedName,
      adminRole: adminRole as AdminRole,
      tokenHash,
      expiresAt,
      invitedBy: authResult.userId,
    },
  });

  // Build setup URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const setupUrl = `${appUrl}/en/admin-setup?token=${rawToken}`;

  // Send invitation email
  const emailSent = await sendEmail({
    to: normalizedEmail,
    subject: "You're invited to join Krishibridge Admin Panel",
    html: generateAdminInviteEmailHtml(
      trimmedName,
      ROLE_LABELS[adminRole] || adminRole,
      inviter?.name || "Super Admin",
      setupUrl
    ),
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "ADMIN_INVITE_SENT",
      entity: "AdminInvitation",
      entityId: invitation.id,
      metadata: {
        email: normalizedEmail,
        adminRole,
        emailSent,
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    },
  });

  return NextResponse.json({
    success: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      adminRole: invitation.adminRole,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      emailSent,
    },
  });
}

// ─── GET: List all admin invitations (Super Admin only) ─────

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  const superCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (superCheck) return superCheck;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // PENDING, ACCEPTED, EXPIRED, REVOKED
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const where: Record<string, unknown> = {};
  if (status && ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"].includes(status)) {
    where.status = status;
  }

  const [invitations, total] = await Promise.all([
    prisma.adminInvitation.findMany({
      where,
      include: {
        invitedByUser: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminInvitation.count({ where }),
  ]);

  // Auto-expire pending invitations that have passed expiry
  const now = new Date();
  const expiredIds = invitations
    .filter((i) => i.status === "PENDING" && i.expiresAt < now)
    .map((i) => i.id);

  if (expiredIds.length > 0) {
    await prisma.adminInvitation.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: "EXPIRED" },
    });
  }

  return NextResponse.json({
    invitations: invitations.map((inv) => ({
      ...inv,
      tokenHash: undefined, // Never expose token hash
      status: inv.status === "PENDING" && inv.expiresAt < now ? "EXPIRED" : inv.status,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
