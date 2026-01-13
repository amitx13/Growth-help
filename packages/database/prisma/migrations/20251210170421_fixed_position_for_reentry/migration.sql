/*
  Warnings:

  - You are about to drop the column `placedUnderUserId` on the `positions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "positions" DROP CONSTRAINT "positions_placedUnderUserId_fkey";

-- DropIndex
DROP INDEX "positions_placedUnderUserId_idx";

-- AlterTable
ALTER TABLE "positions" DROP COLUMN "placedUnderUserId",
ADD COLUMN     "placedUnderPositionId" TEXT;

-- CreateIndex
CREATE INDEX "positions_placedUnderPositionId_idx" ON "positions"("placedUnderPositionId");

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_placedUnderPositionId_fkey" FOREIGN KEY ("placedUnderPositionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
