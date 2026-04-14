import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkAdminPermission } from "@/lib/auth";
import { notifyUser, notifyMany } from "@/lib/notifications";
import { calculateTaxBreakdown, getDefaultCurrency } from "@/lib/tax-engine";
import type { CountryCode } from "@/generated/prisma/client";
import { z } from "zod";

const setTermsSchema = z.object({
  responseId: z.string().uuid(),
  finalPriceInr: z.number().positive("Price must be positive"),
  notes: z.string().max(2000).optional(),
});

interface RouteParams {
  params: Promise<{ rfqId: string }>;
}

// POST /api/admin/rfq/[rfqId]/set-terms — Admin sets final deal price and closes RFQ
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    if (!checkAdminPermission(authResult, "rfq.set_terms")) {
      return NextResponse.json(
        { error: "Insufficient permissions to set RFQ terms" },
        { status: 403 }
      );
    }

    const { rfqId } = await params;
    const body = await req.json();
    const parsed = setTermsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { responseId, finalPriceInr, notes } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const rfq = await tx.rfqRequest.findUnique({
        where: { id: rfqId },
        select: {
          id: true,
          buyerId: true,
          status: true,
          commodityType: true,
          quantityKg: true,
          selectedResponseId: true,
        },
      });

      if (!rfq) throw new Error("RFQ_NOT_FOUND");
      if (rfq.status === "ACCEPTED") throw new Error("ALREADY_ACCEPTED");
      if (rfq.status === "CANCELLED" || rfq.status === "EXPIRED") {
        throw new Error("RFQ_CLOSED");
      }

      const response = await tx.rfqResponse.findUnique({
        where: { id: responseId },
        select: { id: true, rfqId: true, sellerId: true, status: true },
      });

      if (!response || response.rfqId !== rfqId) throw new Error("RESPONSE_NOT_FOUND");

      // Accept the winning response
      await tx.rfqResponse.update({
        where: { id: responseId },
        data: { status: "ACCEPTED" },
      });

      // Reject all other pending/countered responses
      await tx.rfqResponse.updateMany({
        where: { rfqId, id: { not: responseId }, status: { in: ["PENDING", "COUNTERED"] } },
        data: { status: "REJECTED" },
      });

      // Update RFQ with final terms
      await tx.rfqRequest.update({
        where: { id: rfqId },
        data: {
          status: "ACCEPTED",
          selectedResponseId: responseId,
          finalPriceInr,
          adminNotes: notes,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "RFQ_TERMS_SET",
          entity: "RfqRequest",
          entityId: rfqId,
          metadata: {
            responseId,
            sellerId: response.sellerId,
            finalPriceInr,
            notes,
          },
        },
      });

      // Fetch buyer country for tax + currency calculation
      const buyer = await tx.user.findUnique({
        where: { id: rfq.buyerId },
        select: { country: true, uniquePaymentCode: true, name: true },
      });
      const buyerCountry = (buyer?.country || "IN") as CountryCode;
      const buyerPaymentCode = buyer?.uniquePaymentCode || "N/A";
      const totalAmount = finalPriceInr * Number(rfq.quantityKg);
      const taxBreakdown = calculateTaxBreakdown(totalAmount, buyerCountry);
      const currency = getDefaultCurrency(buyerCountry);

      // Fetch platform bank account for payment instructions
      const platformSetting = await tx.platformSettings.findUnique({
        where: { key: "platform_bank_account" },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const platformAccount = (platformSetting?.value as any) || null;

      // Create Transaction record so buyer can pay
      await tx.transaction.create({
        data: {
          rfqId: rfq.id,
          buyerId: rfq.buyerId,
          sellerId: response.sellerId,
          paymentMethod: "MANUAL_OFFLINE",
          currency,
          grossAmount: totalAmount,
          commissionAmount: taxBreakdown.commissionAmount,
          taxOnGoods: taxBreakdown.taxOnGoods,
          taxOnCommission: taxBreakdown.taxOnCommission,
          netToSeller: taxBreakdown.netToSeller,
          idempotencyKey: crypto.randomUUID(),
        },
      });

      // Build payment instructions for buyer notification
      const paymentInstructions = platformAccount
        ? `\n\nPayment Instructions:\nTransfer ${currency} ${totalAmount.toFixed(2)} to:\nBank: ${platformAccount.bankName || "N/A"}\nA/C Holder: ${platformAccount.accountHolderName || "N/A"}\nA/C No: ${platformAccount.accountNumber || "N/A"}\nIFSC: ${platformAccount.ifscCode || "N/A"}${platformAccount.upiId ? `\nUPI: ${platformAccount.upiId}` : ""}\n\nIMPORTANT: Write your unique code "${buyerPaymentCode}" in the payment remarks.`
        : "\n\nPayment details will be shared with you shortly.";

      // Notify buyer (final price revealed only now + payment instructions)
      await tx.notification.create({
        data: {
          userId: rfq.buyerId,
          type: "IN_APP",
          title: "Deal terms confirmed for your RFQ",
          body: `The platform has confirmed deal terms at $${finalPriceInr.toFixed(2)} per unit (total: $${totalAmount.toFixed(2)}). ${paymentInstructions}`,
          data: { rfqId, finalPriceInr, totalAmount, buyerPaymentCode, currency },
        },
      });

      // Notify winning seller
      await tx.notification.create({
        data: {
          userId: response.sellerId,
          type: "IN_APP",
          title: "RFQ deal confirmed — you are the selected supplier!",
          body: `Deal terms have been set at $${finalPriceInr.toFixed(2)} per unit for ${Number(rfq.quantityKg)}kg of ${rfq.commodityType.replace(/_/g, " ")}.`,
          data: { rfqId, responseId, finalPriceInr },
        },
      });

      // Notify rejected sellers
      const rejectedResponses = await tx.rfqResponse.findMany({
        where: { rfqId, id: { not: responseId }, status: "REJECTED" },
        select: { sellerId: true },
      });

      if (rejectedResponses.length > 0) {
        await tx.notification.createMany({
          data: rejectedResponses.map((r) => ({
            userId: r.sellerId,
            type: "IN_APP" as const,
            title: "RFQ closed — another supplier selected",
            body: "The platform has selected a different supplier for this RFQ.",
            data: { rfqId },
          })),
        });
      }

      return {
        buyerId: rfq.buyerId,
        sellerId: response.sellerId,
        rejectedSellerIds: rejectedResponses.map((r) => r.sellerId),
        commodityType: rfq.commodityType,
        totalAmount,
        currency,
        buyerPaymentCode,
      };
    });

    // Fire-and-forget: email + push
    notifyUser({
      userId: result.buyerId,
      event: "RFQ_ACCEPTED" as const,
      title: "Deal terms confirmed for your RFQ",
      body: `The platform has confirmed deal terms at $${finalPriceInr.toFixed(2)} per unit (total: $${result.totalAmount.toFixed(2)}).\n\nPlease proceed to pay. Use your payment code "${result.buyerPaymentCode}" in the payment remarks.`,
      data: { rfqId, finalPriceInr, totalAmount: result.totalAmount, currency: result.currency },
      channels: ["email", "push"],
      link: `/rfq/${rfqId}`,
    });

    notifyUser({
      userId: result.sellerId,
      event: "RFQ_ACCEPTED" as const,
      title: "RFQ deal confirmed — you are the selected supplier!",
      body: `Deal terms have been set at $${finalPriceInr.toFixed(2)} per unit.`,
      data: { rfqId, finalPriceInr, commodityType: result.commodityType },
      channels: ["email", "push"],
      link: `/rfq/${rfqId}`,
    });

    if (result.rejectedSellerIds.length > 0) {
      notifyMany(
        result.rejectedSellerIds.map((sellerId) => ({
          userId: sellerId,
          event: "RFQ_REJECTED" as const,
          title: "RFQ closed — another supplier selected",
          body: "The platform has selected a different supplier for this RFQ.",
          data: { rfqId },
          channels: ["email"] as const,
        }))
      );
    }

    return NextResponse.json({
      message: "Deal terms set successfully",
      finalPriceInr,
      sellerId: result.sellerId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const errorMap: Record<string, { msg: string; code: number }> = {
      RFQ_NOT_FOUND: { msg: "RFQ not found", code: 404 },
      ALREADY_ACCEPTED: { msg: "Terms have already been set for this RFQ", code: 409 },
      RFQ_CLOSED: { msg: "This RFQ is closed", code: 400 },
      RESPONSE_NOT_FOUND: { msg: "Response not found", code: 404 },
    };

    const mapped = errorMap[message];
    if (mapped) {
      return NextResponse.json({ error: mapped.msg }, { status: mapped.code });
    }

    console.error("[ADMIN_RFQ_SET_TERMS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
