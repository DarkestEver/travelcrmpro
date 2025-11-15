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

// System statistics and reports (Super Admin + Admin + Operator)
router.get('/metrics', restrictTo('super_admin', 'admin', 'operator'), performanceController.getMetrics);
router.get('/system', restrictTo('super_admin', 'admin', 'operator'), performanceController.getSystemStats);
router.get('/report', restrictTo('super_admin', 'admin', 'operator'), performanceController.getPerformanceReport);
router.get('/memory', restrictTo('super_admin', 'admin', 'operator'), performanceController.getMemoryUsage);

// Endpoint performance (Super Admin + Admin + Operator)
router.get('/slowest-endpoints', restrictTo('super_admin', 'admin', 'operator'), performanceController.getSlowestEndpoints);
router.get('/active-endpoints', restrictTo('super_admin', 'admin', 'operator'), performanceController.getMostActiveEndpoints);
router.get('/slow-queries', restrictTo('super_admin', 'admin', 'operator'), performanceController.getSlowQueries);

// Cache management (Super Admin + Admin + Operator)
router.get('/cache-stats', restrictTo('super_admin', 'admin', 'operator'), performanceController.getCacheStats);

// Errors (Super Admin + Admin only)
router.get('/errors', restrictTo('super_admin', 'admin'), performanceController.getRecentErrors);

// Admin-only operations
router.post('/clear-cache', restrictTo('super_admin', 'admin'), performanceController.clearCache);
router.post('/reset', restrictTo('super_admin', 'admin'), performanceController.resetMetrics);

module.exports = router;
