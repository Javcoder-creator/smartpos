import { Op } from 'sequelize';
import { Product, Sale, User, Branch } from '../../database/models';

export class DashboardService {
  static async getStats(businessId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const saleWhere: any = {
      businessId,
      status: 'completed',
      createdAt: { [Op.gte]: today },
    };
    if (branchId) saleWhere.branchId = branchId;

    const productWhere: any = { businessId, isActive: true };

    // 1. Total products & low stock
    const totalProducts = await Product.count({ where: productWhere });
    const lowStockProducts = await Product.count({
      where: {
        ...productWhere,
        minStockQty: { [Op.gt]: 0 },
      },
    });

    // 2. Today's sales
    const todaySales = await Sale.findAll({
      where: saleWhere,
      attributes: ['totalAmount', 'createdAt'],
    });

    const todayRevenue = todaySales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
    const transactionsCount = todaySales.length;

    // 3. Recent 5 sales
    const recentSales = await Sale.findAll({
      where: { businessId, status: 'completed' },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'cashier', attributes: ['firstName', 'lastName'] },
        { model: Branch, as: 'branch', attributes: ['name'] },
      ],
    });

    // 4. Hourly breakdown for today
    const hourlyData = [
      { time: '09:00', sales: 0 },
      { time: '11:00', sales: 0 },
      { time: '13:00', sales: 0 },
      { time: '15:00', sales: 0 },
      { time: '17:00', sales: 0 },
      { time: '19:00', sales: 0 },
      { time: '21:00', sales: 0 },
    ];

    for (const s of todaySales) {
      const hour = new Date(s.createdAt).getHours();
      if (hour < 10) hourlyData[0].sales += Number(s.totalAmount);
      else if (hour < 12) hourlyData[1].sales += Number(s.totalAmount);
      else if (hour < 14) hourlyData[2].sales += Number(s.totalAmount);
      else if (hour < 16) hourlyData[3].sales += Number(s.totalAmount);
      else if (hour < 18) hourlyData[4].sales += Number(s.totalAmount);
      else if (hour < 20) hourlyData[5].sales += Number(s.totalAmount);
      else hourlyData[6].sales += Number(s.totalAmount);
    }

    return {
      todayRevenue,
      transactionsCount,
      totalProducts,
      lowStockProducts,
      recentSales,
      hourlyData,
    };
  }
}
