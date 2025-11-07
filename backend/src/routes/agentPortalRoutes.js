const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAgent } = require('../middleware/agentAuth');
const {
  getDashboardStats,
  getRecentActivity,
} = require('../controllers/agentStatsController');

// Apply authentication middleware to all routes
router.use(protect);
router.use(requireAgent);

/**
 * Agent Portal Stats Routes
 * These are for the agent's self-service portal
 */
router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);

module.exports = router;
