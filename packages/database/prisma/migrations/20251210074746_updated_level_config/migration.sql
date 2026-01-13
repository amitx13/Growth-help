/*
  Warnings:

  - You are about to drop the column `uplineAmount` on the `level_configs` table. All the data in the column will be lost.
  - Added the required column `reentryCount` to the `level_configs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `upgradeAmount` to the `level_configs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "level_configs" DROP COLUMN "uplineAmount",
ADD COLUMN     "reentryCount" INTEGER NOT NULL,
ADD COLUMN     "upgradeAmount" INTEGER NOT NULL,
ADD COLUMN     "upgradeAtPayment" INTEGER;
