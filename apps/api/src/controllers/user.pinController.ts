import { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { ApiSuccessResponse, ApiErrorResponse } from '@repo/types';
import { deleteUploadedFile } from './user.createController';

export const SubmitPinRequest = async (req: Request, res: Response) => {
  if (!req.file) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Screenshot is required',
      statusCode: 400,
    };
    return res.status(400).json(errorResponse);
  }

  const filePath = req.file.path;

  try {
    const { fromUserId, toUserId, count } = req.body

    if (!fromUserId || !toUserId || !count) {
      await deleteUploadedFile(filePath);
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Missing required fields',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    if (fromUserId === toUserId) {
      await deleteUploadedFile(filePath);
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `Can't request pins from itself`,
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const pinCount = parseInt(count, 10)

    await prisma.pinRequest.create({
      data: {
        fromUserId,
        toUserId,
        count: pinCount,
        screenshotUrl: filePath
      }
    })

    const data: ApiSuccessResponse = {
      success: true,
      data: null,
      message: "Pin request submitted sucessfully"
    }

    return res.status(200).json(
      {
        success: data.success,
        message: data.message
      }
    )

  } catch (error: any) {
    await deleteUploadedFile(filePath);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to Submit Pin request',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const transferPin = async (req: Request, res: Response) => {
  try {
    const { owner, receiver, count } = req.body;

    if (!owner || !receiver || !count) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Owner, receiver, or count is missing.",
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const pinTransferCount = Number(count);

    if (!Number.isInteger(pinTransferCount) || pinTransferCount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid pin count.",
        statusCode: 400,
      });
    }

    const pins = await prisma.pin.findMany({
      where: {
        currentOwner: owner,
        status: true,
      },
      take: pinTransferCount,
      select: {
        id: true,
      },
    });

    if (pins.length < pinTransferCount) {
      return res.status(400).json({
        success: false,
        error: "Not enough active pins available.",
        statusCode: 400,
      });
    }

    await prisma.$transaction(async (tx) => {
      pins.map(async (pin) =>
        await tx.pin.update({
          where: { id: pin.id },
          data: { currentOwner: receiver },
        })
      )

      await tx.pinRequest.create({
        data: {
          fromUserId: receiver,
          toUserId: owner,
          count,
          confirmed: true,
          status: "APPROVED"
        }
      })


    })

    const successResponse: ApiSuccessResponse = {
      success: true,
      data: null,
      message: "Pins transferred successfully.",
    };

    return res.status(200).json(successResponse);

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to transfer pins.",
      statusCode: 500,
    });
  }
};

export const confirmUserPinRequest = async (req: Request, res: Response) => {
  try {
    const { pinRequestId, action } = req.body;

    if (!pinRequestId || !action) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Pin request ID or action is missing"
      }
      return res.status(400).json(errorResponse);
    }

    if (!["APPROVED", "REJECTED"].includes(action)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Invalid action. Use APPROVED or REJECTED"
      }
      return res.status(400).json(errorResponse);
    }

    const pinReq = await prisma.pinRequest.findUnique({
      where: { id: pinRequestId },
    });

    if (!pinReq) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Invalid pin request ID"
      }
      return res.status(400).json(errorResponse);
    }

    if (pinReq.status !== "PENDING") {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "This pin request has already been processed"
      }
      return res.status(400).json(errorResponse);
    }

    if (action === "APPROVED") {
      const pins = await prisma.pin.findMany({
        where: {
          currentOwner: pinReq.toUserId,
          status: true,
        },
        take: pinReq.count,
        select: { id: true },
      });

      if (pins.length < pinReq.count) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: "Not enough active pins available"
        }
        return res.status(400).json(errorResponse);
      }

      await prisma.$transaction(async (tx) => {
        await tx.pinRequest.update({
          where: { id: pinRequestId },
          data: {
            confirmed: true,
            status: "APPROVED",
          },
        });

        await Promise.all(
          pins.map((pin) =>
            tx.pin.update({
              where: { id: pin.id },
              data: { currentOwner: pinReq.fromUserId },
            })
          )
        );
      });

      return res.status(200).json({
        success: true,
        message: `${pinReq.count} pins transferred successfully`,
        data: null,
      });
    }

    await prisma.pinRequest.update({
      where: { id: pinRequestId },
      data: {
        confirmed: false,
        status: "REJECTED",
      },
    });

    return res.status(200).json({
      success: true,
      message: `Pin request rejected successfully`,
      data: null,
    });

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || "Failed to confirm pin request"
    }
    return res.status(500).json(errorResponse);
  }
};