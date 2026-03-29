import { z } from "zod";

// ─── AUTH SCHEMAS ────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  role: z.enum(["FARMER", "BUYER"]),
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
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

// ─── WAREHOUSE SCHEMAS ───────────────────────

export const warehouseIntakeSchema = z.object({
  farmerId: z.string().uuid("Invalid farmer ID"),
  warehouseId: z.string().uuid("Invalid warehouse ID"),
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
  // Quality check fields
  moisturePct: z.number().min(0).max(100).optional(),
  podSizeMm: z.number().min(0).max(100).optional(),
  colourGrade: z.string().max(50).optional(),
  inspectorNotes: z.string().max(2000).optional(),
});

export const lotUpdateSchema = z.object({
  description: z.string().max(2000).optional(),
  listingMode: z.enum(["AUCTION", "RFQ", "BOTH"]).optional(),
  startingPriceUsd: z.number().positive("Price must be positive").optional(),
  reservePriceUsd: z.number().positive("Reserve price must be positive").optional(),
  auctionStartsAt: z.string().datetime().optional(),
  auctionEndsAt: z.string().datetime().optional(),
});

export const lotPublishSchema = z.object({
  listingMode: z.enum(["AUCTION", "RFQ", "BOTH"]),
  startingPriceUsd: z.number().positive("Price must be positive").optional(),
  reservePriceUsd: z.number().positive("Reserve price must be positive").optional(),
  auctionStartsAt: z.string().datetime().optional(),
  auctionEndsAt: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.listingMode === "AUCTION" || data.listingMode === "BOTH") {
      return !!data.startingPriceUsd && !!data.auctionStartsAt && !!data.auctionEndsAt;
    }
    return true;
  },
  { message: "Auction listings require starting price and auction schedule" }
);

// ─── TYPE EXPORTS ────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type WarehouseIntakeInput = z.infer<typeof warehouseIntakeSchema>;
export type LotUpdateInput = z.infer<typeof lotUpdateSchema>;
export type LotPublishInput = z.infer<typeof lotPublishSchema>;
