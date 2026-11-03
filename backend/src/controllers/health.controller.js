import { checkDbConnection } from '../config/db.js';

/**
 * Controller to provide health check information for monitoring and verification.
 */
export const getHealthStatus = async (req, res) => {
  const dbStatus = await checkDbConnection();

  const healthData = {
    status: 'ok',
    service: 'StockFlow Backend API',
    version: '1.0.0',
    uptime: `${process.uptime().toFixed(2)}s`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus.connected ? 'connected' : 'disconnected',
      details: dbStatus.message,
    },
  };

  return res.status(200).json(healthData);
};
