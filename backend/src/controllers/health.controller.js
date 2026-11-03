import { checkDbConnection } from '../config/db.js';

/**
 * Controller to provide health check information for monitoring and verification.
 * Accurately reports actual database connectivity and schema tables.
 */
export const getHealthStatus = async (req, res) => {
  const dbStatus = await checkDbConnection();

  const healthData = {
    status: dbStatus.connected ? 'ok' : 'degraded',
    service: 'StockFlow Backend API',
    version: '1.0.0',
    uptime: `${process.uptime().toFixed(2)}s`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus.connected ? 'connected' : 'disconnected',
      database: dbStatus.database,
      details: dbStatus.message,
      tables: dbStatus.tables,
      ...(dbStatus.code && { errorCode: dbStatus.code }),
    },
  };

  // Return HTTP 200 so monitoring tools can inspect the diagnostics JSON
  return res.status(200).json(healthData);
};
