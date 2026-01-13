/*
  Warnings:

  - Added the required column `activationPin` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `sponsorId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_sponsorId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activationPin" TEXT NOT NULL,
ALTER COLUMN "sponsorId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
