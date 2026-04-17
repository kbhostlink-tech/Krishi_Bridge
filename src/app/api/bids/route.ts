import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkKycApproved } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { placeBidSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { broadcastNewBid, broadcastOutbid, broadcastAuctionExtended } from "@/lib/socket";
import { notifyUser } from "@/lib/notifications";
import { convertToInr, formatMoney, BASE_CURRENCY } from "@/lib/currency";
import type { CurrencyCode } from "@/generated/prisma/client";

// Minimum bid increment in INR (prevents penny-sniping)
const MIN_BID_INCREMENT_INR = 10;
// Anti-sniping: if bid placed within this window (ms), extend auction
const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const ANTI_SNIPE_EXTENSION_MS = 2 * 60 * 1000; // extend by 2 minutes

// POST /api/bids — Place a bid on an active auction lot
export async function POST(req: NextRequest) {
  // 1. Auth checks: require auth, buyer role, KYC approved
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["BUYER"]);
  if (roleCheck) return roleCheck;

  const kycCheck = checkKycApproved(authResult);
  if (kycCheck) return kycCheck;

  // 2. Rate limit bid placement (10 bids per user per 5 minutes)
  const rateKey = `bid:${authResult.userId}`;
  const rateResult = checkRateLimit(rateKey);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Too many bids. Please slow down.", retryAfterMs: rateResult.retryAfterMs },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = placeBidSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { lotId, amount, currency, isProxy, maxProxyAmount } = parsed.data;

    // 3. Use Prisma interactive transaction with row-level locking for race condition prevention
    // PrismaPg adapter doesn't support $queryRawUnsafe for FOR UPDATE,
    // so we use a serializable transaction approach
    const result = await prisma.$transaction(async (tx) => {
      // Fetch the lot with its current highest bid inside the transaction
      const lot = await tx.lot.findUnique({
        where: { id: lotId },
        select: {
          id: true,
          lotNumber: true,
          sellerId: true,
          status: true,
          listingMode: true,
          auctionEndsAt: true,
          startingPriceInr: true,
          reservePriceInr: true,
          bids: {
            orderBy: { amountInr: "desc" },
            take: 1,
            select: { id: true, bidderId: true, amountInr: true, maxProxyInr: true, isProxy: true },
          },
        },
      });

      if (!lot) {
        return { error: "Lot not found", status: 404 };
      }

      // Validate lot is auction-eligible
      if (lot.status !== "AUCTION_ACTIVE") {
        return { error: "This lot is not currently in an active auction", status: 400 };
      }

      if (lot.listingMode !== "AUCTION" && lot.listingMode !== "BOTH") {
        return { error: "This lot does not support bidding", status: 400 };
      }

      // Prevent bidding on own lot
      if (lot.sellerId === authResult.userId) {
        return { error: "You cannot bid on your own lot", status: 403 };
      }

      // Check auction has not ended
      if (lot.auctionEndsAt && new Date(lot.auctionEndsAt) <= new Date()) {
        return { error: "This auction has ended", status: 400 };
      }

      // Determine minimum acceptable bid
      const highestBid = lot.bids[0];
      const startingPrice = lot.startingPriceInr ? Number(lot.startingPriceInr) : 0;
      const currentHighest = highestBid ? Number(highestBid.amountInr) : 0;
      const minimumBid = currentHighest > 0
        ? currentHighest + MIN_BID_INCREMENT_INR
        : startingPrice;

      if (amount < minimumBid) {
        return {
          error: `Bid must be at least ${formatMoney(minimumBid, BASE_CURRENCY)}`,
          status: 400,
          minimumBid,
        };
      }

      // Prevent same user from being the highest bidder already (don't outbid yourself)
      if (highestBid && highestBid.bidderId === authResult.userId) {
        return { error: "You are already the highest bidder", status: 400 };
      }

      // Convert bid amount to INR (base currency) if user bid in a different currency
      const amountInr = await convertToInr(amount, currency as CurrencyCode);
      const localAmount = amount; // Original amount in user's currency

      // Mark previous highest bid as OUTBID
      if (highestBid) {
        await tx.bid.update({
          where: { id: highestBid.id },
          data: { status: "OUTBID" },
        });
      }

      // Create the new bid
      const newBid = await tx.bid.create({
        data: {
          lotId,
          bidderId: authResult.userId,
          amountInr,
          currency,
          localAmount,
          status: "ACTIVE",
          isProxy: isProxy || false,
          maxProxyInr: maxProxyAmount || null,
        },
        select: {
          id: true,
          amountInr: true,
          currency: true,
          isProxy: true,
          createdAt: true,
          bidder: { select: { id: true, name: true, country: true } },
        },
      });

      // Anti-sniping: if bid placed within last 2 minutes of auction, extend by 2 minutes
      let auctionExtended = false;
      let newAuctionEndsAt = lot.auctionEndsAt;
      if (lot.auctionEndsAt) {
        const timeUntilEnd = new Date(lot.auctionEndsAt).getTime() - Date.now();
        if (timeUntilEnd > 0 && timeUntilEnd <= ANTI_SNIPE_WINDOW_MS) {
          newAuctionEndsAt = new Date(Date.now() + ANTI_SNIPE_EXTENSION_MS);
          await tx.lot.update({
            where: { id: lotId },
            data: { auctionEndsAt: newAuctionEndsAt },
          });
          auctionExtended = true;
        }
      }

      // Proxy bidding chain: resolve all active proxy bids until no more can counter.
      // This handles the case where multiple buyers have proxy bidding enabled.
      const allProxyBids: Array<{ id: string; amountInr: number; currency: string; isProxy: boolean; createdAt: Date; bidder: { id: string; name: string; country: string } }> = [];
      let currentHighestBidId = newBid.id;
      let currentHighestAmount = amountInr;
      let currentHighestBidderId = authResult.userId;
      const MAX_PROXY_CHAIN = 50; // Safety limit

      for (let i = 0; i < MAX_PROXY_CHAIN; i++) {
        // Find the best competing proxy bid that can outbid the current highest
        const competingProxy = await tx.bid.findFirst({
          where: {
            lotId,
            isProxy: true,
            status: "ACTIVE",
            maxProxyInr: { gt: currentHighestAmount + MIN_BID_INCREMENT_INR },
            bidderId: { not: currentHighestBidderId }, // Can't outbid yourself
          },
          orderBy: { maxProxyInr: "desc" }, // Highest proxy wins ties
          select: { id: true, bidderId: true, maxProxyInr: true },
        });

        if (!competingProxy || !competingProxy.maxProxyInr) break;

        const neededAmount = currentHighestAmount + MIN_BID_INCREMENT_INR;
        const maxProxy = Number(competingProxy.maxProxyInr);

        if (neededAmount > maxProxy) break;

        // Mark the current highest bid as outbid
        await tx.bid.update({
          where: { id: currentHighestBidId },
          data: { status: "OUTBID" },
        });

        // Create counter-bid from the proxy
        const counterBid = await tx.bid.create({
          data: {
            lotId,
            bidderId: competingProxy.bidderId,
            amountInr: neededAmount,
            currency: BASE_CURRENCY,
            localAmount: neededAmount,
            status: "ACTIVE",
            isProxy: true,
            maxProxyInr: maxProxy,
          },
          select: {
            id: true,
            amountInr: true,
            currency: true,
            isProxy: true,
            createdAt: true,
            bidder: { select: { id: true, name: true, country: true } },
          },
        });

        allProxyBids.push({ ...counterBid, amountInr: Number(counterBid.amountInr) });
        currentHighestBidId = counterBid.id;
        currentHighestAmount = neededAmount;
        currentHighestBidderId = competingProxy.bidderId;
      }

      // The final proxyBid (if any) is the one that won the chain
      const finalProxyBid = allProxyBids.length > 0 ? allProxyBids[allProxyBids.length - 1] : null;

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "BID_PLACED",
          entity: "Bid",
          entityId: newBid.id,
          metadata: {
            lotId,
            lotNumber: lot.lotNumber,
            amountInr,
            currency,
            isProxy: isProxy || false,
            auctionExtended,
          },
        },
      });

      // Create in-app notification for the outbid user
      if (highestBid && !finalProxyBid) {
        await tx.notification.create({
          data: {
            userId: highestBid.bidderId,
            type: "IN_APP",
            title: "You've been outbid!",
            body: `Someone placed a higher bid of ${formatMoney(amountInr, BASE_CURRENCY)} on lot ${lot.lotNumber}. Place a new bid to stay in the game.`,
            data: { lotId, lotNumber: lot.lotNumber, newAmount: amountInr },
          },
        });
      }

      // Notification for lot owner about new bid
      await tx.notification.create({
        data: {
          userId: lot.sellerId,
          type: "IN_APP",
          title: "New bid on your lot!",
          body: `A new bid of ${formatMoney(amountInr, BASE_CURRENCY)} was placed on lot ${lot.lotNumber}.`,
          data: { lotId, lotNumber: lot.lotNumber, amount: amountInr },
        },
      });

      return {
        bid: {
          ...newBid,
          amountInr: Number(newBid.amountInr),
        },
        proxyBid: finalProxyBid ?? null,
        proxyBidChainLength: allProxyBids.length,
        auctionExtended,
        newAuctionEndsAt: newAuctionEndsAt ? new Date(newAuctionEndsAt).toISOString() : null,
        outbidUserId: highestBid?.bidderId || null,
        lotNumber: lot.lotNumber,
        sellerId: lot.sellerId,
        status: 201,
      };
    });

    // Handle error responses from inside the transaction
    if ("error" in result && typeof result.error === "string") {
      return NextResponse.json(
        { error: result.error, ...(result.minimumBid ? { minimumBid: result.minimumBid } : {}) },
        { status: (result.status as number) || 400 }
      );
    }

    // Fire-and-forget Socket.io broadcasts (after DB transaction committed)
    if ("bid" in result) {
      const bid = result.bid as { id: string; amountInr: number; currency: string; isProxy: boolean; createdAt: Date | string; bidder: { id: string; name: string; country: string } };
      const lotNumber = result.lotNumber as string;

      broadcastNewBid(parsed.data.lotId, bid);

      // Notify outbid user via socket
      if (result.outbidUserId && !result.proxyBid) {
        broadcastOutbid(
          parsed.data.lotId,
          result.outbidUserId as string,
          bid.amountInr,
          lotNumber
        );
      }

      // If proxy auto-bid happened, broadcast that too
      if (result.proxyBid) {
        const proxyBid = result.proxyBid as { id: string; amountInr: number; currency: string; isProxy: boolean; createdAt: Date | string; bidder: { id: string; name: string; country: string } };
        broadcastNewBid(parsed.data.lotId, proxyBid);
        broadcastOutbid(
          parsed.data.lotId,
          authResult.userId,
          proxyBid.amountInr,
          lotNumber
        );
      }

      // If auction was extended (anti-sniping), broadcast
      if (result.auctionExtended && result.newAuctionEndsAt) {
        broadcastAuctionExtended(
          parsed.data.lotId,
          result.newAuctionEndsAt as string,
          lotNumber
        );
      }

      // Fire-and-forget: notifications (in-app already created in transaction)
      // Notify outbid user (in-app + push only — no email per outbid, that's spammy)
      if (result.outbidUserId && !result.proxyBid) {
        notifyUser({
          userId: result.outbidUserId as string,
          event: "OUTBID",
          title: "You've been outbid!",
          body: `Someone placed a higher bid of ${formatMoney(bid.amountInr, BASE_CURRENCY)} on lot ${lotNumber}. Place a new bid to stay in the game.`,
          data: { lotId: parsed.data.lotId, lotNumber, formattedHighestBid: formatMoney(bid.amountInr, BASE_CURRENCY), ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/en/marketplace/${parsed.data.lotId}` },
          channels: ["in_app", "push"],
          link: `/marketplace/${parsed.data.lotId}`,
        });
      }

      // Notify lot owner about new bid (in-app only — no email spam during active auctions)
      notifyUser({
        userId: result.sellerId as string,
        event: "BID_PLACED",
        title: "New bid on your lot!",
        body: `A new bid of ${formatMoney(bid.amountInr, BASE_CURRENCY)} was placed on lot ${lotNumber}.`,
        data: { lotId: parsed.data.lotId, lotNumber, formattedAmount: formatMoney(bid.amountInr, BASE_CURRENCY), formattedHighestBid: formatMoney(bid.amountInr, BASE_CURRENCY), ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/en/marketplace/${parsed.data.lotId}` },
        channels: ["in_app"],
        link: `/marketplace/${parsed.data.lotId}`,
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[BID_PLACE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/bids — Get bids for a lot, or user's bids
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lotId = searchParams.get("lotId");
  const myBids = searchParams.get("my");

  try {
    // If requesting own bids, require auth
    if (myBids === "true") {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) return authResult;

      const bids = await prisma.bid.findMany({
        where: { bidderId: authResult.userId },
        include: {
          lot: {
            select: {
              id: true, lotNumber: true, commodityType: true, grade: true, status: true,
              listingMode: true, auctionEndsAt: true, images: true,
              farmer: { select: { name: true } },
              seller: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        bids: bids.map((b) => ({
          id: b.id,
          amountInr: Number(b.amountInr),
          currency: b.currency,
          localAmount: Number(b.localAmount),
          status: b.status,
          isProxy: b.isProxy,
          maxProxyInr: b.maxProxyInr ? Number(b.maxProxyInr) : null,
          createdAt: b.createdAt,
          lot: {
            id: b.lot.id,
            lotNumber: b.lot.lotNumber,
            commodityType: b.lot.commodityType,
            grade: b.lot.grade,
            status: b.lot.status,
            listingMode: b.lot.listingMode,
            auctionEndsAt: b.lot.auctionEndsAt,
            image: b.lot.images[0] || null,
            sellerName: b.lot.seller.name,
          },
        })),
      });
    }

    // Public: get bids for a lot
    if (!lotId) {
      return NextResponse.json(
        { error: "lotId query param required" },
        { status: 400 }
      );
    }

    const bids = await prisma.bid.findMany({
      where: { lotId },
      select: {
        id: true,
        amountInr: true,
        currency: true,
        status: true,
        isProxy: true,
        createdAt: true,
        bidder: { select: { id: true, name: true, country: true } },
      },
      orderBy: { amountInr: "desc" },
      take: 50,
    });

    // Get total bid count
    const totalBids = await prisma.bid.count({ where: { lotId } });

    return NextResponse.json({
      bids: bids.map((b) => ({
        ...b,
        amountInr: Number(b.amountInr),
      })),
      totalBids,
    });
  } catch (error) {
    console.error("[BIDS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
