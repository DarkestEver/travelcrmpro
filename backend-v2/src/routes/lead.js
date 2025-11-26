const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const asyncHandler = require('../middleware/asyncHandler');
const {
  createLeadSchema,
  updateLeadSchema,
  addNoteSchema,
  assignLeadSchema,
  convertLeadSchema,
} = require('../validation/leadSchemas');
const { USER_ROLES } = require('../config/constants');

/**
 * @route   GET /api/v1/leads/stats
 * @desc    Get lead statistics
 * @access  Private (Agent, Tenant Admin, Super Admin)
 */
router.get(
  '/stats',
  authenticate,
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(leadController.getLeadStats),
);

/**
 * @route   GET /api/v1/leads
 * @desc    Get all leads with filtering
 * @access  Private (Agent, Tenant Admin, Super Admin)
 */
router.get(
  '/',
  authenticate,
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(leadController.getAllLeads),
);

/**
 * @route   POST /api/v1/leads
 * @desc    Create new lead
 * @access  Private (Agent, Tenant Admin)
 */
router.post(
  '/',
  authenticate,
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(createLeadSchema),
  asyncHandler(leadController.createLead),
);

/**
 * @route   GET /api/v1/leads/:id
 * @desc    Get single lead
 * @access  Private (Agent, Tenant Admin, Super Admin)
 */
router.get(
  '/:id',
  authenticate,
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(leadController.getLead),
);

/**
 * @route   PUT /api/v1/leads/:id
 * @desc    Update lead
 * @access  Private (Agent, Tenant Admin)
 */
router.put(
  '/:id',
  authenticate,
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(updateLeadSchema),
  asyncHandler(leadController.updateLead),
);

/**
 * @route   DELETE /api/v1/leads/:id
 * @desc    Delete lead
 * @access  Private (Tenant Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  checkRole(USER_ROLES.TENANT_ADMIN),
  asyncHandler(leadController.deleteLead),
);

/**
 * @route   PUT /api/v1/leads/:id/assign
 * @desc    Assign lead to user
 * @access  Private (Tenant Admin)
 */
router.put(
  '/:id/assign',
  authenticate,
  checkRole(USER_ROLES.TENANT_ADMIN),
  validate(assignLeadSchema),
  asyncHandler(leadController.assignLead),
);

/**
 * @route   POST /api/v1/leads/:id/notes
 * @desc    Add note to lead
 * @access  Private (Agent, Tenant Admin)
 */
router.post(
  '/:id/notes',
  authenticate,
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(addNoteSchema),
  asyncHandler(leadController.addNote),
);

/**
 * @route   POST /api/v1/leads/:id/convert
 * @desc    Convert lead to booking
 * @access  Private (Agent, Tenant Admin)
 */
router.post(
  '/:id/convert',
  authenticate,
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(convertLeadSchema),
  asyncHandler(leadController.convertLead),
);

module.exports = router;
