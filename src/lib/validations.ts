import { z } from "zod";

// ─── AUTH SCHEMAS ────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};':",./<>?\\|`~])/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  role: z.enum(["FARMER", "AGGREGATOR", "BUYER"]),
  country: z.enum(["IN", "NP", "BT", "AE", "SA", "OM"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
  userId: z.string().uuid(),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  preferredLang: z.enum(["en", "hi", "ne", "dz", "ar"]).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};':",./<>?\\|`~])/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

// ─── COMMODITY SUBMISSION SCHEMAS (Farmer) ───

export const commoditySubmissionSchema = z.object({
  commodityType: z.enum([
    "LARGE_CARDAMOM", "TEA", "GINGER", "TURMERIC", "PEPPER",
    "COFFEE", "SAFFRON", "ARECA_NUT", "CINNAMON", "OTHER",
  ]),
  grade: z.enum(["PREMIUM", "A", "B", "C"]).optional(),
  variety: z.string().max(200).optional(),
  quantityKg: z.number().positive("Quantity must be positive").max(100000, "Quantity too large"),
  numberOfBags: z.number().int().positive().max(10000).optional(),
  bagWeight: z.number().positive().max(1000).optional(),
  packagingType: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  origin: z.object({
    country: z.enum(["IN", "NP", "BT", "AE", "SA", "OM"]),
    state: z.string().min(1, "State is required").max(100),
    district: z.string().min(1, "District is required").max(100),
    village: z.string().max(100).optional(),
  }),
  harvestDate: z.string().datetime().optional(),
  harvestYear: z.number().int().min(2000).max(2100).optional(),
  harvestMonth: z.string().max(20).optional(),
  harvestSeason: z.string().max(100).optional(),
  // Product specifications
  moistureRange: z.string().max(50).optional(),
  colourAroma: z.string().max(500).optional(),
  tailCut: z.string().max(50).optional(),
  // Compliance
  sellerDeclaration: z.string().max(5000).optional(),
});

export const commoditySubmissionUpdateSchema = z.object({
  commodityType: z.enum([
    "LARGE_CARDAMOM", "TEA", "GINGER", "TURMERIC", "PEPPER",
    "COFFEE", "SAFFRON", "ARECA_NUT", "CINNAMON", "OTHER",
  ]).optional(),
  grade: z.enum(["PREMIUM", "A", "B", "C"]).optional(),
  variety: z.string().max(200).optional(),
  quantityKg: z.number().positive("Quantity must be positive").max(100000).optional(),
  numberOfBags: z.number().int().positive().max(10000).optional().nullable(),
  bagWeight: z.number().positive().max(1000).optional().nullable(),
  packagingType: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  origin: z.object({
    country: z.enum(["IN", "NP", "BT", "AE", "SA", "OM"]),
    state: z.string().min(1).max(100),
    district: z.string().min(1).max(100),
    village: z.string().max(100).optional(),
  }).optional(),
  harvestDate: z.string().datetime().optional(),
  harvestYear: z.number().int().min(2000).max(2100).optional().nullable(),
  harvestMonth: z.string().max(20).optional(),
  harvestSeason: z.string().max(100).optional(),
  moistureRange: z.string().max(50).optional(),
  colourAroma: z.string().max(500).optional(),
  tailCut: z.string().max(50).optional(),
  sellerDeclaration: z.string().max(5000).optional(),
});

// ─── SELLER LISTING SCHEMAS ──────────────────

export const createListingSchema = z.object({
  commodityType: z.enum([
    "LARGE_CARDAMOM", "TEA", "GINGER", "TURMERIC", "PEPPER",
    "COFFEE", "SAFFRON", "ARECA_NUT", "CINNAMON", "OTHER",
  ]),
  grade: z.enum(["PREMIUM", "A", "B", "C"]),
  quantityKg: z.number().positive("Quantity must be positive").max(100000, "Quantity too large"),
  description: z.string().max(2000).optional(),
  origin: z.object({
    country: z.enum(["IN", "NP", "BT", "AE", "SA", "OM"]),
    state: z.string().min(1, "State is required").max(100),
    district: z.string().min(1, "District is required").max(100),
    village: z.string().max(100).optional(),
  }),
  listingMode: z.enum(["AUCTION", "RFQ", "BOTH"]).optional().default("AUCTION"),
  warehouseId: z.string().uuid("Invalid warehouse ID").optional(),
  submissionId: z.string().uuid("Invalid submission ID").optional(),
  farmerId: z.string().uuid("Invalid farmer ID").optional(),
  // Quality check fields (optional)
  moisturePct: z.number().min(0).max(100).optional(),
  podSizeMm: z.number().min(0).max(100).optional(),
  colourGrade: z.string().max(50).optional(),
  inspectorNotes: z.string().max(2000).optional(),
});

export const lotUpdateSchema = z.object({
  description: z.string().max(2000).optional(),
  listingMode: z.enum(["AUCTION", "RFQ", "BOTH"]).optional(),
  startingPriceInr: z.number().positive("Price must be positive").optional(),
  reservePriceInr: z.number().positive("Reserve price must be positive").optional(),
  auctionStartsAt: z.string().datetime().optional(),
  auctionEndsAt: z.string().datetime().optional(),
});

export const lotPublishSchema = z.object({
  listingMode: z.enum(["AUCTION", "RFQ", "BOTH"]),
  startingPriceInr: z.number().positive("Price must be positive").optional(),
  reservePriceInr: z.number().positive("Reserve price must be positive").optional(),
  auctionStartsAt: z.string().datetime().optional(),
  auctionEndsAt: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.listingMode === "AUCTION" || data.listingMode === "BOTH") {
      return !!data.startingPriceInr && !!data.auctionStartsAt && !!data.auctionEndsAt;
    }
    return true;
  },
  { message: "Auction listings require starting price and auction schedule" }
);

// ─── BIDDING SCHEMAS ─────────────────────────

export const placeBidSchema = z.object({
  lotId: z.string().uuid("Invalid lot ID"),
  amount: z.number().positive("Bid amount must be positive"),
  currency: z.enum(["INR", "NPR", "BTN", "AED", "SAR", "OMR", "USD"]),
  isProxy: z.boolean().optional().default(false),
  maxProxyAmount: z.number().positive("Max proxy amount must be positive").optional(),
}).refine(
  (data) => {
    if (data.isProxy && !data.maxProxyAmount) return false;
    if (data.maxProxyAmount && data.maxProxyAmount < data.amount) return false;
    return true;
  },
  { message: "Proxy bids require maxProxyAmount >= bid amount" }
);

// ─── RFQ SCHEMAS ─────────────────────────────

export const createRfqSchema = z.object({
  commodityType: z.enum([
    "LARGE_CARDAMOM", "TEA", "GINGER", "TURMERIC", "PEPPER",
    "COFFEE", "SAFFRON", "ARECA_NUT", "CINNAMON", "OTHER",
  ]),
  grade: z.enum(["PREMIUM", "A", "B", "C"]).optional(),
  quantityKg: z.number().positive("Quantity must be positive").min(1, "Minimum 1 kg"),
  targetPriceInr: z.number().positive("Price must be positive").optional(),
  deliveryCountry: z.enum(["IN", "NP", "BT", "AE", "SA", "OM"]),
  deliveryCity: z.string().min(1, "City is required").max(100),
  description: z.string().max(2000).optional(),
  expiresInDays: z.number().int().min(1).max(30).optional().default(7),
});

export const rfqResponseSchema = z.object({
  offeredPriceInr: z.number().positive("Price must be positive"),
  currency: z.enum(["INR", "NPR", "BTN", "AED", "SAR", "OMR", "USD"]),
  deliveryDays: z.number().int().positive("Delivery days must be positive").max(365),
  lotId: z.string().uuid("Invalid lot ID").optional(),
  notes: z.string().max(2000).optional(),
});

export const rfqNegotiationSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  proposedPriceInr: z.number().positive("Price must be positive").optional(),
  proposedQuantityKg: z.number().positive("Quantity must be positive").optional(),
});

// ─── PAYMENT SCHEMAS ─────────────────────────

export const createPaymentSchema = z.object({
  lotId: z.string().uuid("Invalid lot ID").optional(),
  rfqId: z.string().uuid("Invalid RFQ ID").optional(),
  responseId: z.string().uuid("Invalid response ID").optional(),
  preferredMethod: z.enum([
    "UPI", "CARD", "NET_BANKING", "ESEWA", "KHALTI",
    "BANK_TRANSFER", "STRIPE", "TAP", "WISE",
  ]).optional(),
}).refine(
  (data) => data.lotId || data.rfqId,
  { message: "Either lotId or rfqId is required" }
);

export const confirmBankTransferSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  bankReference: z.string().min(1, "Bank reference is required").max(100),
  remarks: z.string().max(500).optional(),
});

// ─── TOKEN SCHEMAS ───────────────────────────

export const tokenTransferSchema = z.object({
  toEmail: z.string().email("Invalid recipient email"),
  priceInr: z.number().nonnegative("Price cannot be negative").optional(),
});

export const tokenVerifySchema = z.object({
  tokenId: z.string().uuid("Invalid token ID"),
  hmacHash: z.string().min(1, "HMAC hash is required"),
});

// ─── BUYER / SELLER PROFILE SCHEMAS ──────────

export const buyerProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200),
  tradeName: z.string().max(200).optional().or(z.literal("")),
  buyerType: z.enum(["IMPORTER", "EXPORTER", "BLENDER_PROCESSOR", "WHOLESALER", "INSTITUTIONAL", "TRADER"]),
  fullAddress: z.string().min(1, "Address is required").max(1000),
  city: z.string().max(100).optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  contactDesignation: z.string().max(100).optional().or(z.literal("")),
  alternateContact: z.string().max(200).optional().or(z.literal("")),
  mobile: z.string().max(20).optional().or(z.literal("")),
  registrationNumber: z.string().max(100).optional().or(z.literal("")),
  taxId: z.string().max(100).optional().or(z.literal("")),
  importExportLicense: z.string().max(100).optional().or(z.literal("")),
  yearsInBusiness: z.number().int().min(0).max(200).optional().nullable(),
  typicalMonthlyVolumeMin: z.number().min(0).optional().nullable(),
  typicalMonthlyVolumeMax: z.number().min(0).optional().nullable(),
  preferredOrigins: z.array(z.string()).optional().default([]),
  preferredGrades: z.array(z.string()).optional().default([]),
  packagingPreference: z.string().max(500).optional().or(z.literal("")),
});

export const sellerProfileSchema = z.object({
  sellerType: z.enum(["INDIVIDUAL_FARMER", "AGGREGATOR", "FPO_COOPERATIVE", "TRADER", "PROCESSOR"]),
  entityName: z.string().max(200).optional().or(z.literal("")),
  contactPersonName: z.string().max(200).optional().or(z.literal("")),
  mobile: z.string().max(20).optional().or(z.literal("")),
  languagePreference: z.string().max(50).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  district: z.string().max(100).optional().or(z.literal("")),
  village: z.string().max(100).optional().or(z.literal("")),
  registrationId: z.string().max(100).optional().or(z.literal("")),
  fpoName: z.string().max(200).optional().or(z.literal("")),
  yearsOfActivity: z.number().int().min(0).max(200).optional().nullable(),
  typicalAnnualVolume: z.number().min(0).optional().nullable(),
  originRegion: z.string().max(200).optional().or(z.literal("")),
  harvestSeason: z.string().max(200).optional().or(z.literal("")),
  postHarvestProcess: z.string().max(500).optional().or(z.literal("")),
  indicativePriceExpectation: z.number().min(0).optional().nullable(),
  minAcceptableQuantity: z.number().min(0).optional().nullable(),
  willingToNegotiate: z.boolean().optional().default(true),
  bankAccountName: z.string().max(200).optional().or(z.literal("")),
  bankAccountNumber: z.string().max(50).optional().or(z.literal("")),
  bankName: z.string().max(200).optional().or(z.literal("")),
  bankBranch: z.string().max(200).optional().or(z.literal("")),
  bankIfscCode: z.string().max(20).optional().or(z.literal("")),
});

// ─── TYPE EXPORTS ────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CommoditySubmissionInput = z.infer<typeof commoditySubmissionSchema>;
export type LotUpdateInput = z.infer<typeof lotUpdateSchema>;
export type LotPublishInput = z.infer<typeof lotPublishSchema>;
export type PlaceBidInput = z.infer<typeof placeBidSchema>;
export type CreateRfqInput = z.infer<typeof createRfqSchema>;
export type RfqResponseInput = z.infer<typeof rfqResponseSchema>;
export type RfqNegotiationInput = z.infer<typeof rfqNegotiationSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ConfirmBankTransferInput = z.infer<typeof confirmBankTransferSchema>;
export type TokenTransferInput = z.infer<typeof tokenTransferSchema>;
export type TokenVerifyInput = z.infer<typeof tokenVerifySchema>;
export type BuyerProfileInput = z.infer<typeof buyerProfileSchema>;
export type SellerProfileInput = z.infer<typeof sellerProfileSchema>;
