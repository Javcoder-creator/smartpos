import { Model, DataTypes, Sequelize } from 'sequelize';

export interface AuditLogAttributes {
  id: string;
  businessId?: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AuditLog extends Model<AuditLogAttributes, Partial<AuditLogAttributes>> implements AuditLogAttributes {
  public id!: string;
  public businessId?: string;
  public userId!: string;
  public action!: string;
  public entity!: string;
  public entityId?: string;
  public oldValues?: Record<string, any>;
  public newValues?: Record<string, any>;
  public ipAddress?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof AuditLog {
    AuditLog.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        businessId: {
          type: DataTypes.UUID,
          allowNull: true, // Nullable for super_admin platform actions
          references: { model: 'businesses', key: 'id' },
          onDelete: 'CASCADE',
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
        },
        action: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        entity: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        entityId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        oldValues: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        newValues: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        ipAddress: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        userAgent: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'audit_logs',
        timestamps: true,
        underscored: true,
      }
    );
    return AuditLog;
  }
}
