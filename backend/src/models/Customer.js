const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: false,
    index: true,
  },
  name: {
    type: String,
    required: false, // Made optional since we'll use firstName/lastName
    trim: true,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    select: false, // Don't return password by default
  },
  phone: {
    type: String,
    required: true,
  },
  // Portal access fields
  portalAccess: {
    type: Boolean,
    default: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  passportInfo: {
    number: String,
    country: String,
    expiryDate: Date,
    document: String, // URL
  },
  preferences: {
    dietaryRestrictions: [String],
    seatPreference: String,
    specialNeeds: String,
    interests: [String],
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
  documents: [{
    type: String,
    name: String,
    url: String,
    uploadedAt: Date,
  }],
  tags: [String],
  notes: [{
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  totalBookings: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  inquiryCount: {
    type: Number,
    default: 0,
  },
  lastContactDate: Date,
  lastBookingDate: Date,
  source: {
    type: String,
    enum: ['direct', 'email_inquiry', 'referral', 'website', 'social_media', 'other'],
    default: 'direct'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'lead'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Indexes
customerSchema.index({ agentId: 1, email: 1 });
customerSchema.index({ name: 'text', email: 'text' });
customerSchema.index({ tags: 1 });

// Hash password before saving
customerSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
customerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
customerSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.name || '';
});

// Compound indexes for performance optimization (Phase 10)
customerSchema.index({ tenantId: 1, email: 1 }, { unique: true });
customerSchema.index({ tenantId: 1, phone: 1 });
customerSchema.index({ tenantId: 1, agentId: 1 });
customerSchema.index({ tenantId: 1, portalAccess: 1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
