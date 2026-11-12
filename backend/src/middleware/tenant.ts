import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const tenantMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.businessId) {
    return next(new AppError('Tenant context is required. Business ID missing.', 403));
  }

  req.businessId = req.user.businessId;
  next();
};
