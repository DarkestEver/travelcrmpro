/**
 * Performance Monitoring Middleware
 * Phase 10: Track request performance in real-time
 */

const performanceService = require('../services/performanceService');
const logger = require('../utils/logger');

/**
 * Performance tracking middleware
 */
const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const route = `${req.method} ${req.route?.path || req.path}`;

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Track request
    performanceService.trackRequest(route, duration, res.statusCode);

    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request: ${route} took ${duration}ms`);
    }
  });

  // Capture errors
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    if (res.statusCode >= 400 && data.error) {
      performanceService.trackError(route, data.error, res.statusCode);
    }
    return originalJson(data);
  };

  next();
};

module.exports = performanceMiddleware;
