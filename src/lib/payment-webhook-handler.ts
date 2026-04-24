// ── ESCROW PAYMENT WEBHOOK HANDLER ──
// COMMENTED OUT: Platform payments via escrow are disabled for now.
// Payments are handled offline (UPI / bank transfer). Seller confirms receipt manually.
// Uncomment this entire file when platform payments are re-enabled.
//
// To re-enable:
// 1. Uncomment the processPaymentWebhook function below
// 2. Update /api/payments/create/route.ts to use gateway flow
// 3. Ensure webhook endpoints call this handler

// import { prisma } from "@/lib/prisma";
// import { generateTokenHmac, getTokenExpiryDate } from "@/lib/token-utils";
// import { notifyUser } from "@/lib/notifications";
// import type { WebhookVerifyResult } from "@/lib/payment-gateways";
//
// /**
//  * Process a verified payment webhook.
//  * This is the shared logic for all payment gateways after signature verification.
//  *
//  * ESCROW FLOW:
//  * 1. Idempotency check — skip if already processed
//  * 2. Update transaction status to ESCROW_HELD (NOT COMPLETED)
//  * 3. If success: mint token (buyer gets digital ownership), update lot → SOLD
//  * 4. Funds remain in escrow until warehouse redemption triggers release
//  * 5. If failed: update transaction, notify buyer
//  */
// export async function processPaymentWebhook(result: WebhookVerifyResult): Promise<{
//   processed: boolean;
//   transactionId?: string;
//   tokenId?: string;
//   error?: string;
// }> {
//   if (!result.gatewayOrderId) {
//     return { processed: false, error: "Missing gateway order ID" };
//   }
//
//   const transaction = await prisma.transaction.findFirst({
//     where: { gatewayOrderId: result.gatewayOrderId },
//     select: {
//       id: true, status: true, lotId: true, rfqId: true, buyerId: true, sellerId: true,
//       grossAmount: true, currency: true,
//       lot: { select: { id: true, lotNumber: true, commodityType: true } },
//     },
//   });
//
//   if (!transaction) {
//     return { processed: false, error: "Transaction not found for gateway order" };
//   }
//
//   if (transaction.status === "COMPLETED" || transaction.status === "ESCROW_HELD") {
//     return { processed: true, transactionId: transaction.id };
//   }
//   if (transaction.status === "REFUNDED") {
//     return { processed: false, error: "Transaction already refunded" };
//   }
//
//   if (result.status === "failed") {
//     await prisma.$transaction(async (tx) => {
//       await tx.transaction.update({
//         where: { id: transaction.id },
//         data: {
//           status: "FAILED",
//           gatewayPaymentId: result.gatewayPaymentId,
//         },
//       });
//       await tx.notification.create({
//         data: {
//           userId: transaction.buyerId,
//           type: "IN_APP",
//           title: "Payment failed",
//           body: "Your payment could not be processed. Please try again.",
//           data: { transactionId: transaction.id },
//         },
//       });
//       await tx.auditLog.create({
//         data: {
//           userId: transaction.buyerId,
//           action: "PAYMENT_FAILED",
//           entity: "Transaction",
//           entityId: transaction.id,
//           metadata: {
//             gatewayOrderId: result.gatewayOrderId,
//             gatewayPaymentId: result.gatewayPaymentId,
//           },
//         },
//       });
//     });
//     notifyUser({
//       userId: transaction.buyerId,
//       event: "PAYMENT_FAILED",
//       title: "Payment failed",
//       body: `Your payment for lot ${transaction.lot?.lotNumber || "N/A"} could not be processed. Please try again.`,
//       data: { transactionId: transaction.id, lotNumber: transaction.lot?.lotNumber },
//       channels: ["email", "push"],
//     });
//     return { processed: true, transactionId: transaction.id };
//   }
//
//   // PAYMENT SUCCESS → ESCROW HELD
//   const now = new Date();
//   let tokenId: string | undefined;
//
//   await prisma.$transaction(async (tx) => {
//     await tx.transaction.update({
//       where: { id: transaction.id },
//       data: { status: "ESCROW_HELD", gatewayPaymentId: result.gatewayPaymentId, paidAt: now },
//     });
//     if (transaction.lotId) {
//       const mintedAt = now.toISOString();
//       const hmacHash = generateTokenHmac({ lotId: transaction.lotId, ownerId: transaction.buyerId, mintedAt });
//       const token = await tx.token.create({
//         data: { lotId: transaction.lotId, ownerId: transaction.buyerId, hmacHash, mintedAt: now, expiresAt: getTokenExpiryDate() },
//       });
//       tokenId = token.id;
//       await tx.lot.update({ where: { id: transaction.lotId }, data: { status: "SOLD" } });
//     }
//     await tx.auditLog.create({
//       data: {
//         userId: transaction.buyerId, action: "ESCROW_HELD", entity: "Transaction", entityId: transaction.id,
//         metadata: { gatewayOrderId: result.gatewayOrderId, gatewayPaymentId: result.gatewayPaymentId, grossAmount: Number(transaction.grossAmount), currency: transaction.currency, tokenId },
//       },
//     });
//     await tx.notification.create({
//       data: {
//         userId: transaction.buyerId, type: "IN_APP", title: "Payment received — Escrow held",
//         body: tokenId ? "Your payment has been received and funds are held securely in escrow. A digital token has been minted." : "Your payment has been received and funds are held securely in escrow.",
//         data: { transactionId: transaction.id, tokenId },
//       },
//     });
//     await tx.notification.create({
//       data: {
//         userId: transaction.sellerId, type: "IN_APP", title: "Buyer has paid — Prepare for pickup",
//         body: transaction.lot ? `Payment for lot ${transaction.lot.lotNumber} has been received. Funds are held in escrow.` : "A buyer payment has been received.",
//         data: { transactionId: transaction.id },
//       },
//     });
//   });
//
//   notifyUser({ userId: transaction.buyerId, event: "PAYMENT_CONFIRMED", title: "Payment received — Escrow held",
//     body: tokenId ? `Payment for lot ${transaction.lot?.lotNumber || "N/A"} received. Token minted.` : "Payment received. Funds in escrow.",
//     data: { transactionId: transaction.id, tokenId, lotNumber: transaction.lot?.lotNumber }, channels: ["email", "push"] });
//   notifyUser({ userId: transaction.sellerId, event: "PAYMENT_CONFIRMED", title: "Buyer has paid — Prepare for pickup",
//     body: transaction.lot ? `Payment for lot ${transaction.lot.lotNumber} received. Funds in escrow.` : "Buyer payment received.",
//     data: { transactionId: transaction.id, lotNumber: transaction.lot?.lotNumber }, channels: ["email", "push"] });
//   if (tokenId) {
//     notifyUser({ userId: transaction.buyerId, event: "TOKEN_MINTED", title: "Commodity token issued!",
//       body: `Token for lot ${transaction.lot?.lotNumber || "N/A"} (${transaction.lot?.commodityType || "commodity"}) issued.`,
//       data: { tokenId, lotId: transaction.lotId, lotNumber: transaction.lot?.lotNumber, commodityType: transaction.lot?.commodityType }, channels: ["email", "push"] });
//   }
//
//   return { processed: true, transactionId: transaction.id, tokenId };
// }

// Placeholder export to prevent "no exports" errors
export const ESCROW_PAYMENTS_DISABLED = true;
export const ESCROW_REACTIVATION_NOTE = "Uncomment processPaymentWebhook in this file and update /api/payments/create to re-enable escrow payments.";

