import http from 'http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { pool, checkDbConnection } from '../config/db.js';

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
  console.log('🧪 Running Milestone 2 Signup & Organization Tests');
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
    console.error(`   Details: ${dbHealth.message}`);
    process.exit(1);
  }
  console.log('✅ MySQL connection verified.');

  await setupServer();
  console.log(`✅ Test server listening on ${baseUrl}\n`);

  try {
    // ---------------------------------------------------------------------------
    // Test 1: Health endpoint check
    // ---------------------------------------------------------------------------
    console.log('1. Testing GET /api/health ...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'GET /api/health returns HTTP 200');
    assert(healthJson.status === 'ok', 'Health status is "ok"');
    assert(healthJson.database.status === 'connected', 'Database status reports "connected"');

    // ---------------------------------------------------------------------------
    // Test 2: Input Validation Tests
    // ---------------------------------------------------------------------------
    console.log('\n2. Testing Validation (Missing and Invalid Fields) ...');

    // Missing all fields
    const resEmpty = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(resEmpty.status === 400, 'Empty body returns HTTP 400');

    // Missing password
    const resNoPass = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'jane@example.com',
        organizationName: 'Acme Corp',
      }),
    });
    assert(resNoPass.status === 400, 'Missing password returns HTTP 400');

    // Short password (< 8 chars)
    const resShortPass = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
        organizationName: 'Acme Corp',
      }),
    });
    assert(resShortPass.status === 400, 'Password under 8 characters returns HTTP 400');

    // Invalid email format
    const resInvalidEmail = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'not-an-email',
        password: 'validPassword123',
        organizationName: 'Acme Corp',
      }),
    });
    assert(resInvalidEmail.status === 400, 'Invalid email format returns HTTP 400');

    // Short name (< 2 chars)
    const resShortName = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'J',
        email: 'jane@example.com',
        password: 'validPassword123',
        organizationName: 'Acme Corp',
      }),
    });
    assert(resShortName.status === 400, 'Name shorter than 2 chars returns HTTP 400');

    // ---------------------------------------------------------------------------
    // Test 3: Successful Signup (Organization + User + JWT)
    // ---------------------------------------------------------------------------
    console.log('\n3. Testing Successful Signup ...');
    const uniqueTimestamp = Date.now();
    const testEmail = `founder_${uniqueTimestamp}@stockflow.dev`;
    const rawPassword = 'StrongPassword2026!';
    const testOrgName = `Logistics Co ${uniqueTimestamp}`;

    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '   Alex Founder   ',
        email: `  ${testEmail}  `,
        password: rawPassword,
        organizationName: `   ${testOrgName}   `,
      }),
    });

    const signupJson = await signupRes.json();
    assert(signupRes.status === 201, 'Successful registration returns HTTP 201');
    assert(signupJson.success === true, 'Response contains success: true');
    assert(typeof signupJson.data.token === 'string', 'Response contains JWT token string');
    assert(signupJson.data.user.name === 'Alex Founder', 'Name is trimmed in response');
    assert(signupJson.data.user.email === testEmail.toLowerCase(), 'Email is normalized and trimmed');
    assert(signupJson.data.user.organizationName === testOrgName, 'Organization name is trimmed');
    assert(signupJson.data.user.password === undefined, 'Password is NEVER returned in response');
    assert(signupJson.data.user.password_hash === undefined, 'Password hash is NEVER returned in response');

    // Verify JWT payload
    const decoded = jwt.decode(signupJson.data.token);
    assert(decoded.userId === signupJson.data.user.id, 'JWT payload contains correct userId');
    assert(decoded.organizationId === signupJson.data.user.organizationId, 'JWT payload contains correct organizationId');
    assert(decoded.email === testEmail.toLowerCase(), 'JWT payload contains normalized email');

    const createdUserId = signupJson.data.user.id;
    const createdOrgId = signupJson.data.user.organizationId;

    // ---------------------------------------------------------------------------
    // Test 4: Database Persistence Verification
    // ---------------------------------------------------------------------------
    console.log('\n4. Verifying Persistence in MySQL Database ...');
    const [userRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [createdUserId]);
    assert(userRows.length === 1, 'User row found in MySQL users table');
    assert(userRows[0].email === testEmail.toLowerCase(), 'User email matches normalized email in MySQL');
    assert(userRows[0].organization_id === createdOrgId, 'User references correct organization_id');

    const [orgRows] = await pool.execute('SELECT * FROM organizations WHERE id = ?', [createdOrgId]);
    assert(orgRows.length === 1, 'Organization row found in MySQL organizations table');
    assert(orgRows[0].name === testOrgName, 'Organization name matches in MySQL');

    // ---------------------------------------------------------------------------
    // Test 5: Password Hashing Verification
    // ---------------------------------------------------------------------------
    console.log('\n5. Verifying Password Hashing in MySQL ...');
    const storedHash = userRows[0].password;
    assert(storedHash !== rawPassword, 'Stored password is NOT stored in plaintext');
    assert(storedHash.startsWith('$2'), 'Stored password is a valid bcrypt hash format');
    const isBcryptMatch = await bcrypt.compare(rawPassword, storedHash);
    assert(isBcryptMatch === true, 'Stored bcrypt hash verifies against original plaintext password');

    // ---------------------------------------------------------------------------
    // Test 6: Duplicate Email Registration
    // ---------------------------------------------------------------------------
    console.log('\n6. Testing Duplicate Email Handling ...');
    const dupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Person',
        email: testEmail.toUpperCase(), // Test case insensitivity
        password: 'AnotherPassword123!',
        organizationName: 'Another Org',
      }),
    });

    const dupJson = await dupRes.json();
    assert(dupRes.status === 409, 'Duplicate email returns HTTP 409 Conflict');
    assert(dupJson.success === false, 'Duplicate response has success: false');

    // ---------------------------------------------------------------------------
    // Test 7: Transaction Rollback Verification
    // ---------------------------------------------------------------------------
    console.log('\n7. Verifying Atomic Transaction Rollback on Failure ...');
    const [orgsBefore] = await pool.execute('SELECT COUNT(*) as count FROM organizations');
    const orgCountBefore = orgsBefore[0].count;

    // Simulate an atomic transaction failure:
    // Create an organization, then fail user insert by violating duplicate email constraint
    const conn = await pool.getConnection();
    let rollbackTriggered = false;

    try {
      await conn.beginTransaction();

      // 1. Insert an organization inside the transaction
      const [ghostOrg] = await conn.execute(
        'INSERT INTO organizations (name) VALUES (?)',
        ['Ghost Org Should Be Rolled Back']
      );

      // 2. Deliberately attempt to insert a user with duplicate email to trigger failure
      await conn.execute(
        'INSERT INTO users (organization_id, name, email, password) VALUES (?, ?, ?, ?)',
        [ghostOrg.insertId, 'Ghost User', testEmail, 'hashedPassword']
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      rollbackTriggered = true;
    } finally {
      conn.release();
    }

    const [orgsAfter] = await pool.execute('SELECT COUNT(*) as count FROM organizations');
    const orgCountAfter = orgsAfter[0].count;

    assert(rollbackTriggered === true, 'Transaction failure was successfully caught');
    assert(
      orgCountAfter === orgCountBefore,
      'Organization count unchanged: Ghost organization was rolled back cleanly'
    );

    // Clean up test records
    await pool.execute('DELETE FROM organizations WHERE id = ?', [createdOrgId]);
    console.log('\n🧹 Test records cleaned up.');
  } finally {
    await closeServer();
    await pool.end();
  }

  console.log('\n====================================================');
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
