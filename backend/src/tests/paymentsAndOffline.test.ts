import request from 'supertest';
import crypto from 'crypto';
import app from '../app';
import { Sale, Branch, CashierShift } from '../database/models';

async function runPhase8Tests() {
  console.log('🧪 Starting Phase 8 (Uzbekistan Payment Gateways & Fiscalization) Tests...\n');
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
    // 1. Authenticate owner to prepare test sale
    const email = `payment_test_${Date.now()}@smartpos.uz`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'SmartPOS To‘lovlar MCHJ',
        firstName: 'Farhod',
        lastName: 'Sobirov',
        email,
        phone: `+99893${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: 'Password@123',
      });

    const token = regRes.body.data.tokens.accessToken;
    const businessId = regRes.body.data.user.businessId;
    const userId = regRes.body.data.user.id;
    assert(Boolean(token), '1. Business owner authentication successful');

    // Find or create branch and sale
    const branch = await Branch.findOne({ where: { businessId } });
    if (!branch) throw new Error('No branch found for business');

    // Create test sale in database directly for webhook testing
    const testSale = await Sale.create({
      businessId,
      branchId: branch.id,
      userId,
      saleNumber: `TEST-SALE-${Date.now()}`,
      status: 'completed',
      subtotal: 100000,
      taxAmount: 12000,
      discountAmount: 0,
      totalAmount: 100000,
      paidAmount: 100000,
      changeAmount: 0,
    });
    assert(Boolean(testSale.id), '2. Test sale order registered for payment gateway processing');

    // 3. Payme - Unknown method check
    const paymeUnknownRes = await request(app)
      .post('/api/webhooks/payments/payme')
      .send({
        id: 1,
        method: 'UnknownMethod',
        params: {},
      });
    assert(
      paymeUnknownRes.body.error?.code === -32601,
      '3. Payme JSON-RPC rejects unknown methods with code -32601'
    );

    // 4. Payme - CheckPerformTransaction with invalid sale ID
    const paymeInvalidSaleRes = await request(app)
      .post('/api/webhooks/payments/payme')
      .send({
        id: 2,
        method: 'CheckPerformTransaction',
        params: {
          amount: 10000000, // 100,000 UZS in tiyin
          account: { order_id: '00000000-0000-0000-0000-000000000000' },
        },
      });
    assert(
      paymeInvalidSaleRes.body.error?.code === -31050,
      '4. Payme CheckPerformTransaction returns error code -31050 when order is not found'
    );

    // 5. Payme - CheckPerformTransaction with wrong amount
    const paymeWrongAmountRes = await request(app)
      .post('/api/webhooks/payments/payme')
      .send({
        id: 3,
        method: 'CheckPerformTransaction',
        params: {
          amount: 5000000, // wrong amount in tiyin
          account: { order_id: testSale.id },
        },
      });
    assert(
      paymeWrongAmountRes.body.error?.code === -31001,
      '5. Payme CheckPerformTransaction rejects mismatched amount with code -31001'
    );

    // 6. Payme - CheckPerformTransaction with valid order and exact amount (100,000 UZS = 10,000,000 tiyin)
    const paymeValidCheckRes = await request(app)
      .post('/api/webhooks/payments/payme')
      .send({
        id: 4,
        method: 'CheckPerformTransaction',
        params: {
          amount: 10000000,
          account: { order_id: testSale.id },
        },
      });
    assert(
      paymeValidCheckRes.body.result?.allow === true,
      '6. Payme CheckPerformTransaction authorizes transaction for valid order & amount'
    );

    // 7. Payme - CreateTransaction & PerformTransaction
    const paymeCreateRes = await request(app)
      .post('/api/webhooks/payments/payme')
      .send({
        id: 5,
        method: 'CreateTransaction',
        params: {
          id: 'payme_trans_123',
          time: Date.now(),
          amount: 10000000,
          account: { order_id: testSale.id },
        },
      });
    assert(
      paymeCreateRes.body.result?.state === 1 && paymeCreateRes.body.result?.transaction === 'payme_trans_123',
      '7. Payme CreateTransaction initializes state = 1'
    );

    const paymePerformRes = await request(app)
      .post('/api/webhooks/payments/payme')
      .send({
        id: 6,
        method: 'PerformTransaction',
        params: {
          id: 'payme_trans_123',
        },
      });
    assert(
      paymePerformRes.body.result?.state === 2,
      '8. Payme PerformTransaction transitions to performed state = 2'
    );

    // 8. Click - Invalid MD5 signature verification
    const clickInvalidRes = await request(app)
      .post('/api/webhooks/payments/click')
      .send({
        click_trans_id: 1001,
        service_id: 500,
        merchant_trans_id: testSale.id,
        amount: 100000,
        action: 0,
        sign_time: '2026-11-13 03:00:00',
        sign_string: 'invalid_md5_hash',
      });
    assert(
      clickInvalidRes.body.error === -1,
      '9. Click webhook strictly rejects invalid MD5 signature with error: -1'
    );

    // 9. Click - Prepare Action (action = 0) with valid MD5 signature
    const secretKey = 'click_test_secret';
    const clickTransId = 889922;
    const serviceId = 12345;
    const signTime = '2026-11-13 03:00:00';
    const amount = 100000;
    const prepareSign = crypto
      .createHash('md5')
      .update(`${clickTransId}${serviceId}${secretKey}${testSale.id}${amount}0${signTime}`)
      .digest('hex');

    const clickPrepareRes = await request(app)
      .post('/api/webhooks/payments/click')
      .send({
        click_trans_id: clickTransId,
        service_id: serviceId,
        merchant_trans_id: testSale.id,
        amount: amount,
        action: 0,
        sign_time: signTime,
        sign_string: prepareSign,
      });
    assert(
      clickPrepareRes.body.error === 0 && clickPrepareRes.body.merchant_prepare_id === clickTransId,
      '10. Click Prepare Action succeeds with error: 0 and returns merchant_prepare_id'
    );

    // 10. Click - Complete Action (action = 1) with valid MD5 signature
    const completeSign = crypto
      .createHash('md5')
      .update(`${clickTransId}${serviceId}${secretKey}${testSale.id}${amount}1${signTime}`)
      .digest('hex');

    const clickCompleteRes = await request(app)
      .post('/api/webhooks/payments/click')
      .send({
        click_trans_id: clickTransId,
        service_id: serviceId,
        merchant_trans_id: testSale.id,
        amount: amount,
        action: 1,
        sign_time: signTime,
        sign_string: completeSign,
      });
    assert(
      clickCompleteRes.body.error === 0 && clickCompleteRes.body.merchant_confirm_id === clickTransId,
      '11. Click Complete Action confirms transaction with error: 0'
    );

    // 11. Soliq OFD Fiscal receipt query endpoint
    const fiscalRes = await request(app).get(`/api/webhooks/payments/fiscal/${testSale.id}`);
    const fiscalData = fiscalRes.body.data;
    assert(
      fiscalRes.body.success === true &&
        fiscalData.fiscalNumber === testSale.saleNumber &&
        fiscalData.total === 10000000 &&
        fiscalData.qrCodeUrl.includes('ofd.soliq.uz'),
      '12. Soliq OFD fiscal receipt generated with QR code, tiyin amounts and legal structure'
    );
  } catch (error) {
    console.error('Fatal error during Phase 8 tests:', error);
    failed++;
  }

  console.log(`\n================================`);
  console.log(`Phase 8 Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
