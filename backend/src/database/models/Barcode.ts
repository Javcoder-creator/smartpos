import { Model, DataTypes, Sequelize } from 'sequelize';

export interface BarcodeAttributes {
  id: string;
  productId: string;
  businessId: string;
  variantId?: string;
  barcode: string;
  type: 'ean13' | 'ean8' | 'upc' | 'code128' | 'custom';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Barcode extends Model<BarcodeAttributes, Partial<BarcodeAttributes>> implements BarcodeAttributes {
  public id!: string;
  public productId!: string;
  public businessId!: string;
  public variantId?: string;
  public barcode!: string;
  public type!: 'ean13' | 'ean8' | 'upc' | 'code128' | 'custom';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Barcode {
    Barcode.init(
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
        variantId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'product_variants', key: 'id' },
          onDelete: 'SET NULL',
        },
        barcode: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM('ean13', 'ean8', 'upc', 'code128', 'custom'),
          defaultValue: 'code128',
        },
      },
      {
        sequelize,
        tableName: 'barcodes',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['business_id', 'barcode'],
          },
        ],
      }
    );
    return Barcode;
  }
}
