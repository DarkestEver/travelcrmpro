const express = require('express');
const router = express.Router();
const {
  getAllSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  approveSupplier,
  suspendSupplier,
  reactivateSupplier,
  deleteSupplier,
  updateSupplierRating,
  getSupplierStats,
} = require('../controllers/supplierController');
const {
  getSupplierDashboardStats,
  getSupplierBookings,
  updateBookingStatus,
} = require('../controllers/supplierPortalController');
const { protect, restrictTo, loadSupplier } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

// All routes require authentication
router.use(protect);

// Stats route - MUST be before /:id routes
router.get('/stats', restrictTo('super_admin', 'operator'), getSupplierStats);

// Supplier portal routes - for logged-in suppliers
router.get('/dashboard-stats', restrictTo('supplier'), getSupplierDashboardStats);
router.get('/my-bookings', restrictTo('supplier'), getSupplierBookings);
router.put('/bookings/:bookingId/status', restrictTo('supplier'), auditLogger('update', 'booking'), updateBookingStatus);

// Public supplier routes
router.get('/', getAllSuppliers);
router.post('/', restrictTo('super_admin', 'operator', 'supplier'), auditLogger('create', 'supplier'), createSupplier);

// Supplier-specific routes
router.get('/:id', getSupplier);
router.put('/:id', auditLogger('update', 'supplier'), updateSupplier);

// Admin-only routes
router.patch('/:id/approve', restrictTo('super_admin', 'operator'), auditLogger('update', 'supplier'), approveSupplier);
router.patch('/:id/suspend', restrictTo('super_admin', 'operator'), auditLogger('update', 'supplier'), suspendSupplier);
router.patch('/:id/reactivate', restrictTo('super_admin', 'operator'), auditLogger('update', 'supplier'), reactivateSupplier);
router.delete('/:id', restrictTo('super_admin'), auditLogger('delete', 'supplier'), deleteSupplier);
router.patch('/:id/rating', restrictTo('super_admin', 'operator'), auditLogger('update', 'supplier'), updateSupplierRating);

module.exports = router;
