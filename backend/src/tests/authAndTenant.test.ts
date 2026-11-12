import request from 'supertest';
import app from '../app';
import { sequelize, User, Business, Subscription } from '../database/models';

async function runTests() {
  console.log('🧪 Starting Phase 1 Integration & Tenant Isolation Tests...\n');
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
    // 1. Health check test
    const healthRes = await request(app).get('/api/health');
    assert(healthRes.status === 200 && healthRes.body.success === true, 'GET /api/health returns 200 OK');

    // 2. User registration test (Tenant A)
    const tenantAEmail = `tenant-a-${Date.now()}@test.uz`;
    const regResA = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'Chilonzor Savdo Markazi',
        firstName: 'Bobur',
        lastName: 'Mirzo',
        email: tenantAEmail,
        password: 'Password123!',
        phone: '+998901234567',
      });

    assert(regResA.status === 201, 'Tenant A registration returns 201 Created');
    assert(!!regResA.body.data.tokens.accessToken, 'Tenant A receives accessToken');
    const tokenA = regResA.body.data.tokens.accessToken;
    const businessAId = regResA.body.data.business.id;
    const userAId = regResA.body.data.user.id;

    // 3. User registration test (Tenant B)
    const tenantBEmail = `tenant-b-${Date.now()}@test.uz`;
    const regResB = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'Samarqand Nonlari',
        firstName: 'Ulugbek',
        lastName: 'Samarqandiy',
        email: tenantBEmail,
        password: 'Password123!',
        phone: '+998909876543',
      });

    assert(regResB.status === 201, 'Tenant B registration returns 201 Created');
    const tokenB = regResB.body.data.tokens.accessToken;
    const businessBId = regResB.body.data.business.id;

    // 4. Tenant isolation verification: Business IDs must be distinct
    assert(businessAId !== businessBId, 'Tenant A and Tenant B have separate, isolated business IDs');

    // 5. Duplicate email rejection
    const dupRes = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'Boshqa Do‘kon',
        firstName: 'Ali',
        lastName: 'Valiyev',
        email: tenantAEmail,
        password: 'Password123!',
      });
    assert(dupRes.status === 400, 'Duplicate email registration is rejected with 400 Bad Request');

    // 6. Login with valid credentials
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: tenantAEmail, password: 'Password123!' });
    assert(loginRes.status === 200 && !!loginRes.body.data.tokens.accessToken, 'Login with valid credentials succeeds');

    // 7. Login with invalid password
    const invalidLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: tenantAEmail, password: 'WrongPassword' });
    assert(invalidLoginRes.status === 401, 'Login with wrong password rejected with 401 Unauthorized');

    // 8. Protected route with Tenant A token returns Tenant A data
    const meResA = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(
      meResA.status === 200 && meResA.body.data.businessId === businessAId,
      'Protected /api/auth/me scopes correctly to Tenant A businessId'
    );

    // 9. Protected route with Tenant B token returns Tenant B data
    const meResB = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenB}`);
    assert(
      meResB.status === 200 && meResB.body.data.businessId === businessBId,
      'Protected /api/auth/me scopes correctly to Tenant B businessId'
    );

    // 10. Access without token is denied
    const unauthRes = await request(app).get('/api/auth/me');
    assert(unauthRes.status === 401, 'Accessing protected route without Bearer token returns 401');

    // 11. Super Admin platform access
    const superLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'super@smartpos.uz', password: 'Admin@123' });
    assert(
      superLoginRes.status === 200 && superLoginRes.body.data.user.role === 'super_admin',
      'Super Admin logs in with super_admin platform role'
    );

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution fatal error:', err);
    process.exit(1);
  }
}

runTests();
