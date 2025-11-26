const express = require('express');
const router = express.Router();
const customerPortalController = require('../controllers/customerPortalController');
const { validate, validateQuery } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { USER_ROLES } = require('../config/constants');
const {
  createQuerySchema,
  submitReviewSchema,
  getMyQueriesSchema,
  getMyQuotesSchema,
  getMyBookingsSchema,
  getMyPaymentsSchema,
  getMyDocumentsSchema,
  getExpiringDocumentsSchema,
} = require('../validation/customerPortalSchemas');

// Apply authentication to all customer portal routes
router.use(authenticate);
router.use(checkRole(USER_ROLES.CUSTOMER)); // Customer role only

/**
 * Dashboard
 */
router.get('/dashboard', customerPortalController.getDashboard);

/**
 * Query routes
 */
router.get('/queries', validateQuery(getMyQueriesSchema), customerPortalController.getMyQueries);
router.get('/queries/:id', customerPortalController.getQueryById);
router.post('/queries', validate(createQuerySchema), customerPortalController.createQuery);

/**
 * Quote routes
 */
router.get('/quotes', validateQuery(getMyQuotesSchema), customerPortalController.getMyQuotes);
router.get('/quotes/:id', customerPortalController.getQuoteById);

/**
 * Booking routes
 */
router.get('/bookings', validateQuery(getMyBookingsSchema), customerPortalController.getMyBookings);
router.get('/bookings/:id', customerPortalController.getBookingById);
router.get('/bookings/:id/payments', customerPortalController.getBookingPayments);

/**
 * Payment routes
 */
router.get('/payments', validateQuery(getMyPaymentsSchema), customerPortalController.getMyPayments);
router.get('/payments/:id', customerPortalController.getPaymentById);

/**
 * Document routes
 */
router.get('/documents', validateQuery(getMyDocumentsSchema), customerPortalController.getMyDocuments);
router.get('/documents/expiring', validateQuery(getExpiringDocumentsSchema), customerPortalController.getExpiringDocuments);

/**
 * Review routes
 */
router.post('/reviews', validate(submitReviewSchema), customerPortalController.submitReview);
router.get('/reviews', customerPortalController.getMyReviews);

module.exports = router;
