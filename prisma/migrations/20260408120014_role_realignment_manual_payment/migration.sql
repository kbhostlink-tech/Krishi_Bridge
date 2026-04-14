-- Role Realignment & Manual Payment Migration
-- Renames SELLER role to AGGREGATOR, adds manual payment support

-- 1. Rename SELLER → AGGREGATOR in UserRole enum
-- Must create new type first, then convert
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('FARMER', 'BUYER', 'AGGREGATOR', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE WHEN "role"::text = 'SELLER' THEN 'AGGREGATOR'::"UserRole"
       ELSE "role"::text::"UserRole"
  END
);
DROP TYPE "UserRole_old";

-- 2. Add MANUAL_OFFLINE to PaymentMethod enum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'MANUAL_OFFLINE';

-- 3. Add MANUAL_CONFIRMED to PaymentStatus enum
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'MANUAL_CONFIRMED';

-- 4. Add manual payment fields to Transaction
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "manualPaymentRef" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "manualConfirmedBy" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "manualConfirmedAt" TIMESTAMP(3);

-- 5. Add new fields to BuyerProfile
ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "contactDesignation" TEXT;
ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "alternateContact" TEXT;
ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "mobile" TEXT;

-- 6. Add new fields to SellerProfile
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "contactPersonName" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "mobile" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "languagePreference" TEXT;
