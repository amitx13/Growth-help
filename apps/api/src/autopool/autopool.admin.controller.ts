import { Request, Response } from "express";
import { adminResolvePayment } from "./autopool.service";
import { prisma } from "@repo/database";
import { ApiErrorResponse } from "@repo/types";
import { AutopoolError } from "./autopool.types";

// GET /admin/autopool/all-accounts
export const getAllAutopoolAccounts = async (req: Request, res: Response) => {
  const { level, page = "1", limit = "20" } = req.query;

  const accounts = await prisma.autopoolAccount.findMany({
    where: level ? { level: parseInt(level as string) } : {},
    include: {
      position: {
        select: {
          id: true,
          positionType: true,
          user: { select: { id: true, name: true, email: true, mobile: true, role: true } },
        },
      },
      _count: { select: { children: true, receivedPayments: true } },
    },
    orderBy: { treePosition: "asc" },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string),
  });

  const total = await prisma.autopoolAccount.count({
    where: level ? { level: parseInt(level as string) } : {},
  });

  res.json({ success: true, data: accounts, total });
};

// GET /admin/autopool/all-payments
export const getAllAutopoolPayments = async (req: Request, res: Response) => {
  const { status, page = "1", limit = "20" } = req.query;

  const payments = await prisma.autopoolPayment.findMany({
    where: status ? { status: status as any } : {},
    include: {
      senderAccount: {
        select: {
          level: true,
          accountType: true,
          position: {
            select: {
              id: true,
              positionType: true,
              user: { select: { id: true, name: true, mobile: true } },
            },
          },
        },
      },
      receiverAccount: {
        select: {
          level: true,
          accountType: true,
          position: {
            select: {
              id: true,
              positionType: true,
              user: { select: { id: true, name: true, mobile: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string),
  });

  const total = await prisma.autopoolPayment.count({
    where: status ? { status: status as any } : {},
  });

  res.json({ success: true, data: payments, total });
};

// GET /admin/autopool/eligible-users
export const getEligibleUsersForAutopool = async (req: Request, res: Response) => {
  const { page = "1", limit = "20" } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  // directReferralCount is a real field — no JS filtering needed
  const [positions, total] = await Promise.all([
    prisma.position.findMany({
      where: {
        directReferralCount: { gte: 2 },
        autopoolPendingLinks: { none: { linkType: "ENTRY" } },
        user: { role: "USER" },
      },
      select: {
        id: true,
        positionType: true,
        directReferralCount: true,
        user: { select: { id: true, name: true, email: true, mobile: true } },
      },
      skip,
      take,
      orderBy: { directReferralCount: "desc" },
    }),
    prisma.position.count({
      where: {
        directReferralCount: { gte: 2 },
        autopoolPendingLinks: { none: { linkType: "ENTRY" } },
        user: { role: "USER" },
      },
    }),
  ]);

  res.json({ success: true, data: positions, total, page: parseInt(page as string) });
};

// POST /admin/autopool/resolve-payment/:paymentId
export const resolvePaymentHandler = async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const { action } = req.body;
  const adminUserId = req.userId;

  if (!adminUserId || typeof adminUserId !== "string") {
    return res.status(400).json({ success: false, error: "User ID not found.", statusCode: 400 } as ApiErrorResponse);
  }

  if (!["APPROVED", "REJECTED"].includes(action)) {
    res.status(400).json({ success: false, message: 'Action must be "APPROVED" or "REJECTED"' });
    return;
  }

  const result = await adminResolvePayment(paymentId, action, adminUserId);
  res.json({ success: true, data: result });
};

// POST /admin/autopool/generate-entry-link
export const generateEntryLinkForUser = async (req: Request, res: Response) => {
  const { positionId } = req.body;

  if (!positionId || typeof positionId !== "string") {
    res.status(400).json({ success: false, message: "positionId is required" });
    return;
  }

  const position = await prisma.position.findUniqueOrThrow({
    where: { id: positionId },
    select: {
      id: true,
      directReferralCount: true,
    },
  });

  if (position.directReferralCount < 2) {
    throw new AutopoolError(
      "Position does not have 2 referrals yet",
      "NOT_ELIGIBLE",
      400
    );
  }

  // No duplicate check — admin override is intentional
  const link = await prisma.autopoolPendingLink.create({
    data: {
      positionId,
      linkType: "ENTRY",
      amount: 200,
      isCompleted: false,
    },
  });

  res.status(201).json({ success: true, data: link });
};

