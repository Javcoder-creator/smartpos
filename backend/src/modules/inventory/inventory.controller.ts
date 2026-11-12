import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export class InventoryController {
  static async getBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await InventoryService.getStockBalances(businessId, req.query);
      return sendSuccess(res, result.items, 'Ombor qoldiqlari', 200, result.meta as any);
    } catch (error) {
      next(error);
    }
  }

  static async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;

      if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
        throw new AppError('Barcha maydonlar to‘ldirilishi shart', 400);
      }

      const result = await InventoryService.transferStock(businessId, userId, {
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity: Number(quantity),
        notes,
      });

      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async adjust(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const { productId, warehouseId, newQuantity, reason } = req.body;

      if (!productId || !warehouseId || newQuantity === undefined) {
        throw new AppError('Barcha maydonlar to‘ldirilishi shart', 400);
      }

      const result = await InventoryService.adjustStock(businessId, userId, {
        productId,
        warehouseId,
        newQuantity: Number(newQuantity),
        reason: reason || 'Tuzatish (korreksiya)',
      });

      return sendSuccess(res, result, 'Qoldiq muvaffaqiyatli to‘g‘rilandi');
    } catch (error) {
      next(error);
    }
  }

  static async writeOff(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.id;
      const { productId, warehouseId, quantity, reason } = req.body;

      if (!productId || !warehouseId || !quantity) {
        throw new AppError('Barcha maydonlar to‘ldirilishi shart', 400);
      }

      const result = await InventoryService.writeOffStock(businessId, userId, {
        productId,
        warehouseId,
        quantity: Number(quantity),
        reason: reason || 'Yaroqsiz / Zararlangan tovar',
      });

      return sendSuccess(res, result, 'Tovar hisobdan chiqarildi');
    } catch (error) {
      next(error);
    }
  }

  static async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const result = await InventoryService.listMovements(businessId, req.query);
      return sendSuccess(res, result.movements, 'Harakatlar daftari', 200, result.meta as any);
    } catch (error) {
      next(error);
    }
  }
}
