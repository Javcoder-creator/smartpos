import { Model, DataTypes, Sequelize } from 'sequelize';

export interface CashierShiftAttributes {
  id: string;
  businessId: string;
  registerId: string;
  userId: string;
  openingBalance: number;
  closingBalance?: number;
  totalSales: number;
  totalReturns: number;
  totalCashIn: number;
  totalCashOut: number;
  status: 'open' | 'closed';
  openedAt: Date;
  closedAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CashierShift extends Model<CashierShiftAttributes, Partial<CashierShiftAttributes>> implements CashierShiftAttributes {
  public id!: string;
  public businessId!: string;
  public registerId!: string;
  public userId!: string;
  public openingBalance!: number;
  public closingBalance?: number;
  public totalSales!: number;
  public totalReturns!: number;
  public totalCashIn!: number;
  public totalCashOut!: number;
  public status!: 'open' | 'closed';
  public openedAt!: Date;
  public closedAt?: Date;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof CashierShift {
    CashierShift.init(
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
        registerId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'cash_registers', key: 'id' },
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
        },
        openingBalance: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        closingBalance: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
        },
        totalSales: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        totalReturns: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        totalCashIn: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        totalCashOut: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        status: {
          type: DataTypes.ENUM('open', 'closed'),
          defaultValue: 'open',
        },
        openedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        closedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'cashier_shifts',
        timestamps: true,
        underscored: true,
      }
    );
    return CashierShift;
  }
}
