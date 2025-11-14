/**
 * Health Check Routes
 * Phase 6.1: Routes for system health monitoring
 */

const express = require('express');
const router = express.Router();

const {
  quickHealthCheck,
  detailedHealthCheck,
  checkDatabase,
  checkStripe,
  checkEmail,
  checkSystem,
  getUptime,
  getEnvironment,
} = require('../controllers/healthCheckController');

const { protect, restrictTo } = require('../middleware/auth');

// Public routes (for load balancers and monitoring)
router.get('/', quickHealthCheck);
router.get('/uptime', getUptime);

// Admin-only detailed checks
router.use(protect);
router.use(restrictTo('admin', 'operator'));

router.get('/detailed', detailedHealthCheck);
router.get('/database', checkDatabase);
router.get('/stripe', checkStripe);
router.get('/email', checkEmail);
router.get('/system', checkSystem);
router.get('/environment', getEnvironment);

module.exports = router;
