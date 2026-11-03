import http from 'http';
import app from '../app.js';
import { pool, checkDbConnection } from '../config/db.js';
import { registerUserAndOrganization } from '../services/auth.service.js';

let server;
let baseUrl;

async function setupServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
}

async function closeServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Running StockFlow Products & Multi-Tenant Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Check Database connection first
  const dbHealth = await checkDbConnection();
  if (!dbHealth.connected) {
    console.error('❌ Cannot run tests: MySQL connection is unavailable.');
    process.exit(1);
  }

  await setupServer();
  console.log(`✅ Test server running on ${baseUrl}\n`);

  const ts = Date.now();
  let tokenA, tokenB, orgIdA, orgIdB, userA, userB;

  try {
    // ---------------------------------------------------------------------------
    // Step 1: Set up Two Distinct Organizations (Org A and Org B)
    // ---------------------------------------------------------------------------
    console.log('1. Setting up Tenant Org A and Tenant Org B ...');
    const authA = await registerUserAndOrganization({
      name: 'Owner Alpha',
      email: `alpha_${ts}@stockflow.dev`,
      password: 'AlphaPassword123!',
      organizationName: `Alpha Corp ${ts}`,
    });
    tokenA = authA.token;
    orgIdA = authA.user.organizationId;
    userA = authA.user;

    const authB = await registerUserAndOrganization({
      name: 'Owner Beta',
      email: `beta_${ts}@stockflow.dev`,
      password: 'BetaPassword123!',
      organizationName: `Beta LLC ${ts}`,
    });
    tokenB = authB.token;
    orgIdB = authB.user.organizationId;
    userB = authB.user;

    assert(orgIdA !== orgIdB, 'Two separate organizations created with unique IDs');

    // ---------------------------------------------------------------------------
    // Step 2: Unauthenticated Access Rejection
    // ---------------------------------------------------------------------------
    console.log('\n2. Testing Unauthenticated Access Rejection ...');
    const noAuthRes = await fetch(`${baseUrl}/api/products`);
    assert(noAuthRes.status === 401, 'GET /api/products without token returns HTTP 401');

    const fakeTokenRes = await fetch(`${baseUrl}/api/products`, {
      headers: { Authorization: 'Bearer invalid.fake.token' },
    });
    assert(fakeTokenRes.status === 401, 'GET /api/products with invalid token returns HTTP 401');

    // ---------------------------------------------------------------------------
    // Step 3: Product Creation in Org A
    // ---------------------------------------------------------------------------
    console.log('\n3. Creating Products in Org A ...');
    const createRes1 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Industrial Valve X1',
        sku: 'VALVE-001',
        description: 'Heavy duty brass valve',
        quantity: 25,
        cost_price: 45.0,
        selling_price: 75.5,
        low_stock_threshold: 10,
      }),
    });

    const createJson1 = await createRes1.json();
    assert(createRes1.status === 201, 'Product 1 in Org A created (HTTP 201)');
    assert(createJson1.data.sku === 'VALVE-001', 'Created product has correct SKU');
    assert(createJson1.data.organizationId === orgIdA, 'Created product is strictly bound to Org A');
    assert(createJson1.data.isLowStock === false, 'Quantity (25) > threshold (10), so not low stock');

    const prodIdA1 = createJson1.data.id;

    // Create a low-stock product in Org A
    const createRes2 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Steel Flange 2-inch',
        sku: 'FLANGE-002',
        description: 'Stainless steel flange',
        quantity: 3, // <= low stock threshold 5 (default)
        cost_price: 15.0,
        selling_price: 28.0,
        low_stock_threshold: 5,
      }),
    });
    const createJson2 = await createRes2.json();
    assert(createRes2.status === 201, 'Product 2 (low stock) in Org A created');
    assert(createJson2.data.isLowStock === true, 'Quantity (3) <= threshold (5), correctly flagged as low stock');
    const prodIdA2 = createJson2.data.id;

    // ---------------------------------------------------------------------------
    // Step 4: Duplicate SKU inside Same Organization (Conflict)
    // ---------------------------------------------------------------------------
    console.log('\n4. Testing Duplicate SKU in Org A ...');
    const dupSkuRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Valve Attempt',
        sku: 'VALVE-001', // Same SKU in Org A!
        quantity: 10,
      }),
    });
    assert(dupSkuRes.status === 409, 'Duplicate SKU in same org rejected with HTTP 409 Conflict');

    // ---------------------------------------------------------------------------
    // Step 5: Identical SKU in Different Organization (Multi-tenant SKU reuse)
    // ---------------------------------------------------------------------------
    console.log('\n5. Testing Identical SKU in Different Organization (Org B) ...');
    const orgBSkuRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        name: 'Beta Company Valve',
        sku: 'VALVE-001', // Exact same SKU, but for Org B!
        quantity: 100,
        cost_price: 40.0,
        selling_price: 65.0,
        low_stock_threshold: 15,
      }),
    });
    const orgBJson = await orgBSkuRes.json();
    assert(orgBSkuRes.status === 201, 'Identical SKU "VALVE-001" accepted for different tenant (Org B)');
    assert(orgBJson.data.organizationId === orgIdB, 'Product is bound strictly to Org B');
    const prodIdB1 = orgBJson.data.id;

    // ---------------------------------------------------------------------------
    // Step 6: Multi-Tenant Data Isolation (Listing & Access)
    // ---------------------------------------------------------------------------
    console.log('\n6. Verifying Strict Multi-Tenant Data Isolation ...');

    // Org A listing
    const listResA = await fetch(`${baseUrl}/api/products`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listJsonA = await listResA.json();
    assert(listJsonA.data.length === 2, 'Org A sees exactly its 2 products');
    assert(
      listJsonA.data.every((p) => p.organizationId === orgIdA),
      'All products listed for Org A belong to Org A'
    );

    // Org B listing
    const listResB = await fetch(`${baseUrl}/api/products`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const listJsonB = await listResB.json();
    assert(listJsonB.data.length === 1, 'Org B sees exactly its 1 product');
    assert(listJsonB.data[0].organizationId === orgIdB, 'Product listed for Org B belongs to Org B');

    // Tenant Cross-Access Prevention (Org B tries to access Org A product)
    const crossGetRes = await fetch(`${baseUrl}/api/products/${prodIdA1}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossGetRes.status === 404, 'User B cannot view Org A product (HTTP 404 Not Found)');

    // Tenant Cross-Update Prevention
    const crossPutRes = await fetch(`${baseUrl}/api/products/${prodIdA1}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        name: 'Hacked Name',
        sku: 'VALVE-001',
      }),
    });
    assert(crossPutRes.status === 404, 'User B cannot update Org A product (HTTP 404 Not Found)');

    // Tenant Cross-Delete Prevention
    const crossDelRes = await fetch(`${baseUrl}/api/products/${prodIdA1}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossDelRes.status === 404, 'User B cannot delete Org A product (HTTP 404 Not Found)');

    // ---------------------------------------------------------------------------
    // Step 7: Product Update & Validation
    // ---------------------------------------------------------------------------
    console.log('\n7. Testing Product Update and Validation ...');
    const updateRes = await fetch(`${baseUrl}/api/products/${prodIdA1}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Industrial Valve X1-Pro',
        sku: 'VALVE-001-PRO',
        description: 'Updated brass valve',
        quantity: 50,
        cost_price: 50.0,
        selling_price: 89.99,
        low_stock_threshold: 12,
      }),
    });
    const updateJson = await updateRes.json();
    assert(updateRes.status === 200, 'Org A successfully updated its product');
    assert(updateJson.data.name === 'Industrial Valve X1-Pro', 'Updated name persisted');
    assert(updateJson.data.sku === 'VALVE-001-PRO', 'Updated SKU persisted');
    assert(updateJson.data.quantity === 50, 'Updated quantity persisted');

    // ---------------------------------------------------------------------------
    // Step 8: Dashboard Summary Metrics & Low-Stock Calculations
    // ---------------------------------------------------------------------------
    console.log('\n8. Testing Dashboard Calculations & Low Stock Logic ...');
    const summaryRes = await fetch(`${baseUrl}/api/products/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const summaryJson = await summaryRes.json();

    assert(summaryRes.status === 200, 'GET /api/products/summary returns HTTP 200');
    assert(summaryJson.data.totalProducts === 2, 'Dashboard totalProducts count is 2 (50 + 3 units)');
    assert(summaryJson.data.totalQuantity === 53, 'Dashboard totalQuantity on hand is exactly 53 (50 + 3)');
    assert(summaryJson.data.lowStockCount === 1, 'Dashboard lowStockCount is 1');
    assert(
      summaryJson.data.lowStockProducts[0].sku === 'FLANGE-002',
      'Low stock list correctly identifies product with quantity (3) <= threshold (5)'
    );

    // ---------------------------------------------------------------------------
    // Step 9: Product Deletion
    // ---------------------------------------------------------------------------
    console.log('\n9. Testing Product Deletion ...');
    const delRes = await fetch(`${baseUrl}/api/products/${prodIdA2}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(delRes.status === 200, 'Product deleted successfully');

    const verifyDelRes = await fetch(`${baseUrl}/api/products/${prodIdA2}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(verifyDelRes.status === 404, 'Deleted product is no longer accessible');

    // ---------------------------------------------------------------------------
    // Clean up test organizations
    // ---------------------------------------------------------------------------
    await pool.execute('DELETE FROM organizations WHERE id IN (?, ?)', [orgIdA, orgIdB]);
    console.log('\n🧹 Test organizations cleaned up.');
  } finally {
    await closeServer();
    await pool.end();
  }

  console.log('\n====================================================');
  console.log(`Product & Multi-Tenant Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
