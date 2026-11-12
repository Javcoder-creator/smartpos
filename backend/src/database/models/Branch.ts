import { Model, DataTypes, Sequelize } from 'sequelize';

export interface BranchAttributes {
  id: string;
  businessId: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isMain: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Branch extends Model<BranchAttributes, Partial<BranchAttributes>> implements BranchAttributes {
  public id!: string;
  public businessId!: string;
  public name!: string;
  public address?: string;
  public city?: string;
  public phone?: string;
  public email?: string;
  public isMain!: boolean;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Branch {
    Branch.init(
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
        address: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        isMain: {
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
        tableName: 'branches',
        timestamps: true,
        underscored: true,
      }
    );
    return Branch;
  }
}
