import { Model, DataTypes, Sequelize } from 'sequelize';

export interface PurchaseAttributes {
  id: string;
  businessId: string;
  supplierId: string;
  warehouseId: string;
  userId: string;
  purchaseNumber: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  notes?: string;
  receivedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Purchase extends Model<PurchaseAttributes, Partial<PurchaseAttributes>> implements PurchaseAttributes {
  public id!: string;
  public businessId!: string;
  public supplierId!: string;
  public warehouseId!: string;
  public userId!: string;
  public purchaseNumber!: string;
  public subtotal!: number;
  public discountAmount!: number;
  public totalAmount!: number;
  public paidAmount!: number;
  public debtAmount!: number;
  public status!: 'draft' | 'ordered' | 'received' | 'cancelled';
  public notes?: string;
  public receivedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Purchase {
    Purchase.init(
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
        supplierId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'suppliers', key: 'id' },
        },
        warehouseId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'warehouses', key: 'id' },
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
        },
        purchaseNumber: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        subtotal: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        discountAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        totalAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        paidAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        debtAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        status: {
          type: DataTypes.ENUM('draft', 'ordered', 'received', 'cancelled'),
          defaultValue: 'draft',
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        receivedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'purchases',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['business_id', 'purchase_number'],
          },
        ],
      }
    );
    return Purchase;
  }
}
