import { prisma } from "@repo/database";
import { getAdminSystemIds } from "../lib/system";

const LEVEL_CONFIGS = [
  { level: 1, matrixWidth: 2,  entryFee: 200,   reentryCount: 0,  upgradeAtPayment: 2 },
  { level: 2, matrixWidth: 4,  entryFee: 300,   reentryCount: 1,  upgradeAtPayment: 2 },
  { level: 3, matrixWidth: 6,  entryFee: 600,   reentryCount: 2,  upgradeAtPayment: 3 },
  { level: 4, matrixWidth: 8,  entryFee: 1500,  reentryCount: 4,  upgradeAtPayment: 2 },
  { level: 5, matrixWidth: 10, entryFee: 3000,  reentryCount: 8,  upgradeAtPayment: 2 },
  { level: 6, matrixWidth: 12, entryFee: 6000,  reentryCount: 16, upgradeAtPayment: 3 },
  { level: 7, matrixWidth: 14, entryFee: 15000, reentryCount: 32, upgradeAtPayment: null },
];

async function seedLevelConfigs() {
  console.log("\n📋 Seeding AutopoolLevelConfigs...");

  for (const config of LEVEL_CONFIGS) {
    const existing = await prisma.autopoolLevelConfig.findUnique({
      where: { level: config.level },
    });

    if (existing) {
      console.log(`  ⏭️  LevelConfig ${config.level} already exists — skipped`);
      continue;
    }

    await prisma.autopoolLevelConfig.create({ data: config });
    console.log(`  ✅ LevelConfig ${config.level} created`);
  }
}

async function seedAdminRootAccounts(adminUserId: string) {
  console.log("\n🌳 Seeding Admin Root Accounts...");

  for (const config of LEVEL_CONFIGS) {
    const existing = await prisma.autopoolAccount.findFirst({
      where: { userId: adminUserId, level: config.level },
    });

    if (existing) {
      console.log(`  ⏭️  Admin root for Level ${config.level} already exists — skipped`);
      continue;
    }

    await prisma.autopoolAccount.create({
      data: {
        userId: adminUserId,
        level: config.level,
        accountType: "ORIGINAL",
        parentAccountId: null,      // root — no parent
        treePosition: 1,            // always first in tree
        isActive: true,             // ONLY exception — no payment required
        isUpgradeLocked: false,
        paymentsReceived: 0,
        reentriesCreated: 0,
        upgradedFromAccountId: null,
      },
    });

    console.log(`  ✅ Admin root account created for Level ${config.level}`);
  }
}

async function main() {
  console.log("🚀 Starting Autopool Initialization...");

  const { userId: adminUserId } = await getAdminSystemIds();

  if (!adminUserId) {
    throw new Error("❌ Admin user ID not found. Make sure admin exists in the database first.");
  }

  console.log(`\n👤 Admin userId: ${adminUserId}`);

  await seedLevelConfigs();
  await seedAdminRootAccounts(adminUserId);

  console.log("\n✅ Autopool initialization complete!\n");
}

main()
  .catch((err) => {
    console.error("❌ Initialization failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
