/**
 * Agent Payment Routes
 * Handles payment management for agents/admins
 */

const express = require('express');
const router = express.Router();
const paymentRefundController = require('../controllers/payments/paymentRefundController');

// All routes require agent authentication (handled by parent router)

/**
 * Agent Payment Management Routes
 */

// Get all payments for tenant
router.get('/', paymentRefundController.getAllPayments);

// Get payment details (agent view)
router.get('/:id', paymentRefundController.getPaymentDetails);

// Process refund
router.post('/:id/refund', paymentRefundController.processRefund);

module.exports = router;
