const Joi = require('joi');

/**
 * Quote Validation Schemas
 */

// Customer info schema
const customerSchema = Joi.object({
  name: Joi.string().required().trim().min(2).max(100),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().allow(''),
  address: Joi.object({
    street: Joi.string().trim().allow(''),
    city: Joi.string().trim().allow(''),
    state: Joi.string().trim().allow(''),
    country: Joi.string().trim().allow(''),
    postalCode: Joi.string().trim().allow(''),
  }),
});

// Travel dates schema
const travelDatesSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
});

// Travelers schema
const travelersSchema = Joi.object({
  adults: Joi.number().integer().min(1).required(),
  children: Joi.number().integer().min(0).default(0),
  infants: Joi.number().integer().min(0).default(0),
});

// Line item schema
const lineItemSchema = Joi.object({
  day: Joi.number().integer().min(1).required(),
  itemType: Joi.string()
    .valid('accommodation', 'activity', 'transport', 'meal', 'other')
    .required(),
  description: Joi.string().required().trim().min(5).max(500),
  quantity: Joi.number().min(0).required(),
  unitPrice: Joi.number().min(0).required(),
  total: Joi.number().min(0).required(),
  notes: Joi.string().trim().max(500).allow(''),
});

// Discount schema
const discountSchema = Joi.object({
  name: Joi.string().required().trim().min(3).max(200),
  type: Joi.string().valid('percentage', 'fixed').required(),
  value: Joi.number().min(0).required(),
  amount: Joi.number().min(0),
});

// Tax schema
const taxSchema = Joi.object({
  name: Joi.string().required().trim().min(3).max(200),
  type: Joi.string().valid('percentage', 'fixed').required(),
  value: Joi.number().min(0).required(),
  amount: Joi.number().min(0),
});

// Payment schedule schema
const paymentScheduleSchema = Joi.object({
  dueDate: Joi.date().required(),
  amount: Joi.number().min(0).required(),
  milestone: Joi.string().required().trim().min(3).max(200),
  description: Joi.string().optional().trim().max(500),
  status: Joi.string()
    .valid('pending', 'paid', 'overdue')
    .default('pending'),
});

/**
 * Create Quote Schema
 */
exports.createQuoteSchema = Joi.object({
  itineraryId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
  leadId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  customer: customerSchema,
  title: Joi.string().trim().min(5).max(200),
  validityDays: Joi.number().integer().min(1).max(365).default(7),
  travelDates: travelDatesSchema,
  travelers: travelersSchema,
  discounts: Joi.array().items(discountSchema).default([]),
  taxes: Joi.array().items(taxSchema).default([]),
  paymentSchedule: Joi.array().items(paymentScheduleSchema).default([]),
  inclusions: Joi.array().items(Joi.string().trim().min(3).max(500)).default([]),
  exclusions: Joi.array().items(Joi.string().trim().min(3).max(500)).default([]),
  termsAndConditions: Joi.string().trim().max(5000).allow(''),
  cancellationPolicy: Joi.string().trim().max(2000).allow(''),
  internalNotes: Joi.string().trim().max(2000).allow(''),
  tags: Joi.array().items(Joi.string().trim()).default([]),
});

/**
 * Update Quote Schema
 */
exports.updateQuoteSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200),
  customer: customerSchema,
  travelDates: travelDatesSchema,
  travelers: travelersSchema,
  lineItems: Joi.array().items(lineItemSchema).min(1),
  pricing: Joi.object({
    subtotal: Joi.number().min(0).required(),
    discounts: Joi.array().items(discountSchema).default([]),
    discountTotal: Joi.number().min(0).default(0),
    taxes: Joi.array().items(taxSchema).default([]),
    taxTotal: Joi.number().min(0).default(0),
    grandTotal: Joi.number().min(0).required(),
    currency: Joi.string().length(3).uppercase().default('USD'),
  }),
  paymentSchedule: Joi.array().items(paymentScheduleSchema),
  validUntil: Joi.date().greater('now'),
  inclusions: Joi.array().items(Joi.string().trim().min(3).max(500)),
  exclusions: Joi.array().items(Joi.string().trim().min(3).max(500)),
  termsAndConditions: Joi.string().trim().max(5000).allow(''),
  cancellationPolicy: Joi.string().trim().max(2000).allow(''),
  internalNotes: Joi.string().trim().max(2000).allow(''),
  tags: Joi.array().items(Joi.string().trim()),
}).min(1);

/**
 * Send Quote Schema
 */
exports.sendQuoteSchema = Joi.object({
  recipientEmail: Joi.string().email(),
  message: Joi.string().trim().max(1000).allow(''),
  ccEmails: Joi.array().items(Joi.string().email()).default([]),
});

/**
 * Approve Quote Schema
 */
exports.approveQuoteSchema = Joi.object({
  customerName: Joi.string().trim().min(2).max(100),
  notes: Joi.string().trim().max(500).allow(''),
});

/**
 * Reject Quote Schema
 */
exports.rejectQuoteSchema = Joi.object({
  reason: Joi.string().required().trim().min(5).max(500),
});

/**
 * Revise Quote Schema (create new version)
 */
exports.reviseQuoteSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200),
  customer: customerSchema,
  travelDates: travelDatesSchema,
  travelers: travelersSchema,
  lineItems: Joi.array().items(lineItemSchema).min(1),
  discounts: Joi.array().items(discountSchema),
  taxes: Joi.array().items(taxSchema),
  paymentSchedule: Joi.array().items(paymentScheduleSchema),
  validityDays: Joi.number().integer().min(1).max(365),
  inclusions: Joi.array().items(Joi.string().trim().min(3).max(500)),
  exclusions: Joi.array().items(Joi.string().trim().min(3).max(500)),
  termsAndConditions: Joi.string().trim().max(5000).allow(''),
  cancellationPolicy: Joi.string().trim().max(2000).allow(''),
  internalNotes: Joi.string().trim().max(2000).allow(''),
  tags: Joi.array().items(Joi.string().trim()),
}).min(1);

/**
 * Query Parameters Schema
 */
exports.queryParamsSchema = Joi.object({
  status: Joi.string().valid(
    'draft',
    'sent',
    'viewed',
    'approved',
    'rejected',
    'expired',
    'converted'
  ),
  customerId: Joi.string().email(),
  leadId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  dateFrom: Joi.date(),
  dateTo: Joi.date().when('dateFrom', {
    is: Joi.exist(),
    then: Joi.date().greater(Joi.ref('dateFrom')),
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string()
    .valid(
      'createdAt',
      '-createdAt',
      'validUntil',
      '-validUntil',
      'pricing.grandTotal',
      '-pricing.grandTotal',
      'quoteNumber',
      '-quoteNumber'
    )
    .default('-createdAt'),
});

/**
 * Expiring Quotes Query Schema
 */
exports.expiringQuotesQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(90).default(7),
});

/**
 * Stats Query Schema
 */
exports.statsQuerySchema = Joi.object({
  userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
});
