const { nodeEnv } = require('../config/env');

const notFound = (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};

const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
