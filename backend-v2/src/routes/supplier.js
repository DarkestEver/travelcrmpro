const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');

const supplierController = require('../controllers/supplierController');
const { validate } = require('../middleware/validation');
const { authenticate, requireSameTenant } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { uploadDocument } = require('../services/uploadService');
const { resolveTenant } = require('../middleware/tenant');
const {
  createSupplierSchema,
  updateSupplierSchema,
  updateRatingSchema,
  addDocumentSchema,
} = require('../validation/supplierSchemas');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication and tenant context
router.use(resolveTenant);
router.use(authenticate);
router.use(requireSameTenant);

/**
 * @route   GET /api/v1/suppliers/stats
 * @desc    Get supplier statistics
 * @access  Private (tenant_admin, super_admin)
 */
router.get(
  '/stats',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(supplierController.getSupplierStats)
);

/**
 * @route   GET /api/v1/suppliers
 * @desc    Get all suppliers with filtering, search, and pagination
 * @access  Private (all authenticated users)
 */
router.get('/', asyncHandler(supplierController.getAllSuppliers));

/**
 * @route   GET /api/v1/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private (all authenticated users)
 */
router.get('/:id', asyncHandler(supplierController.getSupplier));

/**
 * @route   POST /api/v1/suppliers
 * @desc    Create new supplier
 * @access  Private (tenant_admin, super_admin)
 */
router.post(
  '/',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(createSupplierSchema),
  asyncHandler(supplierController.createSupplier)
);

/**
 * @route   PUT /api/v1/suppliers/:id
 * @desc    Update supplier
 * @access  Private (tenant_admin, super_admin)
 */
router.put(
  '/:id',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(updateSupplierSchema),
  asyncHandler(supplierController.updateSupplier)
);

/**
 * @route   DELETE /api/v1/suppliers/:id
 * @desc    Delete supplier
 * @access  Private (tenant_admin, super_admin)
 */
router.delete(
  '/:id',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(supplierController.deleteSupplier)
);

/**
 * @route   PUT /api/v1/suppliers/:id/rating
 * @desc    Update supplier rating
 * @access  Private (tenant_admin, super_admin)
 */
router.put(
  '/:id/rating',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(updateRatingSchema),
  asyncHandler(supplierController.updateRating)
);

/**
 * @route   POST /api/v1/suppliers/:id/documents
 * @desc    Add document to supplier
 * @access  Private (tenant_admin, super_admin)
 */
router.post(
  '/:id/documents',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  uploadDocument,
  validate(addDocumentSchema),
  asyncHandler(supplierController.addDocument)
);

module.exports = router;
