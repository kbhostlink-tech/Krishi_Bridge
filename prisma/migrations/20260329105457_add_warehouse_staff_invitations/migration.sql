/*
  Warnings:

  - Added the required column `updatedAt` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "email" TEXT,
ADD COLUMN     "maxCapacity" INTEGER,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "managerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "WarehouseStaff" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffRole" TEXT NOT NULL DEFAULT 'STAFF',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "WarehouseStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "staffRole" TEXT NOT NULL DEFAULT 'STAFF',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarehouseStaff_warehouseId_idx" ON "WarehouseStaff"("warehouseId");

-- CreateIndex
CREATE INDEX "WarehouseStaff_userId_idx" ON "WarehouseStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseStaff_warehouseId_userId_key" ON "WarehouseStaff"("warehouseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseInvitation_token_key" ON "WarehouseInvitation"("token");

-- CreateIndex
CREATE INDEX "WarehouseInvitation_email_idx" ON "WarehouseInvitation"("email");

-- CreateIndex
CREATE INDEX "WarehouseInvitation_token_idx" ON "WarehouseInvitation"("token");

-- CreateIndex
CREATE INDEX "WarehouseInvitation_warehouseId_idx" ON "WarehouseInvitation"("warehouseId");

-- AddForeignKey
ALTER TABLE "WarehouseStaff" ADD CONSTRAINT "WarehouseStaff_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseStaff" ADD CONSTRAINT "WarehouseStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseInvitation" ADD CONSTRAINT "WarehouseInvitation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
