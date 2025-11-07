const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subUserSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    parentAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      required: true,
    },
    permissions: {
      customers: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      quotes: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        respond: { type: Boolean, default: false },
      },
      bookings: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
      reports: {
        view: { type: Boolean, default: false },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    phone: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subUserSchema.index({ parentAgentId: 1, isActive: 1 });
subUserSchema.index({ email: 1, tenantId: 1 });

// Hash password before saving
subUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
subUserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if sub-user has specific permission
subUserSchema.methods.hasPermission = function (module, action) {
  if (this.role === 'admin') {
    return true; // Admins have all permissions
  }
  
  return this.permissions[module] && this.permissions[module][action];
};

// Virtual for full permissions check
subUserSchema.virtual('fullPermissions').get(function () {
  if (this.role === 'admin') {
    return {
      customers: { view: true, create: true, edit: true, delete: true },
      quotes: { view: true, create: true, respond: true },
      bookings: { view: true, create: true, edit: true },
      reports: { view: true },
    };
  }
  return this.permissions;
});

// Don't return password in JSON
subUserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('SubUser', subUserSchema);
