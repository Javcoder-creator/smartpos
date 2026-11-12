import { Model, DataTypes, Sequelize } from 'sequelize';

export interface CustomerAttributes {
  id: string;
  businessId: string;
  groupId?: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  balance: number;
  notes?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer extends Model<CustomerAttributes, Partial<CustomerAttributes>> implements CustomerAttributes {
  public id!: string;
  public businessId!: string;
  public groupId?: string;
  public firstName!: string;
  public lastName?: string;
  public phone!: string;
  public email?: string;
  public address?: string;
  public loyaltyPoints!: number;
  public balance!: number;
  public notes?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Customer {
    Customer.init(
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
        groupId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'customer_groups', key: 'id' },
          onDelete: 'SET NULL',
        },
        firstName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        lastName: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        address: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        loyaltyPoints: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        balance: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'customers',
        timestamps: true,
        underscored: true,
      }
    );
    return Customer;
  }
}
