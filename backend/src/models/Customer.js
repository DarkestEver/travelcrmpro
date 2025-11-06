const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: false,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide customer name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
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
  lastBookingDate: Date,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Indexes
customerSchema.index({ agentId: 1, email: 1 });
customerSchema.index({ name: 'text', email: 'text' });
customerSchema.index({ tags: 1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
