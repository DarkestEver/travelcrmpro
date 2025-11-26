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

  // Customer who wrote the review
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Related booking
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
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
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },

  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  approvedAt: Date,

  rejectionReason: String,

  // Public display
  isPublic: {
    type: Boolean,
    default: false,
  },

  publishedAt: Date,

  // Helpful votes
  helpfulVotes: {
    type: Number,
    default: 0,
  },

  // Metadata
  tripDate: Date,
  
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
reviewSchema.index({ tenant: 1, booking: 1 }, { unique: true });
reviewSchema.index({ tenant: 1, customer: 1 });
reviewSchema.index({ tenant: 1, status: 1, isPublic: 1 });
reviewSchema.index({ tenant: 1, overallRating: 1 });

// Method: Approve review
reviewSchema.methods.approve = function(userId) {
  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.isPublic = true;
  this.publishedAt = new Date();
};

// Method: Reject review
reviewSchema.methods.reject = function(userId, reason) {
  this.status = 'rejected';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.rejectionReason = reason;
  this.isPublic = false;
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
