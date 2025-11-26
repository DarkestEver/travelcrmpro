const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const asyncHandler = require('../middleware/asyncHandler');
const { USER_ROLES } = require('../config/constants');
const {
  createTemplateSchema,
  updateTemplateSchema,
  sendEmailSchema,
} = require('../validation/emailSchemas');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/emails/stats
 * Get email statistics
 */
router.get(
  '/stats',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(emailController.getEmailStats)
);

/**
 * GET /api/v1/emails/logs
 * Get email logs
 */
router.get(
  '/logs',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(emailController.getEmailLogs)
);

/**
 * POST /api/v1/emails/send
 * Send email using template
 */
router.post(
  '/send',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(sendEmailSchema),
  asyncHandler(emailController.sendEmail)
);

/**
 * GET /api/v1/emails/templates
 * Get all email templates
 */
router.get(
  '/templates',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(emailController.getAllTemplates)
);

/**
 * POST /api/v1/emails/templates
 * Create email template
 */
router.post(
  '/templates',
  checkRole(USER_ROLES.TENANT_ADMIN),
  validate(createTemplateSchema),
  asyncHandler(emailController.createTemplate)
);

/**
 * GET /api/v1/emails/templates/:id
 * Get single template
 */
router.get(
  '/templates/:id',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(emailController.getTemplate)
);

/**
 * PUT /api/v1/emails/templates/:id
 * Update email template
 */
router.put(
  '/templates/:id',
  checkRole(USER_ROLES.TENANT_ADMIN),
  validate(updateTemplateSchema),
  asyncHandler(emailController.updateTemplate)
);

/**
 * DELETE /api/v1/emails/templates/:id
 * Delete email template
 */
router.delete(
  '/templates/:id',
  checkRole(USER_ROLES.TENANT_ADMIN),
  asyncHandler(emailController.deleteTemplate)
);

module.exports = router;
