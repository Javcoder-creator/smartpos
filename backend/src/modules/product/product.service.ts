import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import {
  sequelize,
  Product,
  Category,
  Brand,
  Barcode,
  ProductVariant,
  StockMovement,
} from '../../database/models';
import { AppError } from '../../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export interface ProductFilterQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: string | boolean;
  [key: string]: any;
}

export class ProductService {
  static async list(businessId: string, query: ProductFilterQuery) {
    const { page, limit, offset } = parsePagination(query);

    const where: any = { businessId };

    if (query.isActive !== undefined) {
      where.isActive = String(query.isActive) === 'true';
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.brandId) {
      where.brandId = query.brandId;
    }

    if (query.search) {
      const search = query.search.trim();
      // Also search barcodes
      const matchedBarcodes = await Barcode.findAll({
        where: { businessId, barcode: { [Op.iLike]: `%${search}%` } },
        attributes: ['productId'],
      });
      const productIdsFromBarcodes = matchedBarcodes.map((b) => b.productId);

      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { id: { [Op.in]: productIdsFromBarcodes } },
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Brand, as: 'brand', attributes: ['id', 'name', 'slug'] },
        { model: Barcode, as: 'barcodes', attributes: ['id', 'barcode', 'type'] },
        { model: ProductVariant, as: 'variants' },
      ],
      distinct: true,
    });

    const meta = buildPaginationMeta(count, page, limit);

    return { products: rows, meta };
  }

  static async getById(id: string, businessId: string) {
    const product = await Product.findOne({
      where: { id, businessId },
      include: [
        { model: Category, as: 'category' },
        { model: Brand, as: 'brand' },
        { model: Barcode, as: 'barcodes' },
        { model: ProductVariant, as: 'variants' },
      ],
    });

    if (!product) {
      throw new AppError('Mahsulot topilmadi', 404);
    }
    return product;
  }

  static async getByBarcode(barcodeStr: string, businessId: string) {
    // 1. Check Barcode table
    const barcodeRecord = await Barcode.findOne({
      where: { barcode: barcodeStr.trim(), businessId },
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            { model: Category, as: 'category' },
            { model: Brand, as: 'brand' },
            { model: Barcode, as: 'barcodes' },
            { model: ProductVariant, as: 'variants' },
          ],
        },
      ],
    });

    if (barcodeRecord && (barcodeRecord as any).product) {
      return (barcodeRecord as any).product;
    }

    // 2. Check Product SKU directly
    const productBySku = await Product.findOne({
      where: { sku: barcodeStr.trim(), businessId },
      include: [
        { model: Category, as: 'category' },
        { model: Brand, as: 'brand' },
        { model: Barcode, as: 'barcodes' },
        { model: ProductVariant, as: 'variants' },
      ],
    });

    if (productBySku) {
      return productBySku;
    }

    throw new AppError(`Shtrix-kod (${barcodeStr}) bo‘yicha mahsulot topilmadi`, 404);
  }

  static async create(
    businessId: string,
    data: {
      name: string;
      categoryId?: string;
      brandId?: string;
      sku?: string;
      barcode?: string;
      barcodes?: string[];
      purchasePrice: number;
      sellingPrice: number;
      wholesalePrice?: number;
      minStockQty?: number;
      unit?: string;
      description?: string;
      imageUrl?: string;
      trackInventory?: boolean;
      allowNegativeStock?: boolean;
      expirationDate?: string;
      variants?: Array<{ name: string; sku?: string; purchasePrice?: number; sellingPrice?: number }>;
    }
  ) {
    const transaction = await sequelize.transaction();

    try {
      // 1. SKU generation
      let sku = data.sku ? data.sku.trim() : null;
      if (!sku) {
        sku = `SP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      }

      // Check unique SKU per business
      const existingSku = await Product.findOne({ where: { businessId, sku } });
      if (existingSku) {
        throw new AppError(`Ushbu SKU (${sku}) allaqachon mavjud`, 400);
      }

      // 2. Slug generation
      let baseSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (!baseSlug) baseSlug = 'product';
      const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      // 3. Create Product
      const product = await Product.create(
        {
          id: uuidv4(),
          businessId,
          categoryId: data.categoryId || undefined,
          brandId: data.brandId || undefined,
          name: data.name,
          slug,
          sku,
          description: data.description,
          purchasePrice: data.purchasePrice || 0,
          sellingPrice: data.sellingPrice || 0,
          wholesalePrice: data.wholesalePrice || undefined,
          minStockQty: data.minStockQty || 0,
          unit: data.unit || 'dona',
          imageUrl: data.imageUrl,
          trackInventory: data.trackInventory ?? true,
          allowNegativeStock: data.allowNegativeStock ?? false,
          expirationDate: data.expirationDate as any,
          isActive: true,
        },
        { transaction }
      );

      // 4. Barcodes
      const barcodeList: string[] = [];
      if (data.barcode && data.barcode.trim()) {
        barcodeList.push(data.barcode.trim());
      }
      if (Array.isArray(data.barcodes)) {
        for (const b of data.barcodes) {
          if (b && !barcodeList.includes(b.trim())) barcodeList.push(b.trim());
        }
      }

      // If no barcode provided, generate standard EAN-13 compatible or Code-128 barcode
      if (barcodeList.length === 0) {
        const generatedBarcode = '200' + Date.now().toString().slice(-9) + Math.floor(Math.random() * 10);
        barcodeList.push(generatedBarcode);
      }

      for (const bc of barcodeList) {
        await Barcode.create(
          {
            id: uuidv4(),
            productId: product.id,
            businessId,
            barcode: bc,
            type: bc.length === 13 ? 'ean13' : 'code128',
          },
          { transaction }
        );
      }

      // 5. Variants (optional)
      if (Array.isArray(data.variants) && data.variants.length > 0) {
        for (const v of data.variants) {
          const variantSku = v.sku || `${sku}-${v.name.toLowerCase().replace(/\s+/g, '-')}`;
          await ProductVariant.create(
            {
              id: uuidv4(),
              productId: product.id,
              businessId,
              name: v.name,
              sku: variantSku,
              purchasePrice: v.purchasePrice || product.purchasePrice,
              sellingPrice: v.sellingPrice || product.sellingPrice,
              isActive: true,
            },
            { transaction }
          );
        }
      }

      await transaction.commit();
      return this.getById(product.id, businessId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(id: string, businessId: string, data: any) {
    const product = await this.getById(id, businessId);
    const transaction = await sequelize.transaction();

    try {
      await product.update(data, { transaction });

      // Update barcodes if provided
      if (data.barcode) {
        const existingBc = await Barcode.findOne({ where: { productId: id, businessId } });
        if (existingBc) {
          await existingBc.update({ barcode: data.barcode.trim() }, { transaction });
        } else {
          await Barcode.create(
            {
              id: uuidv4(),
              productId: id,
              businessId,
              barcode: data.barcode.trim(),
              type: data.barcode.trim().length === 13 ? 'ean13' : 'code128',
            },
            { transaction }
          );
        }
      }

      await transaction.commit();
      return this.getById(id, businessId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async delete(id: string, businessId: string) {
    const product = await this.getById(id, businessId);
    await product.update({ isActive: false });
    return { success: true, message: 'Mahsulot arxivlandi' };
  }

  static async exportToExcel(businessId: string): Promise<Buffer> {
    const products = await Product.findAll({
      where: { businessId },
      include: [
        { model: Category, as: 'category' },
        { model: Brand, as: 'brand' },
        { model: Barcode, as: 'barcodes' },
      ],
      order: [['name', 'ASC']],
    });

    const rows = products.map((p, idx) => {
      const primaryBarcode = (p as any).barcodes?.[0]?.barcode || '';
      return {
        '№': idx + 1,
        'Mahsulot nomi': p.name,
        'SKU': p.sku,
        'Shtrix-kod': primaryBarcode,
        'Kategoriya': (p as any).category?.name || 'Kategoriyasiz',
        'Brend': (p as any).brand?.name || '',
        'Xarid narxi (UZS)': Number(p.purchasePrice),
        'Sotish narxi (UZS)': Number(p.sellingPrice),
        'Ulgurji narxi (UZS)': p.wholesalePrice ? Number(p.wholesalePrice) : '',
        'O‘lchov birligi': p.unit,
        'Minimal qoldiq': p.minStockQty,
        'Holat': p.isActive ? 'Faol' : 'Nofaol',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mahsulotlar');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  static async importFromExcel(businessId: string, fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rawRows.length === 0) {
      throw new AppError('Excel fayl bo‘sh', 400);
    }

    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const name = row['Mahsulot nomi'] || row['Nomi'] || row['Name'] || row['name'];
      if (!name) continue;

      try {
        const sellingPrice = Number(row['Sotish narxi (UZS)'] || row['Sotish narxi'] || row['Price'] || 0);
        const purchasePrice = Number(row['Xarid narxi (UZS)'] || row['Xarid narxi'] || row['Cost'] || 0);
        const unit = row['O‘lchov birligi'] || row['Birligi'] || 'dona';
        const barcode = row['Shtrix-kod'] || row['Barcode'] ? String(row['Shtrix-kod'] || row['Barcode']).trim() : undefined;
        const sku = row['SKU'] ? String(row['SKU']).trim() : undefined;

        await this.create(businessId, {
          name: String(name).trim(),
          sellingPrice,
          purchasePrice,
          unit,
          barcode,
          sku,
        });

        importedCount++;
      } catch (err: any) {
        errors.push(`Qator ${i + 2}: ${err.message}`);
      }
    }

    return {
      success: true,
      importedCount,
      totalRows: rawRows.length,
      errors: errors.slice(0, 5),
    };
  }
}
