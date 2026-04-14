import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAccessToken, signRefreshToken, setRefreshCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Rate limiting: 5 attempts per email per 15 min
    const rateLimit = checkRateLimit(`login:${email}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfterMs: rateLimit.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate access token (15min)
    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      country: user.country,
      kycStatus: user.kycStatus,
      adminRole: user.adminRole,
    });

    // Generate refresh token (7 days) with tokenVersion for rotation
    const refreshToken = await signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country,
        kycStatus: user.kycStatus,
        emailVerified: user.emailVerified,
        onboardingComplete: user.onboardingComplete,
        preferredLang: user.preferredLang,
      },
      accessToken,
    });

    setRefreshCookie(response, refreshToken);

    return response;
  } catch (error) {
    console.error("[LOGIN]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
