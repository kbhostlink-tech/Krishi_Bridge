import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, checkKycApproved } from "@/lib/auth";
import { createPaymentSchema } from "@/lib/validations";
import { calculateTaxBreakdown, getDefaultCurrency } from "@/lib/tax-engine";
// ── ESCROW GATEWAY IMPORTS (commented out — re-enable when platform payments are active) ──
// import { getPaymentGateway, getAvailableMethods } from "@/lib/payment-gateways";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/notifications";
import crypto from "crypto";
import type { CountryCode } from "@/generated/prisma/client";

// POST /api/payments/create — Create a payment record for auction win or RFQ acceptance
// MANUAL PAYMENT MODE: No escrow / gateway processing. Buyer and seller settle offline
// (UPI, bank transfer, etc.). Seller confirms payment received via /api/payments/confirm-manual.
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = checkRole(authResult, ["BUYER"]);
    if (roleCheck) return roleCheck;

    const kycCheck = checkKycApproved(authResult);
    if (kycCheck) return kycCheck;

    // Rate limit: payment attempts per window
    const rateLimitKey = `payment_create:${authResult.userId}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { lotId, rfqId, responseId } = parsed.data;

    // ── Determine the deal parameters ──
    let sellerId: string;
    let grossAmountInr: number;
    let description: string;
    let existingLotId: string | null = null;
    let existingRfqId: string | null = null;
    let lotNumber: string | undefined;

    if (lotId) {
      // AUCTION WIN payment
      const lot = await prisma.lot.findUnique({
        where: { id: lotId },
        select: {
          id: true, lotNumber: true, commodityType: true, status: true, sellerId: true,
          bids: {
            where: { status: "WON" },
            select: { id: true, bidderId: true, amountInr: true },
            take: 1,
          },
        },
      });

      if (!lot) {
        return NextResponse.json({ error: "Lot not found" }, { status: 404 });
      }

      if (lot.status !== "SOLD") {
        return NextResponse.json({ error: "Lot is not in SOLD status" }, { status: 400 });
      }

      const winningBid = lot.bids[0];
      if (!winningBid || winningBid.bidderId !== authResult.userId) {
        return NextResponse.json({ error: "You are not the winner of this auction" }, { status: 403 });
      }

      sellerId = lot.sellerId;
      grossAmountInr = Number(winningBid.amountInr);
      description = `Auction payment for lot ${lot.lotNumber} (${lot.commodityType.replace(/_/g, " ")})`;
      existingLotId = lot.id;
      lotNumber = lot.lotNumber;
    } else if (rfqId && responseId) {
      // RFQ ACCEPTANCE payment
      const rfq = await prisma.rfqRequest.findUnique({
        where: { id: rfqId },
        select: { id: true, buyerId: true, status: true, commodityType: true },
      });

      if (!rfq) {
        return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
      }

      if (rfq.buyerId !== authResult.userId) {
        return NextResponse.json({ error: "You are not the buyer of this RFQ" }, { status: 403 });
      }

      if (rfq.status !== "ACCEPTED") {
        return NextResponse.json({ error: "RFQ is not in ACCEPTED status" }, { status: 400 });
      }

      const response = await prisma.rfqResponse.findUnique({
        where: { id: responseId },
        select: {
          id: true, rfqId: true, sellerId: true, offeredPriceInr: true, status: true,
          negotiations: { orderBy: { createdAt: "desc" }, take: 1, select: { proposedPriceInr: true } },
        },
      });

      if (!response || response.rfqId !== rfqId || response.status !== "ACCEPTED") {
        return NextResponse.json({ error: "Accepted response not found" }, { status: 404 });
      }

      sellerId = response.sellerId;
      grossAmountInr = response.negotiations[0]?.proposedPriceInr
        ? Number(response.negotiations[0].proposedPriceInr)
        : Number(response.offeredPriceInr);
      description = `RFQ payment for ${rfq.commodityType.replace(/_/g, " ")}`;
      existingRfqId = rfq.id;
    } else {
      return NextResponse.json({ error: "Invalid payment parameters" }, { status: 400 });
    }

    // ── Check for duplicate / existing pending payment ──
    const existingPayment = await prisma.transaction.findFirst({
      where: {
        buyerId: authResult.userId,
        ...(existingLotId ? { lotId: existingLotId } : {}),
        ...(existingRfqId ? { rfqId: existingRfqId } : {}),
        status: { in: ["PENDING", "MANUAL_CONFIRMED", "COMPLETED"] },
      },
      select: { id: true, status: true },
      orderBy: { createdAt: "desc" },
    });

    if (existingPayment?.status === "COMPLETED" || existingPayment?.status === "MANUAL_CONFIRMED" || existingPayment?.status === "FUNDS_RELEASED") {
      return NextResponse.json({ error: "Payment already completed" }, { status: 409 });
    }

    // ── Tax calculation (for record keeping — no commission charged in manual mode) ──
    const buyerCountry = authResult.country as CountryCode;
    const taxBreakdown = calculateTaxBreakdown(grossAmountInr, buyerCountry);
    const currency = getDefaultCurrency(buyerCountry);

    // ── Generate idempotency key ──
    const idempotencyKey = existingPayment
      ? existingPayment.id
      : crypto.randomUUID();

    // ── MANUAL PAYMENT MODE: Create transaction record with MANUAL_OFFLINE method ──
    // No gateway processing — buyer pays seller directly (UPI / bank transfer / etc.)
    // Commission fields set to 0 for manual mode (no platform fee)
    const transaction = existingPayment
      ? await prisma.transaction.findUnique({ where: { id: existingPayment.id } })
      : await prisma.transaction.create({
          data: {
            lotId: existingLotId,
            rfqId: existingRfqId,
            buyerId: authResult.userId,
            sellerId,
            paymentMethod: "MANUAL_OFFLINE",
            currency,
            grossAmount: grossAmountInr,
            commissionAmount: 0, // No platform commission in manual mode
            taxOnGoods: taxBreakdown.taxOnGoods,
            taxOnCommission: 0,
            netToSeller: grossAmountInr, // Full amount goes to seller
            idempotencyKey,
          },
        });

    if (!transaction) {
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
    }

    // ── Audit log ──
    await prisma.auditLog.create({
      data: {
        userId: authResult.userId,
        action: "PAYMENT_INITIATED_MANUAL",
        entity: "Transaction",
        entityId: transaction.id,
        metadata: {
          grossAmount: grossAmountInr,
          currency,
          paymentMethod: "MANUAL_OFFLINE",
          description,
        },
      },
    });

    // ── Fetch platform account details + buyer's unique code ──
    const [platformSetting, buyerUser] = await Promise.all([
      prisma.platformSettings.findUnique({ where: { key: "platform_bank_account" } }),
      prisma.user.findUnique({
        where: { id: authResult.userId },
        select: { uniquePaymentCode: true, name: true },
      }),
    ]);

    const platformAccount = platformSetting?.value as Record<string, string> | null;
    const buyerPaymentCode = buyerUser?.uniquePaymentCode || "N/A";

    // ── Notify admins — new payment pending confirmation ──
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });
    for (const admin of admins) {
      notifyUser({
        userId: admin.id,
        event: "PAYMENT_CONFIRMED" as const,
        title: "New payment pending confirmation",
        body: `Buyer ${buyerUser?.name || "Unknown"} (Code: ${buyerPaymentCode}) initiated payment of ${grossAmountInr.toFixed(2)} ${currency}${lotNumber ? ` for lot ${lotNumber}` : ""}. Check your admin panel to confirm.`,
        data: { transactionId: transaction.id, lotNumber, buyerPaymentCode },
        channels: ["email", "push", "in_app"],
      });
    }

    // ── Notify buyer — payment instructions with platform account + their unique code ──
    const accountInfo = platformAccount
      ? `Bank: ${platformAccount.bankName || "N/A"}, A/C: ${platformAccount.accountNumber || "N/A"}, Name: ${platformAccount.accountHolderName || "N/A"}${platformAccount.ifscCode ? `, IFSC: ${platformAccount.ifscCode}` : ""}${platformAccount.upiId ? `, UPI: ${platformAccount.upiId}` : ""}`
      : "Platform account details not yet configured. Please contact support.";

    notifyUser({
      userId: authResult.userId,
      event: "PAYMENT_CONFIRMED" as const,
      title: `Payment initiated — Pay ${grossAmountInr.toFixed(2)} ${currency}`,
      body: `You won ${lotNumber ? `Lot ${lotNumber}` : "the deal"}! Pay ${grossAmountInr.toFixed(2)} ${currency} to our platform account:\n\n${accountInfo}\n\nIMPORTANT: Write your unique code "${buyerPaymentCode}" in the payment remarks so we can identify your payment. Your unique code: ${buyerPaymentCode}`,
      data: { transactionId: transaction.id, lotNumber, buyerPaymentCode, platformAccount },
      channels: ["email", "push", "in_app"],
    });

    return NextResponse.json({
      transactionId: transaction.id,
      paymentMethod: "MANUAL_OFFLINE",
      grossAmount: grossAmountInr,
      currency,
      description,
      buyerPaymentCode,
      platformAccount: platformAccount || null,
      message: `Payment record created. Pay ${grossAmountInr.toFixed(2)} ${currency} to the platform account. Write your code "${buyerPaymentCode}" in the payment remarks.`,
    }, { status: 201 });

    /* ── ESCROW / GATEWAY FLOW (commented out — uncomment when platform payments are enabled) ──
    // ── Get FX rate for local currency ──
    let localAmount = taxBreakdown.totalBuyerPays;
    if (currency !== "INR") {
      const fxRate = await prisma.fxRate.findUnique({
        where: { fromCurrency_toCurrency: { fromCurrency: "INR", toCurrency: currency } },
      });
      if (fxRate) {
        localAmount = Math.round(taxBreakdown.totalBuyerPays * Number(fxRate.rate) * 100) / 100;
      }
    }

    const transaction_escrow = existingPayment
      ? await prisma.transaction.findUnique({ where: { id: existingPayment.id } })
      : await prisma.transaction.create({
          data: {
            lotId: existingLotId,
            rfqId: existingRfqId,
            buyerId: authResult.userId,
            sellerId,
            paymentMethod: preferredMethod || "BANK_TRANSFER",
            currency,
            grossAmount: grossAmountInr,
            commissionAmount: taxBreakdown.commissionAmount,
            taxOnGoods: taxBreakdown.taxOnGoods,
            taxOnCommission: taxBreakdown.taxOnCommission,
            netToSeller: taxBreakdown.netToSeller,
            idempotencyKey,
          },
        });

    if (!transaction_escrow) {
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
    }

    const { getPaymentGateway } = await import("@/lib/payment-gateways");
    const gateway = getPaymentGateway(buyerCountry, preferredMethod);
    const buyer = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { name: true, email: true, phone: true },
    });

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let order;
    try {
      order = await gateway.createOrder({
        transactionId: transaction_escrow.id,
        amount: localAmount,
        currency,
        description,
        buyerName: buyer?.name || "",
        buyerEmail: buyer?.email || "",
        buyerPhone: buyer?.phone || undefined,
        returnUrl: `${APP_URL}/en/payments/${transaction_escrow.id}`,
        webhookUrl: `${APP_URL}/api/payments/webhook/${gateway.name}`,
      });
    } catch (gatewayError) {
      await prisma.transaction.update({
        where: { id: transaction_escrow.id },
        data: { status: "FAILED" },
      });
      console.error("[PAYMENT_CREATE] Gateway error:", gatewayError);
      return NextResponse.json(
        { error: "Payment gateway unavailable. Please try again." },
        { status: 502 }
      );
    }

    await prisma.transaction.update({
      where: { id: transaction_escrow.id },
      data: {
        gatewayOrderId: order.gatewayOrderId,
        paymentMethod: order.paymentMethod,
      },
    });

    return NextResponse.json({
      transactionId: transaction_escrow.id,
      gatewayOrderId: order.gatewayOrderId,
      redirectUrl: order.redirectUrl,
      paymentMethod: order.paymentMethod,
      metadata: order.metadata,
      taxBreakdown: taxBreakdown.breakdown,
      localAmount,
      currency,
    }, { status: 201 });
    ── END ESCROW / GATEWAY FLOW ── */

  } catch (error) {
    console.error("[PAYMENT_CREATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/payments/create — Get available payment methods
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    // In manual mode, payment is handled offline
    return NextResponse.json({
      methods: ["MANUAL_OFFLINE"],
      note: "Payments are currently handled offline (UPI / bank transfer). The seller will confirm receipt on the platform.",
      currency: getDefaultCurrency(authResult.country as CountryCode),
      country: authResult.country,
    });

    /* ── ESCROW GATEWAY METHODS (commented out — uncomment when platform payments are enabled) ──
    const buyerCountry = authResult.country as CountryCode;
    const { getAvailableMethods } = await import("@/lib/payment-gateways");
    const methods = getAvailableMethods(buyerCountry);
    const currency = getDefaultCurrency(buyerCountry);
    return NextResponse.json({ methods, currency, country: buyerCountry });
    ── END ESCROW GATEWAY METHODS ── */
  } catch (error) {
    console.error("[PAYMENT_METHODS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
