import { z } from 'zod';

// Generic API response schemas
export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
});

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
});

export const ApiResponseSchema = z.union([
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
]);

// Types
export type ApiSuccessResponse<T = any> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
};

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;