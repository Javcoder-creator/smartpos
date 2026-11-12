import { Model, DataTypes, Sequelize } from 'sequelize';

export interface SupplierAttributes {
  id: string;
  businessId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  balance: number;
  notes?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Supplier extends Model<SupplierAttributes, Partial<SupplierAttributes>> implements SupplierAttributes {
  public id!: string;
  public businessId!: string;
  public name!: string;
  public contactPerson?: string;
  public phone!: string;
  public email?: string;
  public address?: string;
  public balance!: number;
  public notes?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Supplier {
    Supplier.init(
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
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        contactPerson: {
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
        tableName: 'suppliers',
        timestamps: true,
        underscored: true,
      }
    );
    return Supplier;
  }
}
