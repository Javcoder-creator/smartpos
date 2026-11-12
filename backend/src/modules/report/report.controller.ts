import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { sendSuccess } from '../../utils/response';

export class ReportController {
  static async getSalesTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const data = await ReportService.getSalesTrend(businessId, req.query);
      return sendSuccess(res, data, 'Savdo dinamikasi');
    } catch (error) {
      next(error);
    }
  }

  static async getTopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const data = await ReportService.getTopProducts(businessId, req.query);
      return sendSuccess(res, data, 'Eng ko‘p sotilgan tovarlar');
    } catch (error) {
      next(error);
    }
  }

  static async getSalesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const data = await ReportService.getSalesByCategory(businessId, req.query);
      return sendSuccess(res, data, 'Kategoriyalar bo‘yicha savdo');
    } catch (error) {
      next(error);
    }
  }

  static async getCashierPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const data = await ReportService.getCashierPerformance(businessId, req.query);
      return sendSuccess(res, data, 'Kassirlar samaradorligi');
    } catch (error) {
      next(error);
    }
  }

  static async getInventoryValuation(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const data = await ReportService.getInventoryValuation(businessId, req.query);
      return sendSuccess(res, data, 'Ombor zaxirasi qiymati');
    } catch (error) {
      next(error);
    }
  }
}
