import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      id: string;
      businessId: string;
      role: string;
      email: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token.', 401));
    }
  }
};

export const requireSuperAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'super_admin') {
    throw new AppError('Ushbu amalni bajarish uchun Super Admin huquqi talab qilinadi', 403);
  }
  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError('Sizda ushbu amalni bajarish huquqi mavjud emas', 403);
    }
    next();
  };
};
