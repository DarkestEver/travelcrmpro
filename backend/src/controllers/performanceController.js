/**
 * Performance Controller
 * Phase 10: API endpoints for performance monitoring
 */

const performanceService = require('../services/performanceService');
const cacheService = require('../services/cacheService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get performance metrics
 * @route GET /api/performance/metrics
 * @access Admin, Operator
 */
exports.getMetrics = asyncHandler(async (req, res) => {
  const metrics = performanceService.getMetrics();

  res.json({
    success: true,
    data: metrics
  });
});

/**
 * Get system statistics
 * @route GET /api/performance/system
 * @access Admin, Operator
 */
exports.getSystemStats = asyncHandler(async (req, res) => {
  const stats = performanceService.getSystemStats();

  res.json({
    success: true,
    data: stats
  });
});

/**
 * Get performance report
 * @route GET /api/performance/report
 * @access Admin, Operator
 */
exports.getPerformanceReport = asyncHandler(async (req, res) => {
  const report = performanceService.getPerformanceReport();

  res.json({
    success: true,
    data: report
  });
});

/**
 * Get slow queries
 * @route GET /api/performance/slow-queries
 * @access Admin, Operator
 */
exports.getSlowQueries = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const slowQueries = performanceService.getSlowQueries(limit);

  res.json({
    success: true,
    data: slowQueries,
    count: slowQueries.length
  });
});

/**
 * Get slowest endpoints
 * @route GET /api/performance/slowest-endpoints
 * @access Admin, Operator
 */
exports.getSlowestEndpoints = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const endpoints = performanceService.getSlowestEndpoints(limit);

  res.json({
    success: true,
    data: endpoints,
    count: endpoints.length
  });
});

/**
 * Get most active endpoints
 * @route GET /api/performance/active-endpoints
 * @access Admin, Operator
 */
exports.getMostActiveEndpoints = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const endpoints = performanceService.getMostActiveEndpoints(limit);

  res.json({
    success: true,
    data: endpoints,
    count: endpoints.length
  });
});

/**
 * Get recent errors
 * @route GET /api/performance/errors
 * @access Admin
 */
exports.getRecentErrors = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const errors = performanceService.getRecentErrors(limit);

  res.json({
    success: true,
    data: errors,
    count: errors.length
  });
});

/**
 * Get cache statistics
 * @route GET /api/performance/cache-stats
 * @access Admin, Operator
 */
exports.getCacheStats = asyncHandler(async (req, res) => {
  const stats = cacheService.getStats();

  res.json({
    success: true,
    data: stats
  });
});

/**
 * Clear cache
 * @route POST /api/performance/clear-cache
 * @access Admin
 */
exports.clearCache = asyncHandler(async (req, res) => {
  const { pattern } = req.body;

  if (pattern) {
    await cacheService.delPattern(pattern);
    res.json({
      success: true,
      message: `Cache cleared for pattern: ${pattern}`
    });
  } else {
    await cacheService.clear();
    res.json({
      success: true,
      message: 'All cache cleared'
    });
  }
});

/**
 * Reset performance metrics
 * @route POST /api/performance/reset
 * @access Admin
 */
exports.resetMetrics = asyncHandler(async (req, res) => {
  performanceService.reset();

  res.json({
    success: true,
    message: 'Performance metrics reset'
  });
});

/**
 * Get memory usage
 * @route GET /api/performance/memory
 * @access Admin, Operator
 */
exports.getMemoryUsage = asyncHandler(async (req, res) => {
  const memory = performanceService.getMemoryUsage();

  res.json({
    success: true,
    data: memory
  });
});
