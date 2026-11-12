import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class ProductController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await ProductService.list(businessId, req.query);
      return sendSuccess(res, result.products, 'Mahsulotlar ro‘yxati', 200, result.meta as any);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const product = await ProductService.getById(String(req.params.id), businessId);
      return sendSuccess(res, product, 'Mahsulot ma’lumotlari');
    } catch (error) {
      next(error);
    }
  }

  static async getByBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const barcode = String(req.params.barcode);
      if (!barcode) {
        throw new AppError('Shtrix-kod talab qilinadi', 400);
      }
      const product = await ProductService.getByBarcode(barcode, businessId);
      return sendSuccess(res, product, 'Shtrix-kod bo‘yicha mahsulot');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      if (!req.body.name) {
        throw new AppError('Mahsulot nomi kiritilishi shart', 400);
      }
      const product = await ProductService.create(businessId, req.body);
      return sendSuccess(res, product, 'Mahsulot muvaffaqiyatli yaratildi', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const product = await ProductService.update(String(req.params.id), businessId, req.body);
      return sendSuccess(res, product, 'Mahsulot muvaffaqiyatli yangilandi');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await ProductService.delete(String(req.params.id), businessId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const buffer = await ProductService.exportToExcel(businessId);

      const filename = `smartpos-products-${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async importExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      if (!req.file || !req.file.buffer) {
        throw new AppError('Excel fayl yuklanmadi', 400);
      }

      const result = await ProductService.importFromExcel(businessId, req.file.buffer);
      return sendSuccess(res, result, `${result.importedCount} ta mahsulot muvaffaqiyatli yuklandi`);
    } catch (error) {
      next(error);
    }
  }
}
