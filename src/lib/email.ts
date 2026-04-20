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

export function generateAdminInviteEmailHtml(
  name: string,
  roleName: string,
  inviterName: string,
  setupUrl: string
): string {
  return `
    <div style="font-family: 'DM Sans', sans-serif; max-width: 520px; margin: 0 auto; padding: 0; background: #faf7f2; border-radius: 24px; overflow: hidden;">
      <div style="background: #1a3a2a; padding: 32px 32px 24px; text-align: center;">
        <h1 style="font-family: 'Fraunces', serif; color: #ffffff; font-size: 22px; margin: 0 0 8px;">
          You're Invited to HCE-X Admin
        </h1>
        <p style="color: #8fb49e; font-size: 14px; margin: 0;">
          Himalayan Commodity Exchange Platform
        </p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #1a3a2a; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
          Hello ${name},
        </p>
        <p style="color: #4a7c5c; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
          <strong>${inviterName}</strong> has invited you to join the admin team as a
          <span style="display: inline-block; background: #e8f5ec; color: #2d5a3f; padding: 2px 10px; border-radius: 100px; font-weight: 600; font-size: 13px;">
            ${roleName}
          </span>.
        </p>
        <p style="color: #4a7c5c; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Click the button below to set up your password and activate your account:
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="${setupUrl}" style="display: inline-block; background: #2d5a3f; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 100px;">
            Set Up Your Account
          </a>
        </div>
        <div style="background: #fff8f0; border: 1px solid #f0dcc8; border-radius: 12px; padding: 16px; margin: 0 0 20px;">
          <p style="color: #c4724e; font-size: 13px; font-weight: 600; margin: 0 0 4px;">
            ⏳ This link expires in 30 minutes
          </p>
          <p style="color: #a0845c; font-size: 12px; margin: 0;">
            For security, this invitation link is valid for 30 minutes only. If it expires, please ask the Super Admin to send a new invitation.
          </p>
        </div>
        <p style="color: #8fb49e; font-size: 13px; line-height: 1.5;">
          If you did not expect this invitation, you can safely ignore this email.
        </p>
      </div>
      <hr style="border: none; border-top: 1px solid #d4e8dc; margin: 0;" />
      <div style="padding: 16px 32px; text-align: center;">
        <p style="color: #8fb49e; font-size: 12px; margin: 0;">
          HCE-X — Himalayan Commodity Exchange Platform
        </p>
      </div>
    </div>
  `;
}
