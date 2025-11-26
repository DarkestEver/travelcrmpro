const Joi = require('joi');

// ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Customer schema
 */
const customerSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string().trim().allow(''),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    country: Joi.string().allow(''),
    postalCode: Joi.string().allow(''),
  }),
});

/**
 * Traveler schema
 */
const travelerSchema = Joi.object({
  type: Joi.string().valid('adult', 'child', 'infant').required(),
  firstName: Joi.string().trim().max(100).required(),
  lastName: Joi.string().trim().max(100).required(),
  dateOfBirth: Joi.date().allow(null),
  passportNumber: Joi.string().trim().allow(''),
  passportExpiry: Joi.date().allow(null),
  nationality: Joi.string().allow(''),
  specialRequests: Joi.string().max(500).allow(''),
});

/**
 * Payment schema
 */
const paymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  currency: Joi.string().length(3).default('USD'),
  method: Joi.string().valid('credit-card', 'debit-card', 'bank-transfer', 'cash', 'check', 'other').required(),
  status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded').default('pending'),
  transactionId: Joi.string().allow(''),
  reference: Joi.string().allow(''),
  notes: Joi.string().max(500).allow(''),
  receiptUrl: Joi.string().uri().allow(''),
});

/**
 * Pricing schema
 */
const pricingSchema = Joi.object({
  basePrice: Joi.number().min(0).required(),
  currency: Joi.string().length(3).default('USD'),
  taxes: Joi.number().min(0).default(0),
  discount: Joi.number().min(0).default(0),
  totalPrice: Joi.number().min(0).required(),
  depositAmount: Joi.number().min(0).default(0),
  depositDueDate: Joi.date().allow(null),
});

/**
 * Create booking schema
 */
const createBookingSchema = Joi.object({
  itinerary: Joi.string().pattern(objectIdPattern).required(),
  lead: Joi.string().pattern(objectIdPattern).allow(null),
  customer: customerSchema.required(),
  travelers: Joi.array().items(travelerSchema).min(1).required(),
  travelStartDate: Joi.date().required(),
  travelEndDate: Joi.date().greater(Joi.ref('travelStartDate')).required(),
  pricing: pricingSchema.required(),
  payments: Joi.array().items(paymentSchema).default([]),
  specialRequests: Joi.string().max(1000).allow(''),
  internalNotes: Joi.string().max(1000).allow(''),
  customerNotes: Joi.string().max(1000).allow(''),
});

/**
 * Update booking schema
 */
const updateBookingSchema = Joi.object({
  customer: customerSchema,
  travelers: Joi.array().items(travelerSchema).min(1),
  travelStartDate: Joi.date(),
  travelEndDate: Joi.date(),
  pricing: pricingSchema,
  specialRequests: Joi.string().max(1000).allow(''),
  internalNotes: Joi.string().max(1000).allow(''),
  customerNotes: Joi.string().max(1000).allow(''),
}).min(1);

/**
 * Update booking status schema
 */
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed').required(),
  reason: Joi.string().max(500).allow(''),
  notes: Joi.string().max(500).allow(''),
});

/**
 * Add payment schema
 */
const addPaymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  currency: Joi.string().length(3).default('USD'),
  method: Joi.string().valid('credit-card', 'debit-card', 'bank-transfer', 'cash', 'check', 'other').required(),
  status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded').default('completed'),
  transactionId: Joi.string().allow(''),
  reference: Joi.string().allow(''),
  notes: Joi.string().max(500).allow(''),
  receiptUrl: Joi.string().uri().allow(''),
});

/**
 * Update payment schema
 */
const updatePaymentSchema = Joi.object({
  amount: Joi.number().min(0),
  method: Joi.string().valid('credit-card', 'debit-card', 'bank-transfer', 'cash', 'check', 'other'),
  status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded'),
  transactionId: Joi.string().allow(''),
  reference: Joi.string().allow(''),
  notes: Joi.string().max(500).allow(''),
  receiptUrl: Joi.string().uri().allow(''),
}).min(1);

/**
 * Add document schema
 */
const addDocumentSchema = Joi.object({
  name: Joi.string().max(200).required(),
  type: Joi.string().valid('invoice', 'voucher', 'receipt', 'contract', 'confirmation', 'other').required(),
  url: Joi.string().uri().required(),
});

module.exports = {
  createBookingSchema,
  updateBookingSchema,
  updateStatusSchema,
  addPaymentSchema,
  updatePaymentSchema,
  addDocumentSchema,
};
