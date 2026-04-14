-- Flow Realignment Migration
-- Removes WAREHOUSE_STAFF role, adds CommoditySubmission, restructures Lot model

-- 1. Create SubmissionStatus enum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'LISTED', 'REJECTED');

-- 2. Create CommoditySubmission table
CREATE TABLE "CommoditySubmission" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "commodityType" "CommodityType" NOT NULL,
    "grade" "Grade",
    "quantityKg" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "images" TEXT[],
    "origin" JSONB NOT NULL,
    "harvestDate" TIMESTAMP(3),
    "harvestSeason" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "adminRemarks" TEXT,
    "lotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommoditySubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommoditySubmission_farmerId_idx" ON "CommoditySubmission"("farmerId");
CREATE INDEX "CommoditySubmission_status_idx" ON "CommoditySubmission"("status");
CREATE INDEX "CommoditySubmission_commodityType_idx" ON "CommoditySubmission"("commodityType");

ALTER TABLE "CommoditySubmission" ADD CONSTRAINT "CommoditySubmission_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Add sellerId to Lot (nullable first for data migration)
ALTER TABLE "Lot" ADD COLUMN "sellerId" TEXT;
ALTER TABLE "Lot" ADD COLUMN "submissionId" TEXT;

-- 4. Migrate existing lots: set sellerId = farmerId (existing lots were created by the same person)
UPDATE "Lot" SET "sellerId" = "farmerId" WHERE "sellerId" IS NULL;

-- 5. Now make sellerId required
ALTER TABLE "Lot" ALTER COLUMN "sellerId" SET NOT NULL;

-- 6. Make farmerId optional (nullable)
ALTER TABLE "Lot" ALTER COLUMN "farmerId" DROP NOT NULL;

-- 7. Make warehouseId optional (nullable)
ALTER TABLE "Lot" ALTER COLUMN "warehouseId" DROP NOT NULL;

-- 8. Add foreign key for sellerId
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Update Lot indexes
CREATE INDEX "Lot_sellerId_idx" ON "Lot"("sellerId");

-- 10. Update any WAREHOUSE_STAFF users to SELLER role before removing enum value
UPDATE "User" SET "role" = 'SELLER' WHERE "role" = 'WAREHOUSE_STAFF';

-- 11. Migrate lot status: INTAKE -> DRAFT
UPDATE "Lot" SET "status" = 'DRAFT' WHERE "status" = 'INTAKE';

-- 12. Drop WarehouseStaff table (remove FK constraints first)
ALTER TABLE "WarehouseStaff" DROP CONSTRAINT IF EXISTS "WarehouseStaff_warehouseId_fkey";
ALTER TABLE "WarehouseStaff" DROP CONSTRAINT IF EXISTS "WarehouseStaff_userId_fkey";
DROP TABLE "WarehouseStaff";

-- 13. Drop WarehouseInvitation table
ALTER TABLE "WarehouseInvitation" DROP CONSTRAINT IF EXISTS "WarehouseInvitation_warehouseId_fkey";
DROP TABLE "WarehouseInvitation";

-- 14. Remove warehouse FK from Lot (drop and re-add as optional)
ALTER TABLE "Lot" DROP CONSTRAINT IF EXISTS "Lot_warehouseId_fkey";
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 15. Remove staff and invitations relations from Warehouse (handled by dropping tables above)

-- 16. Recreate UserRole enum without WAREHOUSE_STAFF
-- PostgreSQL requires creating a new type and migrating
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('FARMER', 'BUYER', 'SELLER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole";
DROP TYPE "UserRole_old";

-- 17. Recreate LotStatus enum without INTAKE
-- Must drop default before changing type
ALTER TABLE "Lot" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "LotStatus" RENAME TO "LotStatus_old";
CREATE TYPE "LotStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'LISTED', 'AUCTION_ACTIVE', 'UNDER_RFQ', 'SOLD', 'REDEEMED', 'EXPIRED', 'CANCELLED');
ALTER TABLE "Lot" ALTER COLUMN "status" TYPE "LotStatus" USING "status"::text::"LotStatus";
DROP TYPE "LotStatus_old";

-- 18. Change Lot default status to DRAFT
ALTER TABLE "Lot" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"LotStatus";
