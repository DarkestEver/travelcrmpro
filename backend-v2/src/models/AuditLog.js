const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Audit Log Schema
 * Tracks all important actions in the system for security and compliance
 */
const auditLogSchema = new Schema(
  {
    // Multi-tenancy
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    // User who performed the action
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // Action details
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        // Authentication
        'login',
        'logout',
        'password_reset',
        'password_change',
        'token_refresh',
        'failed_login',
        // CRUD operations
        'create',
        'read',
        'update',
        'delete',
        // Specific actions
        'export_data',
        'import_data',
        'send_email',
        'generate_report',
        'process_payment',
        'refund_payment',
        'approve_quote',
        'reject_quote',
        'confirm_booking',
        'cancel_booking',
        // Admin actions
        'change_permissions',
        'create_user',
        'delete_user',
        'activate_user',
        'deactivate_user',
        // GDPR
        'data_export_request',
        'data_deletion_request',
        'consent_granted',
        'consent_revoked',
        // Security
        'suspicious_activity',
        'rate_limit_exceeded',
        'unauthorized_access',
      ],
    },

    // Entity affected by the action
    entity: {
      type: {
        type: String,
        required: true,
        enum: [
          'user',
          'tenant',
          'lead',
          'itinerary',
          'booking',
          'payment',
          'invoice',
          'quote',
          'supplier',
          'rate_list',
          'email',
          'report',
          'system',
        ],
      },
      id: {
        type: Schema.Types.ObjectId,
        index: true,
      },
    },

    // Action result
    status: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success',
      index: true,
    },

    // Details about the action
    description: String,

    // Changes made (for update actions)
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },

    // Request metadata
    metadata: {
      // IP address
      ipAddress: String,
      
      // User agent
      userAgent: String,
      
      // Request ID
      requestId: String,
      
      // HTTP method and path
      method: String,
      path: String,
      
      // Response status code
      statusCode: Number,
      
      // Duration in milliseconds
      duration: Number,
      
      // Geolocation (if available)
      location: {
        country: String,
        city: String,
        coordinates: {
          lat: Number,
          lon: Number,
        },
      },
      
      // Device info
      device: {
        type: String, // mobile, tablet, desktop
        os: String,
        browser: String,
      },
    },

    // Error information (if action failed)
    error: {
      code: String,
      message: String,
      stack: String,
    },

    // Security flags
    security: {
      isSuspicious: {
        type: Boolean,
        default: false,
        index: true,
      },
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
        index: true,
      },
      flags: [String], // suspicious_ip, unusual_location, multiple_failed_attempts, etc.
    },

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We use custom timestamp field
  }
);

// Indexes for common queries
auditLogSchema.index({ tenant: 1, timestamp: -1 });
auditLogSchema.index({ tenant: 1, user: 1, timestamp: -1 });
auditLogSchema.index({ tenant: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ tenant: 1, 'entity.type': 1, 'entity.id': 1 });
auditLogSchema.index({ tenant: 1, 'security.isSuspicious': 1 });
auditLogSchema.index({ tenant: 1, 'security.riskLevel': 1 });

// TTL index - automatically delete logs older than 2 years (GDPR compliance)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Static method: Log an action
auditLogSchema.statics.log = async function (data) {
  return await this.create({
    tenant: data.tenantId,
    user: data.userId,
    action: data.action,
    entity: data.entity,
    status: data.status || 'success',
    description: data.description,
    changes: data.changes,
    metadata: data.metadata,
    error: data.error,
    security: data.security,
  });
};

// Static method: Get user activity
auditLogSchema.statics.getUserActivity = function (tenantId, userId, startDate, endDate, limit = 100) {
  const query = {
    tenant: tenantId,
    user: userId,
  };

  if (startDate && endDate) {
    query.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-__v');
};

// Static method: Get entity history
auditLogSchema.statics.getEntityHistory = function (tenantId, entityType, entityId, limit = 100) {
  return this.find({
    tenant: tenantId,
    'entity.type': entityType,
    'entity.id': entityId,
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'firstName lastName email')
    .select('-__v');
};

// Static method: Get suspicious activities
auditLogSchema.statics.getSuspiciousActivities = function (tenantId, startDate, endDate, riskLevel) {
  const query = {
    tenant: tenantId,
    'security.isSuspicious': true,
  };

  if (riskLevel) {
    query['security.riskLevel'] = riskLevel;
  }

  if (startDate && endDate) {
    query.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .populate('user', 'firstName lastName email')
    .limit(1000);
};

// Static method: Get statistics
auditLogSchema.statics.getStatistics = async function (tenantId, startDate, endDate) {
  const matchStage = {
    tenant: mongoose.Types.ObjectId(tenantId),
  };

  if (startDate && endDate) {
    matchStage.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalActions: { $sum: 1 },
        successfulActions: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
        },
        failedActions: {
          $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] },
        },
        suspiciousActivities: {
          $sum: { $cond: ['$security.isSuspicious', 1, 0] },
        },
        uniqueUsers: { $addToSet: '$user' },
        actionsByType: {
          $push: '$action',
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalActions: 1,
        successfulActions: 1,
        failedActions: 1,
        suspiciousActivities: 1,
        uniqueUserCount: { $size: { $ifNull: ['$uniqueUsers', []] } },
      },
    },
  ]);

  return stats[0] || {
    totalActions: 0,
    successfulActions: 0,
    failedActions: 0,
    suspiciousActivities: 0,
    uniqueUserCount: 0,
  };
};

// Static method: Get action breakdown
auditLogSchema.statics.getActionBreakdown = async function (tenantId, startDate, endDate) {
  const matchStage = {
    tenant: mongoose.Types.ObjectId(tenantId),
  };

  if (startDate && endDate) {
    matchStage.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $project: {
        _id: 0,
        action: '$_id',
        count: 1,
      },
    },
  ]);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
