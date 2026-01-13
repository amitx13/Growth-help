/*
  Warnings:

  - You are about to drop the column `sponcerId` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_sponcerId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "sponcerId",
ADD COLUMN     "sponsorId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
