import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/response';

export class DashboardController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const branchId = req.query.branchId as string | undefined;
      const stats = await DashboardService.getStats(businessId, branchId);
      return sendSuccess(res, stats, 'Boshqaruv paneli ko‘rsatkichlari');
    } catch (error) {
      next(error);
    }
  }
}
