const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const asyncHandler = require('../middleware/asyncHandler');
const { USER_ROLES } = require('../config/constants');
const {
  createBookingSchema,
  updateBookingSchema,
  updateStatusSchema,
  addPaymentSchema,
  updatePaymentSchema,
  addDocumentSchema,
} = require('../validation/bookingSchemas');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/bookings/stats
 * Get booking statistics
 */
router.get(
  '/stats',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(bookingController.getBookingStats)
);

/**
 * GET /api/v1/bookings
 * Get all bookings with filtering
 */
router.get(
  '/',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(bookingController.getAllBookings)
);

/**
 * POST /api/v1/bookings
 * Create new booking
 */
router.post(
  '/',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(createBookingSchema),
  asyncHandler(bookingController.createBooking)
);

/**
 * GET /api/v1/bookings/:id
 * Get single booking
 */
router.get(
  '/:id',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(bookingController.getBooking)
);

/**
 * PUT /api/v1/bookings/:id
 * Update booking
 */
router.put(
  '/:id',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(updateBookingSchema),
  asyncHandler(bookingController.updateBooking)
);

/**
 * DELETE /api/v1/bookings/:id
 * Delete booking (admin only)
 */
router.delete(
  '/:id',
  checkRole(USER_ROLES.TENANT_ADMIN),
  asyncHandler(bookingController.deleteBooking)
);

/**
 * PATCH /api/v1/bookings/:id/status
 * Update booking status
 */
router.patch(
  '/:id/status',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(updateStatusSchema),
  asyncHandler(bookingController.updateBookingStatus)
);

/**
 * POST /api/v1/bookings/:id/payments
 * Add payment to booking
 */
router.post(
  '/:id/payments',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(addPaymentSchema),
  asyncHandler(bookingController.addPayment)
);

/**
 * PUT /api/v1/bookings/:id/payments/:paymentId
 * Update payment
 */
router.put(
  '/:id/payments/:paymentId',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(updatePaymentSchema),
  asyncHandler(bookingController.updatePayment)
);

/**
 * POST /api/v1/bookings/:id/documents
 * Add document to booking
 */
router.post(
  '/:id/documents',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(addDocumentSchema),
  asyncHandler(bookingController.addDocument)
);

module.exports = router;
