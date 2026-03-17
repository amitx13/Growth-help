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
      user: { select: { id:true, name: true, email: true, mobile: true, role:true } },
      _count: { select: { children: true, receivedPayments:true } },
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
          user: { select: { name: true, mobile: true, id:true } },
        },
      },
      receiverAccount: {
        select: {
          level: true,
          accountType: true,
          user: { select: { name: true, mobile: true, id:true } },
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

// POST /admin/autopool/resolve-payment/:paymentId
export const resolvePaymentHandler = async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const { action } = req.body;
  const adminUserId = req.userId;

  if (!adminUserId || typeof adminUserId !== "string") {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: "User ID not found.",
      statusCode: 400,
    };
    return res.status(400).json(errorResponse);
  }

  if (!["APPROVED", "REJECTED"].includes(action)) {
    res.status(400).json({
      success: false,
      message: 'Action must be "APPROVED" or "REJECTED"',
    });
    return;
  }

  const result = await adminResolvePayment(paymentId, action, adminUserId);
  res.json({ success: true, data: result });
};

// GET /admin/autopool/eligible-users
export const getEligibleUsersForAutopool = async (req: Request, res: Response) => {
  const { page = "1", limit = "20" } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  // Fetch all candidates — has at least 1 referral, no ENTRY link at all
  const candidates = await prisma.user.findMany({
    where: {
      directReferrals: { some: {} },
      autopoolEntryLinks: { none: { linkType: "ENTRY" } },
      role:"USER"
    },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      _count: { select: { directReferrals: true } },
    },
  });

  // Filter >= 2 in JS (Prisma has no count filter)
  const eligible = candidates.filter((u) => u._count.directReferrals >= 2);

  // Paginate after filter
  const paginated = eligible.slice(skip, skip + take);

  res.json({
    success: true,
    data: paginated,
    total: eligible.length,
    page: parseInt(page as string),
  });
};

// POST /admin/autopool/generate-entry-link
export const generateEntryLinkForUser = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId || typeof userId !== "string") {
    res.status(400).json({ success: false, message: "userId is required" });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      directReferrals: { select: { id: true } },
      autopoolEntryLinks: {
        where: { linkType: "ENTRY", isCompleted: false },
        select: { id: true },
      },
    },
  });

  if (user.directReferrals.length < 2) {
    throw new AutopoolError(
      "User does not have 2 referrals yet",
      "NOT_ELIGIBLE",
      400
    );
  }

  if (user.autopoolEntryLinks.length > 0) {
    throw new AutopoolError(
      "User already has a pending entry link",
      "LINK_ALREADY_EXISTS",
      400
    );
  }

  const link = await prisma.autopoolPendingLink.create({
    data: {
      userId,
      linkType: "ENTRY",
      amount: 200,
      isCompleted: false,
    },
  });

  res.status(201).json({ success: true, data: link });
};
