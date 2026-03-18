import { AutopoolAccountType, prisma } from "@repo/database";
import { findBFSSlot, getNextTreePosition } from "./autopool.bfs";
import { runTriggerLogic } from "./autopool.trigger";
import { AutopoolError, LEVEL_CONFIGS, type AutopoolLevel } from "./autopool.types";
import { getAdminSystemIds } from "../lib/system";
import { deleteUploadedFile } from "../controllers/user.createController";

async function unlockUpgradeSource(
  senderAccountId: string,
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
) {
  const sender = await tx.autopoolAccount.findUniqueOrThrow({
    where: { id: senderAccountId },
    select: { upgradedFromAccountId: true },
  });

  if (sender.upgradedFromAccountId) {
    await tx.autopoolAccount.update({
      where: { id: sender.upgradedFromAccountId },
      data: { isUpgradeLocked: false },
    });
  }
}

// ─────────────────────────────────────────────
// 1. JOIN AUTOPOOL — Level 1
// ─────────────────────────────────────────────
export async function joinAutopool(positionId: string, pendingLinkId: string) {
  const level: AutopoolLevel = 1;
  const config = LEVEL_CONFIGS[level];

  const bfsSlot = await findBFSSlot(level);
  const treePosition = await getNextTreePosition(level);

  const receiver = await prisma.autopoolAccount.findUniqueOrThrow({
    where: { id: bfsSlot.id },
    select: {
      id: true,
      position: {
        select: {
          user: { select: { name: true, mobile: true, bankDetails: true } },
        },
      },
    },
  });

  const newAccount = await prisma.autopoolAccount.create({
    data: {
      positionId,
      level,
      accountType: AutopoolAccountType.ORIGINAL,
      parentAccountId: bfsSlot.id,
      treePosition,
      isActive: false,
    },
  });

  return {
    newAccountId: newAccount.id,
    pendingLinkId,
    receiverAccountId: receiver.id,
    amount: config.entryFee,
    receiverBankDetails: receiver.position.user.bankDetails,
    receiverName: receiver.position.user.name,
    receiverMobile: receiver.position.user.mobile,
  };
}

// ─────────────────────────────────────────────
// 2. SUBMIT PAYMENT
// ─────────────────────────────────────────────
export async function submitAutopoolPayment({
  senderAccountId,
  receiverAccountId,
  amount,
  level,
  paymentType,
  screenshotUrl,
}: {
  senderAccountId: string;
  receiverAccountId: string;
  amount: number;
  level: number;
  paymentType: "ENTRY" | "UPGRADE";
  screenshotUrl: string;
}) {
  const existing = await prisma.autopoolPayment.findFirst({
    where: {
      senderAccountId,
      status: { in: ["PENDING", "UNDER_REVIEW"] },
    },
  });

  if (existing) {
    if (screenshotUrl) await deleteUploadedFile(screenshotUrl);
    throw new AutopoolError("A pending payment already exists for this account", "DUPLICATE_PAYMENT", 400);
  }

  return prisma.autopoolPayment.create({
    data: {
      senderAccountId,
      receiverAccountId,
      amount,
      level,
      paymentType,
      status: "PENDING",
      screenshotUrl,
    },
  });
}

// ─────────────────────────────────────────────
// 3. APPROVE PAYMENT (by receiver account owner)
// ─────────────────────────────────────────────
export async function approveAutopoolPayment(paymentId: string, requestingUserId: string) {
  const payment = await prisma.autopoolPayment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      receiverAccount: {
        select: {
          id: true,
          positionId: true,
          position: { select: { userId: true } },
        },
      },
      senderAccount: {
        select: {
          id: true,
          positionId: true,
          upgradedFromAccountId: true,
        },
      },
    },
  });

  if (payment.status !== "PENDING") {
    throw new AutopoolError("Only PENDING payments can be approved by the receiver", "INVALID_STATUS", 400);
  }

  if (payment.receiverAccount.position.userId !== requestingUserId) {
    throw new AutopoolError("You are not authorized to approve this payment", "UNAUTHORIZED", 403);
  }

  await prisma.$transaction(async (tx) => {
    await tx.autopoolPayment.update({ where: { id: paymentId }, data: { status: "APPROVED" } });

    await tx.autopoolAccount.update({
      where: { id: payment.senderAccount.id },
      data: { isActive: true },
    });

    if (payment.paymentType === "ENTRY") {
      await tx.autopoolPendingLink.updateMany({
        where: {
          positionId: payment.senderAccount.positionId,
          linkType: "ENTRY",
          isCompleted: false,
        },
        data: { isCompleted: true },
      });
    }

    await unlockUpgradeSource(payment.senderAccount.id, tx);
    await runTriggerLogic(payment.receiverAccount.id, tx);
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// 4. MARK PAYMENT UNDER REVIEW
// ─────────────────────────────────────────────
export async function markPaymentUnderReview(paymentId: string, requestingUserId: string) {
  const payment = await prisma.autopoolPayment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      receiverAccount: {
        select: { position: { select: { userId: true } } },
      },
    },
  });

  if (payment.status !== "PENDING") {
    throw new AutopoolError("Only PENDING payments can be marked as under review", "INVALID_STATUS", 400);
  }

  if (payment.receiverAccount.position.userId !== requestingUserId) {
    throw new AutopoolError("You are not authorized to review this payment", "UNAUTHORIZED", 403);
  }

  await prisma.autopoolPayment.update({ where: { id: paymentId }, data: { status: "UNDER_REVIEW" } });
  return { success: true };
}

// ─────────────────────────────────────────────
// 5. ADMIN RESOLVE PAYMENT
// ─────────────────────────────────────────────
export async function adminResolvePayment(
  paymentId: string,
  action: "APPROVED" | "REJECTED",
  adminUserId: string
) {
  const { userId: sysAdminId } = await getAdminSystemIds();

  if (adminUserId !== sysAdminId) {
    throw new AutopoolError("Admin access only", "UNAUTHORIZED", 403);
  }

  const payment = await prisma.autopoolPayment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      receiverAccount: {
        select: {
          id: true,
          positionId: true,
          position: { select: { userId: true } },
        },
      },
      senderAccount: {
        select: {
          id: true,
          positionId: true,
          upgradedFromAccountId: true,
        },
      },
    },
  });

  if (!["PENDING", "UNDER_REVIEW"].includes(payment.status)) {
    throw new AutopoolError("Admin can only resolve PENDING or UNDER_REVIEW payments", "INVALID_STATUS", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.autopoolPayment.update({ where: { id: paymentId }, data: { status: action } });

    if (action === "APPROVED") {
      await tx.autopoolAccount.update({
        where: { id: payment.senderAccount.id },
        data: { isActive: true },
      });

      if (payment.paymentType === "ENTRY") {
        await tx.autopoolPendingLink.updateMany({
          where: {
            positionId: payment.senderAccount.positionId,
            linkType: "ENTRY",
            isCompleted: false,
          },
          data: { isCompleted: true },
        });
      }

      await unlockUpgradeSource(payment.senderAccount.id, tx);
      await runTriggerLogic(payment.receiverAccount.id, tx);
    }
  });

  return { success: true };
}