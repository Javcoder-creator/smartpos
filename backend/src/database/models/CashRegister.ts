import { Model, DataTypes, Sequelize } from 'sequelize';

export interface CashRegisterAttributes {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CashRegister extends Model<CashRegisterAttributes, Partial<CashRegisterAttributes>> implements CashRegisterAttributes {
  public id!: string;
  public businessId!: string;
  public branchId!: string;
  public name!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof CashRegister {
    CashRegister.init(
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
        branchId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: 'branches', key: 'id' },
          onDelete: 'CASCADE',
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'cash_registers',
        timestamps: true,
        underscored: true,
      }
    );
    return CashRegister;
  }
}
