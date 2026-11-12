import { Request, Response, NextFunction } from 'express';
import { WarehouseService } from './warehouse.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class WarehouseController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const branchId = req.query.branchId as string | undefined;
      const warehouses = await WarehouseService.list(businessId, branchId);
      return sendSuccess(res, warehouses, 'Omborlar ro‘yxati');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const warehouse = await WarehouseService.getById(String(req.params.id), businessId);
      return sendSuccess(res, warehouse, 'Ombor ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      if (!req.body.name) {
        throw new AppError('Ombor nomi kiritilishi shart', 400);
      }
      const warehouse = await WarehouseService.create(businessId, req.body);
      return sendSuccess(res, warehouse, 'Ombor muvaffaqiyatli yaratildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const warehouse = await WarehouseService.update(String(req.params.id), businessId, req.body);
      return sendSuccess(res, warehouse, 'Ombor muvaffaqiyatli yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await WarehouseService.delete(String(req.params.id), businessId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
