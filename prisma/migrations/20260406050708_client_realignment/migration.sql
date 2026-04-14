-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('INDIVIDUAL_FARMER', 'AGGREGATOR', 'FPO_COOPERATIVE', 'TRADER', 'PROCESSOR');

-- CreateEnum
CREATE TYPE "BuyerType" AS ENUM ('IMPORTER', 'EXPORTER', 'BLENDER_PROCESSOR', 'WHOLESALER', 'INSTITUTIONAL', 'TRADER');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'COMPLIANCE_ADMIN', 'OPS_ADMIN', 'DATA_AUDIT_ADMIN', 'READ_ONLY_ADMIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LotStatus" ADD VALUE 'DRAFT';
ALTER TYPE "LotStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "LotStatus" ADD VALUE 'UNDER_RFQ';
ALTER TYPE "LotStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'ESCROW_HELD';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SELLER';

-- AlterTable
ALTER TABLE "Lot" ADD COLUMN     "labReportUrl" TEXT,
ADD COLUMN     "originCertUrl" TEXT,
ADD COLUMN     "phytosanitaryUrl" TEXT,
ADD COLUMN     "sellerDeclaration" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "escrowReleasedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminRole" "AdminRole";

-- CreateTable
CREATE TABLE "BuyerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeName" TEXT,
    "buyerType" "BuyerType" NOT NULL,
    "fullAddress" TEXT NOT NULL,
    "website" TEXT,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "importExportLicense" TEXT,
    "yearsInBusiness" INTEGER,
    "typicalMonthlyVolumeMin" DOUBLE PRECISION,
    "typicalMonthlyVolumeMax" DOUBLE PRECISION,
    "preferredOrigins" TEXT[],
    "preferredGrades" TEXT[],
    "packagingPreference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sellerType" "SellerType" NOT NULL,
    "entityName" TEXT,
    "state" TEXT,
    "district" TEXT,
    "village" TEXT,
    "registrationId" TEXT,
    "fpoName" TEXT,
    "yearsOfActivity" INTEGER,
    "typicalAnnualVolume" DOUBLE PRECISION,
    "originRegion" TEXT,
    "harvestSeason" TEXT,
    "postHarvestProcess" TEXT,
    "indicativePriceExpectation" DOUBLE PRECISION,
    "minAcceptableQuantity" DOUBLE PRECISION,
    "willingToNegotiate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_userId_key" ON "BuyerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");

-- AddForeignKey
ALTER TABLE "BuyerProfile" ADD CONSTRAINT "BuyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
