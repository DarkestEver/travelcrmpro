const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption configuration
// Get encryption key from env or generate a default one
// For AES-256-CBC, we need exactly 32 bytes
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Ensure the key is exactly 32 bytes
if (ENCRYPTION_KEY.length === 64) {
  // It's a hex string (64 chars = 32 bytes), convert to Buffer
  ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY, 'hex');
} else if (ENCRYPTION_KEY.length === 32) {
  // It's already 32 characters, use as-is
  ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY, 'utf8');
} else {
  // Invalid length, pad or truncate to 32 bytes
  const hash = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  ENCRYPTION_KEY = hash.slice(0, 32);
}

const IV_LENGTH = 16; // For AES, this is always 16

// Encryption utilities
function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return text;
  const textParts = text.split(':');
  if (textParts.length !== 2) return text; // Not encrypted
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

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
        website: String,
      },
      business: {
        operatingHours: {
          monday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false },
          },
          tuesday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false },
          },
          wednesday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false },
          },
          thursday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false },
          },
          friday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false },
          },
          saturday: {
            open: { type: String, default: '10:00' },
            close: { type: String, default: '16:00' },
            closed: { type: Boolean, default: false },
          },
          sunday: {
            open: { type: String, default: '10:00' },
            close: { type: String, default: '16:00' },
            closed: { type: Boolean, default: true },
          },
        },
        autoApproveBookings: {
          type: Boolean,
          default: false,
        },
        requireDepositForBooking: {
          type: Boolean,
          default: true,
        },
        depositPercentage: {
          type: Number,
          default: 20,
          min: 0,
          max: 100,
        },
        cancellationPolicy: {
          type: String,
          default: 'Free cancellation up to 24 hours before the booking date. Cancellations made within 24 hours will incur a 50% charge.',
        },
        refundPolicy: {
          type: String,
          default: 'Refunds will be processed within 7-10 business days to the original payment method.',
        },
        termsAndConditions: {
          type: String,
          default: '',
        },
        minimumBookingNotice: {
          type: Number,
          default: 24, // hours
        },
        maximumBookingAdvance: {
          type: Number,
          default: 365, // days
        },
      },
      email: {
        senderName: String,
        senderEmail: String,
        // Email Tracking ID Configuration
        trackingIdPrefix: {
          type: String,
          default: 'TRK',
          uppercase: true,
          trim: true,
          maxlength: 10
        },
        enableTrackingId: {
          type: Boolean,
          default: true
        },
        trackingIdSequence: {
          type: Number,
          default: 0
        },
        replyToEmail: String,
        emailSignature: {
          type: String,
          default: '',
        },
        showLogoInEmail: {
          type: Boolean,
          default: true,
        },
        emailFooterText: String,
        templates: {
          bookingConfirmation: {
            subject: {
              type: String,
              default: 'Booking Confirmation - {{bookingNumber}}',
            },
            body: {
              type: String,
              default: '',
            },
            enabled: {
              type: Boolean,
              default: true,
            },
          },
          quoteRequest: {
            subject: {
              type: String,
              default: 'Your Quote Request - {{quoteNumber}}',
            },
            body: {
              type: String,
              default: '',
            },
            enabled: {
              type: Boolean,
              default: true,
            },
          },
          paymentReceipt: {
            subject: {
              type: String,
              default: 'Payment Receipt - {{bookingNumber}}',
            },
            body: {
              type: String,
              default: '',
            },
            enabled: {
              type: Boolean,
              default: true,
            },
          },
          welcomeEmail: {
            subject: {
              type: String,
              default: 'Welcome to {{companyName}}',
            },
            body: {
              type: String,
              default: '',
            },
            enabled: {
              type: Boolean,
              default: true,
            },
          },
        },
      },
      payment: {
        acceptedMethods: {
          type: [String],
          default: ['cash', 'card', 'bank_transfer'],
          enum: ['cash', 'card', 'bank_transfer', 'paypal', 'stripe', 'razorpay'],
        },
        defaultCurrency: {
          type: String,
          default: 'USD',
        },
        taxRate: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        serviceFeePercentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        lateFeePercentage: {
          type: Number,
          default: 5,
          min: 0,
          max: 100,
        },
        stripeEnabled: {
          type: Boolean,
          default: false,
        },
        stripePublicKey: String,
        stripeSecretKey: String,  // Encrypted in pre-save hook
        paypalEnabled: {
          type: Boolean,
          default: false,
        },
        paypalClientId: String,
        paypalClientSecret: String,  // Encrypted in pre-save hook
        razorpayEnabled: {
          type: Boolean,
          default: false,
        },
        razorpayKeyId: String,
        razorpayKeySecret: String,  // Encrypted in pre-save hook
        bankAccountDetails: {
          accountName: String,
          accountNumber: String,
          bankName: String,
          swiftCode: String,
          iban: String,
        },
      },
      // AI Email Automation Settings
      aiSettings: {
        enabled: {
          type: Boolean,
          default: false,
        },
        // Tenant-specific OpenAI API key (encrypted)
        openaiApiKey: String,  // Encrypted in pre-save hook
        // AI Processing settings
        autoProcessEmails: {
          type: Boolean,
          default: true,
        },
        confidenceThreshold: {
          type: Number,
          default: 70,
          min: 0,
          max: 100,
        },
        autoResponseEnabled: {
          type: Boolean,
          default: false,
        },
        // Cost tracking
        monthlyCostLimit: {
          type: Number,
          default: 100, // USD
        },
        currentMonthCost: {
          type: Number,
          default: 0,
        },
        lastCostReset: {
          type: Date,
          default: Date.now,
        },
        // AI model preferences
        models: {
          categorization: {
            type: String,
            default: 'gpt-4-turbo-preview',
          },
          extraction: {
            type: String,
            default: 'gpt-4-turbo-preview',
          },
          response: {
            type: String,
            default: 'gpt-4-turbo-preview',
          },
        },
        // Usage statistics
        stats: {
          totalEmailsProcessed: {
            type: Number,
            default: 0,
          },
          totalCost: {
            type: Number,
            default: 0,
          },
          averageCostPerEmail: {
            type: Number,
            default: 0,
          },
          lastProcessedAt: Date,
        },
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
    
    // Global Watchers - Receive ALL emails from this tenant
    globalWatchers: [{
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
      },
      name: String,
      role: {
        type: String,
        enum: ['owner', 'manager', 'supervisor', 'auditor', 'compliance', 'other'],
        default: 'other'
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isActive: {
        type: Boolean,
        default: true
      },
      description: String // Why this person is watching
    }],
    
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

// Indexes (subdomain and customDomain already indexed via unique: true)
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'subscription.status': 1 });

// Pre-save hook to encrypt sensitive payment keys
tenantSchema.pre('save', function(next) {
  // Encrypt Stripe secret key if modified
  if (this.isModified('settings.payment.stripeSecretKey') && this.settings?.payment?.stripeSecretKey) {
    // Only encrypt if not already encrypted (doesn't contain ':')
    if (!this.settings.payment.stripeSecretKey.includes(':')) {
      this.settings.payment.stripeSecretKey = encrypt(this.settings.payment.stripeSecretKey);
    }
  }
  
  // Encrypt PayPal client secret if modified
  if (this.isModified('settings.payment.paypalClientSecret') && this.settings?.payment?.paypalClientSecret) {
    if (!this.settings.payment.paypalClientSecret.includes(':')) {
      this.settings.payment.paypalClientSecret = encrypt(this.settings.payment.paypalClientSecret);
    }
  }
  
  // Encrypt Razorpay key secret if modified
  if (this.isModified('settings.payment.razorpayKeySecret') && this.settings?.payment?.razorpayKeySecret) {
    if (!this.settings.payment.razorpayKeySecret.includes(':')) {
      this.settings.payment.razorpayKeySecret = encrypt(this.settings.payment.razorpayKeySecret);
    }
  }
  
  // Encrypt OpenAI API key if modified
  if (this.isModified('settings.aiSettings.openaiApiKey') && this.settings?.aiSettings?.openaiApiKey) {
    if (!this.settings.aiSettings.openaiApiKey.includes(':')) {
      this.settings.aiSettings.openaiApiKey = encrypt(this.settings.aiSettings.openaiApiKey);
    }
  }
  
  next();
});

// Method to get decrypted payment keys (use carefully!)
tenantSchema.methods.getDecryptedPaymentKeys = function() {
  return {
    stripeSecretKey: this.settings?.payment?.stripeSecretKey 
      ? decrypt(this.settings.payment.stripeSecretKey) 
      : null,
    paypalClientSecret: this.settings?.payment?.paypalClientSecret 
      ? decrypt(this.settings.payment.paypalClientSecret) 
      : null,
    razorpayKeySecret: this.settings?.payment?.razorpayKeySecret 
      ? decrypt(this.settings.payment.razorpayKeySecret) 
      : null,
  };
};

// Method to get decrypted AI settings
tenantSchema.methods.getDecryptedAISettings = function() {
  return {
    openaiApiKey: this.settings?.aiSettings?.openaiApiKey 
      ? decrypt(this.settings.aiSettings.openaiApiKey) 
      : null,
    enabled: this.settings?.aiSettings?.enabled || false,
    autoProcessEmails: this.settings?.aiSettings?.autoProcessEmails !== false,
    confidenceThreshold: this.settings?.aiSettings?.confidenceThreshold || 70,
    models: this.settings?.aiSettings?.models || {},
  };
};

// Method to mask sensitive keys for API responses
tenantSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Mask sensitive payment keys
  if (obj.settings?.payment?.stripeSecretKey) {
    obj.settings.payment.stripeSecretKey = '***' + obj.settings.payment.stripeSecretKey.slice(-4);
  }
  if (obj.settings?.payment?.paypalClientSecret) {
    obj.settings.payment.paypalClientSecret = '***' + obj.settings.payment.paypalClientSecret.slice(-4);
  }
  if (obj.settings?.payment?.razorpayKeySecret) {
    obj.settings.payment.razorpayKeySecret = '***' + obj.settings.payment.razorpayKeySecret.slice(-4);
  }
  
  // Mask OpenAI API key
  if (obj.settings?.aiSettings?.openaiApiKey) {
    obj.settings.aiSettings.openaiApiKey = 'sk-***' + obj.settings.aiSettings.openaiApiKey.slice(-4);
  }
  
  return obj;
};

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
