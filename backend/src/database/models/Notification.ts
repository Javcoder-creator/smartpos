import { Model, DataTypes, Sequelize } from 'sequelize';

export interface NotificationAttributes {
  id: string;
  businessId: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  readAt?: Date;
  data?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Notification extends Model<NotificationAttributes, Partial<NotificationAttributes>> implements NotificationAttributes {
  public id!: string;
  public businessId!: string;
  public userId?: string;
  public title!: string;
  public message!: string;
  public type!: 'info' | 'warning' | 'error' | 'success';
  public isRead!: boolean;
  public readAt?: Date;
  public data?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Notification {
    Notification.init(
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
        userId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM('info', 'warning', 'error', 'success'),
          defaultValue: 'info',
        },
        isRead: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        readAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        data: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'notifications',
        timestamps: true,
        underscored: true,
      }
    );
    return Notification;
  }
}
