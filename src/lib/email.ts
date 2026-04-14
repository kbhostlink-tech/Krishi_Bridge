/**
 * Email service — supports Amazon SES or Resend.
 * For MVP, logs to console if no email service is configured.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@hcex.com";

  if (!RESEND_API_KEY) {
    // Dev mode: log to console
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${html.substring(0, 200)}...`);
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[EMAIL] Failed to send:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[EMAIL] Error:", error);
    return false;
  }
}

export function generateOtpEmailHtml(name: string, otp: string): string {
  return `
    <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf7f2; border-radius: 24px;">
      <h1 style="font-family: 'Fraunces', serif; color: #1a3a2a; font-size: 24px; margin-bottom: 16px;">
        Verify Your Email
      </h1>
      <p style="color: #4a7c5c; font-size: 16px; line-height: 1.6;">
        Hello ${name},
      </p>
      <p style="color: #4a7c5c; font-size: 16px; line-height: 1.6;">
        Use the following code to verify your email address:
      </p>
      <div style="background: #2d5a3f; color: white; font-size: 32px; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 12px; margin: 24px 0; font-weight: bold;">
        ${otp}
      </div>
      <p style="color: #8fb49e; font-size: 14px;">
        This code expires in 10 minutes. Do not share it with anyone.
      </p>
      <hr style="border: none; border-top: 1px solid #d4e8dc; margin: 24px 0;" />
      <p style="color: #8fb49e; font-size: 12px; text-align: center;">
        HCE-X — Himalayan Commodity Exchange Platform
      </p>
    </div>
  `;
}

export function generatePasswordResetEmailHtml(name: string, resetUrl: string): string {
  return `
    <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf7f2; border-radius: 24px;">
      <h1 style="font-family: 'Fraunces', serif; color: #1a3a2a; font-size: 24px; margin-bottom: 16px;">
        Reset Your Password
      </h1>
      <p style="color: #4a7c5c; font-size: 16px; line-height: 1.6;">
        Hello ${name},
      </p>
      <p style="color: #4a7c5c; font-size: 16px; line-height: 1.6;">
        We received a request to reset your password. Click the button below to set a new password:
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #2d5a3f; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 100px;">
          Reset Password
        </a>
      </div>
      <p style="color: #8fb49e; font-size: 14px;">
        This link expires in 1 hour. If you didn&apos;t request a password reset, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #d4e8dc; margin: 24px 0;" />
      <p style="color: #8fb49e; font-size: 12px; text-align: center;">
        HCE-X — Himalayan Commodity Exchange Platform
      </p>
    </div>
  `;
}
