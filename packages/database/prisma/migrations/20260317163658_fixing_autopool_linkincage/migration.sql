/*
  Warnings:

  - You are about to drop the column `userId` on the `autopool_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `autopool_pending_links` table. All the data in the column will be lost.
  - Added the required column `positionId` to the `autopool_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "autopool_accounts" DROP CONSTRAINT "autopool_accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "autopool_pending_links" DROP CONSTRAINT "autopool_pending_links_userId_fkey";

-- DropIndex
DROP INDEX "autopool_accounts_userId_idx";

-- DropIndex
DROP INDEX "autopool_pending_links_userId_idx";

-- AlterTable
ALTER TABLE "autopool_accounts" DROP COLUMN "userId",
ADD COLUMN     "positionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "autopool_pending_links" DROP COLUMN "userId",
ADD COLUMN     "positionId" TEXT;

-- CreateIndex
CREATE INDEX "autopool_accounts_positionId_idx" ON "autopool_accounts"("positionId");

-- CreateIndex
CREATE INDEX "autopool_pending_links_positionId_idx" ON "autopool_pending_links"("positionId");

-- AddForeignKey
ALTER TABLE "autopool_accounts" ADD CONSTRAINT "autopool_accounts_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopool_pending_links" ADD CONSTRAINT "autopool_pending_links_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
