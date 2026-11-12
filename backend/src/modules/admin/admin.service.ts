import { Op } from 'sequelize';
import {
  sequelize,
  Business,
  Subscription,
  SubscriptionPlan,
  User,
  Sale,
  Branch,
} from '../../database/models';
import { AppError } from '../../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export class AdminService {
  /**
   * Platform-wide metrics and stats for Super Admin
   */
  static async getPlatformStats() {
    const totalBusinesses = await Business.count();
    const activeBusinesses = await Business.count({ where: { isActive: true } });
    const suspendedBusinesses = totalBusinesses - activeBusinesses;

    const totalUsers = await User.count({ where: { isActive: true } });
    const totalSalesCount = await Sale.count({ where: { status: 'completed' } });
    const totalSalesVolume = (await Sale.sum('totalAmount', { where: { status: 'completed' } })) || 0;

    // Subscriptions count by status
    const activeSubs = await Subscription.count({ where: { status: 'active' } });
    const trialSubs = await Subscription.count({ where: { status: 'trial' } });
    const expiredSubs = await Subscription.count({ where: { status: 'expired' } });

    // Platform revenue from subscriptions
    const totalSubscriptionRevenue = (await Subscription.sum('amount')) || 0;

    // Recent 5 registered businesses
    const recentBusinesses = await Business.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Subscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['id', 'name', 'slug'] }],
        },
      ],
    });

    return {
      totalBusinesses,
      activeBusinesses,
      suspendedBusinesses,
      totalUsers,
      totalSalesCount,
      totalSalesVolume: Number(totalSalesVolume),
      totalSubscriptionRevenue: Number(totalSubscriptionRevenue),
      subscriptions: {
        active: activeSubs,
        trial: trialSubs,
        expired: expiredSubs,
      },
      recentBusinesses,
    };
  }

  /**
   * List all businesses with search, status filter and pagination
   */
  static async listBusinesses(query: { search?: string; status?: string; page?: any; limit?: any }) {
    const { page, limit, offset } = parsePagination(query);

    const where: any = {};
    if (query.status === 'active') where.isActive = true;
    else if (query.status === 'suspended') where.isActive = false;

    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search.trim()}%` } },
        { email: { [Op.iLike]: `%${query.search.trim()}%` } },
        { phone: { [Op.iLike]: `%${query.search.trim()}%` } },
        { slug: { [Op.iLike]: `%${query.search.trim()}%` } },
      ];
    }

    const { count, rows: businesses } = await Business.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Subscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan' }],
        },
        { model: Branch, as: 'branches', attributes: ['id', 'name'] },
        { model: User, as: 'users', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'roleId'] },
      ],
      distinct: true,
    });

    return {
      businesses,
      meta: buildPaginationMeta(count, page, limit),
    };
  }

  /**
   * Suspend or Activate Business Account
   */
  static async toggleBusinessStatus(businessId: string, isActive: boolean) {
    const business = await Business.findByPk(businessId);
    if (!business) {
      throw new AppError('Tashkilot topilmadi', 404);
    }

    await business.update({ isActive });

    // Also update subscription status if suspending
    if (!isActive) {
      await Subscription.update(
        { status: 'suspended' },
        { where: { businessId } }
      );
    } else {
      await Subscription.update(
        { status: 'active' },
        { where: { businessId } }
      );
    }

    return business;
  }

  /**
   * List Subscription Plans
   */
  static async listPlans() {
    return SubscriptionPlan.findAll({
      order: [['sortOrder', 'ASC']],
    });
  }

  /**
   * Update Subscription Plan details (Price, Limits, Features)
   */
  static async updatePlan(
    planId: string,
    data: {
      name?: string;
      description?: string;
      monthlyPrice?: number;
      annualPrice?: number;
      maxBranches?: number;
      maxCashiers?: number;
      maxProducts?: number;
      maxWarehouses?: number;
      features?: Record<string, any>;
      isActive?: boolean;
    }
  ) {
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) {
      throw new AppError('Obuna tarifi topilmadi', 404);
    }

    await plan.update(data);
    return plan;
  }

  /**
   * Change or Extend Business Subscription
   */
  static async changeBusinessSubscription(
    businessId: string,
    data: {
      planId: string;
      billingCycle?: 'monthly' | 'annual';
      months?: number;
      status?: 'trial' | 'active' | 'expired' | 'suspended';
    }
  ) {
    const business = await Business.findByPk(businessId);
    if (!business) {
      throw new AppError('Tashkilot topilmadi', 404);
    }

    const plan = await SubscriptionPlan.findByPk(data.planId);
    if (!plan) {
      throw new AppError('Obuna tarifi topilmadi', 404);
    }

    let sub = await Subscription.findOne({ where: { businessId } });

    const monthsToAdd = data.months || (data.billingCycle === 'annual' ? 12 : 1);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsToAdd);

    const price = data.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice * monthsToAdd;

    if (sub) {
      await sub.update({
        planId: plan.id,
        status: data.status || 'active',
        startDate,
        endDate,
        amount: price,
        billingCycle: data.billingCycle || 'monthly',
      });
    } else {
      sub = await Subscription.create({
        id: require('uuid').v4(),
        businessId,
        planId: plan.id,
        status: data.status || 'active',
        startDate,
        endDate,
        amount: price,
        billingCycle: data.billingCycle || 'monthly',
        autoRenew: true,
      });
    }

    return Subscription.findByPk(sub.id, {
      include: [{ model: SubscriptionPlan, as: 'plan' }],
    });
  }
}
