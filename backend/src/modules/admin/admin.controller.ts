import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { sendSuccess } from '../../utils/response';

export class AdminController {
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getPlatformStats();
      return sendSuccess(res, stats, 'Platforma statistikasi');
    } catch (error) {
      next(error);
    }
  }

  static async listBusinesses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listBusinesses(req.query);
      return sendSuccess(res, result.businesses, 'Barcha korxonalar', 200, result.meta as any);
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = String(req.params.id);
      const isActive = req.body.isActive === true;
      const business = await AdminService.toggleBusinessStatus(businessId, isActive);
      return sendSuccess(
        res,
        business,
        isActive ? 'Tashkilot faollashtirildi' : 'Tashkilot faoliyati to‘xtatildi (bloklandi)'
      );
    } catch (error) {
      next(error);
    }
  }

  static async listPlans(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await AdminService.listPlans();
      return sendSuccess(res, plans, 'Obuna tarif rejalari');
    } catch (error) {
      next(error);
    }
  }

  static async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await AdminService.updatePlan(String(req.params.id), req.body);
      return sendSuccess(res, plan, 'Tarif rejasi yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async changeSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await AdminService.changeBusinessSubscription(String(req.params.id), req.body);
      return sendSuccess(res, sub, 'Korxona obunasi yangilandi');
    } catch (error) {
      next(error);
    }
  }
}
