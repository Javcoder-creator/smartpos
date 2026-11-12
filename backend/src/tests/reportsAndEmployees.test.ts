import request from 'supertest';
import app from '../app';

async function runPhase6Tests() {
  console.log('🧪 Starting Phase 6 (Reports, Analytics & Employee RBAC) Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorDetail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, errorDetail || '');
      failed++;
    }
  }

  try {
    // 1. Authenticate Business Owner
    const email = `boss_${Date.now()}@smartpos.uz`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'SmartPOS Analytics MCHJ',
        firstName: 'Rahbar',
        lastName: 'Boshqaruvchi',
        email,
        phone: `+99890${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: 'Password@123',
      });

    const token = regRes.body.data.tokens.accessToken;
    assert(Boolean(token), '1. Register & authenticate business owner');

    // 2. Fetch System Roles & Permissions
    const rolesRes = await request(app)
      .get('/api/employees/roles')
      .set('Authorization', `Bearer ${token}`);
    const roles = rolesRes.body.data;
    assert(roles.length >= 4, '2. Available system roles retrieved (Admin, Manager, Cashier, etc.)');

    const cashierRole = roles.find((r: any) => r.slug === 'cashier') || roles[0];

    // 3. Create a Cashier Employee
    const cashierEmail = `cashier_${Date.now()}@smartpos.uz`;
    const empRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Jasur',
        lastName: 'Kassirov',
        email: cashierEmail,
        phone: '+998933334455',
        roleId: cashierRole.id,
        password: 'Cashier@123',
      });
    const employee = empRes.body.data;
    assert(employee.firstName === 'Jasur', '3. Cashier employee created with RBAC role');

    // 4. List Employees
    const empListRes = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`);
    assert(empListRes.body.data.length >= 2, '4. Employees list retrieved (Owner + Cashier)');

    // 5. Update Employee Details
    const updateRes = await request(app)
      .put(`/api/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+998939998877' });
    assert(updateRes.body.data.phone === '+998939998877', '5. Employee details updated');

    // 6. Test Reports API: Sales Trend
    const trendRes = await request(app)
      .get('/api/reports/sales-trend')
      .set('Authorization', `Bearer ${token}`)
      .query({ days: 7 });
    assert(Array.isArray(trendRes.body.data), '6. Sales trend report calculated');

    // 7. Test Reports API: Top Products
    const topRes = await request(app)
      .get('/api/reports/top-products')
      .set('Authorization', `Bearer ${token}`);
    assert(Array.isArray(topRes.body.data), '7. Top products report queried');

    // 8. Test Reports API: Sales by Category
    const catRes = await request(app)
      .get('/api/reports/categories')
      .set('Authorization', `Bearer ${token}`);
    assert(Array.isArray(catRes.body.data), '8. Category sales breakdown generated');

    // 9. Test Reports API: Cashier Performance
    const cashierPerfRes = await request(app)
      .get('/api/reports/cashiers')
      .set('Authorization', `Bearer ${token}`);
    assert(Array.isArray(cashierPerfRes.body.data), '9. Cashier performance leaderboard calculated');

    // 10. Test Reports API: Inventory Valuation
    const valRes = await request(app)
      .get('/api/reports/inventory-valuation')
      .set('Authorization', `Bearer ${token}`);
    assert(
      valRes.body.data.totalProductsCount !== undefined &&
        valRes.body.data.potentialProfit !== undefined,
      '10. Inventory valuation report generated (Cost vs Retail values)'
    );

    // 11. Deactivate Employee
    const delRes = await request(app)
      .delete(`/api/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`);
    assert(delRes.body.success === true, '11. Employee deactivated');
  } catch (err: any) {
    console.error('Test execution error:', err.response?.body || err.message);
    failed++;
  }

  console.log(`\n🏁 PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runPhase6Tests();
