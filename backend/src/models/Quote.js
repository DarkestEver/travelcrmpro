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
    required: false, // Not required for email-generated quotes
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: false, // Not required initially
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  
  // Customer details (from email extraction)
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  
  // Travel details (from email extraction)
  destination: String,
  additionalDestinations: [String],
  startDate: Date,
  endDate: Date,
  duration: Number,
  
  // Travelers
  adults: { type: Number, default: 0 },
  children: { type: Number, default: 0 },
  childAges: [Number],
  infants: { type: Number, default: 0 },
  
  // Accommodation requirements
  hotelType: {
    type: String,
    enum: ['budget', 'standard', 'premium', 'luxury', null]
  },
  starRating: String,
  roomCategory: String,
  numberOfRooms: Number,
  roomType: String,
  
  // Package details
  packageType: String,
  mealPlan: String,
  activities: [String],
  specialRequirements: [String],
  
  // Budget
  estimatedBudget: Number,
  currency: { type: String, default: 'INR' },
  budgetFlexible: { type: Boolean, default: true },
  
  // Email source tracking
  source: {
    type: String,
    enum: ['manual', 'email', 'import'],
    default: 'manual'
  },
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailLog'
  },
  extractionConfidence: Number,
  dataCompleteness: Number,
  missingFields: [String],
  warningFields: [String],
  
  // Matched itineraries
  matchedItineraries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary'
  }],
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
    enum: [
      'draft', 
      'incomplete_data',
      'pending_operator_review',
      'manual_review_required',
      'awaiting_customer_info',
      'itineraries_found',
      'awaiting_supplier_response',
      'sent', 
      'viewed', 
      'accepted', 
      'rejected', 
      'expired',
      'cancelled'
    ],
    default: 'draft',
  },
  // SLA tracking
  sla: {
    responseDeadline: Date,
    reminderSent: { type: Boolean, default: false },
    breached: { type: Boolean, default: false }
  },
  pdfUrl: String,
  emailSentAt: Date,
  viewedAt: Date,
  respondedAt: Date,
  rejectionReason: String,
  notes: [{
    text: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now }
  }],
  customizations: String, // Custom requests or modifications
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Not required for email-generated quotes
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
