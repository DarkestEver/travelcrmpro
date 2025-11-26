const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Card details schema
 */
const cardDetailsSchema = Joi.object({
  last4: Joi.string().length(4).pattern(/^\d+$/),
  brand: Joi.string().valid('visa', 'mastercard', 'amex', 'discover', 'other'),
  expiryMonth: Joi.number().min(1).max(12),
  expiryYear: Joi.number().min(new Date().getFullYear()),
});

/**
 * Gateway data schema
 */
const gatewayDataSchema = Joi.object({
  provider: Joi.string().valid('stripe', 'paypal', 'square', 'manual', 'other'),
  gatewayTransactionId: Joi.string().allow(''),
  gatewayResponse: Joi.object(),
});

/**
 * Create payment schema
 */
const createPaymentSchema = Joi.object({
  booking: Joi.string().pattern(objectIdPattern).required(),
  customer: Joi.object({
    name: Joi.string().max(200),
    email: Joi.string().email(),
  }),
  amount: Joi.number().min(0).required(),
  currency: Joi.string().length(3).default('USD'),
  method: Joi.string()
    .valid('credit-card', 'debit-card', 'bank-transfer', 'cash', 'check', 'paypal', 'stripe', 'other')
    .required(),
  cardDetails: cardDetailsSchema,
  status: Joi.string()
    .valid('pending', 'processing', 'completed', 'failed')
    .default('pending'),
  gateway: gatewayDataSchema,
  description: Joi.string().max(500).allow(''),
  internalNotes: Joi.string().max(1000).allow(''),
  receiptNumber: Joi.string().allow(''),
  ipAddress: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).allow(''),
  userAgent: Joi.string().allow(''),
});

/**
 * Update payment status schema
 */
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'processing', 'completed', 'failed', 'cancelled')
    .required(),
  gatewayData: Joi.object({
    transactionId: Joi.string(),
    response: Joi.object(),
  }),
  failureReason: Joi.string().max(500).allow(''),
  failureCode: Joi.string().max(50).allow(''),
});

/**
 * Process refund schema
 */
const processRefundSchema = Joi.object({
  refundAmount: Joi.number().min(0),
  reason: Joi.string().max(500).required(),
  refundTransactionId: Joi.string().allow(''),
});

/**
 * Create payment intent schema (Stripe)
 */
const createPaymentIntentSchema = Joi.object({
  invoiceId: Joi.string().pattern(objectIdPattern).required(),
  paymentMethodTypes: Joi.array()
    .items(Joi.string().valid('card', 'us_bank_account', 'sepa_debit'))
    .default(['card']),
  captureMethod: Joi.string().valid('automatic', 'manual').default('automatic'),
});

/**
 * Process Stripe refund schema
 */
const processStripeRefundSchema = Joi.object({
  amount: Joi.number().min(0), // Optional - defaults to full refund
  reason: Joi.string()
    .valid('duplicate', 'fraudulent', 'requested_by_customer')
    .default('requested_by_customer'),
});

module.exports = {
  createPaymentSchema,
  updateStatusSchema,
  processRefundSchema,
  createPaymentIntentSchema,
  processStripeRefundSchema,
};
