import { Model, DataTypes, Sequelize } from 'sequelize';

export interface ReturnAttributes {
  id: string;
  businessId: string;
  saleId: string;
  userId: string;
  returnNumber: string;
  totalAmount: number;
  reason?: string;
  status: 'pending' | 'approved' | 'completed';
  refundMethod: 'cash' | 'card' | 'store_credit';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Return extends Model<ReturnAttributes, Partial<ReturnAttributes>> implements ReturnAttributes {
  public id!: string;
  public businessId!: string;
  public saleId!: string;
  public userId!: string;
  public returnNumber!: string;
  public totalAmount!: number;
  public reason?: string;
  public status!: 'pending' | 'approved' | 'completed';
  public refundMethod!: 'cash' | 'card' | 'store_credit';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Return {
    Return.init(
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
        saleId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'sales', key: 'id' },
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
        },
        returnNumber: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        totalAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('pending', 'approved', 'completed'),
          defaultValue: 'completed',
        },
        refundMethod: {
          type: DataTypes.ENUM('cash', 'card', 'store_credit'),
          defaultValue: 'cash',
        },
      },
      {
        sequelize,
        tableName: 'returns',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['business_id', 'return_number'],
          },
        ],
      }
    );
    return Return;
  }
}
