import { Model, DataTypes, Sequelize } from 'sequelize';

export interface WarehouseAttributes {
  id: string;
  businessId: string;
  branchId?: string;
  name: string;
  address?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Warehouse extends Model<WarehouseAttributes, Partial<WarehouseAttributes>> implements WarehouseAttributes {
  public id!: string;
  public businessId!: string;
  public branchId?: string;
  public name!: string;
  public address?: string;
  public isDefault!: boolean;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Warehouse {
    Warehouse.init(
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
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        address: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        isDefault: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'warehouses',
        timestamps: true,
        underscored: true,
      }
    );
    return Warehouse;
  }
}
