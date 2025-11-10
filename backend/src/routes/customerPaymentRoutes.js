/**
 * Payment Routes
 * Handles all payment-related endpoints
 */

const express = require('express');
const router = express.Router();
const paymentIntentController = require('../controllers/payments/paymentIntentController');
const paymentWebhookController = require('../controllers/payments/paymentWebhookController');
const paymentRefundController = require('../controllers/payments/paymentRefundController');

// Middleware for customer authentication (imported in parent routes)
// Assuming req.customer is set by customerAuth middleware

/**
 * Customer Payment Routes
 */

// Create payment intent for an invoice
router.post('/create-intent', paymentIntentController.createPaymentIntent);

// Get payment details
router.get('/:id', paymentIntentController.getPaymentDetails);

// Get payment history for an invoice
router.get('/invoice/:invoiceId', paymentIntentController.getInvoicePayments);

// Get customer's payment history
router.get('/history', paymentIntentController.getCustomerPayments);

module.exports = router;
