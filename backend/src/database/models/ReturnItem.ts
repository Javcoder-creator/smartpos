import { Model, DataTypes, Sequelize } from 'sequelize';

export interface ReturnItemAttributes {
  id: string;
  returnId: string;
  saleItemId?: string;
  productId: string;
  businessId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReturnItem extends Model<ReturnItemAttributes, Partial<ReturnItemAttributes>> implements ReturnItemAttributes {
  public id!: string;
  public returnId!: string;
  public saleItemId?: string;
  public productId!: string;
  public businessId!: string;
  public quantity!: number;
  public unitPrice!: number;
  public totalPrice!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof ReturnItem {
    ReturnItem.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        returnId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'returns', key: 'id' },
          onDelete: 'CASCADE',
        },
        saleItemId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'sale_items', key: 'id' },
          onDelete: 'SET NULL',
        },
        productId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'products', key: 'id' },
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
        tableName: 'return_items',
        timestamps: true,
        underscored: true,
      }
    );
    return ReturnItem;
  }
}
