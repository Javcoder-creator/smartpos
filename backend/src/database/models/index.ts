import sequelize from '../../config/database';
import { Business } from './Business';
import { SubscriptionPlan } from './SubscriptionPlan';
import { Subscription } from './Subscription';
import { Role } from './Role';
import { Permission } from './Permission';
import { RolePermission } from './RolePermission';
import { User } from './User';
import { Branch } from './Branch';
import { Warehouse } from './Warehouse';
import { Category } from './Category';
import { Brand } from './Brand';
import { Product } from './Product';
import { ProductVariant } from './ProductVariant';
import { Barcode } from './Barcode';
import { CustomerGroup } from './CustomerGroup';
import { Customer } from './Customer';
import { Supplier } from './Supplier';
import { CashRegister } from './CashRegister';
import { CashierShift } from './CashierShift';
import { Sale } from './Sale';
import { SaleItem } from './SaleItem';
import { Payment } from './Payment';
import { Purchase } from './Purchase';
import { PurchaseItem } from './PurchaseItem';
import { StockMovement } from './StockMovement';
import { InventoryCount } from './InventoryCount';
import { Expense } from './Expense';
import { Return } from './Return';
import { ReturnItem } from './ReturnItem';
import { AuditLog } from './AuditLog';
import { Notification } from './Notification';

// 1. Initialize all models
Business.initModel(sequelize);
SubscriptionPlan.initModel(sequelize);
Subscription.initModel(sequelize);
Role.initModel(sequelize);
Permission.initModel(sequelize);
RolePermission.initModel(sequelize);
Branch.initModel(sequelize);
Warehouse.initModel(sequelize);
User.initModel(sequelize);
Category.initModel(sequelize);
Brand.initModel(sequelize);
Product.initModel(sequelize);
ProductVariant.initModel(sequelize);
Barcode.initModel(sequelize);
CustomerGroup.initModel(sequelize);
Customer.initModel(sequelize);
Supplier.initModel(sequelize);
CashRegister.initModel(sequelize);
CashierShift.initModel(sequelize);
Sale.initModel(sequelize);
SaleItem.initModel(sequelize);
Payment.initModel(sequelize);
Purchase.initModel(sequelize);
PurchaseItem.initModel(sequelize);
StockMovement.initModel(sequelize);
InventoryCount.initModel(sequelize);
Expense.initModel(sequelize);
Return.initModel(sequelize);
ReturnItem.initModel(sequelize);
AuditLog.initModel(sequelize);
Notification.initModel(sequelize);

// 2. Define Associations

// Business associations
Business.hasOne(Subscription, { foreignKey: 'businessId', as: 'subscription' });
Subscription.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

SubscriptionPlan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });
Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

Business.hasMany(Branch, { foreignKey: 'businessId', as: 'branches' });
Branch.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Business.hasMany(Warehouse, { foreignKey: 'businessId', as: 'warehouses' });
Warehouse.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Branch.hasMany(Warehouse, { foreignKey: 'branchId', as: 'warehouses' });
Warehouse.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

Business.hasMany(User, { foreignKey: 'businessId', as: 'users' });
User.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Branch.hasMany(User, { foreignKey: 'branchId', as: 'users' });
User.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', as: 'roles' });

// Categories & Brands
Business.hasMany(Category, { foreignKey: 'businessId', as: 'categories' });
Category.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategories' });
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });

Business.hasMany(Brand, { foreignKey: 'businessId', as: 'brands' });
Brand.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

// Products
Business.hasMany(Product, { foreignKey: 'businessId', as: 'products' });
Product.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Brand.hasMany(Product, { foreignKey: 'brandId', as: 'products' });
Product.belongsTo(Brand, { foreignKey: 'brandId', as: 'brand' });

Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.hasMany(Barcode, { foreignKey: 'productId', as: 'barcodes' });
Barcode.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Customers
Business.hasMany(CustomerGroup, { foreignKey: 'businessId', as: 'customerGroups' });
CustomerGroup.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

CustomerGroup.hasMany(Customer, { foreignKey: 'groupId', as: 'customers' });
Customer.belongsTo(CustomerGroup, { foreignKey: 'groupId', as: 'group' });

Business.hasMany(Customer, { foreignKey: 'businessId', as: 'customers' });
Customer.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

// Suppliers
Business.hasMany(Supplier, { foreignKey: 'businessId', as: 'suppliers' });
Supplier.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

// Cash Registers & Shifts
Branch.hasMany(CashRegister, { foreignKey: 'branchId', as: 'cashRegisters' });
CashRegister.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

CashRegister.hasMany(CashierShift, { foreignKey: 'registerId', as: 'shifts' });
CashierShift.belongsTo(CashRegister, { foreignKey: 'registerId', as: 'register' });

User.hasMany(CashierShift, { foreignKey: 'userId', as: 'shifts' });
CashierShift.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sales
Business.hasMany(Sale, { foreignKey: 'businessId', as: 'sales' });
Sale.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Branch.hasMany(Sale, { foreignKey: 'branchId', as: 'sales' });
Sale.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

Customer.hasMany(Sale, { foreignKey: 'customerId', as: 'sales' });
Sale.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Sale, { foreignKey: 'userId', as: 'sales' });
Sale.belongsTo(User, { foreignKey: 'userId', as: 'cashier' });

Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });

Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems' });
SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Sale.hasMany(Payment, { foreignKey: 'saleId', as: 'payments' });
Payment.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });

// Purchases
Business.hasMany(Purchase, { foreignKey: 'businessId', as: 'purchases' });
Purchase.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Supplier.hasMany(Purchase, { foreignKey: 'supplierId', as: 'purchases' });
Purchase.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

Warehouse.hasMany(Purchase, { foreignKey: 'warehouseId', as: 'purchases' });
Purchase.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

Purchase.hasMany(PurchaseItem, { foreignKey: 'purchaseId', as: 'items' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId', as: 'purchase' });

Product.hasMany(PurchaseItem, { foreignKey: 'productId', as: 'purchaseItems' });
PurchaseItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Stock Movements
Product.hasMany(StockMovement, { foreignKey: 'productId', as: 'stockMovements' });
StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Warehouse.hasMany(StockMovement, { foreignKey: 'warehouseId', as: 'stockMovements' });
StockMovement.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// Returns
Sale.hasMany(Return, { foreignKey: 'saleId', as: 'returns' });
Return.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });

Return.hasMany(ReturnItem, { foreignKey: 'returnId', as: 'items' });
ReturnItem.belongsTo(Return, { foreignKey: 'returnId', as: 'return' });

// Expenses
Business.hasMany(Expense, { foreignKey: 'businessId', as: 'expenses' });
Expense.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Branch.hasMany(Expense, { foreignKey: 'branchId', as: 'expenses' });
Expense.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Audit Logs & Notifications
Business.hasMany(AuditLog, { foreignKey: 'businessId', as: 'auditLogs' });
AuditLog.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Business.hasMany(Notification, { foreignKey: 'businessId', as: 'notifications' });
Notification.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

export {
  sequelize,
  Business,
  SubscriptionPlan,
  Subscription,
  Role,
  Permission,
  RolePermission,
  User,
  Branch,
  Warehouse,
  Category,
  Brand,
  Product,
  ProductVariant,
  Barcode,
  CustomerGroup,
  Customer,
  Supplier,
  CashRegister,
  CashierShift,
  Sale,
  SaleItem,
  Payment,
  Purchase,
  PurchaseItem,
  StockMovement,
  InventoryCount,
  Expense,
  Return,
  ReturnItem,
  AuditLog,
  Notification,
};
