/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `bank_details` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bank_details" ADD COLUMN     "gPay" TEXT,
ADD COLUMN     "qrCode" TEXT,
ADD COLUMN     "upiId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bank_details_userId_key" ON "bank_details"("userId");
