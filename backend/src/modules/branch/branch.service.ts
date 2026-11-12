import { v4 as uuidv4 } from 'uuid';
import { Branch, Warehouse, User } from '../../database/models';
import { AppError } from '../../utils/AppError';

export class BranchService {
  static async list(businessId: string) {
    return Branch.findAll({
      where: { businessId },
      include: [
        { model: Warehouse, as: 'warehouses' },
        { model: User, as: 'users', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      ],
      order: [['isMain', 'DESC'], ['createdAt', 'ASC']],
    });
  }

  static async getById(id: string, businessId: string) {
    const branch = await Branch.findOne({
      where: { id, businessId },
      include: [
        { model: Warehouse, as: 'warehouses' },
        { model: User, as: 'users', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      ],
    });

    if (!branch) {
      throw new AppError('Filial topilmadi', 404);
    }
    return branch;
  }

  static async create(
    businessId: string,
    data: { name: string; address?: string; city?: string; phone?: string; email?: string; isMain?: boolean }
  ) {
    // If isMain is true, unset other branches isMain
    if (data.isMain) {
      await Branch.update({ isMain: false }, { where: { businessId } });
    }

    const branch = await Branch.create({
      id: uuidv4(),
      businessId,
      name: data.name,
      address: data.address,
      city: data.city,
      phone: data.phone,
      email: data.email,
      isMain: data.isMain || false,
      isActive: true,
    });

    // Also auto-create a default warehouse for this branch
    await Warehouse.create({
      id: uuidv4(),
      businessId,
      branchId: branch.id,
      name: `${data.name} ombori`,
      isDefault: data.isMain || false,
      isActive: true,
    });

    return branch;
  }

  static async update(
    id: string,
    businessId: string,
    data: { name?: string; address?: string; city?: string; phone?: string; email?: string; isMain?: boolean; isActive?: boolean }
  ) {
    const branch = await this.getById(id, businessId);

    if (data.isMain) {
      await Branch.update({ isMain: false }, { where: { businessId } });
    }

    await branch.update(data);
    return branch;
  }

  static async delete(id: string, businessId: string) {
    const branch = await this.getById(id, businessId);
    if (branch.isMain) {
      throw new AppError('Asosiy filialni o‘chirib bo‘lmaydi', 400);
    }

    await branch.destroy();
    return { success: true, message: 'Filial o‘chirildi' };
  }
}
