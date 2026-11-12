import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from './subscription.service';
import { sendSuccess } from '../../utils/response';

export class SubscriptionController {
  static async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const data = await SubscriptionService.getCurrent(businessId);
      return sendSuccess(res, data, 'Joriy obuna ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }

  static async getPlans(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await SubscriptionService.getPlans();
      return sendSuccess(res, plans, 'Mavjud tarif rejalari');
    } catch (error) {
      next(error);
    }
  }

  static async upgrade(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const data = await SubscriptionService.upgradePlan(businessId, req.body);
      return sendSuccess(res, data, 'Tarif muvaffaqiyatli yangilandi');
    } catch (error) {
      next(error);
    }
  }
}
