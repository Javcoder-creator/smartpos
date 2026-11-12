import { Model, DataTypes, Sequelize } from 'sequelize';

export interface CustomerGroupAttributes {
  id: string;
  businessId: string;
  name: string;
  discountPercent: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CustomerGroup extends Model<CustomerGroupAttributes, Partial<CustomerGroupAttributes>> implements CustomerGroupAttributes {
  public id!: string;
  public businessId!: string;
  public name!: string;
  public discountPercent!: number;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof CustomerGroup {
    CustomerGroup.init(
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
        discountPercent: {
          type: DataTypes.DECIMAL(5, 2),
          defaultValue: 0,
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'customer_groups',
        timestamps: true,
        underscored: true,
      }
    );
    return CustomerGroup;
  }
}
