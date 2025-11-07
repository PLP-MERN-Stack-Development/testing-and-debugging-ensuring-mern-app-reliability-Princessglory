const { logger, performanceLogger } = require('../utils/logger');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Enhanced error logging with request context
  logger.error('🚨 Error Occurred:', {
    error: err.message,
    stack: err.stack,
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      params: req.params,
      query: req.query,
      headers: {
        authorization: req.headers.authorization ? '***REDACTED***' : undefined,
        'content-type': req.headers['content-type']
      }
    },
    timestamp: new Date().toISOString()
  });

  // Log memory usage on errors for debugging
  performanceLogger.logMemoryUsage();

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
    logger.warn('Cast Error:', { value: err.value, path: err.path });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
    logger.warn('Duplicate Key Error:', { keyValue: err.keyValue });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
    logger.warn('Validation Error:', { 
      fields: Object.keys(err.errors),
      messages: Object.values(err.errors).map(val => val.message)
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
    logger.warn('JWT Error:', { type: 'invalid_token' });
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
    logger.warn('JWT Error:', { type: 'expired_token', expiredAt: err.expiredAt });
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
    logger.warn('Rate Limit Exceeded:', { ip: req.ip });
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    const message = 'Database connection error';
    error = { message, statusCode: 503 };
    logger.error('Database Connection Error:', { error: err.message });
  }

  // Prepare response
  const response = {
    status: 'error',
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err
    }),
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  };

  // Log response being sent
  logger.debug('Error Response Sent:', {
    statusCode: error.statusCode || 500,
    message: response.message,
    requestId: response.requestId
  });

  res.status(error.statusCode || 500).json(response);
};

// Unhandled rejection handler
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection:', {
      error: err.message,
      stack: err.stack,
      promise: promise.toString()
    });
    
    // Close server gracefully
    process.exit(1);
  });
};

// Uncaught exception handler
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', {
      error: err.message,
      stack: err.stack
    });
    
    // Close server gracefully
    process.exit(1);
  });
};

// Graceful shutdown handler
const handleGracefulShutdown = (server) => {
  const shutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
    
    // Force close if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

module.exports = {
  errorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  handleGracefulShutdown
};