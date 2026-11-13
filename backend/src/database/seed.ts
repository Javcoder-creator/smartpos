import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  sequelize,
  Role,
  Permission,
  RolePermission,
  SubscriptionPlan,
  User,
} from './models';

export async function runSeeds() {
  console.log('🌱 Starting database seeding...');
  await sequelize.sync({ alter: true });
  console.log('✅ Database models synchronized');

  // 1. Roles
  const rolesData = [
    { name: 'Super Admin', slug: 'super_admin', description: 'Platform Administrator', isSystem: true },
    { name: 'Business Owner', slug: 'business_owner', description: 'Tenant Owner with full access', isSystem: true },
    { name: 'Administrator', slug: 'administrator', description: 'Store Administrator', isSystem: true },
    { name: 'Manager', slug: 'manager', description: 'Branch / Store Manager', isSystem: true },
    { name: 'Cashier', slug: 'cashier', description: 'POS Operator & Cashier', isSystem: true },
    { name: 'Warehouse Manager', slug: 'warehouse_manager', description: 'Stock & Warehouse Manager', isSystem: true },
    { name: 'Accountant', slug: 'accountant', description: 'Financial & Reports Specialist', isSystem: true },
  ];

  const roleMap = new Map<string, Role>();
  for (const r of rolesData) {
    const [role] = await Role.findOrCreate({
      where: { slug: r.slug },
      defaults: { id: uuidv4(), ...r },
    });
    roleMap.set(r.slug, role);
  }
  console.log('✅ Roles seeded');

  // 2. Permissions
  const permissionsData = [
    // Products
    { name: 'View Products', slug: 'products.read', module: 'products' },
    { name: 'Create Products', slug: 'products.create', module: 'products' },
    { name: 'Update Products', slug: 'products.update', module: 'products' },
    { name: 'Delete Products', slug: 'products.delete', module: 'products' },
    // Sales
    { name: 'View Sales', slug: 'sales.read', module: 'sales' },
    { name: 'Create Sales', slug: 'sales.create', module: 'sales' },
    { name: 'Cancel Sales', slug: 'sales.cancel', module: 'sales' },
    { name: 'Return Sales', slug: 'sales.return', module: 'sales' },
    // Inventory
    { name: 'View Inventory', slug: 'inventory.read', module: 'inventory' },
    { name: 'Adjust Inventory', slug: 'inventory.adjust', module: 'inventory' },
    { name: 'Transfer Inventory', slug: 'inventory.transfer', module: 'inventory' },
    { name: 'Count Inventory', slug: 'inventory.count', module: 'inventory' },
    // Purchases
    { name: 'View Purchases', slug: 'purchases.read', module: 'purchases' },
    { name: 'Create Purchases', slug: 'purchases.create', module: 'purchases' },
    { name: 'Update Purchases', slug: 'purchases.update', module: 'purchases' },
    { name: 'Delete Purchases', slug: 'purchases.delete', module: 'purchases' },
    // Customers
    { name: 'View Customers', slug: 'customers.read', module: 'customers' },
    { name: 'Create Customers', slug: 'customers.create', module: 'customers' },
    { name: 'Update Customers', slug: 'customers.update', module: 'customers' },
    { name: 'Delete Customers', slug: 'customers.delete', module: 'customers' },
    // Suppliers
    { name: 'View Suppliers', slug: 'suppliers.read', module: 'suppliers' },
    { name: 'Create Suppliers', slug: 'suppliers.create', module: 'suppliers' },
    { name: 'Update Suppliers', slug: 'suppliers.update', module: 'suppliers' },
    { name: 'Delete Suppliers', slug: 'suppliers.delete', module: 'suppliers' },
    // Finance
    { name: 'View Finance', slug: 'finance.read', module: 'finance' },
    { name: 'Manage Finance', slug: 'finance.manage', module: 'finance' },
    // Reports
    { name: 'View Reports', slug: 'reports.read', module: 'reports' },
    { name: 'Export Reports', slug: 'reports.export', module: 'reports' },
    // Employees
    { name: 'View Employees', slug: 'employees.read', module: 'employees' },
    { name: 'Create Employees', slug: 'employees.create', module: 'employees' },
    { name: 'Update Employees', slug: 'employees.update', module: 'employees' },
    { name: 'Delete Employees', slug: 'employees.delete', module: 'employees' },
    // Settings
    { name: 'View Settings', slug: 'settings.read', module: 'settings' },
    { name: 'Update Settings', slug: 'settings.update', module: 'settings' },
  ];

  const permissionList: Permission[] = [];
  for (const p of permissionsData) {
    const [perm] = await Permission.findOrCreate({
      where: { slug: p.slug },
      defaults: { id: uuidv4(), ...p },
    });
    permissionList.push(perm);
  }
  console.log('✅ Permissions seeded');

  // 3. Role Permissions mapping
  const ownerRole = roleMap.get('business_owner');
  const cashierRole = roleMap.get('cashier');
  const warehouseRole = roleMap.get('warehouse_manager');
  const accountantRole = roleMap.get('accountant');
  const superAdminRole = roleMap.get('super_admin');

  // Super admin and business owner get all permissions
  for (const perm of permissionList) {
    if (superAdminRole) {
      await RolePermission.findOrCreate({
        where: { roleId: superAdminRole.id, permissionId: perm.id },
        defaults: { id: uuidv4(), roleId: superAdminRole.id, permissionId: perm.id },
      });
    }
    if (ownerRole) {
      await RolePermission.findOrCreate({
        where: { roleId: ownerRole.id, permissionId: perm.id },
        defaults: { id: uuidv4(), roleId: ownerRole.id, permissionId: perm.id },
      });
    }
  }

  // Cashier permissions
  const cashierPermSlugs = ['products.read', 'sales.read', 'sales.create', 'sales.return', 'customers.read', 'customers.create'];
  for (const perm of permissionList.filter(p => cashierPermSlugs.includes(p.slug))) {
    if (cashierRole) {
      await RolePermission.findOrCreate({
        where: { roleId: cashierRole.id, permissionId: perm.id },
        defaults: { id: uuidv4(), roleId: cashierRole.id, permissionId: perm.id },
      });
    }
  }

  // Warehouse manager permissions
  const warehousePermSlugs = ['products.read', 'products.create', 'products.update', 'inventory.read', 'inventory.adjust', 'inventory.transfer', 'inventory.count', 'purchases.read', 'purchases.create', 'suppliers.read'];
  for (const perm of permissionList.filter(p => warehousePermSlugs.includes(p.slug))) {
    if (warehouseRole) {
      await RolePermission.findOrCreate({
        where: { roleId: warehouseRole.id, permissionId: perm.id },
        defaults: { id: uuidv4(), roleId: warehouseRole.id, permissionId: perm.id },
      });
    }
  }

  // Accountant permissions
  const accountantPermSlugs = ['finance.read', 'finance.manage', 'reports.read', 'reports.export', 'sales.read', 'purchases.read'];
  for (const perm of permissionList.filter(p => accountantPermSlugs.includes(p.slug))) {
    if (accountantRole) {
      await RolePermission.findOrCreate({
        where: { roleId: accountantRole.id, permissionId: perm.id },
        defaults: { id: uuidv4(), roleId: accountantRole.id, permissionId: perm.id },
      });
    }
  }
  console.log('✅ Role permissions mapped');

  // 4. Subscription Plans
  const plans = [
    {
      name: 'START',
      slug: 'start',
      description: 'Kichik do‘konlar va yakka tartibdagi tadbirkorlar uchun',
      monthlyPrice: 150000,
      annualPrice: 1500000,
      maxBranches: 1,
      maxCashiers: 1,
      maxProducts: 1000,
      maxWarehouses: 1,
      features: { pos: true, basicReports: true, barcodeScanner: true },
      sortOrder: 1,
    },
    {
      name: 'BUSINESS',
      slug: 'business',
      description: 'Rivojlanayotgan do‘konlar va supermarketlar uchun',
      monthlyPrice: 350000,
      annualPrice: 3500000,
      maxBranches: 3,
      maxCashiers: 5,
      maxProducts: 5000,
      maxWarehouses: 3,
      features: { pos: true, advancedReports: true, inventoryManagement: true, crm: true },
      sortOrder: 2,
    },
    {
      name: 'PRO',
      slug: 'pro',
      description: 'Tarmoq do‘konlari va yirik savdo markazlari uchun',
      monthlyPrice: 750000,
      annualPrice: 7500000,
      maxBranches: 10,
      maxCashiers: 20,
      maxProducts: 20000,
      maxWarehouses: 10,
      features: { pos: true, fullAnalytics: true, employeeTracking: true, multiWarehouse: true, apiAccess: true },
      sortOrder: 3,
    },
    {
      name: 'ENTERPRISE',
      slug: 'enterprise',
      description: 'Katta korxonalar va individual talablar uchun',
      monthlyPrice: 1500000,
      annualPrice: 15000000,
      maxBranches: 100,
      maxCashiers: 200,
      maxProducts: 100000,
      maxWarehouses: 50,
      features: { unlimited: true, dedicatedSupport: true, customIntegrations: true },
      sortOrder: 4,
    },
  ];

  for (const pl of plans) {
    await SubscriptionPlan.findOrCreate({
      where: { slug: pl.slug },
      defaults: { id: uuidv4(), ...pl },
    });
  }
  console.log('✅ Subscription plans seeded');

  // 5. Super Admin user
  if (superAdminRole) {
    const existingSuper = await User.findOne({ where: { email: 'super@smartpos.uz' } });
    if (!existingSuper) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await User.create({
        id: uuidv4(),
        email: 'super@smartpos.uz',
        phone: '+998901234567',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: superAdminRole.id,
        isActive: true,
        language: 'uz',
        emailVerifiedAt: new Date(),
      });
      console.log('✅ Super admin user created: super@smartpos.uz / Admin@123');
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding error:', err);
      process.exit(1);
    });
}
