import { Model, DataTypes, Sequelize } from 'sequelize';

export interface ExpenseAttributes {
  id: string;
  businessId: string;
  branchId?: string;
  categoryName: string;
  amount: number;
  description?: string;
  date: string;
  userId: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Expense extends Model<ExpenseAttributes, Partial<ExpenseAttributes>> implements ExpenseAttributes {
  public id!: string;
  public businessId!: string;
  public branchId?: string;
  public categoryName!: string;
  public amount!: number;
  public description?: string;
  public date!: string;
  public userId!: string;
  public paymentMethod!: 'cash' | 'card' | 'transfer';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Expense {
    Expense.init(
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
          allowNull: true,
          references: { model: 'branches', key: 'id' },
          onDelete: 'SET NULL',
        },
        categoryName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        amount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
        },
        paymentMethod: {
          type: DataTypes.ENUM('cash', 'card', 'transfer'),
          defaultValue: 'cash',
        },
      },
      {
        sequelize,
        tableName: 'expenses',
        timestamps: true,
        underscored: true,
      }
    );
    return Expense;
  }
}
