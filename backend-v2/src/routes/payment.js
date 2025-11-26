const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');
const asyncHandler = require('../middleware/asyncHandler');
const {
  createPaymentSchema,
  updateStatusSchema,
  processRefundSchema,
  createPaymentIntentSchema,
  processStripeRefundSchema,
} = require('../validation/paymentSchemas');

// Webhook endpoint (no authentication - verified by Stripe signature)
/**
 * POST /api/v1/payments/webhooks/stripe
 * Stripe webhook handler
 */
router.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }), // Need raw body for signature verification
  asyncHandler(paymentController.handleStripeWebhook)
);

// All other routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/payments/stats
 * Get payment statistics
 */
router.get(
  '/stats',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(paymentController.getPaymentStats)
);

/**
 * POST /api/v1/payments/create-intent
 * Create Stripe payment intent
 */
router.post(
  '/create-intent',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(createPaymentIntentSchema),
  asyncHandler(paymentController.createPaymentIntent)
);

/**
 * GET /api/v1/payments/intent/:paymentIntentId
 * Get payment intent status
 */
router.get(
  '/intent/:paymentIntentId',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  asyncHandler(paymentController.getPaymentIntentStatus)
);

/**
 * GET /api/v1/payments
 * Get all payments
 */
router.get(
  '/',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(paymentController.getAllPayments)
);

/**
 * POST /api/v1/payments
 * Create payment
 */
router.post(
  '/',
  checkRole(USER_ROLES.TENANT_ADMIN),
  validate(createPaymentSchema),
  asyncHandler(paymentController.createPayment)
);

/**
 * GET /api/v1/payments/:id
 * Get payment by ID
 */
router.get(
  '/:id',
  checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(paymentController.getPaymentById)
);

/**
 * PATCH /api/v1/payments/:id/status
 * Update payment status
 */
router.patch(
  '/:id/status',
  checkRole(USER_ROLES.TENANT_ADMIN),
  validate(updateStatusSchema),
  asyncHandler(paymentController.updatePaymentStatus)
);

/**
 * POST /api/v1/payments/:id/refund
 * Process refund
 */
router.post(
  '/:id/refund',
  checkRole(USER_ROLES.TENANT_ADMIN),
  validate(processRefundSchema),
  asyncHandler(paymentController.processRefund)
);

/**
 * POST /api/v1/payments/:id/stripe-refund
 * Process Stripe refund
 */
router.post(
  '/:id/stripe-refund',
  checkRole(USER_ROLES.TENANT_ADMIN),
  validate(processStripeRefundSchema),
  asyncHandler(paymentController.processStripeRefund)
);

module.exports = router;
