import { Router } from "express";
import { adminAuthMiddleware } from "../middleware/adminAuth";
import {
  generateEntryLinkForUser,
  getAllAutopoolAccounts,
  getAllAutopoolPayments,
  getEligibleUsersForAutopool,
  resolvePaymentHandler,
} from "./autopool.admin.controller";
import { asyncHandler } from "./autoPoolMiddleware/asyncHandler";

const router = Router();

router.get("/all-accounts",  adminAuthMiddleware, asyncHandler(getAllAutopoolAccounts));
router.get("/all-payments",  adminAuthMiddleware, asyncHandler(getAllAutopoolPayments));
router.get("/eligible-users",         adminAuthMiddleware, asyncHandler(getEligibleUsersForAutopool));

router.post("/generate-entry-link",   adminAuthMiddleware, asyncHandler(generateEntryLinkForUser));
router.post(
  "/resolve-payment/:paymentId",
  adminAuthMiddleware,
  asyncHandler(resolvePaymentHandler)
);

export default router;
