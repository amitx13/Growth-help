-- CreateEnum
CREATE TYPE "PinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "pin_requests" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "screenshotUrl" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "PinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pin_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pin_requests_fromUserId_idx" ON "pin_requests"("fromUserId");

-- CreateIndex
CREATE INDEX "pin_requests_toUserId_idx" ON "pin_requests"("toUserId");

-- CreateIndex
CREATE INDEX "pin_requests_status_idx" ON "pin_requests"("status");

-- AddForeignKey
ALTER TABLE "pin_requests" ADD CONSTRAINT "pin_requests_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pin_requests" ADD CONSTRAINT "pin_requests_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
