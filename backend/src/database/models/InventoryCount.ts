import { Model, DataTypes, Sequelize } from 'sequelize';

export interface InventoryCountAttributes {
  id: string;
  businessId: string;
  warehouseId: string;
  userId: string;
  status: 'pending' | 'completed' | 'cancelled';
  countedItems: Record<string, any>;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InventoryCount extends Model<InventoryCountAttributes, Partial<InventoryCountAttributes>> implements InventoryCountAttributes {
  public id!: string;
  public businessId!: string;
  public warehouseId!: string;
  public userId!: string;
  public status!: 'pending' | 'completed' | 'cancelled';
  public countedItems!: Record<string, any>;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof InventoryCount {
    InventoryCount.init(
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
        warehouseId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'warehouses', key: 'id' },
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
        },
        status: {
          type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
          defaultValue: 'pending',
        },
        countedItems: {
          type: DataTypes.JSONB,
          defaultValue: [],
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'inventory_counts',
        timestamps: true,
        underscored: true,
      }
    );
    return InventoryCount;
  }
}
