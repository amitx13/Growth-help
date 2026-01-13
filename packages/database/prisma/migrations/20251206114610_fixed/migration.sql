-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_sponsorId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "sponsorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
