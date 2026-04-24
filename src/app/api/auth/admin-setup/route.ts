import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── GET: Validate invitation token (public) ─────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  // Validate token format (must be 96-char hex = 48 random bytes)
  if (!/^[a-f0-9]{96}$/i.test(token)) {
    return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
  }

  const tokenHash = hashToken(token);

  const invitation = await prisma.adminInvitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      name: true,
      adminRole: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      { error: `This invitation has been ${invitation.status.toLowerCase()}` },
      { status: 410 }
    );
  }

  if (invitation.expiresAt < new Date()) {
    // Mark as expired
    await prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
  }

  return NextResponse.json({
    valid: true,
    invitation: {
      email: invitation.email,
      name: invitation.name,
      adminRole: invitation.adminRole,
    },
  });
}

// ─── POST: Accept invitation and set password (public) ─────

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token and password are required" },
      { status: 400 }
    );
  }

  // Validate token format
  if (!/^[a-f0-9]{96}$/i.test(token)) {
    return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
  }

  // Password strength validation
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  if (password.length > 128) {
    return NextResponse.json(
      { error: "Password too long" },
      { status: 400 }
    );
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one uppercase letter" },
      { status: 400 }
    );
  }
  if (!/[a-z]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one lowercase letter" },
      { status: 400 }
    );
  }
  if (!/[0-9]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one number" },
      { status: 400 }
    );
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one special character" },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(token);

  const invitation = await prisma.adminInvitation.findUnique({
    where: { tokenHash },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      { error: `This invitation has been ${invitation.status.toLowerCase()}` },
      { status: 410 }
    );
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
  }

  // Check if email is already taken
  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  // Create admin user + mark invitation as accepted in a transaction
  const newAdmin = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: invitation.email,
        name: invitation.name,
        passwordHash,
        role: "ADMIN",
        adminRole: invitation.adminRole,
        country: "IN", // Default country for admin
        preferredCurrency: "INR",
        kycStatus: "APPROVED", // Admins don't need KYC
        emailVerified: true,
        onboardingComplete: true,
        isActive: true,
      },
    });

    await tx.adminInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedBy: user.id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "ADMIN_INVITE_ACCEPTED",
        entity: "AdminInvitation",
        entityId: invitation.id,
        metadata: {
          email: invitation.email,
          adminRole: invitation.adminRole,
          invitedBy: invitation.invitedBy,
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      },
    });

    return user;
  });

  return NextResponse.json({
    success: true,
    message: "Account created successfully. You can now log in.",
    admin: {
      id: newAdmin.id,
      email: newAdmin.email,
      name: newAdmin.name,
      adminRole: newAdmin.adminRole,
    },
  });
}

