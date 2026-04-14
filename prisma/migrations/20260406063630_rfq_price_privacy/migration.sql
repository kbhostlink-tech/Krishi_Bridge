-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RfqStatus" ADD VALUE 'ROUTED';
ALTER TYPE "RfqStatus" ADD VALUE 'SELECTED';

-- AlterTable
ALTER TABLE "RfqRequest" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "finalPriceUsd" DECIMAL(65,30),
ADD COLUMN     "routedSellerIds" TEXT[],
ADD COLUMN     "selectedResponseId" TEXT;
