const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Tenant Schema
 * Represents a travel agency/organization in the multi-tenant system
 */
const tenantSchema = new Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true,
      minlength: [2, 'Tenant name must be at least 2 characters'],
      maxlength: [100, 'Tenant name cannot exceed 100 characters'],
    },

    slug: {
      type: String,
      required: [true, 'Tenant slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
      minlength: [3, 'Slug must be at least 3 characters'],
      maxlength: [50, 'Slug cannot exceed 50 characters'],
    },

    // Domain Configuration
    domain: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      lowercase: true,
      trim: true,
      match: [
        /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/,
        'Invalid domain format',
      ],
    },

    customDomain: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [
        /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/,
        'Invalid custom domain format',
      ],
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'trial', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'trial',
      required: true,
    },

    // Subscription
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'starter', 'professional', 'enterprise'],
        default: 'free',
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      features: {
        maxUsers: { type: Number, default: 5 },
        maxSuppliers: { type: Number, default: 10 },
        maxQueries: { type: Number, default: 50 },
        customDomain: { type: Boolean, default: false },
        whiteLabel: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
      },
    },

    // Branding
    branding: {
      logo: {
        type: String,
        trim: true,
      },
      favicon: {
        type: String,
        trim: true,
      },
      primaryColor: {
        type: String,
        default: '#3B82F6',
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
      },
      secondaryColor: {
        type: String,
        default: '#10B981',
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
      },
    },

    // Settings
    settings: {
      timezone: {
        type: String,
        default: 'Asia/Kolkata',
      },
      currency: {
        type: String,
        default: 'INR',
        uppercase: true,
        minlength: 3,
        maxlength: 3,
      },
      language: {
        type: String,
        default: 'en',
        lowercase: true,
      },
      dateFormat: {
        type: String,
        default: 'DD/MM/YYYY',
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      // Invoice settings
      invoicePrefix: {
        type: String,
        default: 'INV',
        uppercase: true,
        trim: true,
        maxlength: 10,
      },
      invoiceStartNumber: {
        type: Number,
        default: 1,
        min: 1,
      },
      quotePrefix: {
        type: String,
        default: 'QT',
        uppercase: true,
        trim: true,
        maxlength: 10,
      },
      quoteStartNumber: {
        type: Number,
        default: 1,
        min: 1,
      },
      bookingPrefix: {
        type: String,
        default: 'BK',
        uppercase: true,
        trim: true,
        maxlength: 10,
      },
      bookingStartNumber: {
        type: Number,
        default: 1,
        min: 1,
      },
    },

    // Contact Information
    contact: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },

    // Metadata
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Indexes
tenantSchema.index({ slug: 1 });
tenantSchema.index({ domain: 1 });
tenantSchema.index({ customDomain: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'subscription.plan': 1 });
tenantSchema.index({ createdAt: -1 });

// Virtual: Full domain URL
tenantSchema.virtual('fullDomain').get(function () {
  if (this.customDomain) {
    return `https://${this.customDomain}`;
  }
  if (this.domain) {
    return `https://${this.domain}`;
  }
  return `https://${this.slug}.${process.env.BASE_DOMAIN || 'travelcrm.com'}`;
});

// Virtual: Is trial expired
tenantSchema.virtual('isTrialExpired').get(function () {
  if (this.status !== 'trial') {
    return false;
  }
  if (!this.subscription.endDate) {
    return false;
  }
  return new Date() > this.subscription.endDate;
});

// Pre-save hook: Generate slug from name if not provided
tenantSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Pre-save hook: Set trial end date
tenantSchema.pre('save', function (next) {
  if (this.isNew && this.status === 'trial' && !this.subscription.endDate) {
    const trialDays = 14;
    this.subscription.endDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
  }
  next();
});

// Instance method: Check if feature is enabled
tenantSchema.methods.hasFeature = function (featureName) {
  return this.subscription.features[featureName] === true;
};

// Instance method: Check if subscription is active
tenantSchema.methods.isSubscriptionActive = function () {
  if (this.status === 'cancelled' || this.status === 'suspended') {
    return false;
  }
  if (this.subscription.endDate && new Date() > this.subscription.endDate) {
    return false;
  }
  return this.subscription.isActive;
};

// Static method: Find by slug
tenantSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

// Static method: Find by domain
tenantSchema.statics.findByDomain = function (domain) {
  return this.findOne({
    $or: [{ domain: domain.toLowerCase() }, { customDomain: domain.toLowerCase() }],
  });
};

// Static method: Get active tenants
tenantSchema.statics.getActive = function () {
  return this.find({ status: 'active' });
};

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
