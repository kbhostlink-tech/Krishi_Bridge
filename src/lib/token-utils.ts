import crypto from "crypto";

function getHmacSecret(): string {
  const secret = process.env.TOKEN_HMAC_SECRET;
  if (!secret) {
    throw new Error("TOKEN_HMAC_SECRET environment variable must be set");
  }
  return secret;
}

/**
 * Generate HMAC-SHA256 hash for a token payload.
 * The payload includes lotId or rfqId, ownerId, and mintedAt for uniqueness.
 */
export function generateTokenHmac(data: {
  lotId?: string | null;
  rfqId?: string | null;
  ownerId: string;
  mintedAt: string;
}): string {
  const itemId = data.lotId || data.rfqId || "unknown";
  const payload = `${itemId}:${data.ownerId}:${data.mintedAt}`;
  return crypto
    .createHmac("sha256", getHmacSecret())
    .update(payload)
    .digest("hex");
}

/**
 * Verify a token's HMAC using timing-safe comparison.
 * Returns true if the provided hash matches the expected hash.
 */
export function verifyTokenHmac(
  data: { lotId?: string | null; rfqId?: string | null; ownerId: string; mintedAt: string },
  providedHash: string
): boolean {
  const expectedHash = generateTokenHmac(data);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, "hex"),
      Buffer.from(providedHash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Calculate token expiry date (90 days from minting).
 */
export function getTokenExpiryDate(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 90);
  return expiry;
}

