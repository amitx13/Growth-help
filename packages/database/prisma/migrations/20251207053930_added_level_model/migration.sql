-- CreateTable
CREATE TABLE "Levels" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "totalactivationAmount" INTEGER NOT NULL,
    "uplineAmount" INTEGER NOT NULL,
    "sponsorAmount" INTEGER NOT NULL,
    "teamSize" INTEGER NOT NULL,
    "maxReward" INTEGER NOT NULL,

    CONSTRAINT "Levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLevel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "amountEarned" INTEGER NOT NULL DEFAULT 0,
    "isUpgradeable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserLevel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserLevel" ADD CONSTRAINT "UserLevel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLevel" ADD CONSTRAINT "UserLevel_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
