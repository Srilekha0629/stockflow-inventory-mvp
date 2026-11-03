import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes the MySQL database and creates tables if they do not exist.
 */
export async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD ?? '';
  const database = process.env.DB_NAME || 'stockflow_db';

  console.log('----------------------------------------------------');
  console.log(`Connecting to MySQL server at ${host}:${port} as '${user}'...`);

  let connection;
  try {
    // 1. Connect without selecting database to ensure database existence
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });
  } catch (err) {
    console.error('\n❌ MySQL Connection Failed:');
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`Access denied for user '${user}'.`);
      console.error('Please verify your DB_PASSWORD in backend/.env.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error(`Connection refused at ${host}:${port}.`);
      console.error('Please ensure the MySQL service is running on your machine.');
    } else {
      console.error(`Error details: ${err.message}`);
    }
    console.log('----------------------------------------------------\n');
    throw err;
  }

  try {
    // 2. Create database if it does not exist
    console.log(`Ensuring database '${database}' exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.end();

    // 3. Connect directly to the target database to apply schema
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      multipleStatements: true,
    });

    console.log(`Applying schema to database '${database}'...`);
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await connection.query(schemaSql);

    // 4. Verify created tables
    const [rows] = await connection.query('SHOW TABLES;');
    const tableNames = rows.map((r) => Object.values(r)[0]);

    console.log(`✅ Successfully initialized database '${database}'!`);
    console.log(`📋 Existing tables in database: ${tableNames.join(', ')}`);
    console.log('----------------------------------------------------');

    return { success: true, tables: tableNames };
  } catch (err) {
    console.error(`❌ Failed to apply database schema: ${err.message}`);
    console.log('----------------------------------------------------');
    throw err;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Allow standalone execution via `node src/config/initDb.js` or `npm run db:init`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization finished.');
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
