import request from 'supertest';
import * as XLSX from 'xlsx';
import app from '../app';

async function runPhase2Tests() {
  console.log('🧪 Starting Phase 2 (Products, Categories, Brands, Branches, Dashboard) Tests...\n');
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
    // 1. Register Tenant A
    const tenantEmail = `p2-tenant-${Date.now()}@test.uz`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'Chilonzor Supermarket',
        firstName: 'Sardor',
        lastName: 'Rahimov',
        email: tenantEmail,
        password: 'Password123!',
      });
    const token = regRes.body.data.tokens.accessToken;
    const businessId = regRes.body.data.business.id;

    // 2. Branch Test: Create second branch
    const branchRes = await request(app)
      .post('/api/branches')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Yunusobod filiali',
        address: 'Amir Temur ko‘chasi 45',
        city: 'Toshkent',
        phone: '+998712001122',
      });
    assert(branchRes.status === 201, 'POST /api/branches creates branch with default warehouse');
    const branchId = branchRes.body.data.id;

    // 3. List branches
    const listBranchesRes = await request(app)
      .get('/api/branches')
      .set('Authorization', `Bearer ${token}`);
    assert(
      listBranchesRes.status === 200 && listBranchesRes.body.data.length >= 2,
      'GET /api/branches returns all branches including auto-created main branch'
    );

    // 4. Category Test: Parent & Subcategory
    const parentCatRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ichimliklar', description: 'Salqin va issiq ichimliklar' });
    assert(parentCatRes.status === 201, 'POST /api/categories creates parent category');
    const parentCatId = parentCatRes.body.data.id;

    const subCatRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Gazli ichimliklar', parentId: parentCatId });
    assert(subCatRes.status === 201, 'POST /api/categories creates subcategory linked to parent');
    const subCatId = subCatRes.body.data.id;

    // 5. Brand Test
    const brandRes = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Coca-Cola' });
    assert(brandRes.status === 201, 'POST /api/brands creates brand');
    const brandId = brandRes.body.data.id;

    // 6. Product Creation with custom barcode
    const testBarcode = '4780001234567';
    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Coca-Cola Classic 1.5L',
        categoryId: subCatId,
        brandId: brandId,
        sku: 'CC-1500',
        barcode: testBarcode,
        purchasePrice: 9500,
        sellingPrice: 14000,
        wholesalePrice: 12500,
        minStockQty: 20,
        unit: 'dona',
      });
    assert(prodRes.status === 201, 'POST /api/products creates product with category, brand & barcode');
    const productId = prodRes.body.data.id;

    // 7. Fast Barcode Scanner Lookup
    const barcodeLookupRes = await request(app)
      .get(`/api/products/barcode/${testBarcode}`)
      .set('Authorization', `Bearer ${token}`);
    assert(
      barcodeLookupRes.status === 200 && barcodeLookupRes.body.data.id === productId,
      'GET /api/products/barcode/:barcode finds correct product instantly'
    );

    // 8. List products with search
    const searchRes = await request(app)
      .get('/api/products?search=Coca')
      .set('Authorization', `Bearer ${token}`);
    assert(
      searchRes.status === 200 && searchRes.body.data.length >= 1,
      'GET /api/products?search=Coca filters products by name query'
    );

    // 9. Excel Export Test
    const exportRes = await request(app)
      .get('/api/products/export/excel')
      .set('Authorization', `Bearer ${token}`)
      .responseType('blob');
    assert(
      exportRes.status === 200 && exportRes.headers['content-type'].includes('spreadsheetml'),
      'GET /api/products/export/excel generates valid XLSX spreadsheet'
    );

    // 10. Excel Import Test: create buffer and import
    const importData = [
      {
        'Mahsulot nomi': 'Fanta Orange 1.5L',
        'SKU': 'FANTA-15',
        'Shtrix-kod': '4780009876543',
        'Xarid narxi (UZS)': 9000,
        'Sotish narxi (UZS)': 13500,
        'O‘lchov birligi': 'dona',
      },
      {
        'Mahsulot nomi': 'Sprite Lemon 1.5L',
        'SKU': 'SPRITE-15',
        'Shtrix-kod': '4780005554443',
        'Xarid narxi (UZS)': 9200,
        'Sotish narxi (UZS)': 13800,
        'O‘lchov birligi': 'dona',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(importData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const importRes = await request(app)
      .post('/api/products/import/excel')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', excelBuffer, 'import.xlsx');

    assert(
      importRes.status === 200 && importRes.body.data.importedCount === 2,
      'POST /api/products/import/excel parses spreadsheet and imports products'
    );

    // 11. Dashboard Stats
    const dashboardRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);
    assert(
      dashboardRes.status === 200 && dashboardRes.body.data.totalProducts >= 3,
      'GET /api/dashboard/stats aggregates real inventory counts'
    );

    // 12. Tenant Isolation Test (Tenant B cannot access Tenant A product by barcode)
    const tenantBRes = await request(app)
      .post('/api/auth/register')
      .send({
        businessName: 'Farhod Bozori Do‘koni',
        firstName: 'Anvar',
        lastName: 'Salimov',
        email: `tenant-b-${Date.now()}@test.uz`,
        password: 'Password123!',
      });
    const tokenB = tenantBRes.body.data.tokens.accessToken;

    const crossLookupRes = await request(app)
      .get(`/api/products/barcode/${testBarcode}`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert(
      crossLookupRes.status === 404,
      'Cross-tenant isolation: Tenant B cannot access Tenant A products by barcode'
    );

    console.log(`\n========================================`);
    console.log(`Phase 2 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
    else process.exit(0);
  } catch (err) {
    console.error('Phase 2 test failed with error:', err);
    process.exit(1);
  }
}

runPhase2Tests();
