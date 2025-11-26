const Joi = require('joi');

/**
 * Rate List Validation Schemas
 */

/**
 * Seasonal Pricing Schema
 */
const seasonalPricingSchema = Joi.object({
  name: Joi.string().required().trim(),
  type: Joi.string()
    .valid('peak', 'normal', 'off')
    .required(),
  dateRanges: Joi.array()
    .items(
      Joi.object({
        from: Joi.date().required(),
        to: Joi.date().greater(Joi.ref('from')).required(),
      })
    )
    .min(1)
    .required(),
  pricePerUnit: Joi.number().min(0).required(),
  markup: Joi.number().min(0).max(100).default(0),
});

/**
 * Occupancy Pricing Schema
 */
const occupancyPricingSchema = Joi.object({
  type: Joi.string()
    .valid('single', 'double', 'triple', 'quad', 'suite')
    .required(),
  pricePerNight: Joi.number().min(0).required(),
  maxOccupants: Joi.number().min(1).required(),
});

/**
 * Age-based Pricing Schema
 */
const ageBasedPricingSchema = Joi.object({
  category: Joi.string()
    .valid('adult', 'child', 'infant', 'senior')
    .required(),
  ageFrom: Joi.number().min(0).required(),
  ageTo: Joi.number().greater(Joi.ref('ageFrom')).required(),
  price: Joi.number().min(0).required(),
});

/**
 * Bulk Discount Schema
 */
const bulkDiscountSchema = Joi.object({
  minQuantity: Joi.number().min(1).required(),
  maxQuantity: Joi.number().min(Joi.ref('minQuantity')),
  discountType: Joi.string().valid('percentage', 'fixed').required(),
  discountValue: Joi.number().min(0).required(),
});

/**
 * Additional Charge Schema
 */
const additionalChargeSchema = Joi.object({
  name: Joi.string().required().trim(),
  price: Joi.number().min(0).required(),
  isMandatory: Joi.boolean().default(false),
  applicableFor: Joi.string()
    .valid('per_person', 'per_booking', 'per_night', 'per_day')
    .required(),
});

/**
 * Blackout Date Schema
 */
const blackoutDateSchema = Joi.object({
  from: Joi.date().required(),
  to: Joi.date().greater(Joi.ref('from')).required(),
  reason: Joi.string().trim(),
});

/**
 * Cancellation Policy Schema
 */
const cancellationPolicySchema = Joi.object({
  daysBeforeCheckIn: Joi.number().min(0).required(),
  refundPercentage: Joi.number().min(0).max(100).required(),
});

/**
 * Create Rate List Schema
 */
exports.createRateListSchema = Joi.object({
  supplierId: Joi.string().required(),
  name: Joi.string().required().trim().max(200),
  serviceType: Joi.string()
    .valid('hotel', 'transport', 'activity', 'meal', 'guide', 'other')
    .required(),
  validFrom: Joi.date().required(),
  validTo: Joi.date().greater(Joi.ref('validFrom')).required(),
  isActive: Joi.boolean().default(true),

  destination: Joi.object({
    city: Joi.string().trim(),
    state: Joi.string().trim(),
    country: Joi.string().trim(),
  }),

  pricing: Joi.object({
    baseType: Joi.string()
      .valid('per_night', 'per_person', 'per_trip', 'per_hour', 'per_day')
      .required(),
    baseCurrency: Joi.string().default('USD').uppercase(),
    seasonal: Joi.array().items(seasonalPricingSchema),
    occupancy: Joi.array().items(occupancyPricingSchema),
    ageBased: Joi.array().items(ageBasedPricingSchema),
    bulkDiscounts: Joi.array().items(bulkDiscountSchema),
    additionalCharges: Joi.array().items(additionalChargeSchema),
  }).required(),

  availability: Joi.object({
    minNights: Joi.number().min(1),
    maxNights: Joi.number().min(Joi.ref('minNights')),
    minPax: Joi.number().min(1).default(1),
    maxPax: Joi.number().min(Joi.ref('minPax')),
    advanceBookingDays: Joi.number().min(0).default(0),
    cutoffHours: Joi.number().min(0).default(24),
    blackoutDates: Joi.array().items(blackoutDateSchema),
    weeklyAvailability: Joi.object({
      monday: Joi.boolean().default(true),
      tuesday: Joi.boolean().default(true),
      wednesday: Joi.boolean().default(true),
      thursday: Joi.boolean().default(true),
      friday: Joi.boolean().default(true),
      saturday: Joi.boolean().default(true),
      sunday: Joi.boolean().default(true),
    }),
  }),

  cancellationPolicy: Joi.array().items(cancellationPolicySchema),
  inclusions: Joi.array().items(Joi.string().trim()),
  exclusions: Joi.array().items(Joi.string().trim()),
  description: Joi.string().trim().max(2000),
  notes: Joi.string().trim().max(1000),
});

/**
 * Update Rate List Schema
 */
exports.updateRateListSchema = Joi.object({
  name: Joi.string().trim().max(200),
  validFrom: Joi.date(),
  validTo: Joi.date(),
  isActive: Joi.boolean(),

  destination: Joi.object({
    city: Joi.string().trim(),
    state: Joi.string().trim(),
    country: Joi.string().trim(),
  }),

  pricing: Joi.object({
    baseType: Joi.string().valid(
      'per_night',
      'per_person',
      'per_trip',
      'per_hour',
      'per_day'
    ),
    baseCurrency: Joi.string().uppercase(),
    seasonal: Joi.array().items(seasonalPricingSchema),
    occupancy: Joi.array().items(occupancyPricingSchema),
    ageBased: Joi.array().items(ageBasedPricingSchema),
    bulkDiscounts: Joi.array().items(bulkDiscountSchema),
    additionalCharges: Joi.array().items(additionalChargeSchema),
  }),

  availability: Joi.object({
    minNights: Joi.number().min(1),
    maxNights: Joi.number(),
    minPax: Joi.number().min(1),
    maxPax: Joi.number(),
    advanceBookingDays: Joi.number().min(0),
    cutoffHours: Joi.number().min(0),
    blackoutDates: Joi.array().items(blackoutDateSchema),
    weeklyAvailability: Joi.object({
      monday: Joi.boolean(),
      tuesday: Joi.boolean(),
      wednesday: Joi.boolean(),
      thursday: Joi.boolean(),
      friday: Joi.boolean(),
      saturday: Joi.boolean(),
      sunday: Joi.boolean(),
    }),
  }),

  cancellationPolicy: Joi.array().items(cancellationPolicySchema),
  inclusions: Joi.array().items(Joi.string().trim()),
  exclusions: Joi.array().items(Joi.string().trim()),
  description: Joi.string().trim().max(2000),
  notes: Joi.string().trim().max(1000),
}).min(1); // At least one field must be present

/**
 * Calculate Price Schema
 */
exports.calculatePriceSchema = Joi.object({
  date: Joi.date().required(),
  nights: Joi.number().min(1).default(1),
  pax: Joi.number().min(1).default(1),
  ageBreakdown: Joi.object({
    adults: Joi.number().min(0).default(0),
    children: Joi.number().min(0).default(0),
    infants: Joi.number().min(0).default(0),
    seniors: Joi.number().min(0).default(0),
  }),
  occupancyType: Joi.string().valid('single', 'double', 'triple', 'quad', 'suite'),
});

/**
 * Validate Dates Schema
 */
exports.validateDatesSchema = Joi.object({
  supplierId: Joi.string().required(),
  serviceType: Joi.string()
    .valid('hotel', 'transport', 'activity', 'meal', 'guide', 'other')
    .required(),
  validFrom: Joi.date().required(),
  validTo: Joi.date().greater(Joi.ref('validFrom')).required(),
  excludeId: Joi.string(),
});

/**
 * Bulk Update Schema
 */
exports.bulkUpdateSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).required(),
  updates: Joi.object({
    status: Joi.string().valid('draft', 'published', 'archived'),
    isActive: Joi.boolean(),
  }).min(1).required(),
});

/**
 * Clone Rate List Schema
 */
exports.cloneRateListSchema = Joi.object({
  name: Joi.string().trim().max(200),
  validFrom: Joi.date(),
  validTo: Joi.date(),
});

/**
 * Query Params Schema
 */
exports.queryParamsSchema = Joi.object({
  supplierId: Joi.string(),
  serviceType: Joi.string().valid('hotel', 'transport', 'activity', 'meal', 'guide', 'other'),
  destination: Joi.string().trim(),
  validOn: Joi.date(),
  status: Joi.string().valid('draft', 'published', 'archived'),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sort: Joi.string().default('-createdAt'),
});
