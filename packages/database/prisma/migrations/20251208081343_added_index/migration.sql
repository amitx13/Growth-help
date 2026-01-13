-- CreateIndex
CREATE INDEX "payments_senderId_idx" ON "payments"("senderId");

-- CreateIndex
CREATE INDEX "payments_receiverId_idx" ON "payments"("receiverId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "user_levels_userId_idx" ON "user_levels"("userId");

-- CreateIndex
CREATE INDEX "user_levels_levelNumber_idx" ON "user_levels"("levelNumber");

-- CreateIndex
CREATE INDEX "users_sponsorId_idx" ON "users"("sponsorId");
