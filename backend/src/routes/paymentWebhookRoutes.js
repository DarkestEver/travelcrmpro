/**
 * Payment Webhook Routes
 * Handles Stripe webhook events (no authentication needed)
 */

const express = require('express');
const router = express.Router();
const paymentWebhookController = require('../controllers/payments/paymentWebhookController');

/**
 * Stripe Webhook Endpoint
 * Note: This endpoint requires raw body for signature verification
 * Make sure to configure express.raw() middleware in main app
 */
router.post('/webhook', paymentWebhookController.handleWebhook);

module.exports = router;
