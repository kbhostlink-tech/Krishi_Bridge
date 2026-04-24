import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp, generateOtp, hashOtp } from "@/lib/auth";
import { verifyOtpSchema } from "@/lib/validations";
import { sendEmail, generateOtpEmailHtml } from "@/lib/email";
import { notifyUser } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

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

    const { userId, otp } = parsed.data;

    // Find the latest unused, unexpired OTP for this user
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          error: "OTP expired or not found. Please request a new one.",
          errorCode: "otp_not_found_or_expired",
        },
        { status: 400 }
      );
    }

    // Check max attempts (3)
    if (otpRecord.attempts >= 3) {
      return NextResponse.json(
        {
          error: "Maximum verification attempts exceeded. Please request a new code.",
          errorCode: "otp_attempts_exceeded",
        },
        { status: 400 }
      );
    }

    // Increment attempts
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    // Verify OTP
    const valid = await verifyOtp(otp, otpRecord.codeHash);
    if (!valid) {
      return NextResponse.json(
        {
          error: "Invalid verification code",
          errorCode: "otp_invalid",
          attemptsRemaining: 2 - otpRecord.attempts,
        },
        { status: 400 }
      );
    }

    // Mark OTP as used and verify email
    const [, verifiedUser] = await prisma.$transaction([
      prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      }),
    ]);

    // Fire-and-forget: send welcome notification only after email is verified
    notifyUser({
      userId: verifiedUser.id,
      event: "WELCOME",
      title: "Email Verified — Welcome to Krishibridge!",
      body: `Hi ${verifiedUser.name}, your email has been verified and your account is now active. Complete your profile setup and KYC to start trading.`,
      data: { userName: verifiedUser.name },
      channels: ["email", "in_app"],
    });

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("[VERIFY_OTP]", error);
    return NextResponse.json(
      { error: "Internal server error", errorCode: "internal_error" },
      { status: 500 }
    );
  }
}

// Resend OTP
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required", errorCode: "user_id_required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", errorCode: "user_not_found" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified", errorCode: "email_already_verified" },
        { status: 400 }
      );
    }

    // Rate limit: max 3 OTP requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await prisma.otpCode.count({
      where: {
        userId,
        createdAt: { gt: oneHourAgo },
      },
    });

    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later.", errorCode: "otp_rate_limited" },
        { status: 429 }
      );
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await prisma.otpCode.create({
      data: {
        userId,
        codeHash: otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send OTP email
    await sendEmail({
      to: user.email,
      subject: "Verify Your Email — Krishibridge",
      html: generateOtpEmailHtml(user.name, otp),
    });

    return NextResponse.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("[RESEND_OTP]", error);
    return NextResponse.json(
      { error: "Internal server error", errorCode: "internal_error" },
      { status: 500 }
    );
  }
}

