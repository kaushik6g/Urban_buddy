const { nodeEnv } = require('../config/env');

const notFound = (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};

const errorHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode ?? err.status;
  const statusCode = Number.isInteger(status) && status >= 400 && status <= 599
    ? status
    : 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && nodeEnv !== 'development'
      ? 'Internal server error'
      : err.message || 'Internal server error',
    ...(nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
