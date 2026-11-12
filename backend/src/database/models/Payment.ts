import { Model, DataTypes, Sequelize } from 'sequelize';

export interface PaymentAttributes {
  id: string;
  businessId: string;
  saleId?: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'split';
  reference?: string;
  receivedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Payment extends Model<PaymentAttributes, Partial<PaymentAttributes>> implements PaymentAttributes {
  public id!: string;
  public businessId!: string;
  public saleId?: string;
  public amount!: number;
  public method!: 'cash' | 'card' | 'transfer' | 'split';
  public reference?: string;
  public receivedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Payment {
    Payment.init(
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
          allowNull: true,
          references: { model: 'sales', key: 'id' },
          onDelete: 'CASCADE',
        },
        amount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        method: {
          type: DataTypes.ENUM('cash', 'card', 'transfer', 'split'),
          defaultValue: 'cash',
        },
        reference: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        receivedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'payments',
        timestamps: true,
        underscored: true,
      }
    );
    return Payment;
  }
}
