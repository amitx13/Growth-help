-- CreateEnum
CREATE TYPE "AutopoolAccountType" AS ENUM ('ORIGINAL', 'REENTRY');

-- CreateEnum
CREATE TYPE "AutopoolPaymentType" AS ENUM ('ENTRY', 'UPGRADE');

-- CreateEnum
CREATE TYPE "AutopoolPaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'UNDER_REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "AutopoolLinkType" AS ENUM ('UPGRADE', 'REENTRY');

-- CreateTable
CREATE TABLE "autopool_level_configs" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "matrixWidth" INTEGER NOT NULL,
    "entryFee" INTEGER NOT NULL,
    "reentryCount" INTEGER NOT NULL,
    "upgradeAtPayment" INTEGER,

    CONSTRAINT "autopool_level_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopool_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "accountType" "AutopoolAccountType" NOT NULL DEFAULT 'ORIGINAL',
    "parentAccountId" TEXT,
    "treePosition" INTEGER NOT NULL,
    "paymentsReceived" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isUpgradeLocked" BOOLEAN NOT NULL DEFAULT false,
    "reentriesCreated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autopool_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopool_payments" (
    "id" TEXT NOT NULL,
    "senderAccountId" TEXT NOT NULL,
    "receiverAccountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "paymentType" "AutopoolPaymentType" NOT NULL,
    "status" "AutopoolPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "screenshotUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autopool_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopool_pending_links" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "linkType" "AutopoolLinkType" NOT NULL,
    "targetLevel" INTEGER,
    "amount" INTEGER,
    "reentryCount" INTEGER,
    "reentriesIssued" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autopool_pending_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "autopool_level_configs_level_key" ON "autopool_level_configs"("level");

-- CreateIndex
CREATE INDEX "autopool_accounts_userId_idx" ON "autopool_accounts"("userId");

-- CreateIndex
CREATE INDEX "autopool_accounts_level_idx" ON "autopool_accounts"("level");

-- CreateIndex
CREATE INDEX "autopool_accounts_parentAccountId_idx" ON "autopool_accounts"("parentAccountId");

-- CreateIndex
CREATE INDEX "autopool_accounts_isActive_idx" ON "autopool_accounts"("isActive");

-- CreateIndex
CREATE INDEX "autopool_accounts_isUpgradeLocked_idx" ON "autopool_accounts"("isUpgradeLocked");

-- CreateIndex
CREATE UNIQUE INDEX "autopool_accounts_level_treePosition_key" ON "autopool_accounts"("level", "treePosition");

-- CreateIndex
CREATE INDEX "autopool_payments_senderAccountId_idx" ON "autopool_payments"("senderAccountId");

-- CreateIndex
CREATE INDEX "autopool_payments_receiverAccountId_idx" ON "autopool_payments"("receiverAccountId");

-- CreateIndex
CREATE INDEX "autopool_payments_status_idx" ON "autopool_payments"("status");

-- CreateIndex
CREATE INDEX "autopool_payments_level_idx" ON "autopool_payments"("level");

-- CreateIndex
CREATE INDEX "autopool_pending_links_accountId_idx" ON "autopool_pending_links"("accountId");

-- CreateIndex
CREATE INDEX "autopool_pending_links_linkType_idx" ON "autopool_pending_links"("linkType");

-- CreateIndex
CREATE INDEX "autopool_pending_links_isCompleted_idx" ON "autopool_pending_links"("isCompleted");

-- AddForeignKey
ALTER TABLE "autopool_accounts" ADD CONSTRAINT "autopool_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopool_accounts" ADD CONSTRAINT "autopool_accounts_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "autopool_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopool_payments" ADD CONSTRAINT "autopool_payments_senderAccountId_fkey" FOREIGN KEY ("senderAccountId") REFERENCES "autopool_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopool_payments" ADD CONSTRAINT "autopool_payments_receiverAccountId_fkey" FOREIGN KEY ("receiverAccountId") REFERENCES "autopool_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopool_pending_links" ADD CONSTRAINT "autopool_pending_links_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "autopool_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
