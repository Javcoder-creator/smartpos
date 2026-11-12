import { Request, Response, NextFunction } from 'express';
import { BranchService } from './branch.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class BranchController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const branches = await BranchService.list(businessId);
      return sendSuccess(res, branches, 'Filiallar ro‘yxati');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const branch = await BranchService.getById(String(req.params.id), businessId);
      return sendSuccess(res, branch, 'Filial ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      if (!req.body.name) {
        throw new AppError('Filial nomi kiritilishi shart', 400);
      }
      const branch = await BranchService.create(businessId, req.body);
      return sendSuccess(res, branch, 'Filial muvaffaqiyatli yaratildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const branch = await BranchService.update(String(req.params.id), businessId, req.body);
      return sendSuccess(res, branch, 'Filial muvaffaqiyatli yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await BranchService.delete(String(req.params.id), businessId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
