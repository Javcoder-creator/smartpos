import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import {
  sequelize,
  Expense,
  Sale,
  SaleItem,
  Payment,
  Customer,
  Supplier,
  CashierShift,
  Branch,
  User,
} from '../../database/models';
import { AppError } from '../../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export class FinanceService {
  /**
   * Get Consolidated Financial Overview:
   * Revenue, COGS, Gross Profit, Expenses, Net Profit, Debts & Cashflow
   */
  static async getSummary(
    businessId: string,
    query: { branchId?: string; startDate?: string; endDate?: string }
  ) {
    const saleWhere: any = { businessId, status: 'completed' };
    const expenseWhere: any = { businessId };

    if (query.branchId) {
      saleWhere.branchId = query.branchId;
      expenseWhere.branchId = query.branchId;
    }

    if (query.startDate && query.endDate) {
      const dateRange = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
      saleWhere.createdAt = dateRange;
      expenseWhere.createdAt = dateRange;
    }

    // 1. Fetch completed sales with items
    const sales = await Sale.findAll({
      where: saleWhere,
      include: [
        { model: SaleItem, as: 'items' },
        { model: Payment, as: 'payments' },
      ],
    });

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalCashReceived = 0;
    let totalCardReceived = 0;

    sales.forEach((s) => {
      totalRevenue += Number(s.totalAmount);
      s.items?.forEach((it) => {
        totalCogs += Number(it.quantity) * Number(it.purchasePrice);
      });
      s.payments?.forEach((p) => {
        if (p.method === 'cash') totalCashReceived += Number(p.amount);
        else if (p.method === 'card') totalCardReceived += Number(p.amount);
      });
    });

    const grossProfit = totalRevenue - totalCogs;

    // 2. Fetch Expenses
    const expenses = await Expense.findAll({ where: expenseWhere });
    let totalExpenses = 0;
    const expensesByCategory: Record<string, number> = {};

    expenses.forEach((e) => {
      const amt = Number(e.amount);
      totalExpenses += amt;
      expensesByCategory[e.categoryName] = (expensesByCategory[e.categoryName] || 0) + amt;
    });

    const netProfit = grossProfit - totalExpenses;

    // 3. Customer Total Debt
    const customerDebt = Number(await Customer.sum('balance', { where: { businessId, isActive: true } })) || 0;

    // 4. Supplier Total Debt
    const supplierDebt = Number(await Supplier.sum('balance', { where: { businessId, isActive: true } })) || 0;

    // 5. Active Shifts Cash Balance
    const activeShifts = await CashierShift.findAll({
      where: { businessId, status: 'open' },
    });
    let activeDrawerCash = 0;
    activeShifts.forEach((sh) => {
      activeDrawerCash += Number(sh.openingBalance) + Number(sh.totalCashIn) - Number(sh.totalCashOut);
    });

    return {
      revenue: totalRevenue,
      cogs: totalCogs,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
      marginPercent: totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0,
      cashReceived: totalCashReceived,
      cardReceived: totalCardReceived,
      customerDebt,
      supplierDebt,
      activeDrawerCash,
      expensesByCategory,
      transactionCount: sales.length,
    };
  }

  /**
   * List Expenses with pagination
   */
  static async listExpenses(
    businessId: string,
    query: { branchId?: string; categoryName?: string; page?: any; limit?: any }
  ) {
    const { page, limit, offset } = parsePagination(query);

    const where: any = { businessId };
    if (query.branchId) where.branchId = query.branchId;
    if (query.categoryName) where.categoryName = query.categoryName;

    const { count, rows: expenses } = await Expense.findAndCountAll({
      where,
      limit,
      offset,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
      ],
      distinct: true,
    });

    return {
      expenses,
      meta: buildPaginationMeta(count, page, limit),
    };
  }

  /**
   * Create an Expense
   */
  static async createExpense(
    businessId: string,
    userId: string,
    data: {
      branchId?: string;
      categoryName: string;
      amount: number;
      description?: string;
      date?: string;
      paymentMethod?: 'cash' | 'card' | 'transfer';
    }
  ) {
    if (!data.categoryName || !data.amount) {
      throw new AppError('Kategoriya va summa kiritilishi shart', 400);
    }

    const expense = await Expense.create({
      id: uuidv4(),
      businessId,
      branchId: data.branchId,
      categoryName: data.categoryName,
      amount: Number(data.amount),
      description: data.description,
      date: data.date || new Date().toISOString().slice(0, 10),
      userId,
      paymentMethod: data.paymentMethod || 'cash',
    });

    return expense;
  }

  /**
   * Delete an Expense
   */
  static async deleteExpense(id: string, businessId: string) {
    const expense = await Expense.findOne({ where: { id, businessId } });
    if (!expense) {
      throw new AppError('Xarajat topilmadi', 404);
    }
    await expense.destroy();
    return { success: true, message: 'Xarajat o‘chirildi' };
  }

  /**
   * Record Customer Debt Repayment
   */
  static async recordCustomerDebtPayment(
    customerId: string,
    businessId: string,
    amount: number,
    paymentMethod: 'cash' | 'card' = 'cash',
    notes?: string
  ) {
    const customer = await Customer.findOne({ where: { id: customerId, businessId } });
    if (!customer) {
      throw new AppError('Mijoz topilmadi', 404);
    }

    if (amount <= 0) {
      throw new AppError('To‘lov summasi musbat bo‘lishi kerak', 400);
    }

    return await sequelize.transaction(async (t) => {
      // Deduct from customer balance/debt
      const newBalance = Math.max(0, Number(customer.balance) - amount);
      await customer.update({ balance: newBalance }, { transaction: t });

      // Record a payment entry
      const payment = await Payment.create(
        {
          id: uuidv4(),
          businessId,
          amount,
          method: paymentMethod,
          reference: `Qarz to‘lovi: ${customer.firstName} (${notes || ''})`,
          receivedAt: new Date(),
        },
        { transaction: t }
      );

      return { customer, payment, remainingDebt: newBalance };
    });
  }
}
