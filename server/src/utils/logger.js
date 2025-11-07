// Enhanced logging utilities using built-in Node.js capabilities
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level based on environment
const currentLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Enhanced logger implementation
const logger = {
  _log(level, levelName, message, meta = {}) {
    if (level > currentLevel) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      ...meta
    };
    
    // Console output with colors
    const colorMap = {
      ERROR: colors.red,
      WARN: colors.yellow,
      INFO: colors.blue,
      DEBUG: colors.cyan
    };
    
    const color = colorMap[levelName] || colors.reset;
    console.log(`${color}[${timestamp}] ${levelName}: ${message}${colors.reset}`);
    
    if (Object.keys(meta).length > 0) {
      console.log(`${color}${JSON.stringify(meta, null, 2)}${colors.reset}`);
    }
    
    // File logging
    this._writeToFile(logEntry, levelName);
  },
  
  _writeToFile(logEntry, levelName) {
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Write to combined log
    fs.appendFile(path.join(logsDir, 'combined.log'), logLine, (err) => {
      if (err) console.error('Failed to write to combined log:', err);
    });
    
    // Write errors to separate file
    if (levelName === 'ERROR') {
      fs.appendFile(path.join(logsDir, 'error.log'), logLine, (err) => {
        if (err) console.error('Failed to write to error log:', err);
      });
    }
  },
  
  error(message, meta = {}) {
    this._log(LOG_LEVELS.ERROR, 'ERROR', message, meta);
  },
  
  warn(message, meta = {}) {
    this._log(LOG_LEVELS.WARN, 'WARN', message, meta);
  },
  
  info(message, meta = {}) {
    this._log(LOG_LEVELS.INFO, 'INFO', message, meta);
  },
  
  debug(message, meta = {}) {
    this._log(LOG_LEVELS.DEBUG, 'DEBUG', message, meta);
  }
};

// Performance monitoring utilities
const performanceLogger = {
  startTimer: (label) => {
    const start = process.hrtime.bigint();
    return {
      end: () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        logger.info(`Performance: ${label} completed in ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  },
  
  logMemoryUsage: () => {
    const usage = process.memoryUsage();
    logger.info('Memory Usage:', {
      rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(usage.external / 1024 / 1024)} MB`
    });
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timer = performanceLogger.startTimer(`${req.method} ${req.path}`);
  
  // Log incoming request
  logger.info('Incoming Request:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    timer.end();
    
    logger.info('Request Completed:', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    });
    
    // Call original end method
    originalEnd.apply(res, args);
  };
  
  next();
};

// Database operation logger
const dbLogger = {
  logQuery: (model, operation, query = {}, duration = 0) => {
    logger.debug('Database Operation:', {
      model,
      operation,
      query: JSON.stringify(query),
      duration: `${duration}ms`
    });
  },
  
  logError: (model, operation, error) => {
    logger.error('Database Error:', {
      model,
      operation,
      error: error.message,
      stack: error.stack
    });
  }
};

// Authentication logger
const authLogger = {
  logLogin: (userId, ip, success = true) => {
    logger.info('Authentication Attempt:', {
      userId,
      ip,
      success,
      timestamp: new Date().toISOString(),
      type: 'login'
    });
  },
  
  logLogout: (userId, ip) => {
    logger.info('User Logout:', {
      userId,
      ip,
      timestamp: new Date().toISOString(),
      type: 'logout'
    });
  },
  
  logTokenRefresh: (userId, ip) => {
    logger.info('Token Refresh:', {
      userId,
      ip,
      timestamp: new Date().toISOString(),
      type: 'token_refresh'
    });
  }
};

module.exports = {
  logger,
  performanceLogger,
  requestLogger,
  dbLogger,
  authLogger
};