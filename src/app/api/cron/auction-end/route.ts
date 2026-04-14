import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastAuctionEnded } from "@/lib/socket";
import { calculateTaxBreakdown, getDefaultCurrency } from "@/lib/tax-engine";
import { notifyUser } from "@/lib/notifications";
import crypto from "crypto";
import type { CountryCode } from "@/generated/prisma/client";

const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/auction-end — Process ended auctions
// Called by external cron job every 1 minute
// Protected by CRON_SECRET header to prevent unauthorized access
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all lots where auction has ended but status is still AUCTION_ACTIVE
    const endedLots = await prisma.lot.findMany({
      where: {
        status: "AUCTION_ACTIVE",
        auctionEndsAt: { lte: now },
      },
      select: {
        id: true,
        lotNumber: true,
        sellerId: true,
        reservePriceInr: true,
        bids: {
          orderBy: { amountInr: "desc" },
          take: 1,
          select: { id: true, bidderId: true, amountInr: true },
        },
      },
    });

    if (endedLots.length === 0) {
      return NextResponse.json({
        message: "No auctions to end",
        processedAt: now.toISOString(),
        lotsProcessed: 0,
      });
    }

    const results: { lotId: string; lotNumber: string; outcome: string }[] = [];

    for (const lot of endedLots) {
      const highestBid = lot.bids[0];

      if (!highestBid) {
        // No bids — return to LISTED
        await prisma.$transaction(async (tx) => {
          await tx.lot.update({
            where: { id: lot.id },
            data: { status: "LISTED" },
          });
          await tx.auditLog.create({
            data: {
              userId: lot.sellerId,
              action: "AUCTION_ENDED_NO_BIDS",
              entity: "Lot",
              entityId: lot.id,
              metadata: { lotNumber: lot.lotNumber },
            },
          });
          // Notify seller
          await tx.notification.create({
            data: {
              userId: lot.sellerId,
              type: "IN_APP",
              title: "Auction ended — no bids received",
              body: `Your auction for lot ${lot.lotNumber} ended without any bids. The lot has been returned to Listed status.`,
              data: { lotId: lot.id, lotNumber: lot.lotNumber, outcome: "NO_BIDS" },
            },
          });
        });
        broadcastAuctionEnded(lot.id, "NO_BIDS", undefined, undefined, lot.lotNumber);
        // Email + push: seller (in-app already created in transaction)
        notifyUser({
          userId: lot.sellerId,
          event: "AUCTION_ENDED_NO_BIDS",
          title: "Auction ended — no bids received",
          body: `Your auction for lot ${lot.lotNumber} ended without any bids. The lot has been returned to Listed status.`,
          data: { lotId: lot.id, lotNumber: lot.lotNumber },
          channels: ["email"],
          link: `/marketplace/${lot.id}`,
        });
        results.push({ lotId: lot.id, lotNumber: lot.lotNumber, outcome: "NO_BIDS" });
        continue;
      }

      const reservePrice = lot.reservePriceInr ? Number(lot.reservePriceInr) : 0;
      const bidAmount = Number(highestBid.amountInr);

      if (reservePrice > 0 && bidAmount < reservePrice) {
        // Below reserve — return to LISTED
        await prisma.$transaction(async (tx) => {
          await tx.lot.update({
            where: { id: lot.id },
            data: { status: "LISTED" },
          });
          await tx.bid.updateMany({
            where: { lotId: lot.id },
            data: { status: "CANCELLED" },
          });
          await tx.auditLog.create({
            data: {
              userId: lot.sellerId,
              action: "AUCTION_ENDED_BELOW_RESERVE",
              entity: "Lot",
              entityId: lot.id,
              metadata: {
                lotNumber: lot.lotNumber,
                reservePrice: reservePrice,
                highestBid: bidAmount,
              },
            },
          });
          // Notify seller
          await tx.notification.create({
            data: {
              userId: lot.sellerId,
              type: "IN_APP",
              title: "Auction ended — reserve price not met",
              body: `The highest bid of $${bidAmount.toFixed(2)} on lot ${lot.lotNumber} did not meet your reserve price of $${reservePrice.toFixed(2)}. The lot has been returned to Listed status.`,
              data: { lotId: lot.id, lotNumber: lot.lotNumber, outcome: "BELOW_RESERVE", highestBid: bidAmount, reservePrice },
            },
          });
          // Notify the highest bidder
          await tx.notification.create({
            data: {
              userId: highestBid.bidderId,
              type: "IN_APP",
              title: "Auction ended — reserve not met",
              body: `The auction for lot ${lot.lotNumber} has ended. Unfortunately, the reserve price was not met.`,
              data: { lotId: lot.id, lotNumber: lot.lotNumber, outcome: "BELOW_RESERVE" },
            },
          });
        });
        broadcastAuctionEnded(lot.id, "BELOW_RESERVE", undefined, bidAmount, lot.lotNumber);
        // Email notifications (in-app already in transaction)
        notifyUser({
          userId: lot.sellerId,
          event: "AUCTION_ENDED_BELOW_RESERVE",
          title: "Auction ended — reserve price not met",
          body: `The highest bid of $${bidAmount.toFixed(2)} on lot ${lot.lotNumber} did not meet your reserve price of $${reservePrice.toFixed(2)}.`,
          data: { lotId: lot.id, lotNumber: lot.lotNumber, highestBid: bidAmount.toFixed(2), reservePrice: reservePrice.toFixed(2) },
          channels: ["email"],
          link: `/marketplace/${lot.id}`,
        });
        results.push({ lotId: lot.id, lotNumber: lot.lotNumber, outcome: "BELOW_RESERVE" });
        continue;
      }

      // Winner found — mark SOLD
      // Fetch buyer details (uniquePaymentCode + country) and platform account
      const [bidder, platformSetting] = await Promise.all([
        prisma.user.findUnique({
          where: { id: highestBid.bidderId },
          select: { country: true, uniquePaymentCode: true, name: true },
        }),
        prisma.platformSettings.findUnique({
          where: { key: "platform_bank_account" },
          select: { value: true },
        }),
      ]);
      const buyerCountry = (bidder?.country || "IN") as CountryCode;
      const buyerPaymentCode = bidder?.uniquePaymentCode || "N/A";
      const buyerName = bidder?.name || "Winner";
      const taxBreakdown = calculateTaxBreakdown(bidAmount, buyerCountry);
      const currency = getDefaultCurrency(buyerCountry);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const platformAccount = (platformSetting?.value as any) || null;

      await prisma.$transaction(async (tx) => {
        await tx.lot.update({
          where: { id: lot.id },
          data: { status: "SOLD" },
        });
        await tx.bid.update({
          where: { id: highestBid.id },
          data: { status: "WON" },
        });
        await tx.bid.updateMany({
          where: { lotId: lot.id, id: { not: highestBid.id } },
          data: { status: "CANCELLED" },
        });
        await tx.auditLog.create({
          data: {
            userId: lot.sellerId,
            action: "AUCTION_ENDED_SOLD",
            entity: "Lot",
            entityId: lot.id,
            metadata: {
              lotNumber: lot.lotNumber,
              winnerId: highestBid.bidderId,
              amount: bidAmount,
              buyerPaymentCode,
            },
          },
        });

        // Create Transaction record for the winner to make payment
        await tx.transaction.create({
          data: {
            lotId: lot.id,
            buyerId: highestBid.bidderId,
            sellerId: lot.sellerId,
            paymentMethod: "MANUAL_OFFLINE",
            currency,
            grossAmount: bidAmount,
            commissionAmount: taxBreakdown.commissionAmount,
            taxOnGoods: taxBreakdown.taxOnGoods,
            taxOnCommission: taxBreakdown.taxOnCommission,
            netToSeller: taxBreakdown.netToSeller,
            idempotencyKey: crypto.randomUUID(),
          },
        });

        // Build payment instruction for in-app notification
        const paymentInstructions = platformAccount
          ? `\n\nPayment Instructions:\nTransfer ${currency} ${bidAmount.toFixed(2)} to:\nBank: ${platformAccount.bankName || "N/A"}\nA/C Holder: ${platformAccount.accountHolderName || "N/A"}\nA/C No: ${platformAccount.accountNumber || "N/A"}\nIFSC: ${platformAccount.ifscCode || "N/A"}${platformAccount.upiId ? `\nUPI: ${platformAccount.upiId}` : ""}\n\nIMPORTANT: Write your unique code "${buyerPaymentCode}" in the payment remarks so we can identify your payment.`
          : "\n\nPayment details will be shared with you shortly.";

        // Notify winner (buyer) with full payment instructions
        await tx.notification.create({
          data: {
            userId: highestBid.bidderId,
            type: "IN_APP",
            title: "🎉 Congratulations! You won the auction!",
            body: `You won lot ${lot.lotNumber} with a bid of $${bidAmount.toFixed(2)}.${paymentInstructions}`,
            data: {
              lotId: lot.id, lotNumber: lot.lotNumber, outcome: "WON", amount: bidAmount,
              buyerPaymentCode, currency,
            },
          },
        });
        // Notify seller
        await tx.notification.create({
          data: {
            userId: lot.sellerId,
            type: "IN_APP",
            title: "Your lot has been sold!",
            body: `Lot ${lot.lotNumber} was sold for $${bidAmount.toFixed(2)}. The buyer will proceed with payment to the platform. Once confirmed by admin, your funds will be released to your bank account.`,
            data: { lotId: lot.id, lotNumber: lot.lotNumber, outcome: "SOLD", amount: bidAmount, winnerId: highestBid.bidderId },
          },
        });
      });
      broadcastAuctionEnded(lot.id, "SOLD", highestBid.bidderId, bidAmount, lot.lotNumber);

      // Build detailed email body for winner with payment instructions
      const emailPaymentInstructions = platformAccount
        ? `Transfer ${currency} ${bidAmount.toFixed(2)} to the following account:\n\nBank Name: ${platformAccount.bankName || "N/A"}\nAccount Holder: ${platformAccount.accountHolderName || "N/A"}\nAccount Number: ${platformAccount.accountNumber || "N/A"}\nIFSC Code: ${platformAccount.ifscCode || "N/A"}${platformAccount.swiftCode ? `\nSWIFT: ${platformAccount.swiftCode}` : ""}${platformAccount.upiId ? `\nUPI: ${platformAccount.upiId}` : ""}${platformAccount.additionalInstructions ? `\n\n${platformAccount.additionalInstructions}` : ""}\n\nIMPORTANT: Write your unique code "${buyerPaymentCode}" in the payment remarks/description so we can identify your payment.`
        : "Payment details will be shared with you shortly.";

      // Email + push for winner (includes payment details)
      notifyUser({
        userId: highestBid.bidderId,
        event: "AUCTION_WON",
        title: `Congratulations ${buyerName}! You won lot ${lot.lotNumber}!`,
        body: `You won lot ${lot.lotNumber} with a bid of $${bidAmount.toFixed(2)}.\n\n${emailPaymentInstructions}\n\nYour unique payment code: ${buyerPaymentCode}`,
        data: {
          lotId: lot.id, lotNumber: lot.lotNumber, amount: bidAmount.toFixed(2),
          buyerPaymentCode, currency,
          platformBankName: platformAccount?.bankName,
          platformAccountNumber: platformAccount?.accountNumber,
          platformAccountHolder: platformAccount?.accountHolderName,
        },
        channels: ["email", "push"],
        link: `/marketplace/${lot.id}`,
      });
      // Email + push for seller
      notifyUser({
        userId: lot.sellerId,
        event: "AUCTION_SOLD",
        title: "Your lot has been sold!",
        body: `Lot ${lot.lotNumber} was sold for $${bidAmount.toFixed(2)}. The buyer will proceed with payment to the platform. Once the payment is confirmed by admin, your funds will be released to your registered bank account.`,
        data: { lotId: lot.id, lotNumber: lot.lotNumber, amount: bidAmount.toFixed(2) },
        channels: ["email", "push"],
        link: `/dashboard`,
      });
      results.push({ lotId: lot.id, lotNumber: lot.lotNumber, outcome: "SOLD" });
    }

    console.log(`[CRON_AUCTION_END] Processed ${endedLots.length} auctions:`, results);

    return NextResponse.json({
      message: `Processed ${endedLots.length} auctions`,
      processedAt: now.toISOString(),
      lotsProcessed: endedLots.length,
      results,
    });
  } catch (error) {
    console.error("[CRON_AUCTION_END]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
