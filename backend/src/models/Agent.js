const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  agencyName: {
    type: String,
    required: [true, 'Please provide agency name'],
    trim: true,
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  businessRegistration: {
    number: String,
    document: String, // URL to uploaded document
  },
  creditLimit: {
    type: Number,
    default: 0,
  },
  availableCredit: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR'],
  },
  commissionRules: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    fixedAmount: {
      type: Number,
      default: 0,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending',
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze',
  },
  totalBookings: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: Date,
  }],
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
agentSchema.index({ userId: 1 });
agentSchema.index({ email: 1 });
agentSchema.index({ status: 1 });
agentSchema.index({ agencyName: 'text' });

// Calculate available credit
agentSchema.pre('save', function(next) {
  if (this.isModified('creditLimit') && !this.isModified('availableCredit')) {
    this.availableCredit = this.creditLimit;
  }
  next();
});

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;
