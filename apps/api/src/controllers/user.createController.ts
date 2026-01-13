import { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { CreateUserSchema, ApiSuccessResponse, ApiErrorResponse, AddNewUser, UpdateUserProfileSchema } from '@repo/types';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

import { customAlphabet } from 'nanoid'

export const nanoidAlphaNum = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  2 // length
)

function generateGHId(): string {
  const num = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  return `GH${num}`;
}

export async function generateUniqueGHId(): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const generatedId = generateGHId();

    const existingUser = await prisma.user.findUnique({
      where: { id: generatedId },
      select: { id: true }
    });

    if (!existingUser) {
      return generatedId;
    }
  }

  throw new Error('Failed to generate unique ID after multiple attempts');
}

export async function deleteUploadedFile(dbPath: string) {
  if (!dbPath) return;

  const cleaned = dbPath.startsWith("/") ? dbPath.slice(1) : dbPath;
  const fullPath = path.resolve(process.cwd(), cleaned);

  try {
    await fs.unlink(fullPath);
    console.log("Deleted file:", fullPath);
  } catch (err: any) {
    console.warn("File already missing:", fullPath);
  }
}

export const createUser = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateUserSchema.parse(req.body);

    let sponsorUserId: string | undefined;
    let sponsorPositionId: string | undefined;

    if (validatedData.sponsorPositionId) {
      const sponsorPosition = await prisma.position.findUnique({
        where: { id: validatedData.sponsorPositionId },
        select: {
          id: true,
          userId: true,
          isActive: true,
          positionType: true,
        }
      });

      if (!sponsorPosition) {
        return res.status(400).json({
          success: false,
          error: 'Invalid referral link',
          statusCode: 400,
        } as ApiErrorResponse);
      }

      if (!sponsorPosition.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Sponsor position is not active',
          statusCode: 400,
        } as ApiErrorResponse);
      }

      sponsorUserId = sponsorPosition.userId;
      sponsorPositionId = sponsorPosition.id;

      const pinStatus = await prisma.pin.findFirst({
        where: {
          pinCode: validatedData.activationPin,
          currentOwner: sponsorUserId,
        }
      });

      if (!pinStatus) {
        return res.status(400).json({
          success: false,
          error: 'Invalid PIN or PIN does not belong to sponsor',
          statusCode: 400,
        } as ApiErrorResponse);
      }

      if (!pinStatus.status) {
        return res.status(400).json({
          success: false,
          error: 'PIN already used',
          statusCode: 400,
        } as ApiErrorResponse);
      }
    }

    const generatedId = await generateUniqueGHId();

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          id: generatedId,
          name: validatedData.name,
          mobile: validatedData.mobile,
          email: validatedData.email,
          password: validatedData.password,
          activationPin: validatedData.activationPin,
          sponsorId: sponsorUserId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
        }
      });

      const index = 1
      const checksum = nanoidAlphaNum()

      const positionId = `${user.id}${String(index).padStart(2, '0')}${checksum}`

      await tx.position.create({
        data: {
          id: positionId,
          userId: user.id,
          positionType: 'ORIGINAL',
          placedUnderPositionId: sponsorPositionId,
          currentLevel: 0,
          isActive: false,
        }
      });

      await tx.pin.update({
        where: { pinCode: validatedData.activationPin },
        data: {
          usedBy: user.id,
          status: false,
        }
      });

      return user;
    });

    const token = jwt.sign(
      { userId: result.id, email: result.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Account created successfully',
    } as ApiSuccessResponse);

  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        statusCode: 400,
        message: error.message,
      } as ApiErrorResponse);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user',
      statusCode: 500,
    } as ApiErrorResponse);
  }
};

export const addNewUser = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateUserSchema.parse(req.body);

    let sponsorUserId: string | undefined;
    let sponsorPositionId: string | undefined;

    if (validatedData.sponsorPositionId) {
      const sponsorPosition = await prisma.position.findUnique({
        where: { id: validatedData.sponsorPositionId },
        select: {
          id: true,
          userId: true,
          isActive: true,
          positionType: true,
        }
      });

      if (!sponsorPosition) {
        return res.status(400).json({
          success: false,
          error: 'Invalid referral link',
          statusCode: 400,
        } as ApiErrorResponse);
      }

      if (!sponsorPosition.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Sponsor position is not active',
          statusCode: 400,
        } as ApiErrorResponse);
      }

      sponsorUserId = sponsorPosition.userId;
      sponsorPositionId = sponsorPosition.id;

      const pinStatus = await prisma.pin.findFirst({
        where: {
          pinCode: validatedData.activationPin,
          currentOwner: sponsorUserId,
        }
      });

      if (!pinStatus) {
        return res.status(400).json({
          success: false,
          error: 'Invalid PIN or PIN does not belong to sponsor',
          statusCode: 400,
        } as ApiErrorResponse);
      }

      if (!pinStatus.status) {
        return res.status(400).json({
          success: false,
          error: 'PIN already used',
          statusCode: 400,
        } as ApiErrorResponse);
      }
    }

    const generatedId = await generateUniqueGHId();

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          id: generatedId,
          name: validatedData.name,
          mobile: validatedData.mobile,
          email: validatedData.email,
          password: validatedData.password,
          activationPin: validatedData.activationPin,
          sponsorId: sponsorUserId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          password: true,
          sponsor: {
            select: {
              id: true,
              name: true,
              mobile: true,
            }
          }
        }
      });

      const index = 1
      const checksum = nanoidAlphaNum()

      const positionId = `${user.id}${String(index).padStart(2, '0')}${checksum}`

      await tx.position.create({
        data: {
          id: positionId,
          userId: user.id,
          positionType: 'ORIGINAL',
          placedUnderPositionId: sponsorPositionId,
          currentLevel: 0,
          isActive: false,
        }
      });

      await tx.pin.update({
        where: { pinCode: validatedData.activationPin },
        data: {
          usedBy: user.id,
          status: false,
        }
      });

      return user;
    });

    const newUser: AddNewUser = {
      id: result.id,
      name: result.name,
      email: result.email,
      mobile: result.mobile,
      password: result.password,
      sponsorUserId: result.sponsor?.id || null,
      sponsorName: result.sponsor?.name || null,
      sponsorMobile: result.sponsor?.mobile || null,
    }

    return res.status(201).json({
      success: true,
      data: newUser,
      message: 'User added successfully',
    } as ApiSuccessResponse);

  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        statusCode: 400,
        message: error.message,
      } as ApiErrorResponse);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user',
      statusCode: 500,
    } as ApiErrorResponse);
  }
};

export const updateUserDetails = async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateUserProfileSchema.parse(req.body);

    const userId = req.userId;
    if (!userId || typeof userId !== "string") {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'User ID not found.',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const validateUser = await prisma.user.findUnique({
      where: {
        id: userId
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

export const updateBankDetails = async (req: Request, res: Response) => {
  let uploadedFilePath: string | null = null;

  try {
    const { bankName, accountNumber, ifscCode, upiId, gPay } = req.body;
    const userId = req.userId;

    if (!userId || typeof userId !== "string") {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'User ID not found.',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

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
      await deleteUploadedFile(existingBankDetails.qrCode);
    }

    return res.json({
      success: true,
      message: "Bank details updated successfully.",
    });
  } catch (error: any) {
    if (uploadedFilePath) {
      await deleteUploadedFile(uploadedFilePath);
    }

    console.error('Update Bank Details Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unable to update bank details.",
    });
  }
};