import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import {
  sequelize,
  StockMovement,
  Product,
  Warehouse,
  User,
  Category,
  InventoryCount,
} from '../../database/models';
import { AppError } from '../../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export class InventoryService {
  static async getProductStock(businessId: string, productId: string, warehouseId?: string): Promise<number> {
    const where: any = { businessId, productId };
    if (warehouseId) where.warehouseId = warehouseId;

    const total = await StockMovement.sum('quantity', { where });
    return total || 0;
  }

  static async getStockBalances(
    businessId: string,
    query: { warehouseId?: string; categoryId?: string; search?: string; page?: any; limit?: any }
  ) {
    const { page, limit, offset } = parsePagination(query);

    const productWhere: any = { businessId, isActive: true };
    if (query.categoryId) productWhere.categoryId = query.categoryId;
    if (query.search) {
      productWhere[Op.or] = [
        { name: { [Op.iLike]: `%${query.search.trim()}%` } },
        { sku: { [Op.iLike]: `%${query.search.trim()}%` } },
      ];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: productWhere,
      limit,
      offset,
      order: [['name', 'ASC']],
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });

    const items = await Promise.all(
      products.map(async (prod) => {
        const stock = await this.getProductStock(businessId, prod.id, query.warehouseId);
        const isLow = stock <= prod.minStockQty;
        return {
          product: prod,
          currentStock: stock,
          minStockQty: prod.minStockQty,
          isLowStock: isLow,
        };
      })
    );

    const meta = buildPaginationMeta(count, page, limit);
    return { items, meta };
  }

  static async transferStock(
    businessId: string,
    userId: string,
    data: {
      productId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
      notes?: string;
    }
  ) {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new AppError('Chiqish va kirish omborlari bir xil bo‘lishi mumkin emas', 400);
    }
    if (data.quantity <= 0) {
      throw new AppError('Ko‘chirish miqdori 0 dan katta bo‘lishi kerak', 400);
    }

    const product = await Product.findOne({ where: { id: data.productId, businessId } });
    if (!product) throw new AppError('Mahsulot topilmadi', 404);

    const currentSourceStock = await this.getProductStock(businessId, data.productId, data.fromWarehouseId);
    if (!product.allowNegativeStock && currentSourceStock < data.quantity) {
      throw new AppError(
        `Omborda yetarli qoldiq mavjud emas. Mavjud: ${currentSourceStock} ${product.unit}, so‘ralgan: ${data.quantity} ${product.unit}`,
        400
      );
    }

    const currentDestStock = await this.getProductStock(businessId, data.productId, data.toWarehouseId);

    const transaction = await sequelize.transaction();
    try {
      const transferGroupId = uuidv4();

      // 1. Source warehouse: transfer_out (negative quantity)
      await StockMovement.create(
        {
          id: uuidv4(),
          businessId,
          productId: data.productId,
          warehouseId: data.fromWarehouseId,
          type: 'transfer_out',
          quantity: -data.quantity,
          previousQty: currentSourceStock,
          currentQty: currentSourceStock - data.quantity,
          referenceType: 'transfer',
          referenceId: transferGroupId,
          notes: data.notes || 'Omborlararo ko‘chirish (chiqim)',
          userId,
        },
        { transaction }
      );

      // 2. Dest warehouse: transfer_in (positive quantity)
      await StockMovement.create(
        {
          id: uuidv4(),
          businessId,
          productId: data.productId,
          warehouseId: data.toWarehouseId,
          type: 'transfer_in',
          quantity: data.quantity,
          previousQty: currentDestStock,
          currentQty: currentDestStock + data.quantity,
          referenceType: 'transfer',
          referenceId: transferGroupId,
          notes: data.notes || 'Omborlararo ko‘chirish (kirim)',
          userId,
        },
        { transaction }
      );

      await transaction.commit();
      return { success: true, message: 'Tovarlar muvaffaqiyatli ko‘chirildi', transferId: transferGroupId };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async adjustStock(
    businessId: string,
    userId: string,
    data: {
      productId: string;
      warehouseId: string;
      newQuantity: number;
      reason: string;
    }
  ) {
    const currentStock = await this.getProductStock(businessId, data.productId, data.warehouseId);
    const diff = Number(data.newQuantity) - currentStock;

    if (diff === 0) {
      return { success: true, message: 'Qoldiq o‘zgarishsiz qoldi' };
    }

    const movement = await StockMovement.create({
      id: uuidv4(),
      businessId,
      productId: data.productId,
      warehouseId: data.warehouseId,
      type: 'adjustment',
      quantity: diff,
      previousQty: currentStock,
      currentQty: Number(data.newQuantity),
      referenceType: 'manual_adjustment',
      notes: data.reason,
      userId,
    });

    return { success: true, movement, newStock: Number(data.newQuantity) };
  }

  static async writeOffStock(
    businessId: string,
    userId: string,
    data: {
      productId: string;
      warehouseId: string;
      quantity: number;
      reason: string;
    }
  ) {
    if (data.quantity <= 0) {
      throw new AppError('Hisobdan chiqarish miqdori 0 dan katta bo‘lishi kerak', 400);
    }

    const currentStock = await this.getProductStock(businessId, data.productId, data.warehouseId);

    const movement = await StockMovement.create({
      id: uuidv4(),
      businessId,
      productId: data.productId,
      warehouseId: data.warehouseId,
      type: 'write_off',
      quantity: -data.quantity,
      previousQty: currentStock,
      currentQty: currentStock - data.quantity,
      referenceType: 'write_off',
      notes: data.reason,
      userId,
    });

    return { success: true, movement, currentStock: currentStock - data.quantity };
  }

  static async listMovements(
    businessId: string,
    query: {
      warehouseId?: string;
      productId?: string;
      type?: string;
      page?: any;
      limit?: any;
    }
  ) {
    const { page, limit, offset } = parsePagination(query);

    const where: any = { businessId };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.productId) where.productId = query.productId;
    if (query.type) where.type = query.type;

    const { count, rows: movements } = await StockMovement.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'unit'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    const meta = buildPaginationMeta(count, page, limit);
    return { movements, meta };
  }
}
