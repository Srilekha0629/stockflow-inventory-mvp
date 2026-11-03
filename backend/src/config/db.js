import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'stockflow_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

// Create a connection pool for efficient multi-tenant query execution
export const pool = mysql.createPool(dbConfig);

/**
 * Checks the database connection status by executing a ping and query.
 * Returns an object with connection state, message, and existing tables.
 */
export const checkDbConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    // Test connectivity
    await connection.ping();
    const [result] = await connection.query('SELECT 1 AS alive');

    // Fetch existing tables to verify schema state
    const [tables] = await connection.query('SHOW TABLES');
    const tableList = tables.map((t) => Object.values(t)[0]);

    connection.release();

    return {
      connected: true,
      message: 'Successfully connected to MySQL database pool.',
      database: dbConfig.database,
      tables: tableList,
    };
  } catch (error) {
    if (connection) {
      try {
        connection.release();
      } catch (_) {}
    }

    let userFriendlyMessage = error.message;

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      userFriendlyMessage = `Access denied for user '${dbConfig.user}'. Please configure the correct DB_PASSWORD in backend/.env.`;
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      userFriendlyMessage = `Database '${dbConfig.database}' does not exist. Run 'npm run db:init' to create it.`;
    } else if (error.code === 'ECONNREFUSED') {
      userFriendlyMessage = `Could not connect to MySQL at ${dbConfig.host}:${dbConfig.port}. Please ensure MySQL service is running.`;
    }

    return {
      connected: false,
      message: userFriendlyMessage,
      code: error.code || 'UNKNOWN_ERROR',
      database: dbConfig.database,
      tables: [],
    };
  }
};

/**
 * Helper to execute prepared SQL queries with parameter binding.
 */
export const query = (sql, params = []) => pool.execute(sql, params);

export default pool;
