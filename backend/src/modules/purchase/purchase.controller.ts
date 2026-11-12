import { Request, Response, NextFunction } from 'express';
import { PurchaseService } from './purchase.service';
import { sendSuccess } from '../../utils/response';

export class PurchaseController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await PurchaseService.list(businessId, req.query);
      return sendSuccess(res, result.purchases, 'Kirim hujjatlari ro‘yxati', 200, result.meta as any);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const purchase = await PurchaseService.getById(String(req.params.id), businessId);
      return sendSuccess(res, purchase, 'Kirim hujjati ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const purchase = await PurchaseService.create(businessId, userId, req.body);
      return sendSuccess(res, purchase, 'Kirim hujjati muvaffaqiyatli rasmiylashtirildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async receive(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const purchase = await PurchaseService.receiveGoods(String(req.params.id), businessId, userId);
      return sendSuccess(res, purchase, 'Tovarlar omborga muvaffaqiyatli qabul qilindi');
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await PurchaseService.cancel(String(req.params.id), businessId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
