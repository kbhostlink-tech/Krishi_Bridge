import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAccessToken, signRefreshToken, setRefreshCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { CountryCode, CurrencyCode } from "@/generated/prisma/client";

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  IN: "INR",
  NP: "NPR",
  BT: "BTN",
  AE: "AED",
  SA: "SAR",
  OM: "OMR",
};

const registerAndAcceptSchema = z.object({
  token: z.string().min(1, "Token is required"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  country: z.enum(["IN", "NP", "BT", "AE", "SA", "OM"]),
});

// POST /api/warehouse/invitation/register-and-accept
// For new users: create account + accept invitation atomically
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(`register-accept:${ip}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = registerAndAcceptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, name, password, country } = parsed.data;

    // 1. Find and validate invitation
    const invitation = await prisma.warehouseInvitation.findUnique({
      where: { token },
      include: {
        warehouse: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found or invalid" }, { status: 404 });
    }
    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 409 });
    }
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
    }

    // 2. Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in instead." },
        { status: 409 }
      );
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Atomic transaction: create user + warehouse staff + mark invitation accepted
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          name,
          role: "WAREHOUSE_STAFF",
          country: country as CountryCode,
          preferredCurrency: COUNTRY_CURRENCY_MAP[country] || "USD",
          preferredLang: "en",
          emailVerified: true, // Verified via invitation token
        },
      });

      await tx.warehouseStaff.create({
        data: {
          warehouseId: invitation.warehouseId,
          userId: newUser.id,
          staffRole: invitation.staffRole,
          assignedBy: invitation.invitedBy,
        },
      });

      await tx.warehouseInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date(), acceptedBy: newUser.id },
      });

      return newUser;
    });

    // 5. Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REGISTER_AND_ACCEPT_INVITATION",
        entity: "WarehouseInvitation",
        entityId: invitation.id,
        metadata: {
          warehouseId: invitation.warehouseId,
          staffRole: invitation.staffRole,
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    // 6. Generate tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      country: user.country,
      kycStatus: user.kycStatus,
    });

    const refreshToken = await signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          country: user.country,
          kycStatus: user.kycStatus,
          emailVerified: user.emailVerified,
        },
        accessToken,
        warehouse: invitation.warehouse,
        staffRole: invitation.staffRole,
      },
      { status: 201 }
    );

    setRefreshCookie(response, refreshToken);

    return response;
  } catch (error) {
    console.error("[REGISTER_AND_ACCEPT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
