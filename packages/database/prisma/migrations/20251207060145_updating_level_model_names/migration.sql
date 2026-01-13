/*
  Warnings:

  - You are about to drop the column `sponsorAmount` on the `Levels` table. All the data in the column will be lost.
  - You are about to drop the column `totalactivationAmount` on the `Levels` table. All the data in the column will be lost.
  - You are about to drop the column `uplineAmount` on the `Levels` table. All the data in the column will be lost.
  - Added the required column `sponsorUpgradeAmount` to the `Levels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmountToUpgrade` to the `Levels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uplineUpgradeAmount` to the `Levels` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Levels" DROP COLUMN "sponsorAmount",
DROP COLUMN "totalactivationAmount",
DROP COLUMN "uplineAmount",
ADD COLUMN     "sponsorUpgradeAmount" INTEGER NOT NULL,
ADD COLUMN     "totalAmountToUpgrade" INTEGER NOT NULL,
ADD COLUMN     "uplineUpgradeAmount" INTEGER NOT NULL;
