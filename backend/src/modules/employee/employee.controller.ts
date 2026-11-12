import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from './employee.service';
import { sendSuccess } from '../../utils/response';

export class EmployeeController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const employees = await EmployeeService.list(businessId);
      return sendSuccess(res, employees, 'Xodimlar ro‘yxati');
    } catch (error) {
      next(error);
    }
  }

  static async listRoles(_req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await EmployeeService.listRoles();
      return sendSuccess(res, roles, 'Tizim rollari va ruxsatnomalari');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const employee = await EmployeeService.create(businessId, req.body);
      return sendSuccess(res, employee, 'Xodim muvaffaqiyatli qo‘shildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const employee = await EmployeeService.update(String(req.params.id), businessId, req.body);
      return sendSuccess(res, employee, 'Xodim ma’lumotlari yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await EmployeeService.delete(String(req.params.id), businessId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
