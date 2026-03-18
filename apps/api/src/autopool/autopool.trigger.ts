import { prisma } from "@repo/database";
import { LEVEL_CONFIGS, type AutopoolLevel } from "./autopool.types";
import { getAdminSystemIds } from "../lib/system";

export async function runTriggerLogic(
  receiverAccountId: string,
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
) {
  const account = await tx.autopoolAccount.findUniqueOrThrow({
    where: { id: receiverAccountId },
    select: {
      level: true,
      paymentsReceived: true,
      position: { select: { userId: true } },
    },
  });

  const updated = await tx.autopoolAccount.update({
    where: { id: receiverAccountId },
    data: { paymentsReceived: { increment: 1 } },
  });

  // Admin root accounts absorb payments silently — no triggers
  const { userId: adminUserId } = await getAdminSystemIds();
  if (account.position.userId === adminUserId) return;

  const level = account.level as AutopoolLevel;
  const config = LEVEL_CONFIGS[level];
  const paymentsReceived = updated.paymentsReceived;

  // ── STEP 1: Re-entry link on 1st payment ─────────────────
  if (paymentsReceived === 1 && config.reentryCount > 0) {
    await tx.autopoolPendingLink.create({
      data: {
        accountId: receiverAccountId,
        linkType: "REENTRY",
        reentryCount: config.reentryCount,
        reentriesIssued: 0,
        isCompleted: false,
      },
    });
  }

  // ── STEP 2: Upgrade link at upgradeAtPayment ──────────────
  if (
    config.upgradeAtPayment !== null &&
    paymentsReceived === config.upgradeAtPayment
  ) {
    const nextLevel = (level + 1) as AutopoolLevel;
    const nextConfig = LEVEL_CONFIGS[nextLevel];

    await tx.autopoolPendingLink.create({
      data: {
        accountId: receiverAccountId,
        linkType: "UPGRADE",
        targetLevel: nextLevel,
        amount: nextConfig.entryFee,
        isCompleted: false,
      },
    });

    await tx.autopoolAccount.update({
      where: { id: receiverAccountId },
      data: { isUpgradeLocked: true },
    });
  }
}