import { Request, Response, NextFunction } from 'express';
import { CustomerService } from './customer.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class CustomerController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const search = req.query.search as string | undefined;
      const customers = await CustomerService.list(businessId, search);
      return sendSuccess(res, customers, 'Mijozlar ro‘yxati');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const customer = await CustomerService.getById(String(req.params.id), businessId);
      return sendSuccess(res, customer, 'Mijoz ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      if (!req.body.firstName || !req.body.phone) {
        throw new AppError('Ism va telefon raqam kiritilishi shart', 400);
      }
      const customer = await CustomerService.create(businessId, req.body);
      return sendSuccess(res, customer, 'Yangi mijoz qo‘shildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const customer = await CustomerService.update(String(req.params.id), businessId, req.body);
      return sendSuccess(res, customer, 'Mijoz ma’lumotlari yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await CustomerService.delete(String(req.params.id), businessId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
