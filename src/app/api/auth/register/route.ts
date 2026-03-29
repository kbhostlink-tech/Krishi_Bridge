import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateOtp, hashOtp, signAccessToken, signRefreshToken, setRefreshCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { sendEmail, generateOtpEmailHtml } from "@/lib/email";
import { CountryCode, CurrencyCode } from "@/generated/prisma/client";

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  IN: "INR",
  NP: "NPR",
  BT: "BTN",
  AE: "AED",
  SA: "SAR",
  OM: "OMR",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, phone, role, country } = parsed.data;

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
        { error: "An account with this email or phone already exists" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt cost 12
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone || null,
        role,
        country: country as CountryCode,
        preferredCurrency: COUNTRY_CURRENCY_MAP[country] || "USD",
        preferredLang: "en",
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
      subject: "Verify Your Email — AgriExchange",
      html: generateOtpEmailHtml(name, otp),
    });

    // Generate tokens
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
        message: "Account created. Please verify your email.",
      },
      { status: 201 }
    );

    setRefreshCookie(response, refreshToken);

    return response;
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
