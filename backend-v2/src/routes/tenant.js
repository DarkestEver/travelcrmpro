const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const {
  createTenantSchema,
  updateTenantSchema,
  updateBrandingSchema,
  getTenantQuerySchema,
} = require('../validation/tenantSchemas');

/**
 * @route   GET /tenants
 * @desc    Get all tenants with pagination and filtering
 * @access  Super Admin only
 */
router.get(
  '/',
  authenticate,
  isSuperAdmin,
  validate(getTenantQuerySchema, 'query'),
  tenantController.getAllTenants
);

/**
 * @route   POST /tenants
 * @desc    Create a new tenant
 * @access  Super Admin only
 */
router.post(
  '/',
  authenticate,
  isSuperAdmin,
  validate(createTenantSchema),
  tenantController.createTenant
);

/**
 * @route   GET /tenants/:id
 * @desc    Get tenant by ID
 * @access  Super Admin or own tenant
 */
router.get(
  '/:id',
  authenticate,
  tenantController.getTenant
);

/**
 * @route   PUT /tenants/:id
 * @desc    Update tenant
 * @access  Super Admin (all tenants) or Tenant Admin (own tenant)
 */
router.put(
  '/:id',
  authenticate,
  validate(updateTenantSchema),
  tenantController.updateTenant
);

/**
 * @route   PUT /tenants/:id/branding
 * @desc    Update tenant branding
 * @access  Super Admin or Tenant Admin (own tenant)
 */
router.put(
  '/:id/branding',
  authenticate,
  validate(updateBrandingSchema),
  tenantController.updateBranding
);

/**
 * @route   DELETE /tenants/:id
 * @desc    Delete tenant
 * @access  Super Admin only
 */
router.delete(
  '/:id',
  authenticate,
  isSuperAdmin,
  tenantController.deleteTenant
);

/**
 * @route   GET /tenants/:id/stats
 * @desc    Get tenant statistics
 * @access  Super Admin or own tenant
 */
router.get(
  '/:id/stats',
  authenticate,
  tenantController.getTenantStats
);

module.exports = router;
