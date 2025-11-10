const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  quoteNumber: {
    type: String,
    required: true,
  },
  itineraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
    required: true,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  pricing: {
    baseCost: {
      type: Number,
      required: true,
    },
    markup: {
      percentage: Number,
      amount: Number,
    },
    agentDiscount: {
      percentage: Number,
      amount: Number,
    },
    taxes: {
      amount: Number,
      breakdown: [{
        name: String,
        rate: Number,
        amount: Number,
      }],
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
  numberOfTravelers: {
    adults: {
      type: Number,
      default: 1,
    },
    children: {
      type: Number,
      default: 0,
    },
    infants: {
      type: Number,
      default: 0,
    },
  },
  travelDates: {
    startDate: Date,
    endDate: Date,
    flexible: {
      type: Boolean,
      default: false,
    },
  },
  validUntil: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  },
  pdfUrl: String,
  emailSentAt: Date,
  viewedAt: Date,
  respondedAt: Date,
  rejectionReason: String,
  notes: String,
  customizations: String, // Custom requests or modifications
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
quoteSchema.index({ tenantId: 1, quoteNumber: 1 }, { unique: true });
quoteSchema.index({ agentId: 1, status: 1 });
quoteSchema.index({ customerId: 1 });
quoteSchema.index({ status: 1, validUntil: 1 });
quoteSchema.index({ createdAt: -1 });

// Generate quote number before saving
quoteSchema.pre('save', async function(next) {
  if (this.isNew && !this.quoteNumber) {
    const count = await mongoose.model('Quote').countDocuments();
    const year = new Date().getFullYear();
    this.quoteNumber = `Q${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Auto-expire quotes
quoteSchema.pre('save', function(next) {
  if (this.status === 'sent' && this.validUntil < new Date()) {
    this.status = 'expired';
  }
  next();
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;
