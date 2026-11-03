/**
 * 404 Not Found handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
