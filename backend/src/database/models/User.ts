import { Model, DataTypes, Sequelize } from 'sequelize';

export interface UserAttributes {
  id: string;
  businessId?: string;
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  branchId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  avatarUrl?: string;
  language: string;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<UserAttributes, Partial<UserAttributes>> implements UserAttributes {
  public id!: string;
  public businessId?: string;
  public email!: string;
  public phone?: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public roleId!: string;
  public branchId?: string;
  public isActive!: boolean;
  public lastLoginAt?: Date;
  public emailVerifiedAt?: Date;
  public avatarUrl?: string;
  public language!: string;
  public refreshToken?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof User {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        businessId: {
          type: DataTypes.UUID,
          allowNull: true, // Nullable for super_admin
          references: { model: 'businesses', key: 'id' },
          onDelete: 'CASCADE',
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: { isEmail: true },
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        firstName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        lastName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        roleId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'roles', key: 'id' },
        },
        branchId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'branches', key: 'id' },
          onDelete: 'SET NULL',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        lastLoginAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        emailVerifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        avatarUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        language: {
          type: DataTypes.STRING,
          defaultValue: 'uz',
        },
        refreshToken: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,
      }
    );
    return User;
  }
}
