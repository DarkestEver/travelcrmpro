const mongoose = require('mongoose');

const quoteRequestSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  // Agent who submitted the request
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Customer for whom the quote is requested
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  // Trip details
  destination: {
    country: {
      type: String,
      required: [true, 'Please provide destination country'],
    },
    city: String,
  },
  travelDates: {
    startDate: {
      type: Date,
      required: [true, 'Please provide travel start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide travel end date'],
    },
    flexible: {
      type: Boolean,
      default: false,
    },
  },
  travelers: {
    adults: {
      type: Number,
      required: true,
      min: 1,
    },
    children: {
      type: Number,
      default: 0,
      min: 0,
    },
    infants: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  budget: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD',
    },
  },
  preferences: {
    travelStyle: [{
      type: String,
      enum: ['adventure', 'luxury', 'budget', 'family', 'solo', 'group', 'honeymoon', 'business'],
    }],
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'challenging'],
    },
    themes: [{
      type: String,
      enum: ['cultural', 'nature', 'beach', 'wildlife', 'historical', 'food_wine', 'photography', 'wellness'],
    }],
    accommodation: {
      type: String,
      enum: ['budget', 'standard', 'deluxe', 'luxury'],
      default: 'standard',
    },
  },
  specialRequests: {
    type: String,
    maxlength: 1000,
  },
  // Quote response
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'expired'],
    default: 'pending',
    index: true,
  },
  quotedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Operator who created the quote
  },
  quotedAt: Date,
  quoteItineraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
  },
  quoteAmount: {
    total: Number,
    currency: String,
    breakdown: {
      accommodation: Number,
      transport: Number,
      activities: Number,
      meals: Number,
      other: Number,
    },
  },
  quoteValidUntil: Date,
  quoteNotes: String,
  // Agent response
  agentResponse: {
    action: {
      type: String,
      enum: ['accepted', 'rejected', 'requested_changes'],
    },
    respondedAt: Date,
    notes: String,
  },
  // Assigned suppliers (for future use)
  assignedSuppliers: [{
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    assignedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'responded', 'declined'],
    },
  }],
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  // Internal notes (operator only)
  internalNotes: String,
}, {
  timestamps: true,
});

// Indexes
quoteRequestSchema.index({ tenantId: 1, agentId: 1, status: 1 });
quoteRequestSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
quoteRequestSchema.index({ 'travelDates.startDate': 1 });

// Virtual for total travelers
quoteRequestSchema.virtual('totalTravelers').get(function() {
  return this.travelers.adults + this.travelers.children + this.travelers.infants;
});

// Virtual for duration in days
quoteRequestSchema.virtual('duration').get(function() {
  if (this.travelDates.startDate && this.travelDates.endDate) {
    const diffTime = Math.abs(this.travelDates.endDate - this.travelDates.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return 0;
});

// Check if quote is expired
quoteRequestSchema.virtual('isExpired').get(function() {
  if (this.quoteValidUntil && this.status === 'quoted') {
    return new Date() > this.quoteValidUntil;
  }
  return false;
});

// Auto-update status to expired
quoteRequestSchema.pre('save', function(next) {
  if (this.quoteValidUntil && this.status === 'quoted') {
    if (new Date() > this.quoteValidUntil) {
      this.status = 'expired';
    }
  }
  next();
});

const QuoteRequest = mongoose.model('QuoteRequest', quoteRequestSchema);

module.exports = QuoteRequest;
