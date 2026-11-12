import { Model, DataTypes, Sequelize } from 'sequelize';

export interface BusinessAttributes {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  logoUrl?: string;
  timezone: string;
  currency: string;
  defaultLanguage: string;
  settings?: Record<string, any>;
  isActive: boolean;
  trialEndsAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Business extends Model<BusinessAttributes, Partial<BusinessAttributes>> implements BusinessAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public email?: string;
  public phone?: string;
  public address?: string;
  public city?: string;
  public logoUrl?: string;
  public timezone!: string;
  public currency!: string;
  public defaultLanguage!: string;
  public settings?: Record<string, any>;
  public isActive!: boolean;
  public trialEndsAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Business {
    Business.init(
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
        email: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        address: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        logoUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        timezone: {
          type: DataTypes.STRING,
          defaultValue: 'Asia/Tashkent',
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING,
          defaultValue: 'UZS',
          allowNull: false,
        },
        defaultLanguage: {
          type: DataTypes.STRING,
          defaultValue: 'uz',
          allowNull: false,
        },
        settings: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        trialEndsAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'businesses',
        timestamps: true,
        underscored: true,
      }
    );
    return Business;
  }
}
