-- AlterTable
ALTER TABLE "autopool_accounts" ADD COLUMN     "upgradedFromAccountId" TEXT;

-- CreateIndex
CREATE INDEX "autopool_accounts_upgradedFromAccountId_idx" ON "autopool_accounts"("upgradedFromAccountId");

-- AddForeignKey
ALTER TABLE "autopool_accounts" ADD CONSTRAINT "autopool_accounts_upgradedFromAccountId_fkey" FOREIGN KEY ("upgradedFromAccountId") REFERENCES "autopool_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
