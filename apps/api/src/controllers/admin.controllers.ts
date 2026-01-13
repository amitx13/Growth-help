import { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { randomUUID } from 'crypto';
import { AdminbankDetails, AdminPaymentSchema, ApiErrorResponse, ApiSuccessResponse, DashboardData, DashboardStats, LevelConfig, LoginSchema, PendingPayment, PendingPinRequest, pinRequests, pinsModel, RecentUser, UpdateUserProfileSchema, UserInAdmin, ZodError } from '@repo/types';
import jwt from 'jsonwebtoken';
import { getAdminSystemIds } from '../lib/system';
import { deleteUploadedFile } from './user.createController';

// Generate unique 6-character PIN
function createPin(): string {
  const uuid = randomUUID().replace(/-/g, '').substring(0, 6);
  return uuid.toUpperCase();
}

//todo
export const generatePin = async (req: Request, res: Response) => {
  try {
    const { generateCount } = req.body;

    if (!generateCount) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Please provide number of pins to generate',
        statusCode: 400,
        message: 'Please provide number of pins to generate',
      };
      return res.status(400).json(errorResponse);
    }

    const count = parseInt(generateCount, 10);

    if (isNaN(count) || count < 1) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid pin count. Must be a positive number',
        statusCode: 400,
        message: 'Invalid pin count. Must be a positive number',
      };
      return res.status(400).json(errorResponse);
    }

    if (count > 1000) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Cannot generate more than 1000 PINs at once',
        statusCode: 400,
        message: 'Cannot generate more than 1000 PINs at once',
      };
      return res.status(400).json(errorResponse);
    }

    const admin = await getAdminSystemIds();

    const pinsToCreate: string[] = [];
    const maxAttempts = count * 10;
    let attempts = 0;

    while (pinsToCreate.length < count && attempts < maxAttempts) {
      const pin = createPin();

      // Check if PIN already exists in DB or in current batch
      const exists = await prisma.pin.findUnique({
        where: { pinCode: pin },
      });

      if (!exists && !pinsToCreate.includes(pin)) {
        pinsToCreate.push(pin);
      }

      attempts++;
    }

    if (pinsToCreate.length < count) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Failed to generate unique PINs. Please try again.',
        statusCode: 500,
        message: 'Failed to generate unique PINs. Please try again.',
      };
      return res.status(500).json(errorResponse);
    }

    await prisma.pin.createMany({
      data: pinsToCreate.map((pinCode) => ({
        pinCode,
        currentOwner: admin.userId,
      })),
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        generated: count,
        pins: pinsToCreate,
      },
      message: `${count} PIN(s) generated successfully`,
    };

    return res.status(201).json(response);

  } catch (error: any) {

    if (error.code === 'P2002') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Duplicate PIN detected. Please try again.',
        statusCode: 409,
        message: 'Duplicate PIN detected. Please try again.',
      };
      return res.status(409).json(errorResponse);
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to generate PINs',
      statusCode: 500,
      message: 'Failed to generate PINs',
    };

    return res.status(500).json(errorResponse);
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const validateData = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: {
        id: validateData.userId
      },
      select: { id: true, password: true, name: true, role: true }
    })

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid credentials',
        statusCode: 422,
        message: 'User-ID is incorrect. Please re-check and try again.',
      };
      return res.status(422).json(errorResponse);
    }

    if (user.password !== validateData.password) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid credentials',
        statusCode: 422,
        message: 'Password is incorrect. Please re-check and try again.',
      };
      return res.status(422).json(errorResponse);
    }

    if (user.role === 'USER') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid credentials',
        statusCode: 422,
        message: `This account has user access and is restricted from logging in.`,
      };
      return res.status(422).json(errorResponse);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password, role, ...userWithoutPassword } = user;

    const response: ApiSuccessResponse = {
      success: true,
      data: userWithoutPassword,
      message: `${user.name} logged in successfully`,
    };

    return res.status(200).json(response);

  } catch (error: any) {
    if (error instanceof ZodError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Validation failed',
        statusCode: 400,
        message: error.message,
      };
      return res.status(400).json(errorResponse);
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Unable to login',
      statusCode: 500,
      message: 'An unexpected error occurred',
    };

    res.status(500).json(errorResponse);
  }
};

export const fetchAdminDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.userId
    if (!userId || typeof userId !== "string") {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Admin ID not found.',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role: "ADMIN"
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        positions: {
          select: {
            id: true,
            directReferralCount: true
          }
        }
      }
    })

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Admin not found.',
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
      positions: user.positions.map(position => ({
        directReferralCount: position.directReferralCount,
        positionId: position.id,
      }))
    }

    const userData: ApiSuccessResponse = {
      success: true,
      data: { user: transformedUser },
    }
    return res.status(200).json(userData)

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to fetch Admin Details',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const getAdminDashboardData = async (req: Request, res: Response) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const admin = await getAdminSystemIds();

    const [
      totalUsers,
      totalPositions,
      totalActivePositions,
      totalPins,
      usedPins,
      activePins,
      totalPaymentsReceivedByAdmin,
      pendingPaymentsData,
      totalPendingPaymentsCount,
      recentUsersData,
      totalRecentUsersCount,
      pendingPinRequestsData,
      totalPinPendingRequestCount
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.position.count({
        where: {
          user: {
            role: "USER"
          }
        }
      }),
      prisma.position.count({
        where: {
          isActive: true,
          user: {
            role: "USER"
          }
        }
      }),
      prisma.pin.count(),
      prisma.pin.count({ where: { status: false } }),
      prisma.pin.count({ where: { status: true } }),
      prisma.payment.findMany({
        where: {
          receiverPositionId: admin.accountId,
          status: "APPROVED"
        },
        select: {
          amount: true
        }
      }),
      prisma.payment.findMany({
        where: {
          requestVerification: true,
          status: "PENDING"
        },
        select: {
          id: true,
          senderPositionId: true,
          receiverPositionId: true,
          amount: true,
          paymentType: true,
          createdAt: true,
          updatedAt: true
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({
        where: {
          requestVerification: true,
          status: "PENDING"
        }
      }),
      prisma.user.findMany({
        where: {
          role:"USER",
          createdAt: { gte: last24Hours }
        },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          createdAt: true,
          positions: {
            select: { isActive: true },
            take: 1
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({
        where: {
          role:"USER",
          createdAt: { gte: last24Hours }
        },
      }),
      prisma.pinRequest.findMany({
        where: {
          status: "PENDING",
          toUserId: admin.userId
        },
        select: {
          id: true,
          fromUserId: true,
          toUserId: true,
          count: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.pinRequest.count({
        where: {
          status: "PENDING",
          toUserId: admin.userId
        },
      })
    ]);

    const totalRevenue = totalPaymentsReceivedByAdmin.reduce((sum, p) => sum + p.amount, 0);

    const PIN_PRICE = 50;

    const stats: DashboardStats = {
      totalUsers,
      totalPositions,
      activePositions: totalActivePositions,
      totalRevenue,
      pendingPayments: totalPendingPaymentsCount,
      recentUsersCount: totalRecentUsersCount,
      totalPins,
      usedPins,
      activePins,
      pendingPinRequests: totalPinPendingRequestCount
    };

    const recentUsers: RecentUser[] = recentUsersData.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      mobile: u.mobile,
      createdAt: u.createdAt.toISOString(),
      status: u.positions.length > 0 && u.positions[0].isActive ? 'active' : 'inactive',
    }));

    const pendingPayments: PendingPayment[] = pendingPaymentsData.map((p) => ({
      id: p.id,
      from: p.senderPositionId,
      to: p.receiverPositionId,
      amount: p.amount,
      type: p.paymentType,
      createdAt: p.createdAt.toISOString()
    }));

    const pendingPinRequests: PendingPinRequest[] = pendingPinRequestsData.map((pin) => ({
      id: pin.id,
      fromUser: pin.fromUserId,
      toUser: pin.toUserId,
      count: pin.count,
      amount: pin.count * PIN_PRICE,
      createdAt: pin.createdAt.toISOString()
    }));

    const dashboardData: DashboardData = {
      stats,
      referalCode: admin.accountId,
      recentUsers,
      pendingPayments,
      pendingPinRequests
    };

    return res.status(200).json({
      success: true,
      dashboardData
    });

  } catch (error: any) {
    console.error('Dashboard Error:', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to fetch Admin Details',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
};

export const getUsersDetails = async (req: Request, res: Response) => {
  try {
    const usersDeta = await prisma.user.findMany({
      where: {
        role: "USER"
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        password: true,
        createdAt: true,
        bankDetails: {
          select: {
            bankName: true,
            accountNumber: true,
            ifscCode: true,
            upiId: true,
            gPay: true,
            qrCode: true
          }
        },
        positions: {
          select: {
            id: true,
            positionType: true,
            currentLevel: true,
            isActive: true,
            directReferralCount: true,
            userLevels: {
              select: {
                levelNumber: true,
                amountEarned: true,
                paymentsReceived: true
              }
            },
            placedUnderPosition: {
              select: {
                id: true,
                currentLevel: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    mobile: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const users: UserInAdmin[] = usersDeta.map((u) => {
      const bank = u.bankDetails ?? null;

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

      const bankData = hasBankData
        ? {
          bankName: bank!.bankName,
          accountNumber: bank!.accountNumber,
          ifscCode: bank!.ifscCode,
          upiId: bank!.upiId,
          gPay: bank!.gPay,
          qrCode: bank!.qrCode,
        }
        : null;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        password: u.password,
        createdAt: u.createdAt.toISOString(),

        bankDetails: bankData,

        positions: u.positions.map((p) => ({
          id: p.id,
          positionType: p.positionType,
          currentLevel: p.currentLevel,
          isActive: p.isActive,
          directReferralCount: p.directReferralCount,

          sponsor: p.placedUnderPosition && {
            name: p.placedUnderPosition.user.name,
            mobile: p.placedUnderPosition.user.mobile,
            userId: p.placedUnderPosition.user.id,
            positionId: p.placedUnderPosition.id,
            currentLevel: p.placedUnderPosition.currentLevel,
          },

          userLevels: p.userLevels,
        })),

        totalPositions: u.positions.length,
        activePositions: u.positions.filter((p) => p.isActive).length,
      };
    });

    return res.status(200).json({
      success: true,
      users
    });


  } catch (error: any) {
    console.error('Users Error:', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to fetch Users Details',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const getAllPaymentDetails = async (req: Request, res: Response) => {
  try {

    const payment = await prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        requestVerification: true,
        paymentType: true,
        upgradeToLevel: true,
        screenshotUrl: true,
        status: true,
        confirmed: true,
        createdAt: true,
        senderPosition: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                id: true
              }
            }
          }
        },
        receiverPosition: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                id: true
              }
            }
          }
        }
      }
    })

    const payments: AdminPaymentSchema[] = payment.map((p) => ({
      id: p.id,
      amount: p.amount,
      paid: p.requestVerification,
      paymentType: p.paymentType,
      upgradeToLevel: p.upgradeToLevel,
      screenshotUrl: p.screenshotUrl,
      status: p.status,
      confirmed: p.confirmed,
      createdAt: p.createdAt.toISOString(),
      senderName: p.senderPosition.user.name,
      senderUserId: p.senderPosition.user.id,
      senderPositionId: p.senderPosition.id,
      receiverName: p.receiverPosition.user.name,
      receiverUserId: p.receiverPosition.user.id,
      receiverPositionId: p.receiverPosition.id
    }))

    return res.status(200).json({
      success: true,
      payments
    });


  } catch (error: any) {
    console.error('Users Error:', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to fetch Payment Details',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const getAllPinsDetails = async (req: Request, res: Response) => {
  try {

    const pinsData = await prisma.pin.findMany({
      select: {
        id: true,
        pinCode: true,
        status: true,
        currentOwner: true,
        usedBy: true,
        createdAt: true,
        owner: {
          select: {
            name: true
          }
        },
        consumer: {
          select: {
            name: true
          }
        }
      }
    })

    const admin = await getAdminSystemIds();

    const pinRequestsData = await prisma.pinRequest.findMany({
      where: {
        toUser: {
          id: admin.userId,
        }
      },
      select: {
        id: true,
        fromUserId: true,
        fromUser: {
          select: {
            name: true
          }
        },
        toUserId: true,
        toUser: {
          select: {
            name: true
          }
        },
        count: true,
        screenshotUrl: true,
        confirmed: true,
        status: true,
        createdAt: true,
      }
    })

    const pinRequests: pinRequests[] = pinRequestsData.map((p) => ({
      id: p.id,
      fromUserId: p.fromUserId,
      fromUserName: p.fromUser.name,
      toUserId: p.toUserId,
      toUserName: p.toUser.name,
      count: p.count,
      screenshotUrl: p.screenshotUrl,
      confirmed: p.confirmed,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }))

    const pins: pinsModel[] = pinsData.map((p) => ({
      id: p.id,
      pinCode: p.pinCode,
      status: p.status,
      currentOwner: p.currentOwner,
      currentOwnerName: p.owner.name,
      usedBy: p.usedBy,
      usedByName: p.consumer?.name || null,
      createPin: p.createdAt.toISOString()
    }))

    return res.status(200).json({
      success: true,
      pinRequests,
      pins,
    })


  } catch (error: any) {
    console.error('Pins Error:', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to fetch Pins Details',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const getAdminConfigs = async (req: Request, res: Response) => {
  try {

    const admin = await getAdminSystemIds();

    const adminBankDetails = await prisma.user.findFirst({
      where: {
        id: admin.userId,
      },
      select: {
        name: true,
        bankDetails: {
          select: {
            bankName: true,
            accountNumber: true,
            ifscCode: true,
            upiId: true,
            gPay: true,
            qrCode: true
          }
        }
      }
    })

    if (!adminBankDetails) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Admin Not Found",
        statusCode: 400,
      };

      return res.status(400).json(errorResponse);
    }

    const levelConfigs: LevelConfig[] = await prisma.levelConfig.findMany()

    const bank = adminBankDetails.bankDetails ?? null;

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

    const bankData = hasBankData
      ? {
        bankName: bank!.bankName,
        accountNumber: bank!.accountNumber,
        ifscCode: bank!.ifscCode,
        upiId: bank!.upiId,
        gPay: bank!.gPay,
        qrCode: bank!.qrCode,
      }
      : null;

    const bankDetails: AdminbankDetails = {
      AccountHolderName: adminBankDetails.name,
      bankDetails: bankData
    }

    return res.status(200).json({
      success: true,
      levelConfigs,
      bankDetails,
    })

  } catch (error: any) {

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to fetch Admin Config',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const activateUserAccount = async (req: Request, res: Response) => {
  try {
    const { positionId } = req.body

    if (!positionId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'AccountId is required',
        statusCode: 422,
      };
      return res.status(422).json(errorResponse);
    }

    const userPosition = await prisma.position.findUnique({
      where: {
        id: positionId
      }
    })

    if (!userPosition) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid AccountId user cannot be activated',
        statusCode: 422,
      };
      return res.status(422).json(errorResponse);
    }

    await prisma.$transaction(async (tx) => {

      await tx.position.update({
        where: { id: userPosition.id },
        data: {
          isActive: true,
          currentLevel: 1,
        }
      });

      await tx.userLevel.create({
        data: {
          positionId: userPosition.id,
          levelNumber: 1,
          isActive: true,
          paymentCapacity: 999,
          sponsorPaid: false, // need to change if sponsor payment needed in level 1
        }
      });

      if (userPosition.placedUnderPositionId) {

        const sponsorPosition = await tx.position.update({
          where: { id: userPosition.placedUnderPositionId },
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
                positionId: userPosition.placedUnderPositionId,
                levelNumber: 1
              }
            },
            data: {
              paymentsReceived: { increment: 1 },
              amountEarned: { increment: 500 },
            }
          })

          if (
            sponsorPosition &&
            sponsorPosition.directReferralCount === 2 &&
            sponsorPosition.currentLevel === 1
          ) {
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
  } catch (error: any) {

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || 'Failed to activate user account',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
}

export const updateAdminBankDetails = async (req: Request, res: Response) => {
  let uploadedFilePath: string | null = null;

  try {
    const { bankName, accountNumber, ifscCode, upiId, gPay, accountHolderName } = req.body;
    const admin = await getAdminSystemIds();

    if (req.file) {
      uploadedFilePath = req.file.path;
    }

    if (!bankName || !accountNumber || !ifscCode || !accountHolderName) {
      if (uploadedFilePath) {
        await deleteUploadedFile(uploadedFilePath);
      }

      return res.status(400).json({
        success: false,
        error: "Bank name, account number, IFSC code, and account holder name are required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: admin.userId },
    });

    if (!user) {
      if (uploadedFilePath) {
        await deleteUploadedFile(uploadedFilePath);
      }

      return res.status(404).json({
        success: false,
        error: "Admin not found. Please log in again.",
      });
    }

    const existingBankDetails = await prisma.bankDetail.findUnique({
      where: { userId: admin.userId },
      select: { qrCode: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.bankDetail.upsert({
        where: {
          userId: admin.userId,
        },
        update: {
          bankName,
          accountNumber,
          ifscCode,
          upiId: upiId || null,
          gPay: gPay || null,
          ...(uploadedFilePath && { qrCode: uploadedFilePath }),
        },
        create: {
          userId: admin.userId,
          bankName,
          accountNumber,
          ifscCode,
          upiId: upiId || null,
          gPay: gPay || null,
          qrCode: uploadedFilePath || null,
        },
      });

      await tx.user.update({
        where: {
          id: admin.userId,
        },
        data: {
          name: accountHolderName,
        },
      });
    });

    if (uploadedFilePath && existingBankDetails?.qrCode && existingBankDetails.qrCode !== uploadedFilePath) {
      try {
        await deleteUploadedFile(existingBankDetails.qrCode);
      } catch (error) {
        console.error('Failed to delete old QR code:', error);
      }
    }

    return res.json({
      success: true,
      message: "Bank details updated successfully.",
    });
  } catch (error: any) {
    if (uploadedFilePath) {
      try {
        await deleteUploadedFile(uploadedFilePath);
      } catch { }
    }

    console.error('Update Admin Bank Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unable to update bank details.",
    });
  }
};

export const directlyTransferPins = async (req: Request, res: Response) => {
  try {
    const { fromUserId, toUserId, count } = req.body

    if (!fromUserId || !toUserId || !count) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Missing required fields',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    if (fromUserId === toUserId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `Can't request pins from itself`,
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const userExist = await prisma.user.findUnique({
      where: {
        id: fromUserId
      },
      select: {
        id: true
      }
    })

    if (!userExist) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `Invalid UserId. User does not exists.`,
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const pinCount = parseInt(count, 10)

    await prisma.$transaction(async (tx) => {

      const pins = await tx.pin.findMany({
        where: {
          currentOwner: toUserId,
          status: true,
        },
        take: pinCount,
        select: { id: true },
      });

      if (pins.length < pinCount) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: "Not enough active pins available"
        }
        return res.status(400).json(errorResponse);
      }

      await Promise.all(
        pins.map((pin) =>
          tx.pin.update({
            where: { id: pin.id },
            data: { currentOwner: fromUserId },
          })
        )
      );

      await tx.pinRequest.create({
        data: {
          fromUserId,
          toUserId,
          count: pinCount,
          confirmed: true,
          status: "APPROVED"
        }
      })
    })

    return res.status(200).json({
      success: true,
      message: `${count} pins transferred successfully`,
      data: null,
    });

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.message || "Failed to transfer pins to user"
    }
    return res.status(500).json(errorResponse);
  }
}

export const updateUserDetailsViaAdmin = async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateUserProfileSchema.parse(req.body);

    const validateUser = await prisma.user.findUnique({
      where: {
        id: validatedData.id
      },
      select: {
        id: true
      }
    })

    if (!validateUser) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "Invalid User id. User does not exists."
      }
      return res.status(400).json(errorResponse);
    }


    await prisma.user.update({
      where: {
        id: validateUser.id,
      },
      data: {
        name: validatedData.name,
        mobile: validatedData.mobile,
        email: validatedData.email,
        password: validatedData.password,
      },
    });


    const data: ApiSuccessResponse = {
      success: true,
      data: null,
      message: "User Personal details updated successfully!"
    }

    return res.status(200).json(
      {
        success: data.success,
        data: data.data,
        message: data.message
      }
    )

  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        statusCode: 400,
      } as ApiErrorResponse);
    }

    return res.status(500).json({
      success: false,
      error: error.message,
      statusCode: 500,
    } as ApiErrorResponse);
  }
};

export const updateBankDetailsViaAdmin = async (req: Request, res: Response) => {
  let uploadedFilePath: string | null = null;

  try {
    const { userId } = req.params

    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: "UserId not found"
      }
      return res.status(400).json(errorResponse)
    }
    
    const { bankName, accountNumber, ifscCode, upiId, gPay } = req.body;

    if (req.file) {
      uploadedFilePath = req.file.path;
    }

    if (!bankName || !accountNumber || !ifscCode) {
      if (uploadedFilePath) {
        await deleteUploadedFile(uploadedFilePath);
      }

      return res.status(400).json({
        success: false,
        error: "Bank name, account number, and IFSC code are required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      if (uploadedFilePath) {
        await deleteUploadedFile(uploadedFilePath);
      }

      return res.status(404).json({
        success: false,
        error: "User not found. Please log in again.",
      });
    }

    const existingBankDetails = await prisma.bankDetail.findUnique({
      where: { userId },
      select: { qrCode: true },
    });

    await prisma.bankDetail.upsert({
      where: { userId },
      update: {
        bankName,
        accountNumber,
        ifscCode,
        upiId: upiId || null,
        gPay: gPay || null,
        ...(uploadedFilePath && { qrCode: uploadedFilePath }),
      },
      create: {
        userId,
        bankName,
        accountNumber,
        ifscCode,
        upiId: upiId || null,
        gPay: gPay || null,
        qrCode: uploadedFilePath || null,
      },
    });

    if (uploadedFilePath && existingBankDetails?.qrCode && existingBankDetails.qrCode !== uploadedFilePath) {
      try {
        await deleteUploadedFile(existingBankDetails.qrCode);
        console.log(`Deleted old QR code: ${existingBankDetails.qrCode}`);
      } catch (error) {
        console.error('Failed to delete old QR code:', error);
      }
    }

    return res.json({
      success: true,
      message: "Bank details updated successfully.",
    });
  } catch (error: any) {
    if (uploadedFilePath) {
      try {
        await deleteUploadedFile(uploadedFilePath);
      } catch { }
    }

    console.error('Update Bank Details Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unable to update bank details.",
    });
  }
};
