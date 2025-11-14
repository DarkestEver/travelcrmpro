/**
 * Performance Routes
 * Phase 10: Performance monitoring endpoints
 */

const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// System statistics and reports (Admin + Operator)
router.get('/metrics', restrictTo('admin', 'operator'), performanceController.getMetrics);
router.get('/system', restrictTo('admin', 'operator'), performanceController.getSystemStats);
router.get('/report', restrictTo('admin', 'operator'), performanceController.getPerformanceReport);
router.get('/memory', restrictTo('admin', 'operator'), performanceController.getMemoryUsage);

// Endpoint performance (Admin + Operator)
router.get('/slowest-endpoints', restrictTo('admin', 'operator'), performanceController.getSlowestEndpoints);
router.get('/active-endpoints', restrictTo('admin', 'operator'), performanceController.getMostActiveEndpoints);
router.get('/slow-queries', restrictTo('admin', 'operator'), performanceController.getSlowQueries);

// Cache management (Admin + Operator)
router.get('/cache-stats', restrictTo('admin', 'operator'), performanceController.getCacheStats);

// Errors (Admin only)
router.get('/errors', restrictTo('admin'), performanceController.getRecentErrors);

// Admin-only operations
router.post('/clear-cache', restrictTo('admin'), performanceController.clearCache);
router.post('/reset', restrictTo('admin'), performanceController.resetMetrics);

module.exports = router;
