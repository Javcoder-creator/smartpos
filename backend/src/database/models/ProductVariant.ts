import { Model, DataTypes, Sequelize } from 'sequelize';

export interface ProductVariantAttributes {
  id: string;
  productId: string;
  businessId: string;
  name: string;
  sku: string;
  purchasePrice?: number;
  sellingPrice?: number;
  wholesalePrice?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductVariant extends Model<ProductVariantAttributes, Partial<ProductVariantAttributes>> implements ProductVariantAttributes {
  public id!: string;
  public productId!: string;
  public businessId!: string;
  public name!: string;
  public sku!: string;
  public purchasePrice?: number;
  public sellingPrice?: number;
  public wholesalePrice?: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof ProductVariant {
    ProductVariant.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        productId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'products', key: 'id' },
          onDelete: 'CASCADE',
        },
        businessId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'businesses', key: 'id' },
          onDelete: 'CASCADE',
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        sku: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        purchasePrice: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
        },
        sellingPrice: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
        },
        wholesalePrice: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'product_variants',
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
    return ProductVariant;
  }
}
