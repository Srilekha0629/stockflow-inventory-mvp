import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

/**
 * Registers an organization and its primary user in a single atomic MySQL transaction.
 *
 * @param {Object} params
 * @param {string} params.name - User's full name
 * @param {string} params.email - User's email
 * @param {string} params.password - Plaintext password (to be hashed)
 * @param {string} params.organizationName - Name of the new organization
 * @returns {Promise<Object>} Safe user details and generated JWT token
 */
export async function registerUserAndOrganization({
  name,
  email,
  password,
  organizationName,
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  const trimmedOrg = organizationName.trim();

  // Obtain a dedicated connection from the pool for the transaction
  const connection = await pool.getConnection();

  try {
    // 1. Begin atomic MySQL transaction
    await connection.beginTransaction();

    // 2. Check if a user with this email already exists within the transaction
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? FOR UPDATE',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      const conflictError = new Error('An account with this email address already exists.');
      conflictError.status = 409;
      throw conflictError;
    }

    // 3. Hash password securely with bcryptjs (salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create Organization (tenant entity)
    const [orgResult] = await connection.execute(
      'INSERT INTO organizations (name) VALUES (?)',
      [trimmedOrg]
    );
    const organizationId = orgResult.insertId;

    // 5. Create Primary User associated with the newly created organization
    const [userResult] = await connection.execute(
      'INSERT INTO users (organization_id, name, email, password) VALUES (?, ?, ?, ?)',
      [organizationId, trimmedName, normalizedEmail, hashedPassword]
    );
    const userId = userResult.insertId;

    // 6. Commit the transaction atomically
    await connection.commit();

    // 7. Sign JWT containing user ID and organization ID
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.warn('⚠️  JWT_SECRET is not set in environment variables! Using fallback development secret.');
    }

    const token = jwt.sign(
      {
        userId,
        organizationId,
        email: normalizedEmail,
      },
      jwtSecret || 'stockflow_dev_secret_key_2026',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      }
    );

    // 8. Return safe user & organization details (NEVER include password or hash)
    return {
      token,
      user: {
        id: userId,
        name: trimmedName,
        email: normalizedEmail,
        organizationId,
        organizationName: trimmedOrg,
      },
    };
  } catch (error) {
    // Roll back all changes if any query or step fails
    await connection.rollback();

    // Map MySQL unique constraint violation (code 1062 / ER_DUP_ENTRY) to 409 Conflict
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      const conflictError = new Error('An account with this email address already exists.');
      conflictError.status = 409;
      throw conflictError;
    }

    throw error;
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
}

/**
 * Authenticates a user by email and password without modifying or creating organizations.
 *
 * @param {Object} params
 * @param {string} params.email - User's email address
 * @param {string} params.password - Plaintext password to verify
 * @returns {Promise<Object>} Safe user details and generated JWT token
 */
export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Fetch user joined with organization details
  const [users] = await pool.execute(
    `SELECT u.id, u.organization_id, u.name, u.email, u.password, o.name AS organization_name
     FROM users u
     JOIN organizations o ON u.organization_id = o.id
     WHERE u.email = ?`,
    [normalizedEmail]
  );

  // 2. Reject if email does not exist
  if (users.length === 0) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const user = users[0];

  // 3. Compare password with stored bcrypt hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  // 4. Generate JWT containing userId, organizationId, and email
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.warn('⚠️  JWT_SECRET is not set in environment variables! Using fallback development secret.');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
    },
    jwtSecret || 'stockflow_dev_secret_key_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    }
  );

  // 5. Return safe user & organization details (password is omitted)
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      organizationId: user.organization_id,
      organizationName: user.organization_name,
    },
  };
}
