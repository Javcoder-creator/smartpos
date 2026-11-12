import { Model, DataTypes, Sequelize } from 'sequelize';

export interface RoleAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Role extends Model<RoleAttributes, Partial<RoleAttributes>> implements RoleAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public isSystem!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Role {
    Role.init(
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
        description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        isSystem: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: 'roles',
        timestamps: true,
        underscored: true,
      }
    );
    return Role;
  }
}
