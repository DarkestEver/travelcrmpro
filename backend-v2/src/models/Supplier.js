const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      required: true,
      enum: ['hotel', 'airline', 'transport', 'activity', 'restaurant', 'guide', 'other'],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
      index: true,
    },
    contact: {
      name: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      mobile: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    services: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: String,
        pricing: {
          amount: Number,
          currency: {
            type: String,
            default: 'USD',
          },
          unit: String, // per night, per person, per hour, etc.
        },
        availability: {
          type: String,
          enum: ['available', 'limited', 'unavailable'],
          default: 'available',
        },
      },
    ],
    rating: {
      overall: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      quality: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      service: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      value: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      reviewCount: {
        type: Number,
        default: 0,
      },
    },
    documents: [
      {
        name: String,
        type: {
          type: String,
          enum: ['contract', 'license', 'insurance', 'certification', 'other'],
        },
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        expiryDate: Date,
      },
    ],
    paymentTerms: {
      method: {
        type: String,
        enum: ['bank_transfer', 'credit_card', 'cash', 'check', 'other'],
      },
      creditDays: Number,
      currency: {
        type: String,
        default: 'USD',
      },
      taxId: String,
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
supplierSchema.index({ tenant: 1, name: 1 });
supplierSchema.index({ tenant: 1, type: 1, status: 1 });
supplierSchema.index({ 'contact.email': 1 });
supplierSchema.index({ tags: 1 });
supplierSchema.index({ createdAt: -1 });

// Virtual for average rating
supplierSchema.virtual('averageRating').get(function () {
  const { quality, service, value } = this.rating;
  if (quality === 0 && service === 0 && value === 0) return 0;
  return ((quality + service + value) / 3).toFixed(2);
});

// Instance method: Add service
supplierSchema.methods.addService = function (serviceData) {
  this.services.push(serviceData);
  return this.save();
};

// Instance method: Update rating
supplierSchema.methods.updateRating = function (ratings) {
  Object.assign(this.rating, ratings);
  
  // Increment review count
  this.rating.reviewCount = (this.rating.reviewCount || 0) + 1;
  
  // Recalculate overall rating
  const { quality, service, value } = this.rating;
  if (quality > 0 || service > 0 || value > 0) {
    this.rating.overall = parseFloat(((quality + service + value) / 3).toFixed(2));
  }
  
  return this.save();
};

// Instance method: Add document
supplierSchema.methods.addDocument = function (documentData) {
  this.documents.push(documentData);
  return this.save();
};

// Static method: Get suppliers by type
supplierSchema.statics.getByType = function (tenantId, type, options = {}) {
  const query = { tenant: tenantId, type };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 100);
};

// Static method: Search suppliers
supplierSchema.statics.search = function (tenantId, searchTerm) {
  return this.find({
    tenant: tenantId,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { 'contact.name': { $regex: searchTerm, $options: 'i' } },
      { 'contact.email': { $regex: searchTerm, $options: 'i' } },
      { tags: { $regex: searchTerm, $options: 'i' } },
    ],
  })
    .populate('createdBy', 'firstName lastName email')
    .limit(50);
};

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
