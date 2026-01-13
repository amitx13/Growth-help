/*
  Warnings:

  - You are about to drop the column `referralAmount` on the `Levels` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Levels" DROP COLUMN "referralAmount";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "directReferralAmount" INTEGER NOT NULL DEFAULT 500;
