import { Model, DataTypes, Sequelize } from 'sequelize';

export interface PermissionAttributes {
  id: string;
  name: string;
  slug: string;
  module: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Permission extends Model<PermissionAttributes, Partial<PermissionAttributes>> implements PermissionAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public module!: string;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Permission {
    Permission.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        module: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'permissions',
        timestamps: true,
        underscored: true,
      }
    );
    return Permission;
  }
}
