-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RestaurantStatus" ADD VALUE 'PENDING';
ALTER TYPE "RestaurantStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "resubmitTokenHash" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submitterEmail" TEXT,
ADD COLUMN     "submitterName" TEXT,
ADD COLUMN     "submitterPhone" TEXT,
ADD COLUMN     "websiteUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_resubmitTokenHash_key" ON "Restaurant"("resubmitTokenHash");

