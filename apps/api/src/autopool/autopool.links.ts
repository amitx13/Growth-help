import { AutopoolAccountType, prisma } from "@repo/database";
import { findBFSSlot, getNextTreePosition } from "./autopool.bfs";
import { AutopoolError, LEVEL_CONFIGS, type AutopoolLevel } from "./autopool.types";

// ─────────────────────────────────────────────
// 1. ACT ON UPGRADE LINK
// ─────────────────────────────────────────────
export async function actOnUpgradeLink(pendingLinkId: string, userId: string) {
  const link = await prisma.autopoolPendingLink.findUniqueOrThrow({
    where: { id: pendingLinkId },
    include: { account: { select: { id: true, userId: true } } },
  });

  if (!link.account) {
    throw new AutopoolError("Invalid link — no account associated", "INVALID_LINK", 400);
  }
  if (link.account.userId !== userId) {
    throw new AutopoolError("This upgrade link does not belong to you", "UNAUTHORIZED", 403);
  }
  if (link.linkType !== "UPGRADE") {
    throw new AutopoolError("Invalid link type", "INVALID_LINK_TYPE", 400);
  }
  if (link.isCompleted) {
    throw new AutopoolError("This upgrade link has already been used", "LINK_EXHAUSTED", 400);
  }

  const targetLevel = link.targetLevel as AutopoolLevel;
  const config = LEVEL_CONFIGS[targetLevel];

  const bfsSlot = await findBFSSlot(targetLevel);
  const treePosition = await getNextTreePosition(targetLevel);

  const newAccount = await prisma.autopoolAccount.create({
    data: {
      userId,
      level: targetLevel,
      accountType: AutopoolAccountType.ORIGINAL,
      parentAccountId: bfsSlot.id,
      treePosition,
      isActive: false,
      upgradedFromAccountId: link.account.id,
    },
  });

  await prisma.autopoolPendingLink.update({
    where: { id: pendingLinkId },
    data: { isCompleted: true },
  });

  const receiver = await prisma.autopoolAccount.findUniqueOrThrow({
    where: { id: bfsSlot.id },
    select: {
      id: true,
      user: { select: { name: true, mobile: true, bankDetails: true } },
    },
  });

  return {
    newAccountId: newAccount.id,
    receiverAccountId: bfsSlot.id,
    amount: config.entryFee,
    targetLevel,
    receiverName: receiver.user.name,
    receiverMobile: receiver.user.mobile,
    receiverBankDetails: receiver.user.bankDetails,
  };
}

// ─────────────────────────────────────────────
// 2. ACT ON RE-ENTRY LINK
// ─────────────────────────────────────────────
export async function actOnReentryLink(pendingLinkId: string, userId: string) {
  const link = await prisma.autopoolPendingLink.findUniqueOrThrow({
    where: { id: pendingLinkId },
    include: { account: { select: { id: true, userId: true } } },
  });

  if (!link.account) {
    throw new AutopoolError("Invalid link — no account associated", "INVALID_LINK", 400);
  }
  if (link.account.userId !== userId) {
    throw new AutopoolError("This re-entry link does not belong to you", "UNAUTHORIZED", 403);
  }
  if (link.linkType !== "REENTRY") {
    throw new AutopoolError("Invalid link type", "INVALID_LINK_TYPE", 400);
  }
  if (link.isCompleted) {
    throw new AutopoolError("All re-entries have been used", "LINK_EXHAUSTED", 400);
  }
  if ((link.reentriesIssued ?? 0) >= (link.reentryCount ?? 0)) {
    throw new AutopoolError("Re-entry count exhausted", "LINK_EXHAUSTED", 400);
  }

  const level: AutopoolLevel = 1;
  const config = LEVEL_CONFIGS[level];

  const bfsSlot = await findBFSSlot(level);
  const treePosition = await getNextTreePosition(level);

  const reentryAccount = await prisma.autopoolAccount.create({
    data: {
      userId,
      level,
      accountType: AutopoolAccountType.REENTRY,
      parentAccountId: bfsSlot.id,
      treePosition,
      isActive: false,
    },
  });

  const newIssuedCount = (link.reentriesIssued ?? 0) + 1;
  await prisma.autopoolPendingLink.update({
    where: { id: pendingLinkId },
    data: {
      reentriesIssued: newIssuedCount,
      isCompleted: newIssuedCount >= (link.reentryCount ?? 0),
    },
  });

  await prisma.autopoolAccount.update({
    where: { id: link.account.id },
    data: { reentriesCreated: { increment: 1 } },
  });

  const receiver = await prisma.autopoolAccount.findUniqueOrThrow({
    where: { id: bfsSlot.id },
    select: {
      id: true,
      user: { select: { name: true, mobile: true, bankDetails: true } },
    },
  });

  return {
    newAccountId: reentryAccount.id,
    receiverAccountId: bfsSlot.id,
    amount: config.entryFee,
    receiverName: receiver.user.name,
    receiverMobile: receiver.user.mobile,
    receiverBankDetails: receiver.user.bankDetails,
  };
}
