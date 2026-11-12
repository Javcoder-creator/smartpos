import { v4 as uuidv4 } from 'uuid';
import { Warehouse, Branch } from '../../database/models';
import { AppError } from '../../utils/AppError';

export class WarehouseService {
  static async list(businessId: string, branchId?: string) {
    const where: any = { businessId };
    if (branchId) where.branchId = branchId;

    return Warehouse.findAll({
      where,
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name', 'isMain'] }],
      order: [['isDefault', 'DESC'], ['name', 'ASC']],
    });
  }

  static async getById(id: string, businessId: string) {
    const warehouse = await Warehouse.findOne({
      where: { id, businessId },
      include: [{ model: Branch, as: 'branch' }],
    });

    if (!warehouse) {
      throw new AppError('Ombor topilmadi', 404);
    }
    return warehouse;
  }

  static async create(
    businessId: string,
    data: { name: string; branchId?: string; address?: string; isDefault?: boolean }
  ) {
    if (data.isDefault) {
      await Warehouse.update({ isDefault: false }, { where: { businessId } });
    }

    return Warehouse.create({
      id: uuidv4(),
      businessId,
      branchId: data.branchId || undefined,
      name: data.name,
      address: data.address,
      isDefault: data.isDefault || false,
      isActive: true,
    });
  }

  static async update(
    id: string,
    businessId: string,
    data: { name?: string; branchId?: string; address?: string; isDefault?: boolean; isActive?: boolean }
  ) {
    const warehouse = await this.getById(id, businessId);

    if (data.isDefault) {
      await Warehouse.update({ isDefault: false }, { where: { businessId } });
    }

    await warehouse.update(data);
    return warehouse;
  }

  static async delete(id: string, businessId: string) {
    const warehouse = await this.getById(id, businessId);
    if (warehouse.isDefault) {
      throw new AppError('Asosiy omborni o‘chirib bo‘lmaydi', 400);
    }

    await warehouse.destroy();
    return { success: true, message: 'Ombor muvaffaqiyatli o‘chirildi' };
  }
}
