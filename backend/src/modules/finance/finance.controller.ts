import { Request, Response, NextFunction } from 'express';
import { FinanceService } from './finance.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class FinanceController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const summary = await FinanceService.getSummary(businessId, req.query);
      return sendSuccess(res, summary, 'Moliya hisoboti');
    } catch (error) {
      next(error);
    }
  }

  static async listExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await FinanceService.listExpenses(businessId, req.query);
      return sendSuccess(res, result.expenses, 'Xarajatlar ro‘yxati', 200, result.meta as any);
    } catch (error) {
      next(error);
    }
  }

  static async createExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const expense = await FinanceService.createExpense(businessId, userId, req.body);
      return sendSuccess(res, expense, 'Xarajat muvaffaqiyatli saqlandi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async deleteExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await FinanceService.deleteExpense(String(req.params.id), businessId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async recordCustomerDebtPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const customerId = String(req.params.id);
      const amount = Number(req.body.amount);
      const method = req.body.method || 'cash';
      const notes = req.body.notes;

      const result = await FinanceService.recordCustomerDebtPayment(
        customerId,
        businessId,
        amount,
        method,
        notes
      );
      return sendSuccess(res, result, 'Mijoz qarz to‘lovi muvaffaqiyatli qabul qilindi');
    } catch (error) {
      next(error);
    }
  }
}
