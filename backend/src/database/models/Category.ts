import { Model, DataTypes, Sequelize } from 'sequelize';

export interface CategoryAttributes {
  id: string;
  businessId: string;
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Category extends Model<CategoryAttributes, Partial<CategoryAttributes>> implements CategoryAttributes {
  public id!: string;
  public businessId!: string;
  public parentId?: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public sortOrder!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Category {
    Category.init(
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
        parentId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'categories', key: 'id' },
          onDelete: 'SET NULL',
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        sortOrder: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'categories',
        timestamps: true,
        underscored: true,
      }
    );
    return Category;
  }
}
