import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stockflow_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create a connection pool for efficient multi-tenant query execution
export const pool = mysql.createPool(dbConfig);

/**
 * Checks the database connection status.
 * Returns an object with connection state and message.
 */
export const checkDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return {
      connected: true,
      message: 'Successfully connected to MySQL database pool.',
    };
  } catch (error) {
    return {
      connected: false,
      message: `Database connection unavailable: ${error.message}`,
    };
  }
};

export default pool;
