import { Model, DataTypes, Sequelize } from 'sequelize';

export interface BrandAttributes {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Brand extends Model<BrandAttributes, Partial<BrandAttributes>> implements BrandAttributes {
  public id!: string;
  public businessId!: string;
  public name!: string;
  public slug!: string;
  public logoUrl?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Brand {
    Brand.init(
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
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        logoUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'brands',
        timestamps: true,
        underscored: true,
      }
    );
    return Brand;
  }
}
