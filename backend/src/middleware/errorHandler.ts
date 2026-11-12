import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
        ...(env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
    return;
  }

  console.error('Unhandled Error:', err);

  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      statusCode: 500,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
