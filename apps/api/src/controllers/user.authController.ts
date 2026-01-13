import { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { LoginSchema, ApiSuccessResponse, ApiErrorResponse } from '@repo/types';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  try {
    const validateData = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: {
        id: validateData.userId
      },
      select: { id: true, password: true, email: true, name: true, role: true }
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

    if (user.role === "ADMIN") {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid credentials',
        statusCode: 422,
        message: `This account has admin access and is restricted from logging in.`,
      };
      return res.status(422).json(errorResponse);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
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

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  const response: ApiSuccessResponse = {
    success: true,
    data: null,
    message: "Logged out successfully",
  };

  return res.status(200).json(response);
}