const express = require('express');
const router = express.Router();
const {
  getAdjustments,
  getAdjustment,
  createAdjustment,
  updateAdjustment,
  approveAdjustment,
  rejectAdjustment,
  reverseAdjustment,
  getBookingAdjustments,
  getPendingApprovals,
  getFinancialSummary,
  bulkApprove,
} = require('../controllers/adjustmentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and finance role
router.use(protect);
router.use(authorize('finance', 'admin', 'agency_owner'));

// General adjustment routes
router.route('/')
  .get(getAdjustments)
  .post(createAdjustment);

// Pending approvals
router.get('/pending-approvals', getPendingApprovals);

// Financial summary
router.get('/summary', getFinancialSummary);

// Bulk operations
router.post('/bulk-approve', bulkApprove);

// Booking-specific adjustments
router.get('/booking/:bookingId', getBookingAdjustments);

// Single adjustment routes
router.route('/:id')
  .get(getAdjustment)
  .put(updateAdjustment);

// Approval/rejection routes
router.post('/:id/approve', approveAdjustment);
router.post('/:id/reject', rejectAdjustment);
router.post('/:id/reverse', reverseAdjustment);

module.exports = router;
