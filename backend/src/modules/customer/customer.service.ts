import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { Customer, CustomerGroup, Sale } from '../../database/models';
import { AppError } from '../../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export class CustomerService {
  static async list(businessId: string, search?: string) {
    const where: any = { businessId, isActive: true };
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search.trim()}%` } },
        { lastName: { [Op.iLike]: `%${search.trim()}%` } },
        { phone: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    return Customer.findAll({
      where,
      include: [{ model: CustomerGroup, as: 'group', attributes: ['id', 'name', 'discountPercent'] }],
      order: [['firstName', 'ASC']],
      limit: 100,
    });
  }

  static async getById(id: string, businessId: string) {
    const customer = await Customer.findOne({
      where: { id, businessId },
      include: [
        { model: CustomerGroup, as: 'group' },
        { model: Sale, as: 'sales', limit: 10, order: [['createdAt', 'DESC']] },
      ],
    });

    if (!customer) {
      throw new AppError('Mijoz topilmadi', 404);
    }
    return customer;
  }

  static async create(
    businessId: string,
    data: {
      firstName: string;
      lastName?: string;
      phone: string;
      email?: string;
      address?: string;
      groupId?: string;
      notes?: string;
    }
  ) {
    const customer = await Customer.create({
      id: uuidv4(),
      businessId,
      groupId: data.groupId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      loyaltyPoints: 0,
      balance: 0,
      notes: data.notes,
      isActive: true,
    });

    return customer;
  }

  static async update(
    id: string,
    businessId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      address?: string;
      groupId?: string;
      notes?: string;
      isActive?: boolean;
    }
  ) {
    const customer = await this.getById(id, businessId);
    await customer.update(data);
    return customer;
  }

  static async delete(id: string, businessId: string) {
    const customer = await this.getById(id, businessId);
    await customer.update({ isActive: false });
    return { success: true, message: 'Mijoz o‘chirildi' };
  }
}
