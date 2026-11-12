import request from 'supertest';
import app from '../app';

async function runPhase7Tests() {
  console.log('🧪 Starting Phase 7 (Super Admin Panel & SaaS Subscriptions) Tests...\n');
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
    // 1. Authenticate as Super Admin
    const superLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'super@smartpos.uz',
        password: 'Admin@123',
      });

    const superToken = superLoginRes.body.data.tokens.accessToken;
    assert(Boolean(superToken), '1. Super Admin authentication successful');

    // 2. Get Platform Stats
    const statsRes = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${superToken}`);
    const stats = statsRes.body.data;
    assert(
      stats.totalBusinesses >= 1 && stats.totalUsers >= 1,
      '2. Platform statistics calculated for Super Admin'
    );

    // 3. List All Businesses
    const bizRes = await request(app)
      .get('/api/admin/businesses')
      .set('Authorization', `Bearer ${superToken}`);
    const businesses = bizRes.body.data;
    assert(businesses.length >= 1, '3. All registered tenants listed with subscription & branch metrics');

    const targetBiz = businesses[0];

    // 4. Suspend & Re-activate Business Account
    const suspendRes = await request(app)
      .put(`/api/admin/businesses/${targetBiz.id}/status`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ isActive: false });
    assert(suspendRes.body.data.isActive === false, '4. Business account suspended');

    const activateRes = await request(app)
      .put(`/api/admin/businesses/${targetBiz.id}/status`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ isActive: true });
    assert(activateRes.body.data.isActive === true, '5. Business account re-activated');

    // 5. List Subscription Plans
    const plansRes = await request(app)
      .get('/api/admin/plans')
      .set('Authorization', `Bearer ${superToken}`);
    const plans = plansRes.body.data;
    assert(plans.length >= 4, '6. Pricing plans retrieved (START, BUSINESS, PRO, ENTERPRISE)');

    const proPlan = plans.find((p: any) => p.slug === 'pro') || plans[2];

    // 6. Update Plan Pricing / Quotas
    const updatePlanRes = await request(app)
      .put(`/api/admin/plans/${proPlan.id}`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ monthlyPrice: 550000 });
    assert(Number(updatePlanRes.body.data.monthlyPrice) === 550000, '7. Plan pricing updated by Super Admin');

    // 7. Change Business Subscription
    const changeSubRes = await request(app)
      .put(`/api/admin/businesses/${targetBiz.id}/subscription`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ planId: proPlan.id, months: 3, billingCycle: 'monthly' });
    assert(
      changeSubRes.body.data.planId === proPlan.id && changeSubRes.body.data.status === 'active',
      '8. Tenant subscription upgraded & extended by Super Admin'
    );

    // 8. Register a new tenant to test tenant subscription & RBAC access restrictions
    const tenantEmail = `tenant_${Date.now()}@smartpos.uz`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'Tenant Sub Test MCHJ',
        firstName: 'Tadbirkor',
        lastName: 'Salimov',
        email: tenantEmail,
        phone: `+99890${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: 'Password@123',
      });
    const tenantToken = regRes.body.data.tokens.accessToken;

    // 9. Fetch Tenant Subscription & Resource Quota Usage
    const currentSubRes = await request(app)
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${tenantToken}`);
    assert(
      currentSubRes.body.data.plan !== undefined &&
        currentSubRes.body.data.usage.products !== undefined,
      '9. Tenant subscription and quota usage progress retrieved'
    );

    // 10. Self-service Plan Upgrade by Tenant
    const upgradeRes = await request(app)
      .post('/api/subscriptions/upgrade')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ planId: proPlan.id, billingCycle: 'monthly' });
    assert(
      upgradeRes.body.data.plan.id === proPlan.id,
      '10. Self-service plan upgrade by tenant executed'
    );

    // 11. Security Check: Non-superadmin forbidden from accessing /api/admin
    const forbiddenRes = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${tenantToken}`);
    assert(
      forbiddenRes.status === 403,
      '11. Security check: Regular tenant blocked with 403 Forbidden from Super Admin API'
    );
  } catch (err: any) {
    console.error('Test execution error:', err.response?.body || err.message);
    failed++;
  }

  console.log(`\n🏁 PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runPhase7Tests();
