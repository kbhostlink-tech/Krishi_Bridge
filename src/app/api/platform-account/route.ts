import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, checkKycApproved } from "@/lib/auth";

// GET /api/platform-account — Returns platform bank account details (BUYER only)
// This is the account buyers pay to. Only visible to KYC-approved buyers.
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = checkRole(authResult, ["BUYER"]);
    if (roleCheck) return roleCheck;

    const kycCheck = checkKycApproved(authResult);
    if (kycCheck) return kycCheck;

    // Get platform account details
    const setting = await prisma.platformSettings.findUnique({
      where: { key: "platform_bank_account" },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Platform account details are not yet configured. Please contact support." },
        { status: 404 }
      );
    }

    // Get buyer's unique payment code
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { uniquePaymentCode: true },
    });

    return NextResponse.json({
      platformAccount: setting.value,
      buyerPaymentCode: user?.uniquePaymentCode || null,
      instructions: "Please transfer the exact amount to the account below. Include your unique payment code in the payment remarks/reference so we can identify your payment.",
    });
  } catch (error) {
    console.error("[PLATFORM_ACCOUNT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
