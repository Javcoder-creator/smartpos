import { Request, Response, NextFunction } from 'express';
import { SaleService } from './sale.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class SaleController {
  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const sale = await SaleService.checkout(businessId, userId, req.body);
      const fullSale = await SaleService.getById(sale.id, businessId);
      return sendSuccess(res, fullSale, 'Sotuv muvaffaqiyatli amalga oshirildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async hold(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const sale = await SaleService.holdSale(businessId, userId, req.body);
      return sendSuccess(res, sale, 'Chek muvaffaqiyatli saqlab turildi');
    } catch (error) {
      next(error);
    }
  }

  static async getHeld(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const branchId = req.query.branchId as string | undefined;
      const heldSales = await SaleService.getHeldSales(businessId, branchId);
      return sendSuccess(res, heldSales, 'Kechiktirilgan cheklar ro‘yxati');
    } catch (error) {
      next(error);
    }
  }

  static async resume(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const resumed = await SaleService.resumeSale(String(req.params.id), businessId);
      return sendSuccess(res, resumed, 'Chek savatchaga tiklandi');
    } catch (error) {
      next(error);
    }
  }

  static async return(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const returnRecord = await SaleService.returnSale(String(req.params.id), businessId, userId, req.body);
      return sendSuccess(res, returnRecord, 'Tovarlar qaytarilishi muvaffaqiyatli rasmiylashtirildi');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await SaleService.list(businessId, req.query);
      return sendSuccess(res, result.sales, 'Sotuvlar tarixi', 200, result.meta as any);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const sale = await SaleService.getById(String(req.params.id), businessId);
      return sendSuccess(res, sale, 'Sotuv cheki ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }
}
