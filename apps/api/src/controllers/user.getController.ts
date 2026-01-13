import e, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { ApiSuccessResponse, ApiErrorResponse, IncomingPayment, PaymentType, UserSchemaForPin, UserProfileType, Position } from '@repo/types';
import { ZodError } from 'zod';


import { getAdminSystemIds } from '../lib/system';


export const fetchUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId
    if (!userId || typeof userId !== "string") {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'User ID not found.',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role: "USER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        bankDetails: true,
        positions: {
          select: {
            id: true,
            placedUnderPosition: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    mobile: true,
                    bankDetails: {
                      select: {
                        bankName: true,
                        accountNumber: true,
                        ifscCode: true,
                        qrCode: true,
                        gPay: true,
                        upiId: true
                      }
                    }
                  }
                },
              }
            },
            sentPayments: {
              where: {
                paymentType: 'ACTIVATION',
                status: 'PENDING'
              },
              select: {
                status: true,
              }
            },
            positionType: true,
            currentLevel: true,
            isActive: true,
            directReferralCount: true
          },
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'User not found.',
        statusCode: 404,
      };
      return res.status(404).json(errorResponse);
    }

    // Transform the data to flatten positions
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      isBankDetials: user.bankDetails ? true : false,
      positions: user.positions.map((position): Position => {
        const sponsorUser = position.placedUnderPosition?.user;
        const sponsorBank = sponsorUser?.bankDetails ?? null;

        const hasSponsorBankData =
          sponsorBank &&
          Object.values({
            bankName: sponsorBank.bankName,
            accountNumber: sponsorBank.accountNumber,
            ifscCode: sponsorBank.ifscCode,
            upiId: sponsorBank.upiId,
            qrCode: sponsorBank.qrCode,
            gPay: sponsorBank.gPay,
          }).some(Boolean);

        return {
          positionType: position.positionType,
          currentLevel: position.currentLevel,
          isActive: position.isActive,
          directReferralCount: position.directReferralCount,
          positionId: position.id,

          sponsorId: sponsorUser?.id || null,
          sponsorName: sponsorUser?.name || null,
          sponsorMobile: sponsorUser?.mobile || null,
          sponsorPositionId: position.placedUnderPosition?.id || null,

          sponsorBankDetails: hasSponsorBankData
            ? {
              bankName: sponsorBank!.bankName,
              accountNumber: sponsorBank!.accountNumber,
              ifscCode: sponsorBank!.ifscCode,
              upiId: sponsorBank!.upiId,
              qrCode: sponsorBank!.qrCode,
              gPay: sponsorBank!.gPay,
            }
            : null,

          activationPayment:
            position.sentPayments.length > 0
              ? position.sentPayments[0].status
              : null,
        };
      }),
    };

    const userData: ApiSuccessResponse = {
      success: true,
      data: { user: transformedUser },
    }
    return res.status(200).json(userData)

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to fetch UserDetails',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const getUserIncomingPayments = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User accountId is Required"
      }
      return res.status(400).json(errorResponse);

    }

    const position = await prisma.position.findMany({
      where: {
        userId: userId
      },
      include: {
        receivedPayments: {
          where: {
            status: "PENDING",
            requestVerification: true
          },
          include: {
            senderPosition: {
              select: {
                user: {
                  select: {
                    name: true,
                    id: true,
                    mobile: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!position) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User not found"
      }
    }
    const incomingPayments: IncomingPayment[] = position.flatMap(
      ({ receivedPayments }) =>
        receivedPayments.map(
          ({
            id: paymentId,
            screenshotUrl,
            amount,
            paymentType,
            status,
            confirmed,
            upgradeToLevel,
            updatedAt,
            senderPositionId,
            receiverPositionId,
            senderPosition: {
              user: {
                id: senderUserId,
                name: senderUserName,
                mobile: senderUserMobile
              }
            }
          }) => ({
            paymentId,
            screenshotUrl,

            senderUserName,
            senderUserId,
            senderUserMobile,
            senderAccountId: senderPositionId,

            receiverAccountId: receiverPositionId,

            amount,
            paymentType,
            status,
            confirmed,
            upgradeToLevel,

            updatedAt: updatedAt.toISOString()
          })
        )
    );


    const data: ApiSuccessResponse = {
      success: true,
      data: {
        incomingPayments,
      },
    }
    return res.status(200).json({
      success: data.success,
      incomingPayments: data.data.incomingPayments,
    });

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to get User Payments Details',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const getUserPendingLinks = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User accountId is Required"
      }
      return res.status(400).json(errorResponse);
    }

    const position = await prisma.position.findMany({
      where: {
        userId: userId
      },
      include: {
        pendingLinks: {
          where: {
            isCompleted: false
          }
        }
      }
    })
    if (!position) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User not found"
      }
      return res.status(400).json(errorResponse);
    }
    const pendingLinks = position.map(pos => pos.pendingLinks).flat() || null

    const data: ApiSuccessResponse = {
      success: true,
      data: {
        pendingLinks
      },
    }
    return res.status(200).json({
      success: data.success,
      pendingLinks: data.data.pendingLinks,
    });

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to get User Pending Links',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const getUserPins = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User accountId is Required"
      }
      return res.status(400).json(errorResponse);

    }

    const pins = await prisma.pin.findMany({
      where: {
        currentOwner: userId,
      },
      orderBy: {
        status: 'desc'
      }
    })

    if (!pins) {
      const errorResponse: ApiErrorResponse = {
        error: "Invalid User Id",
        success: false,
      }

      return res.status(400).json(errorResponse)
    }

    const data: ApiSuccessResponse = {
      success: true,
      data: pins,
    }

    return res.status(200).json(
      {
        success: data.success,
        pins: data.data,
      }
    )

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to get User Pending Links',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User accountId is Required"
      }
      return res.status(400).json(errorResponse);
    }

    const userDetails = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        bankDetails: true
      }
    })

    if (!userDetails) {
      const errorResponse: ApiErrorResponse = {
        error: "Invalid User Id",
        success: false,
      }

      return res.status(400).json(errorResponse)
    }

    const bankDetail = (() => {
      const bank = userDetails.bankDetails ?? null;

      const hasBankData =
        bank &&
        Object.values({
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          ifscCode: bank.ifscCode,
          upiId: bank.upiId,
          qrCode: bank.qrCode,
          gPay: bank.gPay,
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

    const user: UserSchemaForPin = {
      id: userDetails.id,
      name: userDetails.name,
      mobile: userDetails.mobile,
      bankDetail,
    };


    const data: ApiSuccessResponse = {
      success: true,
      data: user,
    }

    return res.status(200).json(
      {
        success: data.success,
        user: data.data,
      }
    )

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to get User Details',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const getAdminDetails = async (req: Request, res: Response) => {
  try {

    const admin = await getAdminSystemIds()

    const userDetails = await prisma.user.findUnique({
      where: {
        id: admin.userId
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        bankDetails: true
      }
    })

    if (!userDetails) {
      const errorResponse: ApiErrorResponse = {
        error: "Invalid User Id",
        success: false,
      }

      return res.status(400).json(errorResponse)
    }

    const bankDetail = (() => {
      const bank = userDetails.bankDetails ?? null;

      const hasBankData =
        bank &&
        Object.values({
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          ifscCode: bank.ifscCode,
          upiId: bank.upiId,
          qrCode: bank.qrCode,
          gPay: bank.gPay,
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

    const user: UserSchemaForPin = {
      id: userDetails.id,
      name: userDetails.name,
      mobile: userDetails.mobile,
      bankDetail
    }


    const data: ApiSuccessResponse = {
      success: true,
      data: user,
    }

    return res.status(200).json(
      {
        success: data.success,
        user: data.data,
      }
    )

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to get User Details',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const getUserAllPendingPinRequest = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User Id is Required"
      }
      return res.status(400).json(errorResponse)
    }

    const userDetails = await prisma.pinRequest.findMany({
      where: {
        toUserId: userId,
        status: "PENDING",
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            mobile: true,
          }
        }
      }
    })

    if (!userDetails) {
      const errorResponse: ApiErrorResponse = {
        error: "Invalid User Id",
        success: false,
      }

      return res.status(400).json(errorResponse)
    }


    const data: ApiSuccessResponse = {
      success: true,
      data: userDetails,
    }

    return res.status(200).json(
      {
        success: data.success,
        user: data.data,
      }
    )

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to get Pending pin Request',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const fetchUserProfileData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User Id is Required"
      }
      return res.status(400).json(errorResponse)
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        password: true,
        bankDetails: true,
        createdAt: true
      }
    })

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User Not Found"
      }
      return res.status(400).json(errorResponse);
    }

    const bankDetail = (() => {
      const bank = user.bankDetails ?? null;

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


    const userData: UserProfileType = {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      password: user.password,
      bankDetail,
      createdAt: user.createdAt.toISOString()
    }


    const data: ApiSuccessResponse = {
      success: true,
      data: userData,
    }

    return res.status(200).json(
      {
        success: data.success,
        user: data.data,
      }
    )


  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Request failed',
        statusCode: 400,
      } as ApiErrorResponse);
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || "Failed to fetch user Profile Data"
    }
    return res.status(500).json(errorResponse);
  }
};

export const getUserTeamDetails = async (req: Request, res: Response) => {
  try {

    const { userId } = req.params

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "UserId not found"
      }
      return res.status(400).json(errorResponse)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        positions: {
          select: {
            id: true,
            currentLevel: true,
            positionType: true,
            isActive: true,
            placedUnderPositionId: true,
            directReferralCount: true,
            userLevels: { select: { levelNumber: true, amountEarned: true } }
          },
          orderBy: { createdAt: "asc" }
        },
      },
    })

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User not found"
      }
      return res.status(400).json(errorResponse)
    }


    const positionsWithTeam = []

    for (const pos of user.positions) {
      const team = await getDownlineByLevel(
        pos.id,
        pos.currentLevel
      )

      positionsWithTeam.push({
        ...pos,
        team,
      })
    }

    return res.status(200).json({
      success: true,
      data: positionsWithTeam,
    })

  } catch (error: any) {

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || "Failed to fetch user team details"
    }
    return res.status(500).json(errorResponse);
  }
}

async function getDownlineByLevel(
  rootPositionId: string,
  maxLevel: number
) {
  const result: Record<number, any[]> = {}

  // Level 0 starts with root
  let currentLevelPositions = [rootPositionId]

  for (let level = 1; level <= maxLevel; level++) {
    if (currentLevelPositions.length === 0) break

    // fetch all children of current level in ONE query
    const children = await prisma.position.findMany({
      where: {
        placedUnderPositionId: {
          in: currentLevelPositions,
        },
      },
      select: {
        id: true,
        userId: true,
        positionType: true,
        placedUnderPositionId: true,
        currentLevel: true,
        isActive: true,
        directReferralCount: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
      },
    })

    if (children.length > 0) {
      result[level] = children
      currentLevelPositions = children.map(p => p.id)
    } else {
      break
    }
  }

  return result
}

export const getUserAllPositionsEarnings = async (req: Request, res: Response) => {
  try {

    const { userId } = req.params

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "UserId not found. Please re-login and try again."
      }
      return res.status(400).json(errorResponse)
    }

    const user = await prisma.position.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        currentLevel: true,
        positionType: true,
        isActive: true,
        userLevels: { select: { levelNumber: true, amountEarned: true } },
        sentPayments: {
          where: {
            requestVerification: true
          },
          select: {
            id: true,
            receiverPosition: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    mobile: true
                  }
                }
              }
            },
            amount: true,
            paymentType: true,
            status: true,
            upgradeToLevel: true,
          }
        },
        receivedPayments: {
          where: {
            requestVerification: true
          },
          select: {
            id: true,
            senderPosition: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    mobile: true
                  }
                }
              }
            },
            amount: true,
            paymentType: true,
            status: true,
            upgradeToLevel: true,
          }
        }
      },
      orderBy: { createdAt: "asc" }
    })

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User not found. Please re-login and try again."
      }
      return res.status(400).json(errorResponse)
    }

    return res.status(200).json({
      success: true,
      accounts: user,
    })

  } catch (error: any) {

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || "Failed to fetch user team details"
    }
    return res.status(500).json(errorResponse);
  }
}

export const getUserAllPinRequests = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "UserId not found. Please re-login and try again."
      }
      return res.status(400).json(errorResponse)
    }

    const request = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        sentPinRequests: {
          select: {
            toUser: {
              select: {
                id: true,
                name: true,
              }
            },
            count: true,
            status: true
          }
        },
        receivedPinRequests: {
          select: {
            fromUser: {
              select: {
                id: true,
                name: true,
              }
            },
            count: true,
            status: true
          }
        }
      }
    })

    if (!request) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "User does not have any pin requests"
      }
      return res.status(400).json(errorResponse)
    }

    const pinReceived = request.sentPinRequests.map((r) => ({
      numOfPinsReceived: r.count,
      status: r.status,
      userId: r.toUser.id,
      userName: r.toUser.name
    }))

    const pinSent = request.receivedPinRequests.map((r) => ({
      numOfPinsSent: r.count,
      status: r.status,
      userId: r.fromUser.id,
      userName: r.fromUser.name
    }))


    return res.status(200).json({
      success: true,
      request: {
        pinSent,
        pinReceived
      },
    })

  } catch (error: any) {

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || "Failed to fetch user team details"
    }
    return res.status(500).json(errorResponse);
  }
}

export const getSponsorName = async (req: Request, res: Response) => {
  const { sponsorPositionId } = req.params

  if (!sponsorPositionId) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: "UserId not found"
    }
    return res.status(400).json(errorResponse)
  }

  try {

    const sponsor = await prisma.position.findUnique({
      where: {
        id: sponsorPositionId
      },
      select: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    if (!sponsor) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Invalid Referral Code."
      }
      return res.status(400).json(errorResponse)
    }

    return res.status(200).json({
      success: true,
      name: sponsor.user.name,
    })

  } catch (error: any) {

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || "Failed to fetch Sponsor name"
    }
    return res.status(500).json(errorResponse);
  }
}

export const getUserRetryPaymentDetails = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params

    if (!paymentId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "PaymentId not found"
      }
      return res.status(400).json(errorResponse)
    }

    const existingPayment = await prisma.payment.findUnique({
      where: {
        id: paymentId
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

    if (!existingPayment) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Invalid Payment Id."
      }
      return res.status(400).json(errorResponse)
    }

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

    return res.status(200).json({
      success: true,
      payment,
    })

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || "Failed to fetch user payment details"
    }
    return res.status(500).json(errorResponse);
  }
}