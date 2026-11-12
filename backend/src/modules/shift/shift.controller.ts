import { Request, Response, NextFunction } from 'express';
import { ShiftService } from './shift.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class ShiftController {
  static async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const shift = await ShiftService.getCurrentShift(userId, businessId);
      return sendSuccess(res, shift, shift ? 'Faol smena topildi' : 'Faol smena mavjud emas');
    } catch (error) {
      next(error);
    }
  }

  static async open(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const shift = await ShiftService.openShift(userId, businessId, req.body);
      return sendSuccess(res, shift, 'Kassa smenasi muvaffaqiyatli ochildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const summary = await ShiftService.getShiftSummary(String(req.params.id), businessId);
      return sendSuccess(res, summary, 'Smena hisoboti');
    } catch (error) {
      next(error);
    }
  }

  static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const result = await ShiftService.closeShift(String(req.params.id), userId, businessId, req.body);
      return sendSuccess(res, result, 'Kassa smenasi muvaffaqiyatli yopildi');
    } catch (error) {
      next(error);
    }
  }

  static async recordCashMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const result = await ShiftService.recordCashMovement(String(req.params.id), userId, businessId, req.body);
      return sendSuccess(res, result, 'Kassa harakati qayd etildi');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await ShiftService.list(businessId, req.query);
      return sendSuccess(res, result.shifts, 'Smenalar tarixi', 200, result.meta as any);
    } catch (error) {
      next(error);
    }
  }

  static async listRegisters(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const branchId = req.query.branchId as string | undefined;
      const registers = await ShiftService.listRegisters(businessId, branchId);
      return sendSuccess(res, registers, 'Kassalar ro‘yxati');
    } catch (error) {
      next(error);
    }
  }
}
