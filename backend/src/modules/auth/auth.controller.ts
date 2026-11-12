import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);

      // Set refresh token in cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return sendSuccess(res, result, 'Muvaffaqiyatli ro‘yxatdan o‘tildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, result, 'Tizimga muvaffaqiyatli kirildi');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        throw new AppError('Refresh token topilmadi', 401);
      }

      const result = await AuthService.refreshToken(token);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, result, 'Token muvaffaqiyatli yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.id) {
        await AuthService.logout(req.user.id);
      }

      res.clearCookie('refreshToken');
      return sendSuccess(res, null, 'Tizimdan muvaffaqiyatli chiqildi');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Foydalanuvchi aniqlanmadi', 401);
      }

      const user = await AuthService.getProfile(req.user.id);
      return sendSuccess(res, user, 'Foydalanuvchi ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Foydalanuvchi aniqlanmadi', 401);
      }

      const updated = await AuthService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, updated, 'Profil muvaffaqiyatli yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Foydalanuvchi aniqlanmadi', 401);
      }

      const result = await AuthService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resetPassword(req.body.token, req.body.password);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
