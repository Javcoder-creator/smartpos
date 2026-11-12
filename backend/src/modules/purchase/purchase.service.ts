import { v4 as uuidv4 } from 'uuid';
import {
  sequelize,
  Purchase,
  PurchaseItem,
  Supplier,
  Warehouse,
  User,
  Product,
  StockMovement,
} from '../../database/models';
import { AppError } from '../../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';
import { InventoryService } from '../inventory/inventory.service';

export interface CreatePurchaseInput {
  supplierId: string;
  warehouseId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
  }>;
  discountAmount?: number;
  paidAmount?: number;
  notes?: string;
  status?: 'draft' | 'ordered' | 'received';
}

export class PurchaseService {
  static async list(
    businessId: string,
    query: { supplierId?: string; warehouseId?: string; status?: string; page?: any; limit?: any }
  ) {
    const { page, limit, offset } = parsePagination(query);

    const where: any = { businessId };
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.status) where.status = query.status;

    const { count, rows: purchases } = await Purchase.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'phone'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: PurchaseItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'unit'] }],
        },
      ],
      distinct: true,
    });

    const meta = buildPaginationMeta(count, page, limit);
    return { purchases, meta };
  }

  static async getById(id: string, businessId: string) {
    const purchase = await Purchase.findOne({
      where: { id, businessId },
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Warehouse, as: 'warehouse' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: PurchaseItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });

    if (!purchase) {
      throw new AppError('Kirim hujjati topilmadi', 404);
    }
    return purchase;
  }

  static async create(businessId: string, userId: string, data: CreatePurchaseInput) {
    if (!data.items || data.items.length === 0) {
      throw new AppError('Kirim hujjati kamida 1 ta mahsulotni o‘z ichiga olishi kerak', 400);
    }

    const transaction = await sequelize.transaction();

    try {
      // 1. Calculate totals
      let subtotal = 0;
      for (const item of data.items) {
        subtotal += Number(item.quantity) * Number(item.unitPrice);
      }
      const discountAmount = Number(data.discountAmount || 0);
      const totalAmount = Math.max(0, subtotal - discountAmount);
      const paidAmount = Number(data.paidAmount || 0);
      const debtAmount = Math.max(0, totalAmount - paidAmount);

      const purchaseNumber = `KRM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      const isReceived = data.status === 'received';

      // 2. Create Purchase
      const purchase = await Purchase.create(
        {
          id: uuidv4(),
          businessId,
          supplierId: data.supplierId,
          warehouseId: data.warehouseId,
          userId,
          purchaseNumber,
          subtotal,
          discountAmount,
          totalAmount,
          paidAmount,
          debtAmount,
          status: isReceived ? 'received' : data.status || 'draft',
          notes: data.notes,
          receivedAt: isReceived ? new Date() : undefined,
        },
        { transaction }
      );

      // 3. Create Purchase Items
      for (const item of data.items) {
        const itemTotal = Number(item.quantity) * Number(item.unitPrice);
        await PurchaseItem.create(
          {
            id: uuidv4(),
            purchaseId: purchase.id,
            productId: item.productId,
            variantId: item.variantId || undefined,
            businessId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: itemTotal,
          },
          { transaction }
        );

        // If status is received, immediately increase warehouse stock
        if (isReceived) {
          const currentStock = await InventoryService.getProductStock(
            businessId,
            item.productId,
            data.warehouseId
          );

          await StockMovement.create(
            {
              id: uuidv4(),
              businessId,
              productId: item.productId,
              variantId: item.variantId || undefined,
              warehouseId: data.warehouseId,
              type: 'purchase_in',
              quantity: item.quantity,
              previousQty: currentStock,
              currentQty: currentStock + Number(item.quantity),
              referenceType: 'purchase',
              referenceId: purchase.id,
              notes: `Kirim hujjati №${purchaseNumber}`,
              userId,
            },
            { transaction }
          );

          // Update product purchasePrice to latest
          await Product.update(
            { purchasePrice: item.unitPrice },
            { where: { id: item.productId, businessId }, transaction }
          );
        }
      }

      // 4. If received and there is debt, increase supplier debt balance
      if (isReceived && debtAmount > 0) {
        const supplier = await Supplier.findOne({ where: { id: data.supplierId, businessId } });
        if (supplier) {
          await supplier.update(
            { balance: Number(supplier.balance) + debtAmount },
            { transaction }
          );
        }
      }

      await transaction.commit();
      return this.getById(purchase.id, businessId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async receiveGoods(id: string, businessId: string, userId: string) {
    const purchase = await this.getById(id, businessId);

    if (purchase.status === 'received') {
      throw new AppError('Ushbu kirim hujjati allaqachon qabul qilingan', 400);
    }
    if (purchase.status === 'cancelled') {
      throw new AppError('Bekor qilingan hujjatni qabul qilib bo‘lmaydi', 400);
    }

    const transaction = await sequelize.transaction();

    try {
      // 1. Process items into stock
      const items = (purchase as any).items || [];
      for (const item of items) {
        const currentStock = await InventoryService.getProductStock(
          businessId,
          item.productId,
          purchase.warehouseId
        );

        await StockMovement.create(
          {
            id: uuidv4(),
            businessId,
            productId: item.productId,
            variantId: item.variantId || undefined,
            warehouseId: purchase.warehouseId,
            type: 'purchase_in',
            quantity: item.quantity,
            previousQty: currentStock,
            currentQty: currentStock + Number(item.quantity),
            referenceType: 'purchase',
            referenceId: purchase.id,
            notes: `Kirim qabul qilindi №${purchase.purchaseNumber}`,
            userId,
          },
          { transaction }
        );

        // Update latest purchase price
        await Product.update(
          { purchasePrice: item.unitPrice },
          { where: { id: item.productId, businessId }, transaction }
        );
      }

      // 2. Update supplier debt
      if (purchase.debtAmount > 0) {
        const supplier = await Supplier.findOne({ where: { id: purchase.supplierId, businessId } });
        if (supplier) {
          await supplier.update(
            { balance: Number(supplier.balance) + Number(purchase.debtAmount) },
            { transaction }
          );
        }
      }

      // 3. Mark purchase received
      await purchase.update(
        {
          status: 'received',
          receivedAt: new Date(),
        },
        { transaction }
      );

      await transaction.commit();
      return this.getById(purchase.id, businessId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async cancel(id: string, businessId: string) {
    const purchase = await this.getById(id, businessId);
    if (purchase.status === 'received') {
      throw new AppError('Omborga qabul qilingan kirimni bekor qilib bo‘lmaydi', 400);
    }

    await purchase.update({ status: 'cancelled' });
    return { success: true, message: 'Kirim hujjati bekor qilindi' };
  }
}
