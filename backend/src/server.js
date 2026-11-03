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
    const tableInfo = dbStatus.tables.length > 0
      ? `Tables: ${dbStatus.tables.join(', ')}`
      : 'No tables found (run npm run db:init)';
    console.log(`✅ [Database] ${dbStatus.message} (${tableInfo})`);
  } else {
    console.log(`⚠️  [Database] ${dbStatus.message}`);
    if (dbStatus.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('👉 Action needed: Set your MySQL root password in backend/.env under DB_PASSWORD.');
    } else if (dbStatus.code === 'ER_BAD_DB_ERROR') {
      console.log("👉 Action needed: Run 'npm run db:init' to create 'stockflow_db' and required tables.");
    } else if (dbStatus.code === 'ECONNREFUSED') {
      console.log('👉 Action needed: Start your local MySQL service in Windows Services or via Command Prompt.');
    }
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
