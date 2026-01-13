/*
  Warnings:

  - You are about to drop the column `directReferralAmount` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `Levels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserLevel` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ACTIVATION', 'UPGRADE', 'SPONSORINCOME');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UpgradeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "UserLevel" DROP CONSTRAINT "UserLevel_levelId_fkey";

-- DropForeignKey
ALTER TABLE "UserLevel" DROP CONSTRAINT "UserLevel_userId_fkey";

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_userId_fkey";

-- DropForeignKey
ALTER TABLE "bank_details" DROP CONSTRAINT "bank_details_userId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "directReferralAmount",
ADD COLUMN     "currentLevel" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Levels";

-- DropTable
DROP TABLE "UserLevel";

-- CreateTable
CREATE TABLE "level_configs" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "sponsorAmount" INTEGER NOT NULL,
    "uplineAmount" INTEGER NOT NULL,
    "paymentCapacity" INTEGER NOT NULL,

    CONSTRAINT "level_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_levels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "paymentsReceived" INTEGER NOT NULL DEFAULT 0,
    "amountEarned" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "paymentCapacity" INTEGER NOT NULL,
    "isUpgradeable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upgrade_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "sponsorConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "uplineConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "UpgradeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upgrade_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "upgradeToLevel" INTEGER NOT NULL,
    "paymentToLevel" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "screenshotUrl" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "paymentType" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toLevel" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "level_configs_level_key" ON "level_configs"("level");

-- CreateIndex
CREATE UNIQUE INDEX "user_levels_userId_levelNumber_key" ON "user_levels"("userId", "levelNumber");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_details" ADD CONSTRAINT "bank_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_levels" ADD CONSTRAINT "user_levels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upgrade_requests" ADD CONSTRAINT "upgrade_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_logs" ADD CONSTRAINT "commission_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
