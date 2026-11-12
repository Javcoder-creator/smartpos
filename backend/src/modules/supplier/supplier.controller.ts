import { Request, Response, NextFunction } from 'express';
import { SupplierService } from './supplier.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class SupplierController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const search = req.query.search as string | undefined;
      const suppliers = await SupplierService.list(businessId, search);
      return sendSuccess(res, suppliers, 'Ta’minotchilar ro‘yxati');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const supplier = await SupplierService.getById(String(req.params.id), businessId);
      return sendSuccess(res, supplier, 'Ta’minotchi ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      if (!req.body.name || !req.body.phone) {
        throw new AppError('Ta’minotchi nomi va telefon raqami kiritilishi shart', 400);
      }
      const supplier = await SupplierService.create(businessId, req.body);
      return sendSuccess(res, supplier, 'Ta’minotchi muvaffaqiyatli yaratildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const supplier = await SupplierService.update(String(req.params.id), businessId, req.body);
      return sendSuccess(res, supplier, 'Ta’minotchi yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const amount = Number(req.body.amount);
      if (!amount || amount <= 0) {
        throw new AppError('To‘lov summasi musbat bo‘lishi kerak', 400);
      }
      const supplier = await SupplierService.recordPayment(String(req.params.id), businessId, amount);
      return sendSuccess(res, supplier, 'To‘lov qayd etildi');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await SupplierService.delete(String(req.params.id), businessId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
