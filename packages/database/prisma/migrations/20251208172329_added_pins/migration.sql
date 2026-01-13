-- CreateTable
CREATE TABLE "pins" (
    "id" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "currentOwner" TEXT NOT NULL,
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pins_pinCode_key" ON "pins"("pinCode");

-- CreateIndex
CREATE INDEX "pins_status_idx" ON "pins"("status");

-- CreateIndex
CREATE INDEX "pins_currentOwner_idx" ON "pins"("currentOwner");

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_currentOwner_fkey" FOREIGN KEY ("currentOwner") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
