import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';

dotenv.config();

const useSSL = process.env.DB_SSL === 'true';

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
  ...(useSSL && {
    ssl: {
      ca: readFileSync(new URL('../../certs/ca.pem', import.meta.url), 'utf8'),
      rejectUnauthorized: true,
    },
  }),
};

export const pool = mysql.createPool(dbConfig);

export const checkDbConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    const [result] = await connection.query('SELECT 1 AS alive');
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
      userFriendlyMessage = `Access denied for user '${dbConfig.user}'. Please configure the correct DB_PASSWORD.`;
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      userFriendlyMessage = `Database '${dbConfig.database}' does not exist. Run 'npm run db:init' to create it.`;
    } else if (error.code === 'ECONNREFUSED') {
      userFriendlyMessage = `Could not connect to MySQL at ${dbConfig.host}:${dbConfig.port}.`;
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

export const query = (sql, params = []) => pool.execute(sql, params);

export default pool;