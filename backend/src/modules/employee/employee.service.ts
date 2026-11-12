import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, Role, Branch, Permission } from '../../database/models';
import { AppError } from '../../utils/AppError';

export class EmployeeService {
  /**
   * List all employees for a business
   */
  static async list(businessId: string) {
    return User.findAll({
      where: { businessId },
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'slug', 'description'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * List available roles
   */
  static async listRoles() {
    return Role.findAll({
      where: {
        slug: ['administrator', 'manager', 'cashier', 'warehouse_manager', 'accountant'],
      },
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
      order: [['name', 'ASC']],
    });
  }

  /**
   * Create an employee
   */
  static async create(
    businessId: string,
    data: {
      firstName: string;
      lastName?: string;
      email: string;
      phone?: string;
      password?: string;
      roleId: string;
      branchId?: string;
    }
  ) {
    if (!data.firstName || !data.email || !data.roleId) {
      throw new AppError('Ism, email va rol tanlanishi shart', 400);
    }

    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) {
      throw new AppError('Ushbu email bilan foydalanuvchi allaqachon mavjud', 400);
    }

    const rawPassword = data.password || 'Employee@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const employee = await User.create({
      id: uuidv4(),
      businessId,
      branchId: data.branchId || undefined,
      roleId: data.roleId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      isActive: true,
      language: 'uz',
    });

    return User.findByPk(employee.id, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: Role, as: 'role' },
        { model: Branch, as: 'branch' },
      ],
    });
  }

  /**
   * Update employee details
   */
  static async update(
    id: string,
    businessId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      roleId?: string;
      branchId?: string;
      isActive?: boolean;
      password?: string;
    }
  ) {
    const employee = await User.findOne({ where: { id, businessId } });
    if (!employee) {
      throw new AppError('Xodim topilmadi', 404);
    }

    const updateFields: any = {};
    if (data.firstName) updateFields.firstName = data.firstName;
    if (data.lastName !== undefined) updateFields.lastName = data.lastName;
    if (data.phone !== undefined) updateFields.phone = data.phone;
    if (data.roleId) updateFields.roleId = data.roleId;
    if (data.branchId !== undefined) updateFields.branchId = data.branchId || null;
    if (data.isActive !== undefined) updateFields.isActive = data.isActive;

    if (data.password) {
      updateFields.password = await bcrypt.hash(data.password, 10);
    }

    await employee.update(updateFields);

    return User.findByPk(id, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: Role, as: 'role' },
        { model: Branch, as: 'branch' },
      ],
    });
  }

  /**
   * Deactivate employee
   */
  static async delete(id: string, businessId: string) {
    const employee = await User.findOne({ where: { id, businessId } });
    if (!employee) {
      throw new AppError('Xodim topilmadi', 404);
    }
    await employee.update({ isActive: false });
    return { success: true, message: 'Xodim faoliyati to‘xtatildi' };
  }
}
