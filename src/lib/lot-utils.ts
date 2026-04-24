import crypto from "crypto";
import QRCode from "qrcode";

// ─── LOT NUMBER GENERATION ──────────────────

const COMMODITY_PREFIXES: Record<string, string> = {
  LARGE_CARDAMOM: "LC",
  TEA: "TE",
  GINGER: "GI",
  TURMERIC: "TU",
  PEPPER: "PE",
  COFFEE: "CO",
  SAFFRON: "SA",
  ARECA_NUT: "AN",
  CINNAMON: "CI",
  OTHER: "OT",
};

const STATE_CODES: Record<string, string> = {
  // India
  "Sikkim": "SKM", "West Bengal": "WB", "Meghalaya": "MG", "Arunachal Pradesh": "AR",
  "Assam": "AS", "Kerala": "KL", "Karnataka": "KA", "Tamil Nadu": "TN",
  "Nagaland": "NL", "Manipur": "MN", "Mizoram": "MZ", "Tripura": "TR",
  // Nepal
  "Province 1": "P1", "Madhesh": "MD", "Bagmati": "BG", "Gandaki": "GD",
  "Lumbini": "LM", "Karnali": "KR", "Sudurpashchim": "SP",
  // Bhutan
  "Thimphu": "TH", "Paro": "PA", "Punakha": "PU", "Bumthang": "BU",
  // Gulf
  "Dubai": "DU", "Abu Dhabi": "AD", "Sharjah": "SH",
  "Riyadh": "RY", "Jeddah": "JD", "Muscat": "MS",
};

/**
 * Generate a unique lot number: {CommodityPrefix}-{StateCode}-{4digitRandom}
 * e.g., LC-SKM-8842
 */
export function generateLotNumber(commodityType: string, state: string): string {
  const prefix = COMMODITY_PREFIXES[commodityType] || "OT";
  const stateCode = STATE_CODES[state] || state.substring(0, 3).toUpperCase();
  const random = crypto.randomInt(1000, 9999);
  return `${prefix}-${stateCode}-${random}`;
}

// ─── QR CODE GENERATION ─────────────────────

const HMAC_SECRET = process.env.TOKEN_HMAC_SECRET || "dev-hmac-secret-change-me";

export interface QrPayload {
  lotId: string;
  lotNumber: string;
  commodityType: string;
  grade: string;
  quantityKg: number;
  sellerId: string;
}

/**
 * Generate HMAC-SHA256 signature for QR payload
 */
export function generateHmacSignature(payload: QrPayload): string {
  const data = JSON.stringify({
    lotId: payload.lotId,
    lotNumber: payload.lotNumber,
    commodityType: payload.commodityType,
    grade: payload.grade,
    quantityKg: payload.quantityKg,
    sellerId: payload.sellerId,
  });
  return crypto.createHmac("sha256", HMAC_SECRET).update(data).digest("hex");
}

/**
 * Verify HMAC-SHA256 signature using timing-safe comparison
 */
export function verifyHmacSignature(payload: QrPayload, signature: string): boolean {
  const expected = generateHmacSignature(payload);
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * Generate QR code image as a Buffer (PNG)
 */
export async function generateQrCodeBuffer(payload: QrPayload, signature: string): Promise<Buffer> {
  const qrData = JSON.stringify({ ...payload, signature });
  const dataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: "H",
    type: "image/png",
    width: 400,
    margin: 2,
    color: {
      dark: "#1a3a2a", // sage-900
      light: "#ffffff",
    },
  });
  // Convert data URL to buffer
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  return Buffer.from(base64, "base64");
}

export { COMMODITY_PREFIXES, STATE_CODES };

