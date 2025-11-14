/**
 * Performance Routes
 * Phase 10: Performance monitoring endpoints
 */

const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// System statistics and reports (Admin + Operator)
router.get('/metrics', authorize('admin', 'operator'), performanceController.getMetrics);
router.get('/system', authorize('admin', 'operator'), performanceController.getSystemStats);
router.get('/report', authorize('admin', 'operator'), performanceController.getPerformanceReport);
router.get('/memory', authorize('admin', 'operator'), performanceController.getMemoryUsage);

// Endpoint performance (Admin + Operator)
router.get('/slowest-endpoints', authorize('admin', 'operator'), performanceController.getSlowestEndpoints);
router.get('/active-endpoints', authorize('admin', 'operator'), performanceController.getMostActiveEndpoints);
router.get('/slow-queries', authorize('admin', 'operator'), performanceController.getSlowQueries);

// Cache management (Admin + Operator)
router.get('/cache-stats', authorize('admin', 'operator'), performanceController.getCacheStats);

// Errors (Admin only)
router.get('/errors', authorize('admin'), performanceController.getRecentErrors);

// Admin-only operations
router.post('/clear-cache', authorize('admin'), performanceController.clearCache);
router.post('/reset', authorize('admin'), performanceController.resetMetrics);

module.exports = router;
