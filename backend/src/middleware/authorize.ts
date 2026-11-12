import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { Role, Permission } from '../database/models';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(`Forbidden. Role '${req.user.role}' does not have access to this resource.`, 403)
      );
    }

    next();
  };
};

export const requirePermission = (permissionSlug: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Unauthorized', 401));
      }

      // super_admin and business_owner have all permissions
      if (req.user.role === 'super_admin' || req.user.role === 'business_owner') {
        return next();
      }

      const role = await Role.findOne({
        where: { slug: req.user.role },
        include: [
          {
            model: Permission,
            as: 'permissions',
            where: { slug: permissionSlug },
            required: true,
          },
        ],
      });

      if (!role) {
        return next(
          new AppError(`Forbidden: Missing required permission '${permissionSlug}'`, 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
