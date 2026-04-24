import { NextRequest, NextResponse } from "next/server";
// ── ESCROW PAYMENT WEBHOOKS DISABLED ──
// import { prisma } from "@/lib/prisma";
// import { processPaymentWebhook } from "@/lib/payment-webhook-handler";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { message: "Escrow payments are currently disabled. Payments are handled offline." },
    { status: 200 }
  );
}

