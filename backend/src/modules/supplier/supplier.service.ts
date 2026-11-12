import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Supplier, Purchase } from '../../database/models';
import { AppError } from '../../utils/AppError';

export class SupplierService {
  static async list(businessId: string, search?: string) {
    const where: any = { businessId, isActive: true };
    if (search && search.trim()) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search.trim()}%` } },
        { phone: { [Op.iLike]: `%${search.trim()}%` } },
        { contactPerson: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    return Supplier.findAll({
      where,
      order: [['name', 'ASC']],
    });
  }

  static async getById(id: string, businessId: string) {
    const supplier = await Supplier.findOne({
      where: { id, businessId },
      include: [
        {
          model: Purchase,
          as: 'purchases',
          limit: 10,
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!supplier) {
      throw new AppError('Ta’minotchi topilmadi', 404);
    }
    return supplier;
  }

  static async create(
    businessId: string,
    data: {
      name: string;
      contactPerson?: string;
      phone: string;
      email?: string;
      address?: string;
      balance?: number;
      notes?: string;
    }
  ) {
    return Supplier.create({
      id: uuidv4(),
      businessId,
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      balance: data.balance || 0,
      notes: data.notes,
      isActive: true,
    });
  }

  static async update(
    id: string,
    businessId: string,
    data: {
      name?: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      address?: string;
      balance?: number;
      notes?: string;
      isActive?: boolean;
    }
  ) {
    const supplier = await this.getById(id, businessId);
    await supplier.update(data);
    return supplier;
  }

  static async recordPayment(id: string, businessId: string, amount: number) {
    const supplier = await this.getById(id, businessId);
    const newBalance = Number(supplier.balance) - Number(amount);
    await supplier.update({ balance: newBalance });
    return supplier;
  }

  static async delete(id: string, businessId: string) {
    const supplier = await this.getById(id, businessId);
    await supplier.update({ isActive: false });
    return { success: true, message: 'Ta’minotchi arxivlandi' };
  }
}
