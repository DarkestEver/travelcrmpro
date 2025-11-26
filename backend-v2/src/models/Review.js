const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Review Type
  reviewType: {
    type: String,
    required: true,
    enum: ['booking', 'supplier', 'agent'],
    default: 'booking',
    index: true,
  },

  // Subject of review
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    index: true,
  },

  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
  },

  agent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },

  // Customer who wrote the review
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Overall rating
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },

  // Detailed ratings
  ratings: {
    // Booking-specific
    serviceQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    destinations: {
      type: Number,
      min: 1,
      max: 5,
    },
    accommodation: {
      type: Number,
      min: 1,
      max: 5,
    },
    transportation: {
      type: Number,
      min: 1,
      max: 5,
    },
    activities: {
      type: Number,
      min: 1,
      max: 5,
    },
    // Agent-specific
    responsiveness: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
    knowledge: {
      type: Number,
      min: 1,
      max: 5,
    },
  },

  // Review title
  title: {
    type: String,
    maxlength: 200,
  },

  // Review text
  reviewText: {
    type: String,
    required: true,
    maxlength: 2000,
  },

  // Photos
  photos: [{
    url: String,
    caption: String,
  }],

  // Pros and cons
  pros: [String],
  cons: [String],

  // Trip highlights
  highlights: [String],

  // Would recommend
  wouldRecommend: {
    type: Boolean,
    default: true,
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending',
    index: true,
  },

  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  moderatedAt: Date,

  rejectionReason: String,

  // Featured
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },

  featuredAt: Date,

  // Public display
  isPublic: {
    type: Boolean,
    default: false,
  },

  publishedAt: Date,

  // Helpfulness votes
  helpfulCount: {
    type: Number,
    default: 0,
  },

  unhelpfulCount: {
    type: Number,
    default: 0,
  },

  // Business response
  response: {
    text: String,
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: Date,
  },

  // Verification
  isVerified: {
    type: Boolean,
    default: false,
  },

  verifiedAt: Date,

  // Metadata
  tripDate: Date,
  tripDuration: Number,
  
  traveledWith: {
    type: String,
    enum: ['solo', 'couple', 'family', 'friends', 'business'],
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
reviewSchema.index({ tenant: 1, booking: 1, customer: 1 }, { unique: true, sparse: true });
reviewSchema.index({ tenant: 1, supplier: 1, customer: 1 }, { unique: true, sparse: true });
reviewSchema.index({ tenant: 1, agent: 1, customer: 1 }, { unique: true, sparse: true });
reviewSchema.index({ tenant: 1, customer: 1 });
reviewSchema.index({ tenant: 1, reviewType: 1, status: 1 });
reviewSchema.index({ tenant: 1, status: 1, isPublic: 1, isFeatured: 1 });
reviewSchema.index({ tenant: 1, overallRating: -1 });

// Method: Approve review
reviewSchema.methods.approve = function(userId) {
  this.status = 'approved';
  this.moderatedBy = userId;
  this.moderatedAt = new Date();
  this.isPublic = true;
  this.publishedAt = new Date();
};

// Method: Reject review
reviewSchema.methods.reject = function(userId, reason) {
  this.status = 'rejected';
  this.moderatedBy = userId;
  this.moderatedAt = new Date();
  this.rejectionReason = reason;
  this.isPublic = false;
};

// Method: Flag review
reviewSchema.methods.flag = function(userId, reason) {
  this.status = 'flagged';
  this.moderatedBy = userId;
  this.moderatedAt = new Date();
  this.rejectionReason = reason;
};

// Method: Feature review
reviewSchema.methods.feature = function() {
  if (this.status === 'approved') {
    this.isFeatured = true;
    this.featuredAt = new Date();
  }
};

// Method: Unfeature review
reviewSchema.methods.unfeature = function() {
  this.isFeatured = false;
  this.featuredAt = null;
};

// Method: Add response
reviewSchema.methods.addResponse = function(userId, text) {
  this.response = {
    text,
    respondedBy: userId,
    respondedAt: new Date(),
  };
};

// Method: Verify review
reviewSchema.methods.verifyReview = async function() {
  if (this.booking) {
    const Booking = mongoose.model('Booking');
    const booking = await Booking.findById(this.booking);
    if (booking && booking.status === 'completed') {
      this.isVerified = true;
      this.verifiedAt = new Date();
    }
  }
};

// Static: Get public reviews
reviewSchema.statics.getPublicReviews = function(tenantId, limit = 10) {
  return this.find({
    tenant: tenantId,
    status: 'approved',
    isPublic: true,
  })
    .populate('customer', 'firstName lastName')
    .populate('booking', 'bookingNumber destination')
    .sort('-publishedAt')
    .limit(limit);
};

// Static: Get average rating
reviewSchema.statics.getAverageRating = async function(tenantId) {
  const result = await this.aggregate([
    {
      $match: {
        tenant: tenantId,
        status: 'approved',
      },
    },
    {
      $group: {
        _id: null,
        avgOverallRating: { $avg: '$overallRating' },
        avgServiceQuality: { $avg: '$ratings.serviceQuality' },
        avgValueForMoney: { $avg: '$ratings.valueForMoney' },
        avgCommunication: { $avg: '$ratings.communication' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result[0] || {
    avgOverallRating: 0,
    totalReviews: 0,
  };
};

module.exports = mongoose.model('Review', reviewSchema);
