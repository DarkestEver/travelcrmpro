const Joi = require('joi');

/**
 * Booking review submission schema
 */
exports.submitBookingReview = Joi.object({
  overallRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5',
      'any.required': 'Overall rating is required',
    }),
  
  ratings: Joi.object({
    accommodation: Joi.number().integer().min(1).max(5),
    transportation: Joi.number().integer().min(1).max(5),
    activities: Joi.number().integer().min(1).max(5),
    food: Joi.number().integer().min(1).max(5),
    guide: Joi.number().integer().min(1).max(5),
    valueForMoney: Joi.number().integer().min(1).max(5),
  }),

  title: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Review title is required',
    }),

  reviewText: Joi.string()
    .trim()
    .min(50)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Review text must be at least 50 characters',
      'string.max': 'Review text must not exceed 5000 characters',
      'any.required': 'Review text is required',
    }),

  photos: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .messages({
      'array.max': 'You can upload up to 10 photos',
    }),

  pros: Joi.array()
    .items(Joi.string().trim().min(3).max(200))
    .max(10),

  cons: Joi.array()
    .items(Joi.string().trim().min(3).max(200))
    .max(10),

  highlights: Joi.array()
    .items(Joi.string().trim().min(3).max(200))
    .max(10),

  wouldRecommend: Joi.boolean(),

  tripDate: Joi.date(),

  tripDuration: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.min': 'Trip duration must be at least 1 day',
    }),

  traveledWith: Joi.string()
    .valid('solo', 'couple', 'family', 'friends', 'business', 'group')
    .messages({
      'any.only': 'Invalid travel companion type',
    }),
});

/**
 * Supplier review submission schema
 */
exports.submitSupplierReview = Joi.object({
  overallRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5',
      'any.required': 'Overall rating is required',
    }),

  title: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Review title is required',
    }),

  reviewText: Joi.string()
    .trim()
    .min(20)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Review text must be at least 20 characters',
      'string.max': 'Review text must not exceed 2000 characters',
      'any.required': 'Review text is required',
    }),
});

/**
 * Agent review submission schema
 */
exports.submitAgentReview = Joi.object({
  overallRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5',
      'any.required': 'Overall rating is required',
    }),

  ratings: Joi.object({
    responsiveness: Joi.number().integer().min(1).max(5),
    professionalism: Joi.number().integer().min(1).max(5),
    knowledge: Joi.number().integer().min(1).max(5),
  }),

  title: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Review title is required',
    }),

  reviewText: Joi.string()
    .trim()
    .min(20)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Review text must be at least 20 characters',
      'string.max': 'Review text must not exceed 2000 characters',
      'any.required': 'Review text is required',
    }),
});

/**
 * Update review schema (before moderation)
 */
exports.updateReview = Joi.object({
  overallRating: Joi.number().integer().min(1).max(5),
  
  ratings: Joi.object({
    accommodation: Joi.number().integer().min(1).max(5),
    transportation: Joi.number().integer().min(1).max(5),
    activities: Joi.number().integer().min(1).max(5),
    food: Joi.number().integer().min(1).max(5),
    guide: Joi.number().integer().min(1).max(5),
    valueForMoney: Joi.number().integer().min(1).max(5),
    responsiveness: Joi.number().integer().min(1).max(5),
    professionalism: Joi.number().integer().min(1).max(5),
    knowledge: Joi.number().integer().min(1).max(5),
  }),

  title: Joi.string().trim().min(5).max(200),
  
  reviewText: Joi.string().trim().min(20).max(5000),
  
  photos: Joi.array().items(Joi.string().uri()).max(10),
  
  pros: Joi.array().items(Joi.string().trim().min(3).max(200)).max(10),
  
  cons: Joi.array().items(Joi.string().trim().min(3).max(200)).max(10),
  
  highlights: Joi.array().items(Joi.string().trim().min(3).max(200)).max(10),
  
  wouldRecommend: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided to update',
  });

/**
 * Reject review schema
 */
exports.rejectReview = Joi.object({
  reason: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Rejection reason must be at least 10 characters',
      'string.max': 'Rejection reason must not exceed 500 characters',
      'any.required': 'Rejection reason is required',
    }),
});

/**
 * Flag review schema
 */
exports.flagReview = Joi.object({
  reason: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Flag reason must be at least 10 characters',
      'string.max': 'Flag reason must not exceed 500 characters',
      'any.required': 'Flag reason is required',
    }),
});

/**
 * Business response schema
 */
exports.respondToReview = Joi.object({
  text: Joi.string()
    .trim()
    .min(20)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Response must be at least 20 characters',
      'string.max': 'Response must not exceed 1000 characters',
      'any.required': 'Response text is required',
    }),
});

/**
 * Update response schema
 */
exports.updateResponse = Joi.object({
  text: Joi.string()
    .trim()
    .min(20)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Response must be at least 20 characters',
      'string.max': 'Response must not exceed 1000 characters',
      'any.required': 'Response text is required',
    }),
});

/**
 * Get reviews query schema
 */
exports.getReviews = Joi.object({
  reviewType: Joi.string().valid('booking', 'supplier', 'agent'),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged'),
  isFeatured: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('createdAt', '-createdAt', 'overallRating', '-overallRating', 'publishedAt', '-publishedAt').default('-createdAt'),
});

/**
 * Public reviews query schema
 */
exports.getPublicReviews = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sortBy: Joi.string().valid('publishedAt', '-publishedAt', 'overallRating', '-overallRating', 'helpfulCount', '-helpfulCount').default('-publishedAt'),
});

/**
 * Featured reviews query schema
 */
exports.getFeaturedReviews = Joi.object({
  limit: Joi.number().integer().min(1).max(20).default(5),
});

module.exports = exports;
