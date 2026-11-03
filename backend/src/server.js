import app from './app.js';
import dotenv from 'dotenv';
import { checkDbConnection } from './config/db.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);

const server = app.listen(PORT, async () => {
  console.log('====================================================');
  console.log(`🚀 StockFlow Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('====================================================');

  // Asynchronously test DB connection on startup without crashing the server
  const dbStatus = await checkDbConnection();
  if (dbStatus.connected) {
    console.log(`✅ [Database] ${dbStatus.message}`);
  } else {
    console.log(`⚠️  [Database] ${dbStatus.message}`);
    console.log('ℹ️  Ensure MySQL is running and your .env credentials are correct.');
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default server;
