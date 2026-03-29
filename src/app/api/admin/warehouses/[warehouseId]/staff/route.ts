import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// GET /api/admin/warehouses/[warehouseId]/staff
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { warehouseId } = await params;

  const [staff, invitations] = await Promise.all([
    prisma.warehouseStaff.findMany({
      where: { warehouseId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, country: true },
        },
      },
      orderBy: { assignedAt: "asc" },
    }),
    prisma.warehouseInvitation.findMany({
      where: { warehouseId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ staff, invitations });
}

// POST /api/admin/warehouses/[warehouseId]/staff — invite by email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { warehouseId } = await params;
  const body = await request.json();
  const { email, staffRole = "STAFF" } = body;

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!["STAFF", "MANAGER"].includes(staffRole)) {
    return NextResponse.json({ error: "staffRole must be STAFF or MANAGER" }, { status: 400 });
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
    select: { id: true, name: true, isActive: true },
  });
  if (!warehouse) {
    return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if an existing user with this email is already staff
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true },
  });

  if (existingUser) {
    const alreadyStaff = await prisma.warehouseStaff.findUnique({
      where: {
        warehouseId_userId: { warehouseId, userId: existingUser.id },
      },
    });
    if (alreadyStaff) {
      return NextResponse.json(
        { error: "This user is already a staff member of this warehouse" },
        { status: 409 }
      );
    }
  }

  // Check for still-active pending invitation
  const existingInvite = await prisma.warehouseInvitation.findFirst({
    where: {
      email: normalizedEmail,
      warehouseId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    return NextResponse.json(
      { error: "An active invitation already exists for this email address" },
      { status: 409 }
    );
  }

  // Generate secure token and create invitation
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.warehouseInvitation.create({
    data: {
      email: normalizedEmail,
      warehouseId,
      staffRole,
      token,
      expiresAt,
      invitedBy: authResult.userId,
    },
  });

  const admin = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { name: true },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${baseUrl}/en/accept-invitation?token=${token}`;

  await sendEmail({
    to: normalizedEmail,
    subject: `You're invited to join ${warehouse.name} on AgriExchange`,
    html: buildInvitationEmail({
      warehouseName: warehouse.name,
      staffRole,
      inviterName: admin?.name || "AgriExchange Admin",
      acceptUrl,
      expiresAt,
    }),
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.userId,
      action: "INVITE_WAREHOUSE_STAFF",
      entity: "WarehouseInvitation",
      entityId: invitation.id,
      metadata: { email: normalizedEmail, warehouseId, staffRole },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ invitation }, { status: 201 });
}

function buildInvitationEmail({
  warehouseName,
  staffRole,
  inviterName,
  acceptUrl,
  expiresAt,
}: {
  warehouseName: string;
  staffRole: string;
  inviterName: string;
  acceptUrl: string;
  expiresAt: Date;
}) {
  const roleLabel = staffRole === "MANAGER" ? "Warehouse Manager" : "Warehouse Staff";
  const expiry = expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(26,58,42,0.08)">
    <div style="background:#1a3a2a;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0;font-weight:700">🌿 AgriExchange</h1>
      <p style="color:#8fb49e;margin:8px 0 0;font-size:13px">Agricultural Commodity Exchange Platform</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1a3a2a;font-size:20px;margin:0 0 12px">You've been invited to join<br><strong>${warehouseName}</strong></h2>
      <p style="color:#4a7c5c;font-size:15px;line-height:1.6;margin:0 0 24px">
        <strong>${inviterName}</strong> has invited you to become a <strong>${roleLabel}</strong> at <strong>${warehouseName}</strong> on AgriExchange.
      </p>
      <div style="background:#f2faf6;border-radius:16px;padding:20px;margin:0 0 28px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="color:#4a7c5c;font-size:13px;padding:6px 0">Warehouse</td>
            <td style="color:#1a3a2a;font-size:13px;font-weight:600;text-align:right">${warehouseName}</td>
          </tr>
          <tr>
            <td style="color:#4a7c5c;font-size:13px;padding:6px 0">Your Role</td>
            <td style="color:#1a3a2a;font-size:13px;font-weight:600;text-align:right">${roleLabel}</td>
          </tr>
          <tr>
            <td style="color:#4a7c5c;font-size:13px;padding:6px 0">Invited by</td>
            <td style="color:#1a3a2a;font-size:13px;font-weight:600;text-align:right">${inviterName}</td>
          </tr>
          <tr>
            <td style="color:#4a7c5c;font-size:13px;padding:6px 0">Expires</td>
            <td style="color:#1a3a2a;font-size:13px;font-weight:600;text-align:right">${expiry}</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;margin:0 0 28px">
        <a href="${acceptUrl}" style="display:inline-block;background:#2d5a3f;color:#fff;text-decoration:none;padding:14px 40px;border-radius:100px;font-size:15px;font-weight:600;">
          Accept Invitation →
        </a>
      </div>
      <div style="background:#fff8e1;border-radius:12px;padding:16px;margin:0 0 20px;border:1px solid #ffe082">
        <p style="color:#5d4037;font-size:13px;margin:0 0 6px;font-weight:600">📝 How to accept:</p>
        <p style="color:#6d4c41;font-size:12px;margin:0;line-height:1.6">
          <strong>New to AgriExchange?</strong> Click the button above — you'll set your name and password on the next page.<br>
          <strong>Already have an account?</strong> Click the button and log in with your existing credentials.
        </p>
      </div>
      <p style="color:#8fb49e;font-size:13px;text-align:center;margin:0">
        This link expires on ${expiry}. If you didn't expect this invitation, you can safely ignore it.
      </p>
    </div>
    <div style="background:#f5f0e8;padding:20px 40px;text-align:center">
      <p style="color:#8fb49e;font-size:12px;margin:0">© 2026 AgriExchange · Agricultural Commodity Exchange</p>
    </div>
  </div>
</body>
</html>`;
}
