const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['super_admin', 'operator', 'agent', 'supplier', 'customer', 'auditor', 'finance'],
    default: 'agent',
  },
  phone: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Agent-specific fields
  agentCode: {
    type: String,
    trim: true,
    sparse: true, // Allows null for non-agents
    unique: true,
  },
  agentLevel: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze',
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0,
  },
  creditUsed: {
    type: Number,
    default: 0,
    min: 0,
  },
  commissionRate: {
    type: Number,
    default: 10, // Default 10% commission
    min: 0,
    max: 100,
  },
  // Supplier-specific fields
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    sparse: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  mfaSecret: {
    type: String,
    select: false,
  },
  lastLogin: {
    type: Date,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshToken: {
    type: String,
    select: false,
  },
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ tenantId: 1, email: 1 }, { unique: true }); // Unique email per tenant
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    { id: this._id, role: this.role, tenantId: this.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  return token;
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
  return refreshToken;
};

// Check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Virtual field: Available credit
userSchema.virtual('availableCredit').get(function() {
  if (this.role !== 'agent') return 0;
  return Math.max(0, this.creditLimit - this.creditUsed);
});

// Method: Check if agent has sufficient credit
userSchema.methods.hasSufficientCredit = function(amount) {
  if (this.role !== 'agent') return true;
  return this.availableCredit >= amount;
};

// Method: Reserve credit (for pending bookings)
userSchema.methods.reserveCredit = async function(amount) {
  if (this.role !== 'agent') return true;
  
  if (!this.hasSufficientCredit(amount)) {
    return false;
  }
  
  this.creditUsed += amount;
  await this.save();
  return true;
};

// Method: Release credit (when booking is cancelled)
userSchema.methods.releaseCredit = async function(amount) {
  if (this.role !== 'agent') return true;
  
  this.creditUsed = Math.max(0, this.creditUsed - amount);
  await this.save();
  return true;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
