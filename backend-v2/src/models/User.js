const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Schema } = mongoose;
const { USER_ROLES, USER_STATUS } = require('../config/constants');

/**
 * User Schema
 * Represents users across all tenants with role-based access
 */
const userSchema = new Schema(
  {
    // Tenant Association (null for super_admin)
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: function () {
        return this.role !== USER_ROLES.SUPER_ADMIN;
      },
      index: true,
    },

    // Basic Information
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      index: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password by default in queries
    },

    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },

    // Role & Permissions
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
      default: USER_ROLES.CUSTOMER,
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: {
        values: [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.SUSPENDED, 'deleted'],
        message: '{VALUE} is not a valid status',
      },
      default: USER_STATUS.ACTIVE,
      index: true,
    },

    // Email Verification
    emailVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      select: false,
    },

    verificationTokenExpiry: {
      type: Date,
      select: false,
    },

    // Password Reset
    resetToken: {
      type: String,
      select: false,
    },

    resetTokenExpiry: {
      type: Date,
      select: false,
    },

    // Profile
    avatar: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    // Preferences
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      currency: {
        type: String,
        default: 'USD',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      dateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        default: 'MM/DD/YYYY',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      },
    },

    // Agent-specific fields
    agentCode: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },

    commission: {
      percentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      type: {
        type: String,
        enum: ['flat', 'percentage'],
        default: 'percentage',
      },
    },

    // Customer-specific fields
    assignedAgent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // Index defined below
    },

    // Metadata
    lastLogin: {
      type: Date,
    },

    lastPasswordChange: {
      type: Date,
    },

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
        delete ret.password;
        delete ret.verificationToken;
        delete ret.verificationTokenExpiry;
        delete ret.resetToken;
        delete ret.resetTokenExpiry;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Indexes
userSchema.index({ tenant: 1, email: 1 });
userSchema.index({ tenant: 1, role: 1 });
userSchema.index({ tenant: 1, status: 1 });
userSchema.index({ assignedAgent: 1 });
userSchema.index({ createdAt: -1 });

// Virtual: Full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual: Initials
userSchema.virtual('initials').get(function () {
  return `${this.firstName[0]}${this.lastName[0]}`.toUpperCase();
});

// Pre-save hook: Hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.lastPasswordChange = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save hook: Generate agent code for new agents
userSchema.pre('save', function (next) {
  if (this.isNew && this.role === USER_ROLES.AGENT && !this.agentCode) {
    this.agentCode = `AG${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;
  }
  next();
});

// Instance method: Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) {
      throw new Error('User password is not loaded');
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

// Instance method: Generate auth token payload
userSchema.methods.generateAuthToken = function () {
  return {
    userId: this._id.toString(),
    tenantId: this.tenant ? this.tenant.toString() : null,
    email: this.email,
    role: this.role,
  };
};

// Instance method: Generate verification token
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

// Instance method: Generate password reset token
userSchema.methods.generateResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

// Instance method: Verify reset token
userSchema.methods.verifyResetToken = function (token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.resetToken === hashedToken && this.resetTokenExpiry > new Date();
};

// Instance method: Check if user has role
userSchema.methods.hasRole = function (role) {
  return this.role === role;
};

// Instance method: Check if user is active
userSchema.methods.isActive = function () {
  return this.status === USER_STATUS.ACTIVE && this.emailVerified;
};

// Static method: Find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method: Find by tenant
userSchema.statics.findByTenant = function (tenantId, filters = {}) {
  return this.find({ tenant: tenantId, ...filters });
};

// Static method: Find agents by tenant
userSchema.statics.findAgentsByTenant = function (tenantId) {
  return this.find({
    tenant: tenantId,
    role: USER_ROLES.AGENT,
    status: USER_STATUS.ACTIVE,
  });
};

// Static method: Find customers by agent
userSchema.statics.findCustomersByAgent = function (agentId) {
  return this.find({
    assignedAgent: agentId,
    role: USER_ROLES.CUSTOMER,
  });
};

// Static method: Hash token for comparison
userSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
