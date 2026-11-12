import { Op, fn, col, literal } from 'sequelize';
import {
  sequelize,
  Sale,
  SaleItem,
  Product,
  Category,
  User,
  Branch,
  Warehouse,
  StockMovement,
} from '../../database/models';
import { InventoryService } from '../inventory/inventory.service';

export class ReportService {
  /**
   * Daily Sales & Profit Trend (e.g. last 7 or 30 days)
   */
  static async getSalesTrend(
    businessId: string,
    query: { branchId?: string; days?: number }
  ) {
    const days = Number(query.days) || 14;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const where: any = {
      businessId,
      status: 'completed',
      createdAt: { [Op.gte]: startDate },
    };
    if (query.branchId) where.branchId = query.branchId;

    const sales = await Sale.findAll({
      where,
      include: [{ model: SaleItem, as: 'items' }],
      order: [['createdAt', 'ASC']],
    });

    // Group by Date: YYYY-MM-DD
    const trendMap: Record<string, { date: string; revenue: number; cogs: number; profit: number; count: number }> = {};

    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      trendMap[key] = { date: key, revenue: 0, cogs: 0, profit: 0, count: 0 };
    }

    sales.forEach((s) => {
      const dateKey = new Date(s.createdAt).toISOString().slice(0, 10);
      if (trendMap[dateKey]) {
        trendMap[dateKey].revenue += Number(s.totalAmount);
        trendMap[dateKey].count += 1;

        let saleCogs = 0;
        s.items?.forEach((it) => {
          saleCogs += Number(it.quantity) * Number(it.purchasePrice);
        });
        trendMap[dateKey].cogs += saleCogs;
        trendMap[dateKey].profit += Number(s.totalAmount) - saleCogs;
      }
    });

    return Object.values(trendMap);
  }

  /**
   * Top Selling Products by Revenue and Units
   */
  static async getTopProducts(
    businessId: string,
    query: { branchId?: string; limit?: number }
  ) {
    const limit = Number(query.limit) || 10;
    const saleWhere: any = { businessId, status: 'completed' };
    if (query.branchId) saleWhere.branchId = query.branchId;

    const sales = await Sale.findAll({
      where: saleWhere,
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'unit'] }],
        },
      ],
    });

    const productStats: Record<
      string,
      { productId: string; name: string; sku: string; unit: string; totalQty: number; totalRevenue: number }
    > = {};

    sales.forEach((s) => {
      s.items?.forEach((it) => {
        const pId = it.productId;
        if (!productStats[pId]) {
          productStats[pId] = {
            productId: pId,
            name: it.product?.name || 'Mahsulot',
            sku: it.product?.sku || '',
            unit: it.unit || 'dona',
            totalQty: 0,
            totalRevenue: 0,
          };
        }
        productStats[pId].totalQty += Number(it.quantity);
        productStats[pId].totalRevenue += Number(it.totalPrice);
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  /**
   * Sales by Category breakdown
   */
  static async getSalesByCategory(businessId: string, query: { branchId?: string }) {
    const saleWhere: any = { businessId, status: 'completed' };
    if (query.branchId) saleWhere.branchId = query.branchId;

    const sales = await Sale.findAll({
      where: saleWhere,
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
            },
          ],
        },
      ],
    });

    const catStats: Record<string, { categoryName: string; revenue: number; itemsCount: number }> = {};

    sales.forEach((s) => {
      s.items?.forEach((it) => {
        const catName = it.product?.category?.name || 'Boshqa';
        if (!catStats[catName]) {
          catStats[catName] = { categoryName: catName, revenue: 0, itemsCount: 0 };
        }
        catStats[catName].revenue += Number(it.totalPrice);
        catStats[catName].itemsCount += Number(it.quantity);
      });
    });

    return Object.values(catStats).sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Cashier Sales Performance
   */
  static async getCashierPerformance(businessId: string, query: { branchId?: string }) {
    const saleWhere: any = { businessId, status: { [Op.in]: ['completed', 'returned'] } };
    if (query.branchId) saleWhere.branchId = query.branchId;

    const sales = await Sale.findAll({
      where: saleWhere,
      include: [{ model: User, as: 'cashier', attributes: ['id', 'firstName', 'lastName'] }],
    });

    const cashierMap: Record<
      string,
      { userId: string; name: string; salesCount: number; totalRevenue: number }
    > = {};

    sales.forEach((s) => {
      const uId = s.userId;
      const name = s.cashier ? `${s.cashier.firstName} ${s.cashier.lastName || ''}`.trim() : 'Noma’lum';
      if (!cashierMap[uId]) {
        cashierMap[uId] = { userId: uId, name, salesCount: 0, totalRevenue: 0 };
      }
      cashierMap[uId].salesCount += 1;
      cashierMap[uId].totalRevenue += Number(s.totalAmount);
    });

    return Object.values(cashierMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Inventory Valuation (Cost value vs Selling value)
   */
  static async getInventoryValuation(businessId: string, query: { warehouseId?: string }) {
    const products = await Product.findAll({
      where: { businessId, isActive: true },
    });

    let totalItems = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    for (const prod of products) {
      const stock = await InventoryService.getProductStock(businessId, prod.id, query.warehouseId);
      if (stock > 0) {
        totalItems += stock;
        totalCostValue += stock * (Number(prod.purchasePrice) || 0);
        totalRetailValue += stock * Number(prod.sellingPrice);
      }
    }

    const potentialProfit = Math.max(0, totalRetailValue - totalCostValue);

    return {
      totalProductsCount: products.length,
      totalUnitsInStock: totalItems,
      totalCostValue,
      totalRetailValue,
      potentialProfit,
      marginPercent: totalRetailValue > 0 ? Number(((potentialProfit / totalRetailValue) * 100).toFixed(1)) : 0,
    };
  }
}
