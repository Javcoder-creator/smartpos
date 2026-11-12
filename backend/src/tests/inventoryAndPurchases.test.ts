import request from 'supertest';
import app from '../app';

async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3 (Inventory, Warehouses, Purchases, Suppliers) Tests...\n');
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
    // 1. Register Tenant
    const tenantEmail = `p3-tenant-${Date.now()}@test.uz`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'Chilonzor Savdo Markazi',
        firstName: 'Jamshid',
        lastName: 'Zokirov',
        email: tenantEmail,
        password: 'Password123!',
      });
    const token = regRes.body.data.tokens.accessToken;

    // 2. Fetch default warehouse and branch
    const warehouseListRes = await request(app)
      .get('/api/warehouses')
      .set('Authorization', `Bearer ${token}`);
    assert(warehouseListRes.status === 200 && warehouseListRes.body.data.length >= 1, 'Auto-created warehouse exists');
    const warehouse1 = warehouseListRes.body.data[0];

    // 3. Create second warehouse
    const wh2Res = await request(app)
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Zaxira ombori', branchId: warehouse1.branchId });
    assert(wh2Res.status === 201, 'POST /api/warehouses creates second warehouse');
    const warehouse2 = wh2Res.body.data;

    // 4. Create Supplier
    const supRes = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Toshkent Sanoat Ta’minot MCHJ',
        contactPerson: 'Farhod Akromov',
        phone: '+998901234567',
        balance: 0,
      });
    assert(supRes.status === 201, 'POST /api/suppliers creates supplier');
    const supplier = supRes.body.data;

    // 5. Create Product
    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Pepsi 1.5L',
        purchasePrice: 9000,
        sellingPrice: 13500,
        unit: 'dona',
        minStockQty: 10,
      });
    assert(prodRes.status === 201, 'POST /api/products creates product');
    const product = prodRes.body.data;

    // 6. Create Purchase (Goods arrival invoice)
    const purchaseRes = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supplierId: supplier.id,
        warehouseId: warehouse1.id,
        items: [
          {
            productId: product.id,
            quantity: 100,
            unitPrice: 8800,
          },
        ],
        paidAmount: 300000, // Total: 880,000, Paid: 300,000, Debt: 580,000
        status: 'draft',
      });
    assert(purchaseRes.status === 201, 'POST /api/purchases creates purchase order');
    const purchase = purchaseRes.body.data;

    // 7. Receive Goods (Confirm arrival into warehouse)
    const receiveRes = await request(app)
      .post(`/api/purchases/${purchase.id}/receive`)
      .set('Authorization', `Bearer ${token}`);
    assert(receiveRes.status === 200 && receiveRes.body.data.status === 'received', 'POST /api/purchases/:id/receive confirms arrival');

    // 8. Verify stock balance in warehouse1 is 100
    const balanceRes = await request(app)
      .get(`/api/inventory/balances?warehouseId=${warehouse1.id}`)
      .set('Authorization', `Bearer ${token}`);
    const itemInStock = balanceRes.body.data.find((i: any) => i.product.id === product.id);
    assert(
      balanceRes.status === 200 && itemInStock && itemInStock.currentStock === 100,
      'Warehouse 1 stock increases by 100 upon purchase receive'
    );

    // 9. Verify supplier debt increased by 580,000 UZS
    const supUpdated = await request(app)
      .get(`/api/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${token}`);
    assert(
      supUpdated.status === 200 && Number(supUpdated.body.data.balance) === 580000,
      'Supplier debt balance tracks remaining purchase amount (580,000 UZS)'
    );

    // 10. Transfer 30 items from warehouse1 to warehouse2
    const transferRes = await request(app)
      .post('/api/inventory/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: product.id,
        fromWarehouseId: warehouse1.id,
        toWarehouseId: warehouse2.id,
        quantity: 30,
        notes: 'Zaxira omboriga ko‘chirish',
      });
    assert(transferRes.status === 200, 'POST /api/inventory/transfer moves stock between warehouses');

    // Verify warehouse2 has 30 items
    const wh2Bal = await request(app)
      .get(`/api/inventory/balances?warehouseId=${warehouse2.id}`)
      .set('Authorization', `Bearer ${token}`);
    const wh2Item = wh2Bal.body.data.find((i: any) => i.product.id === product.id);
    assert(wh2Item && wh2Item.currentStock === 30, 'Warehouse 2 stock balance reflects +30 from transfer');

    // 11. Prevent negative stock transfer
    const overTransfer = await request(app)
      .post('/api/inventory/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: product.id,
        fromWarehouseId: warehouse1.id,
        toWarehouseId: warehouse2.id,
        quantity: 99999,
      });
    assert(overTransfer.status === 400, 'Over-transfer beyond available stock is blocked with 400');

    // 12. Stock Write-off (damage/spoilage)
    const writeOffRes = await request(app)
      .post('/api/inventory/write-off')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: product.id,
        warehouseId: warehouse1.id,
        quantity: 5,
        reason: 'Shishasi singan',
      });
    assert(writeOffRes.status === 200, 'POST /api/inventory/write-off decreases stock and records write_off movement');

    // 13. Movement Ledger Audit
    const movementsRes = await request(app)
      .get(`/api/inventory/movements?productId=${product.id}`)
      .set('Authorization', `Bearer ${token}`);
    assert(
      movementsRes.status === 200 && movementsRes.body.data.length >= 4,
      'GET /api/inventory/movements returns auditable stock ledger (purchase_in, transfer_out, transfer_in, write_off)'
    );

    // 14. Record Supplier Payment
    const payRes = await request(app)
      .post(`/api/suppliers/${supplier.id}/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 580000 });
    assert(
      payRes.status === 200 && Number(payRes.body.data.balance) === 0,
      'POST /api/suppliers/:id/payment clears supplier debt balance'
    );

    console.log(`\n========================================`);
    console.log(`Phase 3 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
    else process.exit(0);
  } catch (err) {
    console.error('Phase 3 test fatal error:', err);
    process.exit(1);
  }
}

runPhase3Tests();
