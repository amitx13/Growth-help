/*
  Warnings:

  - The values [CONFIRMED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [CONFIRMED] on the enum `UpgradeStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "public"."payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UpgradeStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "public"."upgrade_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "upgrade_requests" ALTER COLUMN "status" TYPE "UpgradeStatus_new" USING ("status"::text::"UpgradeStatus_new");
ALTER TYPE "UpgradeStatus" RENAME TO "UpgradeStatus_old";
ALTER TYPE "UpgradeStatus_new" RENAME TO "UpgradeStatus";
DROP TYPE "public"."UpgradeStatus_old";
ALTER TABLE "upgrade_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
