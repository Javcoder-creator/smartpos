import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class CategoryController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const categories = await CategoryService.list(businessId);
      return sendSuccess(res, categories, 'Kategoriyalar ro‘yxati');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const category = await CategoryService.getById(String(req.params.id), businessId);
      return sendSuccess(res, category, 'Kategoriya ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      if (!req.body.name) {
        throw new AppError('Kategoriya nomi kiritilishi shart', 400);
      }
      const category = await CategoryService.create(businessId, req.body);
      return sendSuccess(res, category, 'Kategoriya muvaffaqiyatli yaratildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const category = await CategoryService.update(String(req.params.id), businessId, req.body);
      return sendSuccess(res, category, 'Kategoriya muvaffaqiyatli yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await CategoryService.delete(String(req.params.id), businessId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
