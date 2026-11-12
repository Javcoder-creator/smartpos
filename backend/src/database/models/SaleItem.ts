import { Model, DataTypes, Sequelize } from 'sequelize';

export interface SaleItemAttributes {
  id: string;
  saleId: string;
  productId: string;
  variantId?: string;
  businessId: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  discountAmount: number;
  totalPrice: number;
  unit: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SaleItem extends Model<SaleItemAttributes, Partial<SaleItemAttributes>> implements SaleItemAttributes {
  public id!: string;
  public saleId!: string;
  public productId!: string;
  public variantId?: string;
  public businessId!: string;
  public quantity!: number;
  public unitPrice!: number;
  public purchasePrice!: number;
  public discountAmount!: number;
  public totalPrice!: number;
  public unit!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof SaleItem {
    SaleItem.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        saleId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'sales', key: 'id' },
          onDelete: 'CASCADE',
        },
        productId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'products', key: 'id' },
        },
        variantId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'product_variants', key: 'id' },
          onDelete: 'SET NULL',
        },
        businessId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'businesses', key: 'id' },
          onDelete: 'CASCADE',
        },
        quantity: {
          type: DataTypes.DECIMAL(12, 3),
          defaultValue: 1,
        },
        unitPrice: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        purchasePrice: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        discountAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        totalPrice: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        unit: {
          type: DataTypes.STRING,
          defaultValue: 'dona',
        },
      },
      {
        sequelize,
        tableName: 'sale_items',
        timestamps: true,
        underscored: true,
      }
    );
    return SaleItem;
  }
}
