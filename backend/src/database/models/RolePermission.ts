import { Model, DataTypes, Sequelize } from 'sequelize';

export interface RolePermissionAttributes {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RolePermission extends Model<RolePermissionAttributes, Partial<RolePermissionAttributes>> implements RolePermissionAttributes {
  public id!: string;
  public roleId!: string;
  public permissionId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof RolePermission {
    RolePermission.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        roleId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'roles', key: 'id' },
          onDelete: 'CASCADE',
        },
        permissionId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'permissions', key: 'id' },
          onDelete: 'CASCADE',
        },
      },
      {
        sequelize,
        tableName: 'role_permissions',
        timestamps: true,
        underscored: true,
      }
    );
    return RolePermission;
  }
}
