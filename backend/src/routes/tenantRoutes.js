const express = require('express');
const router = express.Router();
const {
  getAllTenants,
  getTenant,
  createTenant,
  updateTenant,
  updateSubscription,
  suspendTenant,
  activateTenant,
  deleteTenant,
  getTenantStats,
  getCurrentTenant,
} = require('../controllers/tenantController');
const { protect, restrictTo } = require('../middleware/auth');
const { identifyTenant } = require('../middleware/tenant');

// Public route - tenant registration
router.post('/', createTenant);

// Protected routes - require authentication
router.use(protect);

// Get current tenant (from context)
router.get('/current', identifyTenant, getCurrentTenant);

// Super admin only routes
router.get('/', restrictTo('super_admin'), getAllTenants);
router.get('/:id', getTenant); // Tenant owner or super admin
router.patch('/:id', updateTenant); // Tenant owner or super admin
router.patch('/:id/subscription', restrictTo('super_admin'), updateSubscription);
router.patch('/:id/suspend', restrictTo('super_admin'), suspendTenant);
router.patch('/:id/activate', restrictTo('super_admin'), activateTenant);
router.delete('/:id', restrictTo('super_admin'), deleteTenant);
router.get('/:id/stats', getTenantStats); // Tenant owner or super admin

module.exports = router;
