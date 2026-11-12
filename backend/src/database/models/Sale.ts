import { Model, DataTypes, Sequelize } from 'sequelize';

export interface SaleAttributes {
  id: string;
  businessId: string;
  branchId: string;
  customerId?: string;
  userId: string;
  shiftId?: string;
  saleNumber: string;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  debtAmount: number;
  status: 'completed' | 'held' | 'returned' | 'cancelled';
  notes?: string;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Sale extends Model<SaleAttributes, Partial<SaleAttributes>> implements SaleAttributes {
  public id!: string;
  public businessId!: string;
  public branchId!: string;
  public customerId?: string;
  public userId!: string;
  public shiftId?: string;
  public saleNumber!: string;
  public subtotal!: number;
  public discountAmount!: number;
  public discountPercent!: number;
  public taxAmount!: number;
  public totalAmount!: number;
  public paidAmount!: number;
  public changeAmount!: number;
  public debtAmount!: number;
  public status!: 'completed' | 'held' | 'returned' | 'cancelled';
  public notes?: string;
  public completedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Sale {
    Sale.init(
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
        branchId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'branches', key: 'id' },
        },
        customerId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'customers', key: 'id' },
          onDelete: 'SET NULL',
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
        },
        shiftId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'cashier_shifts', key: 'id' },
          onDelete: 'SET NULL',
        },
        saleNumber: {
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
        discountPercent: {
          type: DataTypes.DECIMAL(5, 2),
          defaultValue: 0,
        },
        taxAmount: {
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
        changeAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        debtAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        status: {
          type: DataTypes.ENUM('completed', 'held', 'returned', 'cancelled'),
          defaultValue: 'completed',
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        completedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'sales',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['business_id', 'sale_number'],
          },
        ],
      }
    );
    return Sale;
  }
}
