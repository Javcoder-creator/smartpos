import { Request, Response, NextFunction } from 'express';
import { BrandService } from './brand.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class BrandController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const brands = await BrandService.list(businessId);
      return sendSuccess(res, brands, 'Brendlar ro‘yxati');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const brand = await BrandService.getById(String(req.params.id), businessId);
      return sendSuccess(res, brand, 'Brend ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      if (!req.body.name) {
        throw new AppError('Brend nomi kiritilishi shart', 400);
      }
      const brand = await BrandService.create(businessId, req.body);
      return sendSuccess(res, brand, 'Brend muvaffaqiyatli yaratildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const brand = await BrandService.update(String(req.params.id), businessId, req.body);
      return sendSuccess(res, brand, 'Brend muvaffaqiyatli yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await BrandService.delete(String(req.params.id), businessId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
