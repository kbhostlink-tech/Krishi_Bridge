import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateOtp, hashOtp, signAccessToken, signRefreshToken, setRefreshCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { sendEmail, generateOtpEmailHtml } from "@/lib/email";
import { CountryCode, CurrencyCode } from "@/generated/prisma/client";
import crypto from "crypto";

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  IN: "INR",
  NP: "NPR",
  BT: "BTN",
  AE: "AED",
  SA: "SAR",
  OM: "OMR",
};

/** Generate a unique payment code: first 2 letters of name (uppercase) + 4 random digits */
async function generateUniquePaymentCode(name: string): Promise<string> {
  const prefix = name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase().padEnd(2, "X");
  for (let i = 0; i < 10; i++) {
    const digits = crypto.randomInt(1000, 9999).toString();
    const code = `${prefix}${digits}`;
    const existing = await prisma.user.findUnique({ where: { uniquePaymentCode: code } });
    if (!existing) return code;
  }
  // Fallback: use longer random suffix
  const fallback = `${prefix}${crypto.randomInt(10000, 99999)}`;
  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errorCode: "validation_failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, name, phone, role, country, preferredLang } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email or phone already exists",
          errorCode: "account_exists",
        },
        { status: 409 }
      );
    }

    // Hash password with bcrypt cost 12
    const passwordHash = await hashPassword(password);

    // Generate unique payment code for buyer identification
    const uniquePaymentCode = await generateUniquePaymentCode(name);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone || null,
        role,
        country: country as CountryCode,
        preferredCurrency: COUNTRY_CURRENCY_MAP[country] || "INR",
        preferredLang: preferredLang || "en",
        uniquePaymentCode,
      },
    });

    // Generate OTP for email verification
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        codeHash: otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send OTP email
    await sendEmail({
      to: email,
      subject: "Verify Your Email — Krishibridge",
      html: generateOtpEmailHtml(name, otp),
    });

    // Generate tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      country: user.country,
      kycStatus: user.kycStatus,
      adminRole: user.adminRole,
    });

    const refreshToken = await signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          country: user.country,
          kycStatus: user.kycStatus,
          emailVerified: user.emailVerified,
          onboardingComplete: user.onboardingComplete,
        },
        accessToken,
        message: "Account created. Please verify your email.",
      },
      { status: 201 }
    );

    setRefreshCookie(response, refreshToken);

    return response;
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { error: "Internal server error", errorCode: "internal_error" },
      { status: 500 }
    );
  }
}
