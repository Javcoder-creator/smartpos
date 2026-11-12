import { v4 as uuidv4 } from 'uuid';
import { Category, Product } from '../../database/models';
import { AppError } from '../../utils/AppError';

export class CategoryService {
  static async list(businessId: string) {
    return Category.findAll({
      where: { businessId },
      include: [
        { model: Category, as: 'subcategories' },
        { model: Product, as: 'products', attributes: ['id'] },
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
  }

  static async getById(id: string, businessId: string) {
    const category = await Category.findOne({
      where: { id, businessId },
      include: [
        { model: Category, as: 'subcategories' },
        { model: Category, as: 'parent' },
      ],
    });

    if (!category) {
      throw new AppError('Kategoriya topilmadi', 404);
    }
    return category;
  }

  static async create(
    businessId: string,
    data: { name: string; parentId?: string; description?: string; sortOrder?: number }
  ) {
    let baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = 'category';
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    return Category.create({
      id: uuidv4(),
      businessId,
      parentId: data.parentId || undefined,
      name: data.name,
      slug,
      description: data.description,
      sortOrder: data.sortOrder || 0,
      isActive: true,
    });
  }

  static async update(
    id: string,
    businessId: string,
    data: { name?: string; parentId?: string; description?: string; sortOrder?: number; isActive?: boolean }
  ) {
    const category = await this.getById(id, businessId);
    await category.update(data);
    return category;
  }

  static async delete(id: string, businessId: string) {
    const category = await this.getById(id, businessId);

    // Check if category has products
    const productCount = await Product.count({ where: { categoryId: id, businessId } });
    if (productCount > 0) {
      throw new AppError(
        `Ushbu toifaga biriktirilgan ${productCount} ta mahsulot mavjud. Avval ularni boshqa toifaga o‘tkazing`,
        400
      );
    }

    await category.destroy();
    return { success: true, message: 'Kategoriya muvaffaqiyatli o‘chirildi' };
  }
}
