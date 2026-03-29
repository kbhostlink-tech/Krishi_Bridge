import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail, generatePasswordResetEmailHtml } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Rate limit: 3 requests per email per 15 minutes
    const rateLimitKey = `forgot-password:${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${retryAfterSec} seconds.` },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: "If an account exists with that email, a password reset link has been sent.",
    });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return successResponse;
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Hash the token for storage (so DB leak doesn't expose tokens)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Build reset URL — use the raw token (not hashed) in the URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const resetUrl = `${baseUrl}/en/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password — AgriExchange",
      html: generatePasswordResetEmailHtml(user.name, resetUrl),
    });

    return successResponse;
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
