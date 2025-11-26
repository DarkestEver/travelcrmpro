const Joi = require('joi');

/**
 * Schema for creating a lead
 */
const createLeadSchema = Joi.object({
  source: Joi.string().valid('website', 'phone', 'email', 'referral', 'walk-in', 'social-media', 'advertisement', 'other'),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'proposal-sent', 'negotiation', 'won', 'lost', 'closed'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  customer: Joi.object({
    name: Joi.string().trim().min(1).max(200).required(),
    email: Joi.string().email().trim().lowercase().required(),
    phone: Joi.string().trim().required(),
    country: Joi.string().trim().max(100),
    city: Joi.string().trim().max(100),
  }).required(),
  requirements: Joi.object({
    destination: Joi.string().trim().max(200),
    travelDates: Joi.object({
      startDate: Joi.date(),
      endDate: Joi.date().min(Joi.ref('startDate')),
      flexible: Joi.boolean(),
    }),
    numberOfTravelers: Joi.object({
      adults: Joi.number().integer().min(0).max(100),
      children: Joi.number().integer().min(0).max(100),
      infants: Joi.number().integer().min(0).max(100),
    }),
    budget: Joi.object({
      min: Joi.number().min(0),
      max: Joi.number().min(Joi.ref('min')),
      currency: Joi.string().length(3).uppercase(),
    }),
    packageType: Joi.string().valid('budget', 'standard', 'luxury', 'custom'),
    specialRequirements: Joi.string().trim().max(1000),
  }),
  assignedTo: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  followUpDate: Joi.date(),
  expectedCloseDate: Joi.date(),
  estimatedValue: Joi.object({
    amount: Joi.number().min(0),
    currency: Joi.string().length(3).uppercase(),
  }),
  tags: Joi.array().items(Joi.string().trim().max(50)),
});

/**
 * Schema for updating a lead
 */
const updateLeadSchema = Joi.object({
  source: Joi.string().valid('website', 'phone', 'email', 'referral', 'walk-in', 'social-media', 'advertisement', 'other'),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'proposal-sent', 'negotiation', 'won', 'lost', 'closed'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  customer: Joi.object({
    name: Joi.string().trim().min(1).max(200),
    email: Joi.string().email().trim().lowercase(),
    phone: Joi.string().trim(),
    country: Joi.string().trim().max(100),
    city: Joi.string().trim().max(100),
  }),
  requirements: Joi.object({
    destination: Joi.string().trim().max(200),
    travelDates: Joi.object({
      startDate: Joi.date(),
      endDate: Joi.date().min(Joi.ref('startDate')),
      flexible: Joi.boolean(),
    }),
    numberOfTravelers: Joi.object({
      adults: Joi.number().integer().min(0).max(100),
      children: Joi.number().integer().min(0).max(100),
      infants: Joi.number().integer().min(0).max(100),
    }),
    budget: Joi.object({
      min: Joi.number().min(0),
      max: Joi.number().min(Joi.ref('min')),
      currency: Joi.string().length(3).uppercase(),
    }),
    packageType: Joi.string().valid('budget', 'standard', 'luxury', 'custom'),
    specialRequirements: Joi.string().trim().max(1000),
  }),
  assignedTo: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null),
  followUpDate: Joi.date().allow(null),
  expectedCloseDate: Joi.date().allow(null),
  estimatedValue: Joi.object({
    amount: Joi.number().min(0),
    currency: Joi.string().length(3).uppercase(),
  }),
  tags: Joi.array().items(Joi.string().trim().max(50)),
  lossReason: Joi.string().valid('price', 'timing', 'competitor', 'no-response', 'not-interested', 'other'),
  lossNotes: Joi.string().trim().max(500),
}).min(1);

/**
 * Schema for adding a note
 */
const addNoteSchema = Joi.object({
  note: Joi.string().trim().min(1).max(2000).required(),
});

/**
 * Schema for assigning a lead
 */
const assignLeadSchema = Joi.object({
  assignedTo: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
});

/**
 * Schema for converting to booking
 */
const convertLeadSchema = Joi.object({
  bookingId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  addNoteSchema,
  assignLeadSchema,
  convertLeadSchema,
};
