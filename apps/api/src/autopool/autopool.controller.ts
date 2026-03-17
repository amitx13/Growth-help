import { Request, Response } from "express";
import {
  joinAutopool,
  submitAutopoolPayment,
  approveAutopoolPayment,
  markPaymentUnderReview,
} from "./autopool.service";
import { actOnUpgradeLink, actOnReentryLink } from "./autopool.links";
import { AutopoolError } from "./autopool.types";
import { prisma } from "@repo/database";
import { ApiErrorResponse } from "@repo/types";
import { deleteUploadedFile } from "../controllers/user.createController";

// GET /autopool/my-accounts
export const getMyAutopoolAccounts = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({
      success: false,
      error: "User ID not found.",
      statusCode: 400,
    } as ApiErrorResponse);
  }

  const accounts = await prisma.autopoolAccount.findMany({
    where: { userId },
    include: {
      pendingLinks: { where: { isCompleted: false } },

      // All sent payments — FE filters by status for dead-end detection + earnings
      sentPayments: {
        select: { id: true, status: true, amount: true },
      },

      // Approved received payments — for earnings
      receivedPayments: {
        where: { status: "APPROVED" },
        select: { amount: true },
      },

      parent: {
        select: {
          id: true,
          user: { select: { name: true, mobile: true, bankDetails: true } },
        },
      },

      _count: { select: { children: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: accounts });
};

// GET /autopool/incoming-payments
export const getIncomingAutopoolPayments = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ success: false, error: "User ID not found.", statusCode: 400 } as ApiErrorResponse);
  }

  const payments = await prisma.autopoolPayment.findMany({
    where: {
      receiverAccount: { userId },
      status: { in: ["PENDING", "UNDER_REVIEW"] },
    },
    include: {
      senderAccount: {
        select: {
          level: true,
          accountType: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: payments });
};

// GET /autopool/pending-links
export const getMyAutopoolPendingLinks = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ success: false, error: "User ID not found.", statusCode: 400 } as ApiErrorResponse);
  }

  const links = await prisma.autopoolPendingLink.findMany({
    where: {
      OR: [
        { account: { userId } },
        { userId },
      ],
      isCompleted: false,
    },
    include: {
      account: { select: { level: true, accountType: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: links });
};

// POST /autopool/join
export const joinAutopoolHandler = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { pendingLinkId } = req.body;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ success: false, error: "User ID not found.", statusCode: 400 } as ApiErrorResponse);
  }

  if (!pendingLinkId || typeof pendingLinkId !== "string") {
    throw new AutopoolError("Entry link ID is required to join autopool", "MISSING_ENTRY_LINK", 400);
  }

  const entryLink = await prisma.autopoolPendingLink.findUniqueOrThrow({
    where: { id: pendingLinkId },
  });

  if (entryLink.userId !== userId) {
    throw new AutopoolError("This entry link does not belong to you", "UNAUTHORIZED", 403);
  }
  if (entryLink.linkType !== "ENTRY") {
    throw new AutopoolError("Invalid link type", "INVALID_LINK_TYPE", 400);
  }
  if (entryLink.isCompleted) {
    throw new AutopoolError("This entry link has already been used", "LINK_EXHAUSTED", 400);
  }

  const existing = await prisma.autopoolAccount.findFirst({
    where: { userId, level: 1, accountType: "ORIGINAL" },
  });

  if (existing) {
    throw new AutopoolError("You already have a Level 1 autopool account", "ALREADY_JOINED", 400);
  }

  const result = await joinAutopool(userId, pendingLinkId);
  res.status(201).json({ success: true, data: result });
};

// POST /autopool/payments/submit
export const submitPaymentHandler = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { senderAccountId, receiverAccountId, amount, level, paymentType } = req.body;
  const screenshotUrl = req.file?.path;

  if (!userId || typeof userId !== "string") {
    if (screenshotUrl) await deleteUploadedFile(screenshotUrl);
    return res.status(400).json({ success: false, error: "User ID not found.", statusCode: 400 } as ApiErrorResponse);
  }

  if (!screenshotUrl) {
    if (screenshotUrl) await deleteUploadedFile(screenshotUrl);
    throw new AutopoolError("Payment screenshot is required", "MISSING_SCREENSHOT", 400);
  }

  // SECURITY: verify senderAccount belongs to this user — prevents spoofing
  const senderAccount = await prisma.autopoolAccount.findUnique({
    where: { id: senderAccountId },
    select: { userId: true },
  });
  if (!senderAccount || senderAccount.userId !== userId) {
    if (screenshotUrl) await deleteUploadedFile(screenshotUrl);
    throw new AutopoolError("This account does not belong to you", "UNAUTHORIZED", 403);
  }

  const payment = await submitAutopoolPayment({
    senderAccountId,
    receiverAccountId,
    amount: parseInt(amount),
    level: parseInt(level),
    paymentType,
    screenshotUrl,
  });

  res.status(201).json({ success: true, data: payment });
};

// POST /autopool/payments/approve/:paymentId
export const approvePaymentHandler = async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const userId = req.userId;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ success: false, error: "User ID not found.", statusCode: 400 } as ApiErrorResponse);
  }

  const result = await approveAutopoolPayment(paymentId, userId);
  res.json({ success: true, data: result });
};

// POST /autopool/payments/under-review/:paymentId
export const markUnderReviewHandler = async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const userId = req.userId;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ success: false, error: "User ID not found.", statusCode: 400 } as ApiErrorResponse);
  }

  const result = await markPaymentUnderReview(paymentId, userId);
  res.json({ success: true, data: result });
};

// POST /autopool/links/upgrade/:linkId
export const upgradeHandler = async (req: Request, res: Response) => {
  const { linkId } = req.params;
  const userId = req.userId;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ success: false, error: "User ID not found.", statusCode: 400 } as ApiErrorResponse);
  }

  const result = await actOnUpgradeLink(linkId, userId);
  res.status(201).json({ success: true, data: result });
};

// POST /autopool/links/reentry/:linkId
export const reentryHandler = async (req: Request, res: Response) => {
  const { linkId } = req.params;
  const userId = req.userId;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ success: false, error: "User ID not found.", statusCode: 400 } as ApiErrorResponse);
  }

  const result = await actOnReentryLink(linkId, userId);
  res.status(201).json({ success: true, data: result });
};