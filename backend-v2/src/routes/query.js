const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { USER_ROLES } = require('../config/constants');

/**
 * Query Routes
 * All routes require authentication
 */

router.use(authenticate);

// Statistics and reports (Admin/Manager only)
router.get(
  '/stats',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.getQueryStatistics)
);

router.get(
  '/sla-report',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.getSLAReport)
);

router.get(
  '/agent-performance',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.getAgentPerformance)
);

router.get(
  '/source-analysis',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.getSourceAnalysis)
);

// Overdue and escalated queries
router.get(
  '/overdue',
  asyncHandler(queryController.getOverdueQueries)
);

router.get(
  '/escalated',
  asyncHandler(queryController.getEscalatedQueries)
);

// Duplicate detection
router.post(
  '/find-duplicates',
  asyncHandler(queryController.findDuplicates)
);

// Bulk assignment
router.post(
  '/bulk-assign',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.bulkAssignQueries)
);

// Create query
router.post(
  '/create',
  asyncHandler(queryController.createQuery)
);

// Get all queries
router.get(
  '/',
  asyncHandler(queryController.getAllQueries)
);

// Get query by ID
router.get(
  '/:id',
  asyncHandler(queryController.getQueryById)
);

// Update query
router.patch(
  '/:id',
  asyncHandler(queryController.updateQuery)
);

// Delete query
router.delete(
  '/:id',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.deleteQuery)
);

// Assignment operations
router.post(
  '/:id/assign',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.assignQuery)
);

router.post(
  '/:id/auto-assign',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.autoAssignQuery)
);

router.post(
  '/:id/unassign',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.unassignQuery)
);

// Status operations
router.patch(
  '/:id/status',
  asyncHandler(queryController.updateQueryStatus)
);

router.post(
  '/:id/mark-responded',
  asyncHandler(queryController.markAsResponded)
);

router.post(
  '/:id/mark-resolved',
  asyncHandler(queryController.markAsResolved)
);

// Escalation
router.post(
  '/:id/escalate',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.escalateQuery)
);

// Duplicate marking
router.post(
  '/:id/mark-duplicate',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.MANAGER),
  asyncHandler(queryController.markAsDuplicate)
);

// Convert to lead
router.post(
  '/:id/convert-to-lead',
  asyncHandler(queryController.convertToLead)
);

// Add note
router.post(
  '/:id/notes',
  asyncHandler(queryController.addNote)
);

// Agent availability routes
router.post(
  '/agents/availability/status',
  asyncHandler(queryController.setAgentStatus)
);

router.get(
  '/agents/online',
  asyncHandler(queryController.getOnlineAgents)
);

router.get(
  '/agents/:id/workload',
  asyncHandler(queryController.getAgentWorkload)
);

module.exports = router;
