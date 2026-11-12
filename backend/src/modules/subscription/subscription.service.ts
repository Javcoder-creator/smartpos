import {
  Subscription,
  SubscriptionPlan,
  Business,
  Branch,
  Product,
  Warehouse,
  User,
} from '../../database/models';
import { AppError } from '../../utils/AppError';

export class SubscriptionService {
  /**
   * Get current business subscription details and quota usage
   */
  static async getCurrent(businessId: string) {
    const business = await Business.findByPk(businessId, {
      include: [
        {
          model: Subscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan' }],
        },
      ],
    });

    if (!business || !business.subscription) {
      throw new AppError('Faol obuna topilmadi', 404);
    }

    const sub = business.subscription;
    const plan = (sub as any).plan;

    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(sub.endDate);
    const timeDiff = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Calculate resource usage vs plan limits
    const branchCount = await Branch.count({ where: { businessId, isActive: true } });
    const productCount = await Product.count({ where: { businessId, isActive: true } });
    const warehouseCount = await Warehouse.count({ where: { businessId, isActive: true } });
    const cashierCount = await User.count({ where: { businessId, isActive: true } });

    return {
      subscription: sub,
      plan,
      daysLeft: Math.max(0, daysLeft),
      isExpired: daysLeft <= 0,
      usage: {
        branches: { current: branchCount, max: plan?.maxBranches || 1 },
        products: { current: productCount, max: plan?.maxProducts || 100 },
        warehouses: { current: warehouseCount, max: plan?.maxWarehouses || 1 },
        cashiers: { current: cashierCount, max: plan?.maxCashiers || 1 },
      },
    };
  }

  /**
   * List available subscription plans
   */
  static async getPlans() {
    return SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
    });
  }

  /**
   * Upgrade / Change plan
   */
  static async upgradePlan(
    businessId: string,
    data: { planId: string; billingCycle?: 'monthly' | 'annual' }
  ) {
    const plan = await SubscriptionPlan.findByPk(data.planId);
    if (!plan) {
      throw new AppError('Tanlangan tarif rejasi topilmadi', 404);
    }

    const sub = await Subscription.findOne({ where: { businessId } });
    if (!sub) {
      throw new AppError('Obuna topilmadi', 404);
    }

    const monthsToAdd = data.billingCycle === 'annual' ? 12 : 1;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsToAdd);

    const amount = data.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice * monthsToAdd;

    await sub.update({
      planId: plan.id,
      status: 'active',
      startDate,
      endDate,
      amount,
      billingCycle: data.billingCycle || 'monthly',
    });

    return this.getCurrent(businessId);
  }
}
