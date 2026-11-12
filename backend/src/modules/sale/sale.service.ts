import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import {
  sequelize,
  Sale,
  SaleItem,
  Payment,
  Product,
  Warehouse,
  Branch,
  User,
  Customer,
  CashierShift,
  StockMovement,
  Return,
  ReturnItem,
} from '../../database/models';
import { AppError } from '../../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';
import { InventoryService } from '../inventory/inventory.service';
import { ShiftService } from '../shift/shift.service';

export interface CheckoutItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
}

export interface CheckoutPaymentInput {
  method: 'cash' | 'card' | 'transfer' | 'split';
  amount: number;
  reference?: string;
}

export interface CheckoutInput {
  branchId: string;
  warehouseId?: string;
  customerId?: string;
  shiftId?: string;
  items: CheckoutItemInput[];
  discountAmount?: number;
  discountPercent?: number;
  payments: CheckoutPaymentInput[];
  notes?: string;
}

export class SaleService {
  /**
   * Helper to generate unique sale number: CHK-YYYYMMDD-XXXX
   */
  private static generateSaleNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `CHK-${dateStr}-${rand}`;
  }

  /**
   * Process Checkout / Complete Sale
   */
  static async checkout(businessId: string, userId: string, data: CheckoutInput) {
    if (!data.items || data.items.length === 0) {
      throw new AppError('Savatchada kamida bitta mahsulot bo‘lishi kerak', 400);
    }

    if (!data.branchId) {
      throw new AppError('Filial tanlanishi shart', 400);
    }

    // Determine target warehouse
    let warehouseId = data.warehouseId;
    if (!warehouseId) {
      const defaultWarehouse = await Warehouse.findOne({
        where: { businessId, branchId: data.branchId, isActive: true },
        order: [['isDefault', 'DESC']],
      });
      if (!defaultWarehouse) {
        throw new AppError('Ushbu filial uchun ombor topilmadi', 400);
      }
      warehouseId = defaultWarehouse.id;
    }

    // Determine active cashier shift
    let shiftId = data.shiftId;
    if (!shiftId) {
      const activeShift = await ShiftService.getCurrentShift(userId, businessId);
      if (activeShift) {
        shiftId = activeShift.id;
      }
    }

    // Fetch and validate products
    const productIds = data.items.map((it) => it.productId);
    const products = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        businessId,
        isActive: true,
      },
    });

    const productMap = new Map<string, Product>();
    products.forEach((p) => productMap.set(p.id, p));

    for (const item of data.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw new AppError(`Mahsulot topilmadi yoki faol emas (ID: ${item.productId})`, 404);
      }
      if (item.quantity <= 0) {
        throw new AppError(`"${prod.name}" uchun miqdor musbat bo‘lishi kerak`, 400);
      }
    }

    // Calculate line items
    let calculatedSubtotal = 0;
    const preparedItems: Array<{
      id: string;
      productId: string;
      variantId?: string;
      quantity: number;
      unitPrice: number;
      purchasePrice: number;
      discountAmount: number;
      totalPrice: number;
      unit: string;
    }> = [];

    for (const item of data.items) {
      const prod = productMap.get(item.productId)!;
      const unitPrice =
        item.unitPrice !== undefined ? Number(item.unitPrice) : Number(prod.sellingPrice);
      const purchasePrice = Number(prod.costPrice) || 0;
      const itemDiscount = Number(item.discountAmount) || 0;
      const lineTotal = Math.max(0, item.quantity * unitPrice - itemDiscount);

      calculatedSubtotal += lineTotal;

      preparedItems.push({
        id: uuidv4(),
        productId: prod.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        purchasePrice,
        discountAmount: itemDiscount,
        totalPrice: lineTotal,
        unit: prod.unit || 'dona',
      });
    }

    // Calculate global discounts and final totals
    let globalDiscount = Number(data.discountAmount) || 0;
    if (data.discountPercent && data.discountPercent > 0) {
      globalDiscount += (calculatedSubtotal * data.discountPercent) / 100;
    }

    const totalAmount = Math.max(0, calculatedSubtotal - globalDiscount);

    // Sum payments
    const paymentsList = data.payments || [];
    let totalPaid = paymentsList.reduce((acc, p) => acc + Number(p.amount), 0);

    let changeAmount = 0;
    let debtAmount = 0;

    if (totalPaid >= totalAmount) {
      changeAmount = totalPaid - totalAmount;
    } else {
      debtAmount = totalAmount - totalPaid;
    }

    // Check credit / debt sale rule
    if (debtAmount > 0 && !data.customerId) {
      throw new AppError('Qarz (nasiya) savdoni amalga oshirish uchun mijoz tanlanishi shart', 400);
    }

    const saleId = uuidv4();
    const saleNumber = this.generateSaleNumber();

    // Execute atomic transaction
    return await sequelize.transaction(async (t) => {
      // 1. Create Sale record
      const sale = await Sale.create(
        {
          id: saleId,
          businessId,
          branchId: data.branchId,
          customerId: data.customerId,
          userId,
          shiftId,
          saleNumber,
          subtotal: calculatedSubtotal,
          discountAmount: globalDiscount,
          discountPercent: data.discountPercent || 0,
          taxAmount: 0,
          totalAmount,
          paidAmount: Math.min(totalPaid, totalAmount),
          changeAmount,
          debtAmount,
          status: 'completed',
          notes: data.notes,
          completedAt: new Date(),
        },
        { transaction: t }
      );

      // 2. Create Sale Items
      for (const item of preparedItems) {
        await SaleItem.create(
          {
            id: item.id,
            saleId,
            productId: item.productId,
            variantId: item.variantId,
            businessId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            purchasePrice: item.purchasePrice,
            discountAmount: item.discountAmount,
            totalPrice: item.totalPrice,
            unit: item.unit,
          },
          { transaction: t }
        );

        // 3. Record Stock Movement (Inventory Deduction)
        await StockMovement.create(
          {
            id: uuidv4(),
            businessId,
            warehouseId: warehouseId!,
            productId: item.productId,
            variantId: item.variantId,
            userId,
            type: 'sale_out',
            quantity: -Math.abs(item.quantity),
            unitCost: item.purchasePrice,
            referenceType: 'sale',
            referenceId: saleId,
            notes: `Sotuv № ${saleNumber}`,
          },
          { transaction: t }
        );
      }

      // 4. Create Payment records
      for (const p of paymentsList) {
        if (p.amount > 0) {
          await Payment.create(
            {
              id: uuidv4(),
              businessId,
              saleId,
              amount: p.amount,
              method: p.method,
              reference: p.reference,
              receivedAt: new Date(),
            },
            { transaction: t }
          );
        }
      }

      // 5. If debt exists, increment customer balance
      if (debtAmount > 0 && data.customerId) {
        const customer = await Customer.findOne({
          where: { id: data.customerId, businessId },
          transaction: t,
        });
        if (customer) {
          await customer.update(
            {
              balance: Number(customer.balance) + debtAmount,
            },
            { transaction: t }
          );
        }
      }

      // 6. Sodiqlik ballari (Loyalty points: 1% cashback in points)
      if (data.customerId) {
        const customer = await Customer.findOne({
          where: { id: data.customerId, businessId },
          transaction: t,
        });
        if (customer) {
          const earnedPoints = Math.floor(totalAmount * 0.01);
          await customer.update(
            {
              loyaltyPoints: Number(customer.loyaltyPoints) + earnedPoints,
            },
            { transaction: t }
          );
        }
      }

      // 7. Update cashier shift totals if active
      if (shiftId) {
        const shift = await CashierShift.findOne({
          where: { id: shiftId, businessId },
          transaction: t,
        });
        if (shift) {
          await shift.update(
            {
              totalSales: Number(shift.totalSales) + totalAmount,
            },
            { transaction: t }
          );
        }
      }

      return sale;
    });
  }

  /**
   * Hold Sale (Savdoni kechiktirib turish)
   */
  static async holdSale(businessId: string, userId: string, data: CheckoutInput) {
    if (!data.items || data.items.length === 0) {
      throw new AppError('Savatcha bo‘sh', 400);
    }

    const saleId = uuidv4();
    const saleNumber = `HELD-${Date.now().toString().slice(-6)}`;

    let subtotal = 0;
    const itemsData = data.items.map((it) => {
      const price = Number(it.unitPrice) || 0;
      const total = it.quantity * price;
      subtotal += total;
      return {
        id: uuidv4(),
        saleId,
        productId: it.productId,
        variantId: it.variantId,
        businessId,
        quantity: it.quantity,
        unitPrice: price,
        purchasePrice: 0,
        discountAmount: 0,
        totalPrice: total,
        unit: 'dona',
      };
    });

    const sale = await sequelize.transaction(async (t) => {
      const createdSale = await Sale.create(
        {
          id: saleId,
          businessId,
          branchId: data.branchId,
          customerId: data.customerId,
          userId,
          shiftId: data.shiftId,
          saleNumber,
          subtotal,
          discountAmount: 0,
          discountPercent: 0,
          taxAmount: 0,
          totalAmount: subtotal,
          paidAmount: 0,
          changeAmount: 0,
          debtAmount: 0,
          status: 'held',
          notes: data.notes || 'Kechiktirilgan chek',
        },
        { transaction: t }
      );

      for (const item of itemsData) {
        await SaleItem.create(item, { transaction: t });
      }

      return createdSale;
    });

    return this.getById(sale.id, businessId);
  }

  /**
   * Get all currently held sales
   */
  static async getHeldSales(businessId: string, branchId?: string) {
    const where: any = { businessId, status: 'held' };
    if (branchId) where.branchId = branchId;

    return Sale.findAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'unit', 'sellingPrice'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Resume and remove held sale
   */
  static async resumeSale(saleId: string, businessId: string) {
    const sale = await Sale.findOne({
      where: { id: saleId, businessId, status: 'held' },
      include: [
        { model: Customer, as: 'customer' },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });

    if (!sale) {
      throw new AppError('Kechiktirilgan chek topilmadi', 404);
    }

    // Delete held sale record so it can be re-checked out
    await SaleItem.destroy({ where: { saleId } });
    await Sale.destroy({ where: { id: saleId } });

    return sale;
  }

  /**
   * Return items from a completed sale / Refund
   */
  static async returnSale(
    saleId: string,
    businessId: string,
    userId: string,
    data: {
      items: Array<{ itemId: string; quantity: number }>;
      reason?: string;
      refundMethod?: 'cash' | 'card';
    }
  ) {
    const sale = await Sale.findOne({
      where: { id: saleId, businessId },
      include: [
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Branch, as: 'branch', include: [{ model: Warehouse, as: 'warehouses' }] },
      ],
    });

    if (!sale) {
      throw new AppError('Sotuv hujjati topilmadi', 404);
    }

    if (sale.status === 'cancelled') {
      throw new AppError('Bekor qilingan chekni qaytarib bo‘lmaydi', 400);
    }

    const defaultWarehouse = sale.branch?.warehouses?.[0];
    if (!defaultWarehouse) {
      throw new AppError('Omborxona topilmadi', 400);
    }

    let returnTotal = 0;
    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;
    const returnId = uuidv4();

    return await sequelize.transaction(async (t) => {
      // 1. Create Return record
      const returnRecord = await Return.create(
        {
          id: returnId,
          businessId,
          saleId: sale.id,
          userId,
          returnNumber,
          totalAmount: 0, // will update below
          reason: data.reason || 'Mijoz tomonidan qaytarildi',
          status: 'completed',
        },
        { transaction: t }
      );

      // 2. Process return items
      for (const reqItem of data.items) {
        const saleItem = sale.items?.find((it) => it.id === reqItem.itemId);
        if (!saleItem) continue;

        const returnQty = Math.min(Number(reqItem.quantity), Number(saleItem.quantity));
        const itemRefund = returnQty * Number(saleItem.unitPrice);
        returnTotal += itemRefund;

        await ReturnItem.create(
          {
            id: uuidv4(),
            returnId,
            saleItemId: saleItem.id,
            productId: saleItem.productId,
            businessId,
            quantity: returnQty,
            unitPrice: Number(saleItem.unitPrice),
            totalPrice: itemRefund,
          },
          { transaction: t }
        );

        // Restore stock to warehouse
        await StockMovement.create(
          {
            id: uuidv4(),
            businessId,
            warehouseId: defaultWarehouse.id,
            productId: saleItem.productId,
            variantId: saleItem.variantId,
            userId,
            type: 'return_in',
            quantity: Math.abs(returnQty),
            unitCost: Number(saleItem.purchasePrice),
            referenceType: 'return',
            referenceId: returnId,
            notes: `Tovar qaytarilishi: ${returnNumber}`,
          },
          { transaction: t }
        );
      }

      await returnRecord.update({ totalAmount: returnTotal }, { transaction: t });

      // Update sale status
      await sale.update({ status: 'returned' }, { transaction: t });

      // Adjust customer debt if sale had debt
      if (sale.customerId && Number(sale.debtAmount) > 0) {
        const customer = await Customer.findByPk(sale.customerId, { transaction: t });
        if (customer) {
          const debtReduction = Math.min(Number(sale.debtAmount), returnTotal);
          await customer.update(
            { balance: Math.max(0, Number(customer.balance) - debtReduction) },
            { transaction: t }
          );
        }
      }

      return returnRecord;
    });
  }

  /**
   * List sales history with filters
   */
  static async list(
    businessId: string,
    query: {
      search?: string;
      branchId?: string;
      userId?: string;
      customerId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: any;
      limit?: any;
    }
  ) {
    const { page, limit, offset } = parsePagination(query);

    const where: any = { businessId };
    if (query.branchId) where.branchId = query.branchId;
    if (query.userId) where.userId = query.userId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;

    if (query.search) {
      where.saleNumber = { [Op.iLike]: `%${query.search}%` };
    }

    if (query.startDate && query.endDate) {
      where.createdAt = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    }

    const { count, rows: sales } = await Sale.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: User, as: 'cashier', attributes: ['id', 'firstName', 'lastName'] },
        { model: Payment, as: 'payments' },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'unit'] }],
        },
      ],
      distinct: true,
    });

    return {
      sales,
      meta: buildPaginationMeta(count, page, limit),
    };
  }

  /**
   * Get single sale details by ID
   */
  static async getById(id: string, businessId: string) {
    const sale = await Sale.findOne({
      where: { id, businessId },
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'address', 'phone'] },
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone', 'balance', 'loyaltyPoints'] },
        { model: User, as: 'cashier', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Payment, as: 'payments' },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'unit', 'sellingPrice'] }],
        },
      ],
    });

    if (!sale) {
      throw new AppError('Sotuv hujjati topilmadi', 404);
    }

    return sale;
  }
}
