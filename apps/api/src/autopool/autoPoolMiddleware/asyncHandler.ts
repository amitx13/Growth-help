import { Request, Response, NextFunction, RequestHandler } from "express";
import { AutopoolError } from "../autopool.types";

export const asyncHandler =
  (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Known autopool domain errors
      if (err instanceof AutopoolError) {
        return res.status(err.statusCode ?? 400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      // Prisma not found
      if (err?.code === "P2025") {
        return res.status(404).json({
          success: false,
          code: "NOT_FOUND",
          message: "Record not found",
        });
      }

      // Unexpected errors
      console.error("[AutopoolError]", err);
      return res.status(500).json({
        success: false,
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
      });
    });
  };