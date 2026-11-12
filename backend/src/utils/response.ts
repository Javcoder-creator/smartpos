import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data?: unknown,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: Record<string, unknown>
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data ?? null,
    ...(meta && { meta }),
  });
};

export const sendError = (
  res: Response,
  message: string = 'Error',
  statusCode: number = 500,
  errors?: Record<string, unknown> | unknown[]
): Response => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(errors ? { errors } : {}),
    },
  });
};
