import { Router } from "express";
import { authMiddleware } from "../middleware/verifyAuth";
import { upload, processImage } from "../middleware/upload";
import {
  getMyAutopoolAccounts,
  getMyAutopoolPendingLinks,
  getIncomingAutopoolPayments,
  joinAutopoolHandler,
  submitPaymentHandler,
  approvePaymentHandler,
  markUnderReviewHandler,
  upgradeHandler,
  reentryHandler,
} from "./autopool.controller";
import { asyncHandler } from "./autoPoolMiddleware/asyncHandler";

const router = Router();

// ── GET ───────────────────────────────────────────
router.get("/my-accounts", authMiddleware, asyncHandler(getMyAutopoolAccounts));
router.get("/incoming-payments", authMiddleware, asyncHandler(getIncomingAutopoolPayments));
router.get("/pending-links", authMiddleware, asyncHandler(getMyAutopoolPendingLinks));

// ── POST ──────────────────────────────────────────
router.post("/join", authMiddleware, asyncHandler(joinAutopoolHandler));

router.post(
  "/payments/submit",
  authMiddleware,
  upload.single("screenshot"),
  processImage,
  asyncHandler(submitPaymentHandler)
);

router.post("/payments/approve/:paymentId", authMiddleware, asyncHandler(approvePaymentHandler));
router.post("/payments/under-review/:paymentId", authMiddleware, asyncHandler(markUnderReviewHandler));
router.post("/links/upgrade/:linkId", authMiddleware, asyncHandler(upgradeHandler));
router.post("/links/reentry/:linkId", authMiddleware, asyncHandler(reentryHandler));

export default router;
