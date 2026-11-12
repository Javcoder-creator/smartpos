import request from 'supertest';
import app from '../app';

async function runPhase5Tests() {
  console.log('🧪 Starting Phase 5 (Customer CRM, Loyalty, Expenses & Finance P&L) Tests...\n');
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
    const email = `finance_${Date.now()}@smartpos.uz`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'SmartPOS Finance MCHJ',
        firstName: 'Moliya',
        lastName: 'Mudir',
        email,
        phone: `+99890${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: 'Password@123',
      });

    const token = regRes.body.data.tokens.accessToken;
    assert(Boolean(token), '1. Register & authenticate tenant session');

    // 2. Create Customer in CRM
    const custRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Bobur',
        lastName: 'Mirzayev',
        phone: '+998911112233',
        email: 'bobur@test.uz',
        address: 'Toshkent sh., Yunusobod',
      });
    const customer = custRes.body.data;
    assert(customer.firstName === 'Bobur', '2. Customer profile created in CRM');

    // 3. List Customers
    const custListRes = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .query({ search: 'Bobur' });
    assert(custListRes.body.data.length >= 1, '3. Customer search query executed');

    // 4. Record Expense (e.g. Office Rent = 1,200,000 UZS)
    const expRes = await request(app)
      .post('/api/finance/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryName: 'Ijara',
        amount: 1200000,
        paymentMethod: 'cash',
        description: 'Do‘kon oylik ijarasi',
      });
    const expense = expRes.body.data;
    assert(Number(expense.amount) === 1200000, '4. Expense created (Office Rent: 1.2M UZS)');

    // 5. List Expenses
    const expListRes = await request(app)
      .get('/api/finance/expenses')
      .set('Authorization', `Bearer ${token}`);
    assert(expListRes.body.data.length >= 1, '5. Expenses list retrieved');

    // 6. Record Customer Debt via Sales Checkout
    const branchRes = await request(app)
      .get('/api/branches')
      .set('Authorization', `Bearer ${token}`);
    const branch = branchRes.body.data[0];

    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Smart Watch X',
        sellingPrice: 300000,
        costPrice: 200000,
        unit: 'dona',
        barcode: `SW${Date.now()}`,
      });
    const product = prodRes.body.data;

    // Credit Sale (Total 300,000 UZS; Paid 100,000 UZS; Debt 200,000 UZS)
    const saleRes = await request(app)
      .post('/api/sales/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        branchId: branch.id,
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1, unitPrice: 300000 }],
        payments: [{ method: 'cash', amount: 100000 }],
        notes: 'Nasiya savdo',
      });
    const sale = saleRes.body.data;
    assert(
      Number(sale.debtAmount) === 200000,
      '6. Credit sale executed (200,000 UZS debt tracked)'
    );

    // 7. Verify Customer Debt & Loyalty Points
    const updatedCustRes = await request(app)
      .get(`/api/customers/${customer.id}`)
      .set('Authorization', `Bearer ${token}`);
    const updatedCust = updatedCustRes.body.data;
    assert(
      Number(updatedCust.balance) === 200000 && Number(updatedCust.loyaltyPoints) === 3000,
      '7. Customer balance updated (200k debt) & loyalty points awarded (3k points: 1% of 300k)'
    );

    // 8. Record Customer Debt Repayment
    const repayRes = await request(app)
      .post(`/api/finance/customers/${customer.id}/debt-payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 150000,
        method: 'cash',
        notes: 'Qisman qarz to‘lovi',
      });
    assert(
      Number(repayRes.body.data.remainingDebt) === 50000,
      '8. Debt repayment recorded (200k - 150k = 50k remaining)'
    );

    // 9. Finance Summary (P&L)
    const summaryRes = await request(app)
      .get('/api/finance/summary')
      .set('Authorization', `Bearer ${token}`);
    const summary = summaryRes.body.data;
    assert(
      Number(summary.revenue) === 300000 &&
        Number(summary.cogs) === 200000 &&
        Number(summary.grossProfit) === 100000 &&
        Number(summary.expenses) === 1200000 &&
        Number(summary.customerDebt) === 50000,
      '9. Financial P&L summary calculation (Revenue: 300k, COGS: 200k, Gross Profit: 100k, Expenses: 1.2M, Customer Debt: 50k)',
      summary
    );

    // 10. Delete Expense
    const delRes = await request(app)
      .delete(`/api/finance/expenses/${expense.id}`)
      .set('Authorization', `Bearer ${token}`);
    assert(delRes.body.success === true, '10. Expense deleted successfully');
  } catch (err: any) {
    console.error('Test execution error:', err.response?.body || err.message);
    failed++;
  }

  console.log(`\n🏁 PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runPhase5Tests();
