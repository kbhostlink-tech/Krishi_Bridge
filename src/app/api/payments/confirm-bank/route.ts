import { NextRequest, NextResponse } from "next/server";
// ── ESCROW PAYMENT DISABLED ──
// This endpoint was for admin-confirmed bank transfers (Bhutan).
// With manual offline payments, use /api/payments/confirm-manual instead.
// import { prisma } from "@/lib/prisma";
// import { requireAuth, checkRole } from "@/lib/auth";
// import { confirmBankTransferSchema } from "@/lib/validations";
// import { processPaymentWebhook } from "@/lib/payment-webhook-handler";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { message: "Escrow-based bank transfer confirmation is currently disabled. Use /api/payments/confirm-manual for offline payment confirmation." },
    { status: 200 }
  );
}

