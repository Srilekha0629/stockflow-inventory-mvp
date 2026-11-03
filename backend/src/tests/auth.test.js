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
  console.log('🧪 Running StockFlow Authentication Test Suite');
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

  let createdOrgId;
  let createdUserId;
  const uniqueTimestamp = Date.now();
  const testEmail = `founder_${uniqueTimestamp}@stockflow.dev`;
  const rawPassword = 'StrongPassword2026!';
  const testOrgName = `Logistics Co ${uniqueTimestamp}`;

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
    // Test 2: Signup Input Validation Tests
    // ---------------------------------------------------------------------------
    console.log('\n2. Testing Signup Validation (Missing and Invalid Fields) ...');

    // Missing all fields
    const resEmpty = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(resEmpty.status === 400, 'Empty signup body returns HTTP 400');

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
    const decodedSignupJwt = jwt.decode(signupJson.data.token);
    assert(decodedSignupJwt.userId === signupJson.data.user.id, 'JWT payload contains correct userId');
    assert(decodedSignupJwt.organizationId === signupJson.data.user.organizationId, 'JWT payload contains correct organizationId');
    assert(decodedSignupJwt.email === testEmail.toLowerCase(), 'JWT payload contains normalized email');

    createdUserId = signupJson.data.user.id;
    createdOrgId = signupJson.data.user.organizationId;

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
        email: testEmail.toUpperCase(),
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

    const conn = await pool.getConnection();
    let rollbackTriggered = false;

    try {
      await conn.beginTransaction();

      const [ghostOrg] = await conn.execute(
        'INSERT INTO organizations (name) VALUES (?)',
        ['Ghost Org Should Be Rolled Back']
      );

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

    // ---------------------------------------------------------------------------
    // Test 8: Login Input Validation Tests
    // ---------------------------------------------------------------------------
    console.log('\n8. Testing Login Input Validation ...');

    // Missing email and password
    const loginEmptyRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(loginEmptyRes.status === 400, 'Empty login body returns HTTP 400');

    // Missing password
    const loginNoPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    assert(loginNoPassRes.status === 400, 'Missing login password returns HTTP 400');

    // Missing email
    const loginNoEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: rawPassword }),
    });
    assert(loginNoEmailRes.status === 400, 'Missing login email returns HTTP 400');

    // ---------------------------------------------------------------------------
    // Test 9: Login with Non-Existent Email
    // ---------------------------------------------------------------------------
    console.log('\n9. Testing Login with Non-Existent Email ...');
    const loginWrongEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'does_not_exist_99999@stockflow.dev',
        password: rawPassword,
      }),
    });
    const loginWrongEmailJson = await loginWrongEmailRes.json();
    assert(loginWrongEmailRes.status === 401, 'Non-existent email returns HTTP 401 Unauthorized');
    assert(loginWrongEmailJson.success === false, 'Response contains success: false');
    assert(loginWrongEmailJson.message === 'Invalid email or password.', 'Error message is generic to prevent enumeration');

    // ---------------------------------------------------------------------------
    // Test 10: Login with Incorrect Password
    // ---------------------------------------------------------------------------
    console.log('\n10. Testing Login with Incorrect Password ...');
    const loginWrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'IncorrectPassword999!',
      }),
    });
    const loginWrongPassJson = await loginWrongPassRes.json();
    assert(loginWrongPassRes.status === 401, 'Incorrect password returns HTTP 401 Unauthorized');
    assert(loginWrongPassJson.success === false, 'Response contains success: false');
    assert(loginWrongPassJson.message === 'Invalid email or password.', 'Error message is generic');

    // ---------------------------------------------------------------------------
    // Test 11: Successful Login
    // ---------------------------------------------------------------------------
    console.log('\n11. Testing Successful Login ...');
    const loginSuccessRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: rawPassword,
      }),
    });
    const loginSuccessJson = await loginSuccessRes.json();
    assert(loginSuccessRes.status === 200, 'Correct credentials return HTTP 200 OK');
    assert(loginSuccessJson.success === true, 'Response contains success: true');
    assert(typeof loginSuccessJson.data.token === 'string', 'Response contains JWT token string');
    assert(loginSuccessJson.data.user.id === createdUserId, 'User id matches created user');
    assert(loginSuccessJson.data.user.email === testEmail.toLowerCase(), 'Email matches normalized email');
    assert(loginSuccessJson.data.user.organizationId === createdOrgId, 'Organization ID matches created organization');
    assert(loginSuccessJson.data.user.organizationName === testOrgName, 'Organization name matches created organization');
    assert(loginSuccessJson.data.user.password === undefined, 'Password is NEVER exposed in login response');
    assert(loginSuccessJson.data.user.password_hash === undefined, 'Password hash is NEVER exposed');

    // Verify JWT payload from login
    const decodedLoginJwt = jwt.decode(loginSuccessJson.data.token);
    assert(decodedLoginJwt.userId === createdUserId, 'Login JWT contains correct userId');
    assert(decodedLoginJwt.organizationId === createdOrgId, 'Login JWT contains correct organizationId');
    assert(decodedLoginJwt.email === testEmail.toLowerCase(), 'Login JWT contains correct email');

    // ---------------------------------------------------------------------------
    // Test 12: Case-Insensitive Email Login
    // ---------------------------------------------------------------------------
    console.log('\n12. Testing Case-Insensitive Email Login ...');
    const loginCaseRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `   ${testEmail.toUpperCase()}   `,
        password: rawPassword,
      }),
    });
    assert(loginCaseRes.status === 200, 'Uppercase trimmed email logs in successfully');

    // ---------------------------------------------------------------------------
    // Clean up test records
    // ---------------------------------------------------------------------------
    if (createdOrgId) {
      await pool.execute('DELETE FROM organizations WHERE id = ?', [createdOrgId]);
      console.log('\n🧹 Test records cleaned up.');
    }
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
