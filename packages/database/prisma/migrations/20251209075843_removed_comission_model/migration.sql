/*
  Warnings:

  - You are about to drop the `commission_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "commission_logs" DROP CONSTRAINT "commission_logs_userId_fkey";

-- DropTable
DROP TABLE "commission_logs";
