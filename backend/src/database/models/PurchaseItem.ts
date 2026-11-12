import { Model, DataTypes, Sequelize } from 'sequelize';

export interface PurchaseItemAttributes {
  id: string;
  purchaseId: string;
  productId: string;
  variantId?: string;
  businessId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PurchaseItem extends Model<PurchaseItemAttributes, Partial<PurchaseItemAttributes>> implements PurchaseItemAttributes {
  public id!: string;
  public purchaseId!: string;
  public productId!: string;
  public variantId?: string;
  public businessId!: string;
  public quantity!: number;
  public unitPrice!: number;
  public totalPrice!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof PurchaseItem {
    PurchaseItem.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        purchaseId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'purchases', key: 'id' },
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
        totalPrice: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: 'purchase_items',
        timestamps: true,
        underscored: true,
      }
    );
    return PurchaseItem;
  }
}
