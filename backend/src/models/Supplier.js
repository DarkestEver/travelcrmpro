const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
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
  companyName: {
    type: String,
    required: [true, 'Please provide company name'],
    trim: true,
  },
  country: {
    type: String,
    required: [true, 'Please provide country'],
  },
  city: String,
  state: String,
  contactPersons: [{
    name: String,
    title: String,
    email: String,
    phone: String,
    isPrimary: Boolean,
  }],
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
  serviceTypes: [{
    type: String,
    enum: ['hotel', 'transport', 'activity', 'tour', 'meal', 'other'],
  }],
  currencies: [{
    type: String,
    default: ['USD'],
  }],
  paymentTerms: {
    type: String,
    default: 'Net 30',
  },
  defaultMarkup: {
    percentage: {
      type: Number,
      default: 15,
    },
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    swiftCode: String,
  },
  contracts: [{
    name: String,
    url: String,
    validFrom: Date,
    validTo: Date,
    uploadedAt: Date,
  }],
  certificates: [{
    name: String,
    url: String,
    expiryDate: Date,
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  performance: {
    responseTime: Number, // average in hours
    fulfillmentRate: Number, // percentage
    totalBookings: {
      type: Number,
      default: 0,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending',
  },
  notes: String,
}, {
  timestamps: true,
});

// Indexes
supplierSchema.index({ userId: 1 });
supplierSchema.index({ country: 1 });
supplierSchema.index({ serviceTypes: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ companyName: 'text' });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
