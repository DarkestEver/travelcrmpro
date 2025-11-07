const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
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
      index: true,
    },
    subUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubUser',
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Customer actions
        'customer_created',
        'customer_updated',
        'customer_deleted',
        'customer_imported',
        // Quote actions
        'quote_created',
        'quote_accepted',
        'quote_rejected',
        'quote_cancelled',
        // Booking actions
        'booking_created',
        'booking_updated',
        'booking_cancelled',
        // Sub-user actions
        'sub_user_created',
        'sub_user_updated',
        'sub_user_deleted',
        'sub_user_activated',
        'sub_user_deactivated',
        'sub_user_permissions_updated',
        // Authentication
        'login',
        'logout',
        'password_changed',
      ],
    },
    module: {
      type: String,
      required: true,
      enum: ['customers', 'quotes', 'bookings', 'sub_users', 'auth', 'reports'],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ subUserId: 1, timestamp: -1 });
activityLogSchema.index({ tenantId: 1, module: 1, timestamp: -1 });
activityLogSchema.index({ tenantId: 1, action: 1, timestamp: -1 });

// Auto-delete logs older than 90 days (optional)
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
