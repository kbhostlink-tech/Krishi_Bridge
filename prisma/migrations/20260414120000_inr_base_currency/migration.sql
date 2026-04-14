-- Rename all *Usd columns to *Inr (changing base currency from USD to INR)

-- Lot table
ALTER TABLE "Lot" RENAME COLUMN "startingPriceUsd" TO "startingPriceInr";
ALTER TABLE "Lot" RENAME COLUMN "reservePriceUsd" TO "reservePriceInr";

-- Bid table
ALTER TABLE "Bid" RENAME COLUMN "amountUsd" TO "amountInr";
ALTER TABLE "Bid" RENAME COLUMN "maxProxyUsd" TO "maxProxyInr";

-- Drop and recreate the index on Bid for the renamed column
DROP INDEX IF EXISTS "Bid_lotId_amountUsd_idx";
CREATE INDEX "Bid_lotId_amountInr_idx" ON "Bid"("lotId", "amountInr");

-- TokenTransfer table
ALTER TABLE "TokenTransfer" RENAME COLUMN "priceUsd" TO "priceInr";

-- RfqRequest table
ALTER TABLE "RfqRequest" RENAME COLUMN "targetPriceUsd" TO "targetPriceInr";
ALTER TABLE "RfqRequest" RENAME COLUMN "finalPriceUsd" TO "finalPriceInr";

-- RfqResponse table
ALTER TABLE "RfqResponse" RENAME COLUMN "offeredPriceUsd" TO "offeredPriceInr";

-- RfqNegotiation table
ALTER TABLE "RfqNegotiation" RENAME COLUMN "proposedPriceUsd" TO "proposedPriceInr";

-- Update FxRate records: change base from USD to INR
-- Existing rates are USD→X. We need to delete them and let the new cron (INR base) repopulate.
DELETE FROM "FxRate";
