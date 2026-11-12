import { Model, DataTypes, Sequelize } from 'sequelize';

export interface StockMovementAttributes {
  id: string;
  businessId: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  type: 'purchase_in' | 'sale_out' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return_in' | 'return_out' | 'write_off';
  quantity: number;
  previousQty: number;
  currentQty: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StockMovement extends Model<StockMovementAttributes, Partial<StockMovementAttributes>> implements StockMovementAttributes {
  public id!: string;
  public businessId!: string;
  public productId!: string;
  public variantId?: string;
  public warehouseId!: string;
  public type!: 'purchase_in' | 'sale_out' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return_in' | 'return_out' | 'write_off';
  public quantity!: number;
  public previousQty!: number;
  public currentQty!: number;
  public referenceType?: string;
  public referenceId?: string;
  public notes?: string;
  public userId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof StockMovement {
    StockMovement.init(
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
        warehouseId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'warehouses', key: 'id' },
        },
        type: {
          type: DataTypes.ENUM(
            'purchase_in',
            'sale_out',
            'transfer_in',
            'transfer_out',
            'adjustment',
            'return_in',
            'return_out',
            'write_off'
          ),
          allowNull: false,
        },
        quantity: {
          type: DataTypes.DECIMAL(12, 3),
          allowNull: false,
        },
        previousQty: {
          type: DataTypes.DECIMAL(12, 3),
          defaultValue: 0,
        },
        currentQty: {
          type: DataTypes.DECIMAL(12, 3),
          defaultValue: 0,
        },
        referenceType: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        referenceId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
        },
      },
      {
        sequelize,
        tableName: 'stock_movements',
        timestamps: true,
        underscored: true,
      }
    );
    return StockMovement;
  }
}
