const Joi = require('joi');

/**
 * Customer Portal validation schemas
 */

const createQuerySchema = Joi.object({
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(20).required(),
  destination: Joi.string().max(200).required(),
  travelDates: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  }).optional(),
  numberOfTravelers: Joi.number().min(1).max(100).optional(),
  budget: Joi.object({
    min: Joi.number().min(0).optional(),
    max: Joi.number().min(Joi.ref('min')).optional(),
    currency: Joi.string().length(3).default('INR'),
  }).optional(),
  message: Joi.string().max(2000).required(),
  source: Joi.string().valid('website', 'whatsapp', 'email', 'phone', 'chat', 'referral', 'other').default('website'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
});

const submitReviewSchema = Joi.object({
  bookingId: Joi.string().required(),
  overallRating: Joi.number().min(1).max(5).required(),
  ratings: Joi.object({
    serviceQuality: Joi.number().min(1).max(5).optional(),
    valueForMoney: Joi.number().min(1).max(5).optional(),
    communication: Joi.number().min(1).max(5).optional(),
    destinations: Joi.number().min(1).max(5).optional(),
    accommodation: Joi.number().min(1).max(5).optional(),
  }).optional(),
  reviewText: Joi.string().min(10).max(2000).required(),
  photos: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      caption: Joi.string().max(200).optional(),
    })
  ).max(10).optional(),
  highlights: Joi.array().items(Joi.string().max(100)).max(10).optional(),
  wouldRecommend: Joi.boolean().default(true),
  tripDate: Joi.date().max('now').optional(),
  traveledWith: Joi.string().valid('solo', 'couple', 'family', 'friends', 'business').optional(),
});

const getMyQueriesSchema = Joi.object({
  status: Joi.string().valid('new', 'assigned', 'in_progress', 'responded', 'resolved', 'closed', 'spam').optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const getMyQuotesSchema = Joi.object({
  status: Joi.string().valid('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired').optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const getMyBookingsSchema = Joi.object({
  status: Joi.string().valid(
    'pending_confirmation',
    'confirmed',
    'payment_pending',
    'partially_paid',
    'fully_paid',
    'in_progress',
    'completed',
    'cancelled'
  ).optional(),
  upcoming: Joi.boolean().optional(),
  past: Joi.boolean().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const getMyPaymentsSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded').optional(),
  bookingId: Joi.string().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const getMyDocumentsSchema = Joi.object({
  documentType: Joi.string()
    .valid(
      'passport',
      'visa',
      'pan_card',
      'aadhar_card',
      'driving_license',
      'photo',
      'vaccination_certificate',
      'insurance',
      'flight_ticket',
      'hotel_voucher',
      'other'
    )
    .optional(),
  bookingId: Joi.string().optional(),
  verificationStatus: Joi.string().valid('pending', 'in_review', 'verified', 'rejected', 'expired').optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const getExpiringDocumentsSchema = Joi.object({
  days: Joi.number().min(1).max(365).default(90),
});

module.exports = {
  createQuerySchema,
  submitReviewSchema,
  getMyQueriesSchema,
  getMyQuotesSchema,
  getMyBookingsSchema,
  getMyPaymentsSchema,
  getMyDocumentsSchema,
  getExpiringDocumentsSchema,
};
