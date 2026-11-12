import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import {
  sequelize,
  CashierShift,
  CashRegister,
  Branch,
  User,
  Sale,
  Payment,
  Return,
} from '../../database/models';
import { AppError } from '../../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export class ShiftService {
  /**
   * Get or create a default cash register for a branch
   */
  static async getOrCreateRegister(businessId: string, branchId: string) {
    let register = await CashRegister.findOne({
      where: { businessId, branchId, isActive: true },
    });

    if (!register) {
      register = await CashRegister.create({
        id: uuidv4(),
        businessId,
        branchId,
        name: 'Asosiy Kassa 1',
        isActive: true,
      });
    }

    return register;
  }

  /**
   * List all cash registers for a business / branch
   */
  static async listRegisters(businessId: string, branchId?: string) {
    const where: any = { businessId, isActive: true };
    if (branchId) where.branchId = branchId;

    return CashRegister.findAll({
      where,
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });
  }

  /**
   * Get currently active open shift for the user
   */
  static async getCurrentShift(userId: string, businessId: string) {
    const shift = await CashierShift.findOne({
      where: {
        userId,
        businessId,
        status: 'open',
      },
      include: [
        {
          model: CashRegister,
          as: 'register',
          include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }],
        },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['openedAt', 'DESC']],
    });

    return shift;
  }

  /**
   * Open a new cashier shift
   */
  static async openShift(
    userId: string,
    businessId: string,
    data: {
      registerId?: string;
      branchId?: string;
      openingBalance?: number;
      notes?: string;
    }
  ) {
    // Check if user already has an active shift
    const existing = await CashierShift.findOne({
      where: { userId, businessId, status: 'open' },
    });

    if (existing) {
      throw new AppError('Sizda allaqachon ochiq kassa smenasi mavjud', 400);
    }

    let registerId = data.registerId;
    if (!registerId) {
      // Find user's branch or fallback to first branch
      let branchId = data.branchId;
      if (!branchId) {
        const user = await User.findByPk(userId);
        branchId = user?.branchId || undefined;
      }

      if (!branchId) {
        const branch = await Branch.findOne({ where: { businessId } });
        if (!branch) {
          throw new AppError('Filial topilmadi. Avval filial yarating', 400);
        }
        branchId = branch.id;
      }

      const reg = await this.getOrCreateRegister(businessId, branchId);
      registerId = reg.id;
    }

    const shift = await CashierShift.create({
      id: uuidv4(),
      businessId,
      registerId,
      userId,
      openingBalance: Number(data.openingBalance) || 0,
      totalSales: 0,
      totalReturns: 0,
      totalCashIn: 0,
      totalCashOut: 0,
      status: 'open',
      openedAt: new Date(),
      notes: data.notes,
    });

    return this.getCurrentShift(userId, businessId);
  }

  /**
   * Get shift statistics and breakdown
   */
  static async getShiftSummary(shiftId: string, businessId: string) {
    const shift = await CashierShift.findOne({
      where: { id: shiftId, businessId },
      include: [
        {
          model: CashRegister,
          as: 'register',
          include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }],
        },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    if (!shift) {
      throw new AppError('Kassa smenasi topilmadi', 404);
    }

    // Query sales made in this shift
    const sales = await Sale.findAll({
      where: {
        shiftId: shift.id,
        businessId,
        status: { [Op.in]: ['completed', 'returned'] },
      },
      include: [{ model: Payment, as: 'payments' }],
    });

    let totalCashSales = 0;
    let totalCardSales = 0;
    let totalOtherSales = 0;
    let totalSalesAmount = 0;

    sales.forEach((s) => {
      totalSalesAmount += Number(s.totalAmount);
      s.payments?.forEach((p) => {
        const amt = Number(p.amount);
        if (p.method === 'cash') totalCashSales += amt;
        else if (p.method === 'card') totalCardSales += amt;
        else totalOtherSales += amt;
      });
    });

    const expectedCashInDrawer =
      Number(shift.openingBalance) +
      totalCashSales +
      Number(shift.totalCashIn) -
      Number(shift.totalCashOut) -
      Number(shift.totalReturns);

    return {
      shift,
      summary: {
        salesCount: sales.length,
        totalSalesAmount,
        totalCashSales,
        totalCardSales,
        totalOtherSales,
        openingBalance: Number(shift.openingBalance),
        totalCashIn: Number(shift.totalCashIn),
        totalCashOut: Number(shift.totalCashOut),
        totalReturns: Number(shift.totalReturns),
        expectedCashInDrawer,
      },
    };
  }

  /**
   * Close a cashier shift
   */
  static async closeShift(
    shiftId: string,
    userId: string,
    businessId: string,
    data: { closingBalance: number; notes?: string }
  ) {
    const shift = await CashierShift.findOne({
      where: { id: shiftId, businessId },
    });

    if (!shift) {
      throw new AppError('Kassa smenasi topilmadi', 404);
    }

    if (shift.status === 'closed') {
      throw new AppError('Ushbu smena allaqachon yopilgan', 400);
    }

    const summaryData = await this.getShiftSummary(shiftId, businessId);
    const expectedCash = summaryData.summary.expectedCashInDrawer;
    const closingBalance = Number(data.closingBalance);
    const difference = closingBalance - expectedCash;

    await shift.update({
      closingBalance,
      totalSales: summaryData.summary.totalSalesAmount,
      status: 'closed',
      closedAt: new Date(),
      notes: data.notes
        ? `${shift.notes ? shift.notes + ' | ' : ''}${data.notes} (Farq: ${difference} UZS)`
        : shift.notes,
    });

    return {
      shift,
      summary: summaryData.summary,
      closingBalance,
      difference,
    };
  }

  /**
   * Cash in / Cash out during shift
   */
  static async recordCashMovement(
    shiftId: string,
    userId: string,
    businessId: string,
    data: { type: 'in' | 'out'; amount: number; reason: string }
  ) {
    const shift = await CashierShift.findOne({
      where: { id: shiftId, businessId, status: 'open' },
    });

    if (!shift) {
      throw new AppError('Ochiq kassa smenasi topilmadi', 404);
    }

    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
      throw new AppError('Summa musbat bo‘lishi kerak', 400);
    }

    if (data.type === 'in') {
      await shift.update({
        totalCashIn: Number(shift.totalCashIn) + amount,
      });
    } else {
      await shift.update({
        totalCashOut: Number(shift.totalCashOut) + amount,
      });
    }

    return shift;
  }

  /**
   * List historical shifts
   */
  static async list(
    businessId: string,
    query: { branchId?: string; userId?: string; status?: string; page?: any; limit?: any }
  ) {
    const { page, limit, offset } = parsePagination(query);

    const where: any = { businessId };
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    const { count, rows: shifts } = await CashierShift.findAndCountAll({
      where,
      limit,
      offset,
      order: [['openedAt', 'DESC']],
      include: [
        {
          model: CashRegister,
          as: 'register',
          include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }],
        },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      distinct: true,
    });

    return {
      shifts,
      meta: buildPaginationMeta(count, page, limit),
    };
  }
}
