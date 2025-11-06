const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true,
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'],
    },
    // Custom domain (optional)
    customDomain: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      lowercase: true,
      trim: true,
    },
    // Tenant settings
    settings: {
      branding: {
        logo: String,
        primaryColor: {
          type: String,
          default: '#4F46E5',
        },
        secondaryColor: {
          type: String,
          default: '#06B6D4',
        },
        companyName: String,
      },
      features: {
        maxUsers: {
          type: Number,
          default: 5,
        },
        maxAgents: {
          type: Number,
          default: 10,
        },
        maxCustomers: {
          type: Number,
          default: 100,
        },
        maxBookings: {
          type: Number,
          default: 50,
        },
        enableAnalytics: {
          type: Boolean,
          default: true,
        },
        enableAuditLogs: {
          type: Boolean,
          default: true,
        },
        enableNotifications: {
          type: Boolean,
          default: true,
        },
        enableWhiteLabel: {
          type: Boolean,
          default: false,
        },
      },
      contact: {
        email: String,
        phone: String,
        address: String,
        city: String,
        country: String,
      },
    },
    // Subscription details
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'starter', 'professional', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['trial', 'active', 'suspended', 'cancelled'],
        default: 'trial',
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: Date,
      trialEndsAt: {
        type: Date,
        default: function() {
          // 14 days trial by default
          return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        },
      },
      billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly',
      },
      price: {
        type: Number,
        default: 0,
      },
    },
    // Owner/Admin user
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    // Database configuration (for future database-per-tenant approach)
    database: {
      type: {
        type: String,
        enum: ['shared', 'dedicated'],
        default: 'shared',
      },
      connectionString: String,
      name: String,
    },
    // Metadata
    metadata: {
      industry: String,
      size: {
        type: String,
        enum: ['small', 'medium', 'large', 'enterprise'],
      },
      country: String,
      timezone: {
        type: String,
        default: 'UTC',
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    // Usage tracking
    usage: {
      users: {
        type: Number,
        default: 0,
      },
      agents: {
        type: Number,
        default: 0,
      },
      customers: {
        type: Number,
        default: 0,
      },
      bookings: {
        type: Number,
        default: 0,
      },
      storage: {
        type: Number,
        default: 0, // in MB
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ customDomain: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'subscription.status': 1 });

// Methods
tenantSchema.methods.isActive = function() {
  return this.status === 'active' && this.subscription.status === 'active';
};

tenantSchema.methods.isTrialExpired = function() {
  if (this.subscription.status !== 'trial') return false;
  return new Date() > this.subscription.trialEndsAt;
};

tenantSchema.methods.canAddUser = function() {
  return this.usage.users < this.settings.features.maxUsers;
};

tenantSchema.methods.canAddAgent = function() {
  return this.usage.agents < this.settings.features.maxAgents;
};

tenantSchema.methods.canAddCustomer = function() {
  return this.usage.customers < this.settings.features.maxCustomers;
};

tenantSchema.methods.canAddBooking = function() {
  return this.usage.bookings < this.settings.features.maxBookings;
};

// Statics
tenantSchema.statics.findBySubdomain = function(subdomain) {
  return this.findOne({ subdomain: subdomain.toLowerCase(), status: 'active' });
};

tenantSchema.statics.findByDomain = function(domain) {
  return this.findOne({ 
    $or: [
      { subdomain: domain.toLowerCase() },
      { customDomain: domain.toLowerCase() }
    ],
    status: 'active'
  });
};

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
