import { NextRequest, NextResponse } from "next/server";
// ── ESCROW PAYMENT WEBHOOKS DISABLED ──
// Uncomment when platform payments are re-enabled:
// import { razorpayGateway } from "@/lib/payment-gateways";
// import { processPaymentWebhook } from "@/lib/payment-webhook-handler";

// POST /api/payments/webhook/razorpay — Razorpay webhook handler (DISABLED — manual payments active)
export async function POST(_req: NextRequest) {
  // Escrow payments are currently disabled. Return 200 to prevent retries.
  return NextResponse.json(
    { message: "Escrow payments are currently disabled. Payments are handled offline." },
    { status: 200 }
  );

  /* ── ESCROW FLOW (uncomment when platform payments are re-enabled) ──
  try {
    const body = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const result = razorpayGateway.verifyWebhook(headers, body);

    if (!result.verified) {
      console.error("[RAZORPAY_WEBHOOK] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const processed = await processPaymentWebhook(result);
    return NextResponse.json(processed, { status: processed.processed ? 200 : 400 });
  } catch (error) {
    console.error("[RAZORPAY_WEBHOOK]", error);
    return NextResponse.json({ error: "Processing error" }, { status: 200 });
  }
  ── END ESCROW FLOW ── */
}

