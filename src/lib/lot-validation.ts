type LotAuctionField = "startingPriceInr" | "reservePriceInr" | "auctionStartsAt" | "auctionEndsAt";

export type LotAuctionFieldErrors = Partial<Record<LotAuctionField, string[]>>;

interface LotAuctionValidationInput {
  listingMode?: string | null;
  startingPriceInr?: number | null;
  reservePriceInr?: number | null;
  auctionStartsAt?: string | Date | null;
  auctionEndsAt?: string | Date | null;
  requireFutureStart?: boolean;
  requireFutureEnd?: boolean;
  now?: Date;
}

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function getLotAuctionFieldErrors(input: LotAuctionValidationInput): LotAuctionFieldErrors {
  const errors: LotAuctionFieldErrors = {};
  const needsAuction = input.listingMode === "AUCTION" || input.listingMode === "BOTH";

  if (!needsAuction) {
    return errors;
  }

  const now = input.now ?? new Date();
  const start = parseDate(input.auctionStartsAt);
  const end = parseDate(input.auctionEndsAt);

  if (!isPositiveNumber(input.startingPriceInr)) {
    errors.startingPriceInr = ["Add a valid starting price to enable auction bidding."];
  }

  if (!start) {
    errors.auctionStartsAt = ["Select when bidding should open."];
  } else if (input.requireFutureStart !== false && start.getTime() <= now.getTime()) {
    errors.auctionStartsAt = ["Auction start must be in the future."];
  }

  if (!end) {
    errors.auctionEndsAt = ["Select when bidding should close."];
  } else {
    if (input.requireFutureEnd !== false && end.getTime() <= now.getTime()) {
      errors.auctionEndsAt = ["Auction end must be in the future."];
    }

    if (start && end.getTime() <= start.getTime()) {
      errors.auctionEndsAt = ["Auction end must be later than the start time."];
    }
  }

  if (
    isPositiveNumber(input.startingPriceInr) &&
    isPositiveNumber(input.reservePriceInr) &&
    input.reservePriceInr < input.startingPriceInr
  ) {
    errors.reservePriceInr = ["Reserve price must be equal to or higher than the starting price."];
  }

  return errors;
}

export function hasLotAuctionFieldErrors(errors: LotAuctionFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function getFirstLotAuctionError(errors: LotAuctionFieldErrors): string | undefined {
  return Object.values(errors).flat()[0];
}