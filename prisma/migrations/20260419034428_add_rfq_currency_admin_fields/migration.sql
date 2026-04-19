-- AlterTable
ALTER TABLE "RfqRequest" ADD COLUMN     "adminPriceInr" DECIMAL(65,30),
ADD COLUMN     "targetCurrency" "CurrencyCode";

-- AlterTable
ALTER TABLE "RfqResponse" ADD COLUMN     "adminEditedPriceInr" DECIMAL(65,30),
ADD COLUMN     "adminForwarded" BOOLEAN NOT NULL DEFAULT false;
