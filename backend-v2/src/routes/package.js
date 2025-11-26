const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { USER_ROLES } = require('../config/constants');

/**
 * Package Routes
 * All routes require authentication (applied globally)
 */

// All routes require authentication
router.use(authenticate);

// Statistics (Tenant Admin, Super Admin only)
router.get(
  '/statistics',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(packageController.getPackageStatistics)
);

// Public browsing
router.get(
  '/browse',
  asyncHandler(packageController.browsePackages)
);

// Featured packages
router.get(
  '/featured',
  asyncHandler(packageController.getFeaturedPackages)
);

// Popular packages
router.get(
  '/popular',
  asyncHandler(packageController.getPopularPackages)
);

// Bulk operations (Tenant Admin, Super Admin only)
router.put(
  '/bulk/visibility',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(packageController.bulkUpdateVisibility)
);

router.put(
  '/bulk/status',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(packageController.bulkUpdateStatus)
);

router.delete(
  '/bulk',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(packageController.bulkDeletePackages)
);

// Create package (Tenant Admin, Super Admin only)
router.post(
  '/',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(packageController.createPackage)
);

// Get all packages (with filters)
router.get(
  '/',
  asyncHandler(packageController.getAllPackages)
);

// Package by slug
router.get(
  '/slug/:slug',
  asyncHandler(packageController.getPackageBySlug)
);

// Clone package (Tenant Admin, Super Admin only)
router.post(
  '/:id/clone',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(packageController.clonePackage)
);

// Calculate price
router.post(
  '/:id/calculate-price',
  asyncHandler(packageController.calculatePrice)
);

// Check availability
router.post(
  '/:id/check-availability',
  asyncHandler(packageController.checkAvailability)
);

// Get package by ID
router.get(
  '/:id',
  asyncHandler(packageController.getPackageById)
);

// Update package (Tenant Admin, Super Admin only)
router.put(
  '/:id',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(packageController.updatePackage)
);

// Delete package (Tenant Admin, Super Admin only)
router.delete(
  '/:id',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(packageController.deletePackage)
);

module.exports = router;
