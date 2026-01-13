import { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { ApiSuccessResponse, ApiErrorResponse, PaymentType } from '@repo/types';
import { getAdminSystemIds } from '../lib/system';
import { deleteUploadedFile } from './user.createController';

export const completePaymentDetails = async (req: Request, res: Response) => {
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
    const { paymentId, senderPositionId, receiverPositionId, amount, paymentType, pendingLinkId } = req.body;

    if (paymentType === 'ACTIVATION') {
      if (!senderPositionId || !receiverPositionId || !amount || !paymentType) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Missing required fields',
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      const amt = parseFloat(amount);
      if (isNaN(amt) || amt !== 500) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Invalid amount',
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      const senderPosition = await prisma.position.findUnique({
        where: { id: senderPositionId },
        select: { id: true, currentLevel: true, isActive: true }
      });

      if (!senderPosition) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: `Account ${senderPositionId} does not exists`,
          statusCode: 404,
        };
        return res.status(404).json(errorResponse);
      }

      if (senderPosition.isActive) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'User account already activated',
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      const receiverPosition = await prisma.position.findUnique({
        where: { id: receiverPositionId },
        select: {
          id: true,
          isActive: true
        }
      });

      if (!receiverPosition) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Incorrect Sponsor Id',
          statusCode: 404,
        };
        return res.status(404).json(errorResponse);
      }

      if (!receiverPosition.isActive) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Sponsor Account is not active',
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      const existingPayment = await prisma.payment.findFirst({
        where: {
          senderPositionId,
          receiverPositionId,
          paymentType,
          status: 'PENDING',
        }
      });

      if (existingPayment) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'A pending payment already exists for this activation',
          statusCode: 409,
        };
        return res.status(409).json(errorResponse);
      }

      const existingRejectedPayment = await prisma.payment.findFirst({
        where: {
          senderPositionId,
          receiverPositionId,
          paymentType,
          status: "REJECTED",
        }
      });

      if (existingRejectedPayment) {

        if (existingRejectedPayment.screenshotUrl) {
          await deleteUploadedFile(existingRejectedPayment.screenshotUrl);
        }

        await prisma.payment.update({
          where: {
            id: existingRejectedPayment.id
          },
          data: {
            screenshotUrl: filePath,
            status: 'PENDING',
            confirmed: false,
            requestVerification: true,
          },
        })

        const response: ApiSuccessResponse = {
          success: true,
          data: null,
          message: 'Activation payment updated successfully',
        };

        return res.status(201).json(response);
      }

      const payment = await prisma.payment.create({
        data: {
          senderPositionId,
          receiverPositionId,
          amount: amt,
          paymentType,
          requestVerification: true,
          screenshotUrl: filePath,
        },
        select: {
          id: true,
          amount: true,
          paymentType: true,
          status: true,
          createdAt: true,
        }
      });

      const response: ApiSuccessResponse = {
        success: true,
        data: payment,
        message: 'Activation payment request created successfully',
      };
      return res.status(201).json(response);
    }

    if (paymentType === 'SPONSOR_PAYMENT' || paymentType === 'UPGRADE') {

      if (!paymentId) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'payment Id is required',
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      const existingPayment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: {
          paymentType: true,
          status: true,
          id: true,
          screenshotUrl: true,
        }
      });

      if (!existingPayment) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Invalid paymentId',
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      if (existingPayment.paymentType !== paymentType) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Payment type mismatch',
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      if (existingPayment.status !== "PENDING") {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: `${existingPayment.status === "APPROVED" ? "Payment already approved" : existingPayment.status === "UNDER_REVIEW" ? "Payment is reviewed by Admin" : "Payment is rejected by Admin"}`,
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      if (!pendingLinkId) {
        await deleteUploadedFile(filePath);
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Link-Id is required',
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      const paymentDetails = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            screenshotUrl: filePath,
            requestVerification: true
          },
          select: {
            id: true,
            amount: true,
            paymentType: true,
            status: true,
            createdAt: true,
          }
        });

        await tx.pendingLink.update({
          where: { id: pendingLinkId },
          data: { isCompleted: true }
        });

        return payment;
      });

      const response: ApiSuccessResponse = {
        success: true,
        data: paymentDetails,
        message: 'Payment screenshot uploaded successfully',
      };
      return res.status(200).json(response);
    }

    await deleteUploadedFile(filePath);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Invalid payment type',
      statusCode: 400,
    };
    return res.status(400).json(errorResponse);

  } catch (error: any) {
    await deleteUploadedFile(filePath);

    if (error.code === 'P2003') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid position ID',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Unable to create payment request',
      statusCode: 500,
    };
    return res.status(500).json(errorResponse);
  }
};

export const generatePaymentDetailsFromPendingLink = async (req: Request, res: Response) => {
  const { linkId } = req.body
  if (!linkId) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Please provide a valid link',
      statusCode: 400,
    };
    return res.status(400).json(errorResponse);
  }
  try {
    const link = await prisma.pendingLink.findUnique({
      where: {
        id: linkId
      }
    })

    if (!link) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `Invalid link, Can't be activated`,
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    if (link.isCompleted) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Payment for this link is already been completed.',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    if (link.linkType === 'SPONSOR_PAYMENT' && link.amount !== null) {

      const user = await prisma.position.findUnique({
        where: {
          id: link.positionId
        },
        include: {
          placedUnderPosition: {
            select: {
              id: true
            }
          }
        }
      })

      if (!user) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: 'Unable to find User for payment',
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      const admin = await getAdminSystemIds();

      const sponsorPositionId = user.placedUnderPosition?.id || admin.accountId
      const paymentAmount = link.amount;

      const existingPayment = await prisma.payment.findFirst({
        where: {
          senderPositionId: user.id,
          receiverPositionId: sponsorPositionId,
          amount: paymentAmount,
          paymentType: 'SPONSOR_PAYMENT',
          status: 'PENDING',
        },
        include: {
          receiverPosition: {
            select: {
              user: {
                select: {
                  name: true,
                  id: true,
                  mobile: true,
                  bankDetails: true
                }
              }
            }
          }
        }
      })

      if (existingPayment) {

        const receiverBankDetails = (() => {
          const bank = existingPayment.receiverPosition.user.bankDetails ?? null;

          const hasBankData =
            bank &&
            Object.values({
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              ifscCode: bank.ifscCode,
              upiId: bank.upiId,
              gPay: bank.gPay,
              qrCode: bank.qrCode,
            }).some(Boolean);

          return hasBankData
            ? {
              bankName: bank!.bankName,
              accountNumber: bank!.accountNumber,
              ifscCode: bank!.ifscCode,
              upiId: bank!.upiId,
              gPay: bank!.gPay,
              qrCode: bank!.qrCode,
            }
            : null;
        })();

        const payment: PaymentType = {
          id: existingPayment.id,
          senderPositionId: existingPayment.senderPositionId,
          receiverPositionId: existingPayment.receiverPositionId,
          amount: existingPayment.amount,
          paymentType: existingPayment.paymentType,
          status: existingPayment.status,
          upgradeToLevel: existingPayment.upgradeToLevel,
          screenshotUrl: existingPayment.screenshotUrl,
          requestVerification: existingPayment.requestVerification,
          confirmed: existingPayment.confirmed,
          createdAt: existingPayment.createdAt,
          updatedAt: existingPayment.updatedAt,
          receiverName: existingPayment.receiverPosition.user.name,
          receiverId: existingPayment.receiverPosition.user.id,
          receiverBankDetails,
          Mobile: existingPayment.receiverPosition.user.mobile,
        }

        const Response: ApiSuccessResponse = {
          success: true,
          data: payment,
          message: "Your payment is pending. Please upload a screenshot for verification."
        };
        return res.status(200).json(Response);
      }

      const PaymentDetails = await prisma.payment.create({
        data: {
          senderPositionId: user.id,
          receiverPositionId: sponsorPositionId,
          amount: paymentAmount,
          paymentType: 'SPONSOR_PAYMENT',
        },
        include: {
          receiverPosition: {
            select: {
              user: {
                select: {
                  name: true,
                  id: true,
                  mobile: true,
                  bankDetails: true
                }
              }
            }
          }
        }
      })

      const receiverBankDetails = (() => {
        const bank = PaymentDetails.receiverPosition.user.bankDetails ?? null;

        const hasBankData =
          bank &&
          Object.values({
            bankName: bank.bankName,
            accountNumber: bank.accountNumber,
            ifscCode: bank.ifscCode,
            upiId: bank.upiId,
            gPay: bank.gPay,
            qrCode: bank.qrCode,
          }).some(Boolean);

        return hasBankData
          ? {
            bankName: bank!.bankName,
            accountNumber: bank!.accountNumber,
            ifscCode: bank!.ifscCode,
            upiId: bank!.upiId,
            gPay: bank!.gPay,
            qrCode: bank!.qrCode,
          }
          : null;
      })();


      const payment: PaymentType = {
        id: PaymentDetails.id,
        senderPositionId: PaymentDetails.senderPositionId,
        receiverPositionId: PaymentDetails.receiverPositionId,
        amount: PaymentDetails.amount,
        paymentType: PaymentDetails.paymentType,
        status: PaymentDetails.status,
        upgradeToLevel: PaymentDetails.upgradeToLevel,
        screenshotUrl: PaymentDetails.screenshotUrl,
        requestVerification: PaymentDetails.requestVerification,
        confirmed: PaymentDetails.confirmed,
        createdAt: PaymentDetails.createdAt,
        updatedAt: PaymentDetails.updatedAt,
        receiverName: PaymentDetails.receiverPosition.user.name,
        receiverId: PaymentDetails.receiverPosition.user.id,
        receiverBankDetails,
        Mobile: PaymentDetails.receiverPosition.user.mobile,
      }

      const response: ApiSuccessResponse = {
        success: true,
        data: payment,
        message: 'Sponsor payment request created successfully',
      };
      return res.status(201).json(response);

    }
    if (link.linkType === 'UPGRADE' && link.amount && link.targetLevel) {

      const currentPosition = await prisma.position.findUnique({
        where: {
          id: link.positionId
        },
        select: {
          id: true,
          placedUnderPositionId: true,
          currentLevel: true,
        }
      })

      if (!currentPosition) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: `Invalid User Id.`,
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      if (currentPosition?.currentLevel === link.targetLevel) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: `Unable to Upgrade since user is already in level ${link.targetLevel}`,
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      const userlevelData = await prisma.userLevel.findUnique({
        where: {
          positionId_levelNumber: {
            positionId: currentPosition.id,
            levelNumber: currentPosition.currentLevel
          }
        },
        select: {
          sponsorPaid: true
        }
      })

      if (!userlevelData?.sponsorPaid) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: `Unable to Upgrade since sponsor payment of Level: ${currentPosition.currentLevel} is pending`,
          statusCode: 400,
        };
        return res.status(400).json(errorResponse);
      }

      const admin = await getAdminSystemIds()

      const uplinePositionId = await getUplinePositionIdForPayment(currentPosition.placedUnderPositionId, link.targetLevel, admin.accountId);

      const payAmt = link.amount

      const existingPayment = await prisma.payment.findFirst({
        where: {
          senderPositionId: currentPosition.id,
          receiverPositionId: uplinePositionId,
          amount: payAmt,
          upgradeToLevel: link.targetLevel,
          paymentToLevel: link.targetLevel,
          paymentType: 'UPGRADE',
          status: 'PENDING',
        },
        include: {
          receiverPosition: {
            select: {
              user: {
                select: {
                  name: true,
                  id: true,
                  mobile: true,
                  bankDetails: true
                }
              }
            }
          }
        }
      })

      if (existingPayment) {

        const receiverBankDetails = (() => {
          const bank = existingPayment.receiverPosition.user.bankDetails ?? null;

          const hasBankData =
            bank &&
            Object.values({
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              ifscCode: bank.ifscCode,
              upiId: bank.upiId,
              gPay: bank.gPay,
              qrCode: bank.qrCode,
            }).some(Boolean);

          return hasBankData
            ? {
              bankName: bank!.bankName,
              accountNumber: bank!.accountNumber,
              ifscCode: bank!.ifscCode,
              upiId: bank!.upiId,
              gPay: bank!.gPay,
              qrCode: bank!.qrCode,
            }
            : null;
        })();


        const payment: PaymentType = {
          id: existingPayment.id,
          senderPositionId: existingPayment.senderPositionId,
          receiverPositionId: existingPayment.receiverPositionId,
          amount: existingPayment.amount,
          paymentType: existingPayment.paymentType,
          status: existingPayment.status,
          upgradeToLevel: existingPayment.upgradeToLevel,
          screenshotUrl: existingPayment.screenshotUrl,
          requestVerification: existingPayment.requestVerification,
          confirmed: existingPayment.confirmed,
          createdAt: existingPayment.createdAt,
          updatedAt: existingPayment.updatedAt,
          receiverName: existingPayment.receiverPosition.user.name,
          receiverId: existingPayment.receiverPosition.user.id,
          receiverBankDetails,
          Mobile: existingPayment.receiverPosition.user.mobile,
        }

        const Response: ApiSuccessResponse = {
          success: true,
          data: payment,
          message: "Your payment is pending. Please upload a screenshot for verification."
        };
        return res.status(200).json(Response);
      }


      const PaymentDetails = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            senderPositionId: currentPosition.id,
            receiverPositionId: uplinePositionId,
            upgradeToLevel: link.targetLevel,
            paymentToLevel: link.targetLevel,
            amount: payAmt,
            status: "PENDING",
            paymentType: 'UPGRADE',
          },
          include: {
            receiverPosition: {
              select: {
                user: {
                  select: {
                    role: true,
                    name: true,
                    id: true,
                    mobile: true,
                    bankDetails: true
                  }
                }
              }
            }
          }
        })
        if (payment.receiverPosition.user.role === "USER" && payment.upgradeToLevel) {

          await tx.userLevel.update({
            where: {
              positionId_levelNumber: {
                positionId: payment.receiverPositionId,
                levelNumber: payment.upgradeToLevel
              }
            },
            data: {
              paymentsReceived: { increment: 1 }
            }
          })

        }

        return payment;
      })


      const receiverBankDetails = (() => {
        const bank = PaymentDetails.receiverPosition.user.bankDetails ?? null;

        const hasBankData =
          bank &&
          Object.values({
            bankName: bank.bankName,
            accountNumber: bank.accountNumber,
            ifscCode: bank.ifscCode,
            upiId: bank.upiId,
            gPay: bank.gPay,
            qrCode: bank.qrCode,
          }).some(Boolean);

        return hasBankData
          ? {
            bankName: bank!.bankName,
            accountNumber: bank!.accountNumber,
            ifscCode: bank!.ifscCode,
            upiId: bank!.upiId,
            gPay: bank!.gPay,
            qrCode: bank!.qrCode,
          }
          : null;
      })();


      const payment: PaymentType = {
        id: PaymentDetails.id,
        senderPositionId: PaymentDetails.senderPositionId,
        receiverPositionId: PaymentDetails.receiverPositionId,
        amount: PaymentDetails.amount,
        paymentType: PaymentDetails.paymentType,
        status: PaymentDetails.status,
        upgradeToLevel: PaymentDetails.upgradeToLevel,
        screenshotUrl: PaymentDetails.screenshotUrl,
        requestVerification: PaymentDetails.requestVerification,
        confirmed: PaymentDetails.confirmed,
        createdAt: PaymentDetails.createdAt,
        updatedAt: PaymentDetails.updatedAt,
        receiverName: PaymentDetails.receiverPosition.user.name,
        receiverId: PaymentDetails.receiverPosition.user.id,
        receiverBankDetails,
        Mobile: PaymentDetails.receiverPosition.user.mobile,
      }

      const response: ApiSuccessResponse = {
        success: true,
        data: payment,
        message: 'Upgrade payment request created successfully',
      };
      return res.status(201).json(response);

    }
    else {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid link type for payment generation',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }
  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Unable to generate payment request',
      statusCode: 500,
    };

    res.status(500).json(errorResponse);
  }
}

const getUplinePositionIdForPayment = async (placedUnderPositionId: string | null, targetLevel: number, rootPositionId: string): Promise<string> => {

  if (!placedUnderPositionId) {
    return rootPositionId
  }

  if (placedUnderPositionId === rootPositionId) {
    return rootPositionId
  }

  const levelConfig = await prisma.levelConfig.findUnique({
    where: { level: targetLevel }
  });

  if (!levelConfig) {
    return rootPositionId;
  }

  let sponsorPositionId = placedUnderPositionId;
  let uplineLevel = 1;

  while (uplineLevel < targetLevel) {
    const position = await prisma.position.findUnique({
      where: { id: sponsorPositionId },
      select: { placedUnderPositionId: true }
    });

    if (!position?.placedUnderPositionId) {
      break;
    }

    sponsorPositionId = position.placedUnderPositionId;
    uplineLevel++;
  }

  if (uplineLevel !== targetLevel) {
    return rootPositionId
  }

  while (true) {
    const uplinePosition = await prisma.position.findUnique({
      where: { id: sponsorPositionId },
      include: {
        userLevels: {
          where: { levelNumber: targetLevel }
        },
        user: true
      }
    });

    if (!uplinePosition) break;

    const userLevel = uplinePosition.userLevels[0];

    if (userLevel) {
      const { paymentsReceived, paymentCapacity } = userLevel;

      const upgradeThreshold = levelConfig.upgradeAtPayment;

      if (userLevel.levelNumber === 5 && upgradeThreshold === null) {
        if (paymentsReceived <= paymentCapacity) {
          return uplinePosition.id;
        }
      }

      if (!upgradeThreshold) {
        break;
      }

      if (paymentsReceived < upgradeThreshold) {
        return uplinePosition.id;
      }

      if (
        paymentsReceived === upgradeThreshold &&
        uplinePosition.currentLevel > targetLevel
      ) {
        return uplinePosition.id;
      }

      if (paymentsReceived >= paymentCapacity) {
        if (!uplinePosition.placedUnderPositionId) break;
        sponsorPositionId = uplinePosition.placedUnderPositionId;
        continue;
      }
    }

    if (!uplinePosition.placedUnderPositionId) break;
    sponsorPositionId = uplinePosition.placedUnderPositionId;
  }
  return rootPositionId

}

export const confirmActivationPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { action } = req.body;

    if (!paymentId || !action) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Payment ID and action are required',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        senderPosition: true,
        receiverPosition: true,
      }
    });

    if (!payment) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Payment not found',
        statusCode: 400,
      };
      return res.status(404).json(errorResponse);
    }

    if (payment.senderPosition.isActive) {
      if (!payment.confirmed && action === 'APPROVED') {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'APPROVED',
            confirmed: true,
          }
        });

        return res.status(200).json({
          success: true,
          data: null,
          message: 'Payment approved successfully',
        });
      }

      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `${payment.senderPosition.id} is already activated By admin`,
        statusCode: 400,
      };
      return res.status(404).json(errorResponse);

    }

    if (payment.paymentType !== 'ACTIVATION') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Not an activation payment',
        statusCode: 400,
      };
      return res.status(404).json(errorResponse);

    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Payment already ${payment.status.toLowerCase()}`,
        statusCode: 400,
      });
    }

    if (action === 'APPROVED' && !payment.confirmed) {
      await prisma.$transaction(async (tx) => {
        // 1. Mark payment as approved
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'APPROVED',
            confirmed: true,
          }
        });

        // 2. Activate the sender's position
        const activatedPosition = await tx.position.update({
          where: { id: payment.senderPositionId },
          data: {
            isActive: true,
            currentLevel: 1,
          }
        });

        // 3. Create UserLevel for Level 1
        await tx.userLevel.create({
          data: {
            positionId: activatedPosition.id,
            levelNumber: 1,
            isActive: true,
            paymentCapacity: 999,
            sponsorPaid: false, // need to change if sponsor payment needed in level 1
          }
        });

        // 4. ✅ NEW: Increment the SPONSOR POSITION's referral count
        if (activatedPosition.placedUnderPositionId) {
          // Increment the position that placed this user
          const sponsorPosition = await tx.position.update({
            where: { id: activatedPosition.placedUnderPositionId },
            data: {
              directReferralCount: { increment: 1 }
            },
            select: {
              id: true,
              directReferralCount: true,
              currentLevel: true,
              placedUnderPositionId: true,
              user: {
                select: {
                  role: true,
                }
              }
            }
          });

          if (sponsorPosition.user.role === "USER") {
            await tx.userLevel.update({
              where: {
                positionId_levelNumber: {
                  positionId: activatedPosition.placedUnderPositionId,
                  levelNumber: 1
                }
              },
              data: {
                paymentsReceived: { increment: 1 },
                amountEarned: { increment: 500 },
              }
            })

            // 6. If sponsor position has 2 refs and is at Level 1, generate upgrade link and sponsor link
            if (
              sponsorPosition &&
              sponsorPosition.directReferralCount === 2 &&
              sponsorPosition.currentLevel === 1
            ) {
              // ✅ Check if upgrade link already exists
              const existingUpgrade = await tx.pendingLink.findFirst({
                where: {
                  positionId: sponsorPosition.id,
                  linkType: 'UPGRADE',
                  targetLevel: 2,
                  isCompleted: false,
                }
              });

              if (!existingUpgrade) {
                await tx.pendingLink.create({
                  data: {
                    positionId: sponsorPosition.id,
                    linkType: 'UPGRADE',
                    targetLevel: 2,
                    amount: 700,
                    isCompleted: false,
                  }
                });
              }

              if (sponsorPosition.placedUnderPositionId) {
                await tx.pendingLink.create({
                  data: {
                    positionId: sponsorPosition.id,
                    linkType: 'SPONSOR_PAYMENT',
                    amount: 50,
                    isCompleted: false,
                  }
                })
              }
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: null,
        message: 'Activation approved successfully',
      });

    } else if (action === 'REJECTED') {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REJECTED' }
      });

      return res.status(200).json({
        success: true,
        data: null,
        message: 'Activation rejected',
      });

    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use "APPROVED" or "REJECTED"',
        statusCode: 400,
      });
    }

  } catch (error: any) {
    console.error('Error in confirmActivationPayment:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to confirm payment',
      statusCode: 500,
    });
  }
};

export const confirmUpgradeAndSponsorPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { action } = req.body;

    if (!paymentId || !action) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Payment ID and action are required',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        senderPosition: true,
        receiverPosition: true,
      }
    })

    if (!payment) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Payment not found',
        statusCode: 404,
      };
      return res.status(404).json(errorResponse);
    }

    if (payment.status === 'APPROVED' || payment.status === 'REJECTED') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `${payment.status === "APPROVED" ? "Payment is already approved" : "Payment is rejected by Admin"}`,
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    if (action === 'APPROVED' && !payment.confirmed) {

      if (payment.paymentType === 'SPONSOR_PAYMENT') {

        await prisma.$transaction(async (tx) => {

          const receiverRole = await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: 'APPROVED',
              confirmed: true,
            },
            select: {
              receiverPosition: {
                select: {
                  user: {
                    select: {
                      role: true
                    }
                  }
                }
              }
            }
          })

          await tx.userLevel.update({
            where: {
              positionId_levelNumber: {
                positionId: payment.senderPositionId,
                levelNumber: payment.senderPosition.currentLevel,
              }
            },
            data: {
              sponsorPaid: true,
            }
          })

          if (receiverRole.receiverPosition.user.role === "USER") {

            await tx.userLevel.update({
              where: {
                positionId_levelNumber: {
                  positionId: payment.receiverPositionId,
                  levelNumber: payment.receiverPosition.currentLevel,
                }
              },
              data: {
                amountEarned: {
                  increment: payment.amount,
                }
              }
            })
          }
        })

        const responce: ApiSuccessResponse = {
          success: true,
          data: null,
          message: "Payment Approved"
        }

        return res.status(201).json(responce)
      }

      if (payment.paymentType === 'UPGRADE') {

        const nextLevelForSender = payment.senderPosition.currentLevel + 1

        const levelConfig = await prisma.levelConfig.findUnique({
          where: {
            level: nextLevelForSender
          }
        })

        if (!levelConfig) {
          const errorResponse: ApiErrorResponse = {
            success: false,
            error: `Levels Cannot be found contact Admin`,
            statusCode: 400,
          };
          return res.status(400).json(errorResponse);
        }

        await prisma.$transaction(async (tx) => {

          // payment update,
          const reciverRoleInPayment = await tx.payment.update({
            where: {
              id: paymentId
            },
            data: {
              status: "APPROVED",
              confirmed: true
            },
            select: {
              receiverPosition: {
                select: {
                  user: {
                    select: {
                      role: true
                    }
                  }
                }
              }
            }
          })

          //sender userlevel create, position update
          await tx.userLevel.create({
            data: {
              positionId: payment.senderPositionId,
              levelNumber: levelConfig.level,
              isActive: true,
              paymentCapacity: levelConfig.paymentCapacity
            }
          })

          await tx.position.update({
            where: {
              id: payment.senderPositionId
            },
            data: {
              currentLevel: levelConfig.level
            }
          })

          if (reciverRoleInPayment.receiverPosition.user.role === "USER") {
            // receiver userlevel paymentsReceived increment, 1st pay (create reentry pending link, sponsor payment pending link), next upgrade pending link 
            const receiverUserLevel = await tx.userLevel.update({
              where: {
                positionId_levelNumber: {
                  positionId: payment.receiverPositionId,
                  levelNumber: levelConfig.level
                }
              },
              data: {
                // paymentsReceived: { // this will happen in the pendning link payment generation
                //   increment: 1
                // },
                amountEarned: { // this will happen in the confirmation of payment - here
                  increment: payment.amount
                }
              }
            })

            if (receiverUserLevel.paymentsReceived === 1) {
              // create reentry pending link
              await tx.pendingLink.create({
                data: {
                  positionId: payment.receiverPositionId,
                  linkType: 'REENTRY',
                  reentryCount: levelConfig.reentryCount,
                  isCompleted: false,
                }
              });

              // create sponsor payment pending link
              await tx.pendingLink.create({
                data: {
                  positionId: payment.receiverPositionId,
                  linkType: 'SPONSOR_PAYMENT',
                  amount: levelConfig.sponsorAmount,
                  isCompleted: false,
                }
              })
            }

            if (receiverUserLevel.paymentsReceived === levelConfig.upgradeAtPayment && levelConfig.level < 5) {
              // create next upgrade pending link
              const nextLevelConfig = await tx.levelConfig.findUnique({
                where: {
                  level: levelConfig.level + 1
                }
              })

              if (nextLevelConfig) {
                await tx.pendingLink.create({
                  data: {
                    positionId: payment.receiverPositionId,
                    linkType: 'UPGRADE',
                    targetLevel: nextLevelConfig.level,
                    amount: nextLevelConfig.upgradeAmount,
                    isCompleted: false,
                  }
                });
              }
            }
          }
        })

        const responce: ApiSuccessResponse = {
          success: true,
          data: null,
          message: "Payment Approved"
        }

        return res.status(201).json(responce)
      }
    }
    else if (action === "UNDER_REVIEW") {
      if (payment.paymentType === 'SPONSOR_PAYMENT') {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'UNDER_REVIEW' }
        });

        const response: ApiSuccessResponse = {
          success: true,
          data: null,
          message: 'Sponsor payment is submitted for review',
        };
        return res.status(200).json(response);
      }
      if (payment.paymentType === 'UPGRADE') {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'UNDER_REVIEW' }
        });
        const response: ApiSuccessResponse = {
          success: true,
          data: null,
          message: 'Upgrade payment is submitted for review',
        };
        return res.status(200).json(response);
      }
    }
    else {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid action. Use "APPROVED" or "UNDER REVIEW"',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }
  } catch (error: any) {
    console.error('Error in confirmUpgradeAndSponsorPayment:', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Unable to Confirm payment request',
      statusCode: 500,
    };

    res.status(500).json(errorResponse);
  }
}

export const confirmUpgradeAndSponsorPaymentViaAdmin = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { action } = req.body;

    if (!paymentId || !action) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Payment ID and action are required',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        senderPosition: true,
        receiverPosition: true,
      }
    })

    if (!payment) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Payment not found',
        statusCode: 404,
      };
      return res.status(404).json(errorResponse);
    }

    if (payment.status === 'APPROVED' || payment.status === 'REJECTED') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `${payment.status === "APPROVED" ? "Payment is already approved" : "Payment is rejected and can't be approved again"}`,
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    if (action === 'APPROVED' && !payment.confirmed) {

      if (payment.paymentType === 'SPONSOR_PAYMENT') {

        await prisma.$transaction(async (tx) => {

          const receiverRole = await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: 'APPROVED',
              confirmed: true,
            },
            select: {
              receiverPosition: {
                select: {
                  user: {
                    select: {
                      role: true
                    }
                  }
                }
              }
            }
          })

          await tx.userLevel.update({
            where: {
              positionId_levelNumber: {
                positionId: payment.senderPositionId,
                levelNumber: payment.senderPosition.currentLevel,
              }
            },
            data: {
              sponsorPaid: true,
            }
          })

          if (receiverRole.receiverPosition.user.role === "USER") {

            await tx.userLevel.update({
              where: {
                positionId_levelNumber: {
                  positionId: payment.receiverPositionId,
                  levelNumber: payment.receiverPosition.currentLevel,
                }
              },
              data: {
                amountEarned: {
                  increment: payment.amount,
                }
              }
            })
          }
        })

        const responce: ApiSuccessResponse = {
          success: true,
          data: null,
          message: "Payment Approved"
        }

        return res.status(201).json(responce)
      }

      if (payment.paymentType === 'UPGRADE') {

        const nextLevelForSender = payment.senderPosition.currentLevel + 1

        const levelConfig = await prisma.levelConfig.findUnique({
          where: {
            level: nextLevelForSender
          }
        })

        if (!levelConfig) {
          const errorResponse: ApiErrorResponse = {
            success: false,
            error: `Levels Cannot be found contact Admin`,
            statusCode: 400,
          };
          return res.status(400).json(errorResponse);
        }

        await prisma.$transaction(async (tx) => {

          // payment update,
          const reciverRoleInPayment = await tx.payment.update({
            where: {
              id: paymentId
            },
            data: {
              status: "APPROVED",
              confirmed: true
            },
            select: {
              receiverPosition: {
                select: {
                  user: {
                    select: {
                      role: true
                    }
                  }
                }
              }
            }
          })

          //sender userlevel create, position update
          await tx.userLevel.create({
            data: {
              positionId: payment.senderPositionId,
              levelNumber: levelConfig.level,
              isActive: true,
              paymentCapacity: levelConfig.paymentCapacity
            }
          })

          await tx.position.update({
            where: {
              id: payment.senderPositionId
            },
            data: {
              currentLevel: levelConfig.level
            }
          })

          if (reciverRoleInPayment.receiverPosition.user.role === "USER") {
            const receiverUserLevel = await tx.userLevel.update({
              where: {
                positionId_levelNumber: {
                  positionId: payment.receiverPositionId,
                  levelNumber: levelConfig.level
                }
              },
              data: {
                amountEarned: {
                  increment: payment.amount
                }
              }
            })

            if (receiverUserLevel.paymentsReceived === 1) {
              // create reentry pending link
              await tx.pendingLink.create({
                data: {
                  positionId: payment.receiverPositionId,
                  linkType: 'REENTRY',
                  reentryCount: levelConfig.reentryCount,
                  isCompleted: false,
                }
              });

              // create sponsor payment pending link
              await tx.pendingLink.create({
                data: {
                  positionId: payment.receiverPositionId,
                  linkType: 'SPONSOR_PAYMENT',
                  amount: levelConfig.sponsorAmount,
                  isCompleted: false,
                }
              })
            }

            if (receiverUserLevel.paymentsReceived === levelConfig.upgradeAtPayment && levelConfig.level < 5) {
              // create next upgrade pending link
              const nextLevelConfig = await tx.levelConfig.findUnique({
                where: {
                  level: levelConfig.level + 1
                }
              })

              if (nextLevelConfig) {
                await tx.pendingLink.create({
                  data: {
                    positionId: payment.receiverPositionId,
                    linkType: 'UPGRADE',
                    targetLevel: nextLevelConfig.level,
                    amount: nextLevelConfig.upgradeAmount,
                    isCompleted: false,
                  }
                });
              }
            }
          }
        })

        const responce: ApiSuccessResponse = {
          success: true,
          data: null,
          message: "Payment Approved"
        }

        return res.status(201).json(responce)
      }
    }
    else if (action === "REJECTED") {
      if (payment.paymentType === 'SPONSOR_PAYMENT') {

        await prisma.$transaction(async (tx) => {

          const payment = await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: 'REJECTED',
            }
          });

          if (!payment.requestVerification) {
            await tx.payment.update({
              where: { id: paymentId },
              data: {
                requestVerification: true,
              }
            });

            await tx.pendingLink.updateMany({
              where: {
                positionId: payment.senderPositionId,
                linkType: 'SPONSOR_PAYMENT',
                amount: payment.amount,
              },
              data: {
                isCompleted: true,
              }
            })
          }

          await tx.pendingLink.create({
            data: {
              positionId: payment.senderPositionId,
              linkType: 'SPONSOR_PAYMENT',
              amount: payment.amount,
              isCompleted: false,
            }
          })

        })

        const response: ApiSuccessResponse = {
          success: true,
          data: null,
          message: 'payment is rejected and link created for sponsor payment',
        };
        return res.status(200).json(response);
      }
      if (payment.paymentType === 'UPGRADE' && payment.upgradeToLevel) {

        await prisma.$transaction(async (tx) => {

          const payment = await tx.payment.update({
            where: { id: paymentId },
            data: { status: 'REJECTED' },
            select: {
              requestVerification: true,
              senderPositionId: true,
              upgradeToLevel: true,
              amount: true,
              receiverPosition: {
                select: {
                  id: true,
                  user: {
                    select: {
                      role: true
                    }
                  }
                }
              },
            }
          });

          if (!payment.requestVerification && payment.upgradeToLevel) {
            await tx.payment.update({
              where: { id: paymentId },
              data: {
                requestVerification: true,
              }
            });

            await tx.pendingLink.updateMany({
              where: {
                positionId: payment.senderPositionId,
                linkType: 'UPGRADE',
                targetLevel: payment.upgradeToLevel,
                amount: payment.amount,
              },
              data: {
                isCompleted: true,
              }
            })
          }

          if (payment.receiverPosition.user.role === "USER" && payment.upgradeToLevel) {

            await tx.userLevel.update({
              where: {
                positionId_levelNumber: {
                  positionId: payment.receiverPosition.id,
                  levelNumber: payment.upgradeToLevel
                }
              },
              data: {
                paymentsReceived: { decrement: 1 }
              }
            })

          }

          await tx.pendingLink.create({
            data: {
              positionId: payment.senderPositionId,
              linkType: 'UPGRADE',
              targetLevel: payment.upgradeToLevel,
              amount: payment.amount,
              isCompleted: false,
            }
          })

        })

        const response: ApiSuccessResponse = {
          success: true,
          data: null,
          message: 'Payment is rejected and link created for upgrade',
        };
        return res.status(200).json(response);
      }
    }
    else {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid action. Use "APPROVED" or "UNDER REVIEW"',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }
  } catch (error: any) {
    console.error('Error in confirmUpgradeAndSponsorPayment:', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Unable to Confirm payment request',
      statusCode: 500,
    };

    res.status(500).json(errorResponse);
  }
}