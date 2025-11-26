const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/reports/dashboard
 * Get dashboard overview
 */
router.get(
  '/dashboard',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(reportController.getDashboard)
);

/**
 * GET /api/v1/reports/revenue
 * Get revenue report
 */
router.get(
  '/revenue',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(reportController.getRevenueReport)
);

/**
 * GET /api/v1/reports/bookings
 * Get booking report
 */
router.get(
  '/bookings',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(reportController.getBookingReport)
);

/**
 * GET /api/v1/reports/leads
 * Get leads report
 */
router.get(
  '/leads',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(reportController.getLeadsReport)
);

/**
 * GET /api/v1/reports/agents
 * Get agent performance report
 */
router.get(
  '/agents',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(reportController.getAgentReport)
);

/**
 * GET /api/v1/reports/export
 * Export report
 */
router.get(
  '/export',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(reportController.exportReport)
);

module.exports = router;
