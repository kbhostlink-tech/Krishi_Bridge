import { prisma } from "@/lib/prisma";

export interface ReferenceBand {
  lowInr: number;
  midInr: number;
  highInr: number;
  sampleCount: number;
}

const MIN_SAMPLES = 5;
const LOOKBACK_DAYS = 30;

export async function calculateReferenceBand(
  commodityType: string,
  grade?: string | null,
  country?: string | null
): Promise<ReferenceBand | null> {
  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  // Collect prices from two sources: auction final prices + accepted RFQ prices
  const [auctionPrices, rfqPrices] = await Promise.all([
    // Auction final prices: winning bids on lots with matching commodity/grade
    prisma.bid.findMany({
      where: {
        status: "WON",
        createdAt: { gte: since },
        lot: {
          commodityType: commodityType as never,
          ...(grade ? { grade: grade as never } : {}),
          ...(country ? { country: country as never } : {}),
        },
      },
      select: { amountInr: true },
    }),
    // Accepted RFQ prices: responses that were accepted
    prisma.rfqResponse.findMany({
      where: {
        status: "ACCEPTED",
        createdAt: { gte: since },
        rfq: {
          commodityType: commodityType as never,
          ...(grade ? { grade: grade as never } : {}),
          ...(country ? { deliveryCountry: country as never } : {}),
        },
      },
      select: { offeredPriceInr: true },
    }),
  ]);

  const prices: number[] = [
    ...auctionPrices.map((b) => Number(b.amountInr)),
    ...rfqPrices.map((r) => Number(r.offeredPriceInr)),
  ].filter((p) => p > 0);

  if (prices.length < MIN_SAMPLES) return null;

  prices.sort((a, b) => a - b);

  const sum = prices.reduce((acc, p) => acc + p, 0);

  return {
    lowInr: prices[0],
    midInr: sum / prices.length,
    highInr: prices[prices.length - 1],
    sampleCount: prices.length,
  };
}
