import { v4 as uuidv4 } from 'uuid';
import { Brand, Product } from '../../database/models';
import { AppError } from '../../utils/AppError';

export class BrandService {
  static async list(businessId: string) {
    return Brand.findAll({
      where: { businessId },
      order: [['name', 'ASC']],
    });
  }

  static async getById(id: string, businessId: string) {
    const brand = await Brand.findOne({
      where: { id, businessId },
      include: [{ model: Product, as: 'products', attributes: ['id', 'name', 'sku'] }],
    });

    if (!brand) {
      throw new AppError('Brend topilmadi', 404);
    }
    return brand;
  }

  static async create(businessId: string, data: { name: string; logoUrl?: string }) {
    let baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = 'brand';
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    return Brand.create({
      id: uuidv4(),
      businessId,
      name: data.name,
      slug,
      logoUrl: data.logoUrl,
      isActive: true,
    });
  }

  static async update(
    id: string,
    businessId: string,
    data: { name?: string; logoUrl?: string; isActive?: boolean }
  ) {
    const brand = await this.getById(id, businessId);
    await brand.update(data);
    return brand;
  }

  static async delete(id: string, businessId: string) {
    const brand = await this.getById(id, businessId);

    const productCount = await Product.count({ where: { brandId: id, businessId } });
    if (productCount > 0) {
      throw new AppError(
        `Ushbu brendga biriktirilgan ${productCount} ta mahsulot mavjud. Avval ularni o‘zgartiring`,
        400
      );
    }

    await brand.destroy();
    return { success: true, message: 'Brend muvaffaqiyatli o‘chirildi' };
  }
}
