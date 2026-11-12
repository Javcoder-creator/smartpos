import { Model, DataTypes, Sequelize } from 'sequelize';

export interface SubscriptionPlanAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  maxBranches: number;
  maxCashiers: number;
  maxProducts: number;
  maxWarehouses: number;
  features: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SubscriptionPlan extends Model<SubscriptionPlanAttributes, Partial<SubscriptionPlanAttributes>> implements SubscriptionPlanAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public monthlyPrice!: number;
  public annualPrice!: number;
  public maxBranches!: number;
  public maxCashiers!: number;
  public maxProducts!: number;
  public maxWarehouses!: number;
  public features!: Record<string, any>;
  public isActive!: boolean;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof SubscriptionPlan {
    SubscriptionPlan.init(
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
          type: DataTypes.TEXT,
          allowNull: true,
        },
        monthlyPrice: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        annualPrice: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        maxBranches: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        maxCashiers: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        maxProducts: {
          type: DataTypes.INTEGER,
          defaultValue: 500,
        },
        maxWarehouses: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        features: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        sortOrder: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: 'subscription_plans',
        timestamps: true,
        underscored: true,
      }
    );
    return SubscriptionPlan;
  }
}
