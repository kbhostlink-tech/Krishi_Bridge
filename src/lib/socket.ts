/**
 * Socket.io broadcast client for Next.js API routes.
 * Sends events to the standalone Socket.io server via HTTP POST.
 */

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || "http://localhost:3001";
const BROADCAST_SECRET = process.env.SOCKET_BROADCAST_SECRET || "dev-broadcast-secret";

export interface BroadcastPayload {
  event: string;
  room: string;
  data: Record<string, unknown>;
}

/**
 * Broadcast an event to a Socket.io room via the standalone server.
 * Fire-and-forget: errors are logged but never thrown.
 */
export async function broadcastToRoom(payload: BroadcastPayload): Promise<void> {
  try {
    const res = await fetch(`${SOCKET_SERVER_URL}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BROADCAST_SECRET}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn("[SOCKET_BROADCAST] Failed:", res.status, await res.text());
    }
  } catch (error) {
    // Non-critical: log and continue. The bid is already persisted.
    console.warn("[SOCKET_BROADCAST] Unreachable:", error instanceof Error ? error.message : error);
  }
}

/**
 * Broadcast a new bid event to an auction room.
 *
 * Privacy: the bidder's name and country are intentionally stripped before
 * broadcast — bidders must remain anonymous to competing buyers. The client
 * can still identify "their own" bids via `bidderId` and render "You",
 * while all other viewers see a neutral label.
 */
export async function broadcastNewBid(
  lotId: string,
  bid: {
    id: string;
    amountInr: number;
    currency: string;
    isProxy: boolean;
    createdAt: Date | string;
    bidder: { id: string; name: string; country: string };
  }
): Promise<void> {
  await broadcastToRoom({
    event: "new-bid",
    room: `auction:${lotId}`,
    data: {
      lotId,
      bid: {
        id: bid.id,
        amountInr: bid.amountInr,
        currency: bid.currency,
        isProxy: bid.isProxy,
        createdAt: bid.createdAt instanceof Date ? bid.createdAt.toISOString() : bid.createdAt,
        bidder: {
          id: bid.bidder.id,
          name: "Anonymous bidder",
          country: null,
        },
      },
    },
  });
}

/**
 * Notify a specific user that they've been outbid.
 */
export async function broadcastOutbid(
  lotId: string,
  outbidUserId: string,
  newAmount: number,
  lotNumber: string
): Promise<void> {
  await broadcastToRoom({
    event: "outbid",
    room: `auction:${lotId}`,
    data: { lotId, lotNumber, userId: outbidUserId, newAmount },
  });
}

/**
 * Broadcast auction extension due to anti-sniping.
 */
export async function broadcastAuctionExtended(
  lotId: string,
  newEndsAt: string,
  lotNumber: string
): Promise<void> {
  await broadcastToRoom({
    event: "auction-ending",
    room: `auction:${lotId}`,
    data: { lotId, lotNumber, newEndsAt },
  });
}

/**
 * Broadcast that an auction has ended.
 */
export async function broadcastAuctionEnded(
  lotId: string,
  outcome: "SOLD" | "NO_BIDS" | "BELOW_RESERVE",
  winnerId?: string,
  winningAmount?: number,
  lotNumber?: string
): Promise<void> {
  await broadcastToRoom({
    event: "auction-ended",
    room: `auction:${lotId}`,
    data: { lotId, lotNumber, outcome, winnerId, winningAmount },
  });
}
