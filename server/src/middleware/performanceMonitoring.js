const { logger, performanceLogger } = require('../utils/logger');

// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  // Add request ID for tracking
  req.requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  res.set('X-Request-ID', req.requestId);
  
  // Override res.end to capture performance metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryDiff = {
      rss: endMemory.rss - startMemory.rss,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed
    };
    
    // Log performance metrics
    const performanceData = {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memoryUsage: {
        rss: `${Math.round(endMemory.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
        memoryIncrease: `${Math.round(memoryDiff.heapUsed / 1024)}KB`
      }
    };
    
    // Warn on slow requests
    if (duration > 1000) {
      logger.warn('Slow Request Detected:', performanceData);
    } else {
      logger.debug('Performance Metrics:', performanceData);
    }
    
    // Log memory warnings
    if (endMemory.heapUsed > 100 * 1024 * 1024) { // 100MB
      logger.warn('High Memory Usage Detected:', {
        heapUsed: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
        requestId: req.requestId
      });
    }
    
    originalEnd.apply(res, args);
  };
  
  next();
};

// Database query performance monitor
const dbPerformanceMonitor = (model) => {
  return {
    async find(query = {}, options = {}) {
      const timer = performanceLogger.startTimer(`DB Query: ${model} find`);
      try {
        const result = await model.find(query, null, options);
        const duration = timer.end();
        
        logger.debug('Database Query Performance:', {
          model: model.modelName,
          operation: 'find',
          querySize: JSON.stringify(query).length,
          resultCount: result.length,
          duration: `${duration.toFixed(2)}ms`
        });
        
        return result;
      } catch (error) {
        timer.end();
        logger.error('Database Query Error:', {
          model: model.modelName,
          operation: 'find',
          query,
          error: error.message
        });
        throw error;
      }
    },
    
    async findById(id) {
      const timer = performanceLogger.startTimer(`DB Query: ${model} findById`);
      try {
        const result = await model.findById(id);
        const duration = timer.end();
        
        logger.debug('Database Query Performance:', {
          model: model.modelName,
          operation: 'findById',
          id,
          found: !!result,
          duration: `${duration.toFixed(2)}ms`
        });
        
        return result;
      } catch (error) {
        timer.end();
        logger.error('Database Query Error:', {
          model: model.modelName,
          operation: 'findById',
          id,
          error: error.message
        });
        throw error;
      }
    },
    
    async create(data) {
      const timer = performanceLogger.startTimer(`DB Query: ${model} create`);
      try {
        const result = await model.create(data);
        const duration = timer.end();
        
        logger.debug('Database Query Performance:', {
          model: model.modelName,
          operation: 'create',
          dataSize: JSON.stringify(data).length,
          duration: `${duration.toFixed(2)}ms`
        });
        
        return result;
      } catch (error) {
        timer.end();
        logger.error('Database Query Error:', {
          model: model.modelName,
          operation: 'create',
          data,
          error: error.message
        });
        throw error;
      }
    }
  };
};

// API response time tracking
const responseTimeTracker = {
  slow: new Map(), // Track slow endpoints
  errors: new Map(), // Track error frequencies
  
  track(req, res, duration, statusCode) {
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    // Track slow responses
    if (duration > 1000) {
      const slowCount = this.slow.get(endpoint) || 0;
      this.slow.set(endpoint, slowCount + 1);
    }
    
    // Track errors
    if (statusCode >= 400) {
      const errorCount = this.errors.get(endpoint) || 0;
      this.errors.set(endpoint, errorCount + 1);
    }
  },
  
  getSlowEndpoints() {
    return Array.from(this.slow.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  },
  
  getErrorEndpoints() {
    return Array.from(this.errors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  },
  
  generateReport() {
    logger.info('Performance Report:', {
      slowEndpoints: this.getSlowEndpoints(),
      errorEndpoints: this.getErrorEndpoints(),
      timestamp: new Date().toISOString()
    });
  }
};

// Generate performance reports every 5 minutes
setInterval(() => {
  responseTimeTracker.generateReport();
  performanceLogger.logMemoryUsage();
}, 5 * 60 * 1000);

module.exports = {
  performanceMonitoring,
  dbPerformanceMonitor,
  responseTimeTracker
};