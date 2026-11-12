import { Model, DataTypes, Sequelize } from 'sequelize';

export interface SubscriptionAttributes {
  id: string;
  businessId: string;
  planId: string;
  status: 'trial' | 'active' | 'expired' | 'suspended' | 'cancelled';
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date;
  amount: number;
  billingCycle: 'monthly' | 'annual';
  autoRenew: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Subscription extends Model<SubscriptionAttributes, Partial<SubscriptionAttributes>> implements SubscriptionAttributes {
  public id!: string;
  public businessId!: string;
  public planId!: string;
  public status!: 'trial' | 'active' | 'expired' | 'suspended' | 'cancelled';
  public startDate!: Date;
  public endDate!: Date;
  public trialEndDate?: Date;
  public amount!: number;
  public billingCycle!: 'monthly' | 'annual';
  public autoRenew!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Subscription {
    Subscription.init(
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
        planId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'subscription_plans', key: 'id' },
        },
        status: {
          type: DataTypes.ENUM('trial', 'active', 'expired', 'suspended', 'cancelled'),
          defaultValue: 'trial',
        },
        startDate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        endDate: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        trialEndDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        amount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0,
        },
        billingCycle: {
          type: DataTypes.ENUM('monthly', 'annual'),
          defaultValue: 'monthly',
        },
        autoRenew: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'subscriptions',
        timestamps: true,
        underscored: true,
      }
    );
    return Subscription;
  }
}
