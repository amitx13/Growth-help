-- AlterEnum
ALTER TYPE "AutopoolLinkType" ADD VALUE 'ENTRY';

-- AlterTable
ALTER TABLE "autopool_pending_links" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "accountId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "autopool_pending_links_userId_idx" ON "autopool_pending_links"("userId");

-- AddForeignKey
ALTER TABLE "autopool_pending_links" ADD CONSTRAINT "autopool_pending_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
