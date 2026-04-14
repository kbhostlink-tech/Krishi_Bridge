/*
  Warnings:

  - A unique constraint covering the columns `[rfqId]` on the table `Token` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uniquePaymentCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'FUNDS_RELEASED';

-- DropForeignKey
ALTER TABLE "Lot" DROP CONSTRAINT "Lot_farmerId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_lotId_fkey";

-- AlterTable
ALTER TABLE "CommoditySubmission" ADD COLUMN     "bagWeight" DOUBLE PRECISION,
ADD COLUMN     "colourAroma" TEXT,
ADD COLUMN     "harvestMonth" TEXT,
ADD COLUMN     "harvestYear" INTEGER,
ADD COLUMN     "labReportUrl" TEXT,
ADD COLUMN     "moistureRange" TEXT,
ADD COLUMN     "numberOfBags" INTEGER,
ADD COLUMN     "originCertUrl" TEXT,
ADD COLUMN     "packagingType" TEXT,
ADD COLUMN     "phytosanitaryUrl" TEXT,
ADD COLUMN     "sellerDeclaration" TEXT,
ADD COLUMN     "tailCut" TEXT,
ADD COLUMN     "variety" TEXT,
ADD COLUMN     "videos" TEXT[];

-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankIfscCode" TEXT,
ADD COLUMN     "bankName" TEXT;

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "rfqId" TEXT,
ALTER COLUMN "lotId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "adminConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "adminConfirmedBy" TEXT,
ADD COLUMN     "buyerReceivedAt" TIMESTAMP(3),
ADD COLUMN     "fundsReleasedAt" TIMESTAMP(3),
ADD COLUMN     "fundsReleasedBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uniquePaymentCode" TEXT;

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSettings_key_key" ON "PlatformSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Token_rfqId_key" ON "Token"("rfqId");

-- CreateIndex
CREATE UNIQUE INDEX "User_uniquePaymentCode_key" ON "User"("uniquePaymentCode");

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RfqRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
