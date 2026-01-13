/*
  Warnings:

  - The values [SPONSORINCOME] on the enum `PaymentType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `receiverId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `isUpgradeable` on the `user_levels` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_levels` table. All the data in the column will be lost.
  - You are about to drop the column `currentLevel` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `membership` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `upgrade_requests` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[positionId,levelNumber]` on the table `user_levels` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiverPositionId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderPositionId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `positionId` to the `user_levels` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PositionType" AS ENUM ('ORIGINAL', 'REENTRY');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('SPONSOR_PAYMENT', 'REENTRY', 'UPGRADE');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentType_new" AS ENUM ('ACTIVATION', 'UPGRADE', 'SPONSOR_PAYMENT', 'LEVEL_INCOME');
ALTER TABLE "payments" ALTER COLUMN "paymentType" TYPE "PaymentType_new" USING ("paymentType"::text::"PaymentType_new");
ALTER TYPE "PaymentType" RENAME TO "PaymentType_old";
ALTER TYPE "PaymentType_new" RENAME TO "PaymentType";
DROP TYPE "public"."PaymentType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_senderId_fkey";

-- DropForeignKey
ALTER TABLE "upgrade_requests" DROP CONSTRAINT "upgrade_requests_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_levels" DROP CONSTRAINT "user_levels_userId_fkey";

-- DropIndex
DROP INDEX "payments_receiverId_idx";

-- DropIndex
DROP INDEX "payments_senderId_idx";

-- DropIndex
DROP INDEX "user_levels_userId_idx";

-- DropIndex
DROP INDEX "user_levels_userId_levelNumber_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "receiverPositionId" TEXT NOT NULL,
ADD COLUMN     "senderPositionId" TEXT NOT NULL,
ALTER COLUMN "upgradeToLevel" DROP NOT NULL,
ALTER COLUMN "paymentToLevel" DROP NOT NULL,
ALTER COLUMN "screenshotUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_levels" DROP COLUMN "isUpgradeable",
DROP COLUMN "userId",
ADD COLUMN     "positionId" TEXT NOT NULL,
ADD COLUMN     "sponsorPaid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "currentLevel",
DROP COLUMN "membership";

-- DropTable
DROP TABLE "upgrade_requests";

-- DropEnum
DROP TYPE "UpgradeStatus";

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionType" "PositionType" NOT NULL,
    "placedUnderUserId" TEXT,
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "directReferralCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_links" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "linkType" "LinkType" NOT NULL,
    "amount" INTEGER,
    "targetLevel" INTEGER,
    "reentryCount" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "positions_userId_idx" ON "positions"("userId");

-- CreateIndex
CREATE INDEX "positions_placedUnderUserId_idx" ON "positions"("placedUnderUserId");

-- CreateIndex
CREATE INDEX "positions_currentLevel_idx" ON "positions"("currentLevel");

-- CreateIndex
CREATE INDEX "positions_isBlocked_idx" ON "positions"("isBlocked");

-- CreateIndex
CREATE INDEX "pending_links_positionId_idx" ON "pending_links"("positionId");

-- CreateIndex
CREATE INDEX "pending_links_linkType_idx" ON "pending_links"("linkType");

-- CreateIndex
CREATE INDEX "pending_links_isCompleted_idx" ON "pending_links"("isCompleted");

-- CreateIndex
CREATE INDEX "payments_senderPositionId_idx" ON "payments"("senderPositionId");

-- CreateIndex
CREATE INDEX "payments_receiverPositionId_idx" ON "payments"("receiverPositionId");

-- CreateIndex
CREATE INDEX "payments_paymentType_idx" ON "payments"("paymentType");

-- CreateIndex
CREATE INDEX "user_levels_positionId_idx" ON "user_levels"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_levels_positionId_levelNumber_key" ON "user_levels"("positionId", "levelNumber");

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_placedUnderUserId_fkey" FOREIGN KEY ("placedUnderUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_levels" ADD CONSTRAINT "user_levels_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_senderPositionId_fkey" FOREIGN KEY ("senderPositionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receiverPositionId_fkey" FOREIGN KEY ("receiverPositionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_links" ADD CONSTRAINT "pending_links_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
