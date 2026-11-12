import request from 'supertest';
import app from '../app';

async function runPhase4Tests() {
  console.log('🧪 Starting Phase 4 (POS, Sales & Shifts) Tests...\n');
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
    const email = `cashier_${Date.now()}@smartpos.uz`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'SmartPOS Kassa Test MCHJ',
        firstName: 'Kassir',
        lastName: 'Ali',
        email,
        phone: `+99890${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: 'Password@123',
      });

    const token = regRes.body.data.tokens.accessToken;
    assert(Boolean(token), '1. Register & authenticate tenant session');

    // 2. Fetch Branches & Warehouses
    const branchRes = await request(app)
      .get('/api/branches')
      .set('Authorization', `Bearer ${token}`);
    const branch = branchRes.body.data[0];
    assert(Boolean(branch), '2. Branch resolved for POS register');

    const whRes = await request(app)
      .get('/api/warehouses')
      .set('Authorization', `Bearer ${token}`);
    const warehouse = whRes.body.data[0];
    assert(Boolean(warehouse), '3. Warehouse resolved for stock operations');

    // 3. Create a test product
    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Coca Cola 1.5L',
        sellingPrice: 15000,
        costPrice: 10000,
        unit: 'dona',
        barcode: `COL${Date.now()}`,
      });
    const product = prodRes.body.data;
    assert(product.sellingPrice == 15000, '4. Product created for checkout');

    // Add initial stock (50 units)
    await request(app)
      .post('/api/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({
        warehouseId: warehouse.id,
        productId: product.id,
        newQuantity: 50,
        reason: 'Boshlang‘ich qoldiq kassa testi uchun',
      });

    // 4. Open Cashier Shift
    const shiftOpenRes = await request(app)
      .post('/api/shifts/open')
      .set('Authorization', `Bearer ${token}`)
      .send({
        branchId: branch.id,
        openingBalance: 100000,
        notes: 'Ertalabki smena',
      });
    const shift = shiftOpenRes.body.data;
    assert(
      shift.status === 'open' && Number(shift.openingBalance) === 100000,
      '5. Cashier shift opened (100,000 UZS opening cash)'
    );

    // 5. Get Current Shift
    const currentShiftRes = await request(app)
      .get('/api/shifts/current')
      .set('Authorization', `Bearer ${token}`);
    assert(currentShiftRes.body.data.id === shift.id, '6. Active shift retrieved');

    // 6. Cash Checkout (Buy 2 units = 30,000 UZS, pay 50,000 UZS cash, change 20,000 UZS)
    const checkout1Res = await request(app)
      .post('/api/sales/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        branchId: branch.id,
        warehouseId: warehouse.id,
        shiftId: shift.id,
        items: [{ productId: product.id, quantity: 2, unitPrice: 15000 }],
        payments: [{ method: 'cash', amount: 50000 }],
        notes: 'Naqd to‘lov cheki',
      });
    const sale1 = checkout1Res.body.data;
    assert(
      Number(sale1.totalAmount) === 30000 &&
        Number(sale1.changeAmount) === 20000 &&
        Number(sale1.paidAmount) === 30000,
      '7. Cash sale checkout with change calculation (30k total, 20k change)'
    );

    // 7. Verify stock deduction
    const balanceRes = await request(app)
      .get('/api/inventory/balances')
      .set('Authorization', `Bearer ${token}`)
      .query({ warehouseId: warehouse.id, search: 'Coca Cola' });
    const balanceItem = balanceRes.body.data[0];
    assert(
      Number(balanceItem.currentStock) === 48,
      '8. Stock automatically decremented from 50 to 48'
    );

    // 8. Split Payment Checkout (Buy 2 units = 30,000 UZS; Pay 10,000 Cash + 20,000 Card)
    const checkout2Res = await request(app)
      .post('/api/sales/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        branchId: branch.id,
        warehouseId: warehouse.id,
        shiftId: shift.id,
        items: [{ productId: product.id, quantity: 2, unitPrice: 15000 }],
        payments: [
          { method: 'cash', amount: 10000 },
          { method: 'card', amount: 20000 },
        ],
        notes: 'Split payment cheki',
      });
    const sale2 = checkout2Res.body.data;
    assert(
      Number(sale2.totalAmount) === 30000 && sale2.payments.length === 2,
      '9. Split payment checkout (10k cash + 20k card)'
    );

    // 9. Hold Sale & Resume
    const holdRes = await request(app)
      .post('/api/sales/hold')
      .set('Authorization', `Bearer ${token}`)
      .send({
        branchId: branch.id,
        items: [{ productId: product.id, quantity: 5, unitPrice: 15000 }],
        notes: 'Kutayotgan xaridor',
      });
    const heldSale = holdRes.body.data;
    assert(heldSale.status === 'held', '10. Sale held successfully');

    const heldListRes = await request(app)
      .get('/api/sales/held')
      .set('Authorization', `Bearer ${token}`);
    assert(heldListRes.body.data.length >= 1, '11. Held sales list retrieved');

    const resumeRes = await request(app)
      .post(`/api/sales/${heldSale.id}/resume`)
      .set('Authorization', `Bearer ${token}`);
    assert(resumeRes.body.data.id === heldSale.id, '12. Held sale resumed into cart');

    // 10. Return / Refund on Sale 1
    const returnRes = await request(app)
      .post(`/api/sales/${sale1.id}/return`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ itemId: sale1.items[0].id, quantity: 1 }],
        reason: 'Yaroqlilik muddati xato',
      });
    assert(returnRes.body.data.status === 'completed', '13. Return and refund processed');

    // Stock after return: 48 - 2 + 1 = 47
    const balanceAfterReturn = await request(app)
      .get('/api/inventory/balances')
      .set('Authorization', `Bearer ${token}`)
      .query({ warehouseId: warehouse.id, search: 'Coca Cola' });
    assert(
      Number(balanceAfterReturn.body.data[0].currentStock) === 47,
      '14. Stock restored via return_in (+1 item back in stock)'
    );

    // 11. Shift Summary
    const summaryRes = await request(app)
      .get(`/api/shifts/${shift.id}/summary`)
      .set('Authorization', `Bearer ${token}`);
    const summary = summaryRes.body.data.summary;
    assert(
      summary.salesCount >= 2 && summary.expectedCashInDrawer > 100000,
      '15. Shift summary aggregates cash & card sales'
    );

    // 12. Close Shift with Cash Reconciliation
    const closeRes = await request(app)
      .post(`/api/shifts/${shift.id}/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        closingBalance: summary.expectedCashInDrawer,
        notes: 'Kun yakuni tekshirildi',
      });
    assert(
      closeRes.body.data.shift.status === 'closed',
      '16. Shift closed with cash reconciliation'
    );

    // 13. Sales History List
    const salesListRes = await request(app)
      .get('/api/sales')
      .set('Authorization', `Bearer ${token}`);
    assert(salesListRes.body.data.length >= 2, '17. Sales history list queried with pagination');
  } catch (err: any) {
    console.error('Test execution error:', err.response?.body || err.message);
    failed++;
  }

  console.log(`\n🏁 PHASE 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runPhase4Tests();
