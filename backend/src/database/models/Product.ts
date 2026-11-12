import { Model, DataTypes, Sequelize } from 'sequelize';

export interface ProductAttributes {
  id: string;
  businessId: string;
  categoryId?: string;
  brandId?: string;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  minStockQty: number;
  unit: string;
  imageUrl?: string;
  isActive: boolean;
  trackInventory: boolean;
  allowNegativeStock: boolean;
  expirationDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product extends Model<ProductAttributes, Partial<ProductAttributes>> implements ProductAttributes {
  public id!: string;
  public businessId!: string;
  public categoryId?: string;
  public brandId?: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public sku!: string;
  public purchasePrice!: number;
  public sellingPrice!: number;
  public wholesalePrice?: number;
  public minStockQty!: number;
  public unit!: string;
  public imageUrl?: string;
  public isActive!: boolean;
  public trackInventory!: boolean;
  public allowNegativeStock!: boolean;
  public expirationDate?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Product {
    Product.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        businessId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'businesses', key: 'id' },
          onDelete: 'CASCADE',
        },
        categoryId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'categories', key: 'id' },
          onDelete: 'SET NULL',
        },
        brandId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'brands', key: 'id' },
          onDelete: 'SET NULL',
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        sku: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        purchasePrice: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        sellingPrice: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        wholesalePrice: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
        },
        minStockQty: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        unit: {
          type: DataTypes.STRING,
          defaultValue: 'dona',
        },
        imageUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        trackInventory: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        allowNegativeStock: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        expirationDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'products',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['business_id', 'sku'],
          },
        ],
      }
    );
    return Product;
  }
}
