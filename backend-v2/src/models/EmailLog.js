const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Email Log Schema
 * Tracks all emails sent from the system for auditing and analytics
 */
const emailLogSchema = new Schema(
  {
    // Multi-tenancy
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    // Email template reference
    template: {
      type: Schema.Types.ObjectId,
      ref: 'EmailTemplate',
      index: true,
    },

    templateSlug: {
      type: String,
      index: true,
    },

    // Recipient information
    to: {
      type: [String],
      required: true,
    },

    cc: [String],
    bcc: [String],

    // Sender information
    from: {
      email: {
        type: String,
        required: true,
      },
      name: String,
    },

    replyTo: String,

    // Email content
    subject: {
      type: String,
      required: true,
    },

    htmlBody: String,
    textBody: String,

    // Attachments
    attachments: [
      {
        filename: String,
        contentType: String,
        size: Number,
        path: String,
      },
    ],

    // Related entities
    relatedTo: {
      entityType: {
        type: String,
        enum: ['booking', 'quote', 'invoice', 'lead', 'payment', 'other'],
        index: true,
      },
      entityId: {
        type: Schema.Types.ObjectId,
        index: true,
      },
    },

    // Delivery status
    status: {
      type: String,
      enum: ['queued', 'sending', 'sent', 'delivered', 'failed', 'bounced', 'rejected'],
      default: 'queued',
      index: true,
    },

    // Email provider information
    provider: {
      type: String,
      enum: ['smtp', 'sendgrid', 'mailgun', 'ses', 'manual'],
      default: 'smtp',
    },

    providerMessageId: {
      type: String,
      index: true,
    },

    providerResponse: Schema.Types.Mixed,

    // Timestamps
    queuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    sentAt: {
      type: Date,
      index: true,
    },

    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    bouncedAt: Date,
    failedAt: Date,

    // Engagement tracking
    openCount: {
      type: Number,
      default: 0,
    },

    clickCount: {
      type: Number,
      default: 0,
    },

    // Links clicked
    clickedLinks: [
      {
        url: String,
        clickedAt: Date,
      },
    ],

    // Error information
    error: {
      code: String,
      message: String,
      details: Schema.Types.Mixed,
    },

    // Retry information
    retryCount: {
      type: Number,
      default: 0,
    },

    lastRetryAt: Date,
    nextRetryAt: Date,

    // IP and user agent (for tracking opens/clicks)
    ipAddress: String,
    userAgent: String,

    // Audit
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // Metadata
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
emailLogSchema.index({ tenant: 1, status: 1, queuedAt: -1 });
emailLogSchema.index({ tenant: 1, 'relatedTo.entityType': 1, 'relatedTo.entityId': 1 });
emailLogSchema.index({ tenant: 1, templateSlug: 1 });
emailLogSchema.index({ tenant: 1, to: 1 });
emailLogSchema.index({ providerMessageId: 1 });
emailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // Auto-delete after 90 days

// Instance method: Mark as sent
emailLogSchema.methods.markAsSent = function (providerMessageId, providerResponse) {
  this.status = 'sent';
  this.sentAt = new Date();
  this.providerMessageId = providerMessageId;
  this.providerResponse = providerResponse;
  return this.save();
};

// Instance method: Mark as delivered
emailLogSchema.methods.markAsDelivered = function () {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Instance method: Mark as failed
emailLogSchema.methods.markAsFailed = function (errorCode, errorMessage, errorDetails) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.error = {
    code: errorCode,
    message: errorMessage,
    details: errorDetails,
  };
  return this.save();
};

// Instance method: Mark as bounced
emailLogSchema.methods.markAsBounced = function () {
  this.status = 'bounced';
  this.bouncedAt = new Date();
  return this.save();
};

// Instance method: Track email open
emailLogSchema.methods.trackOpen = function (ipAddress, userAgent) {
  if (!this.openedAt) {
    this.openedAt = new Date();
  }
  this.openCount += 1;
  this.ipAddress = ipAddress || this.ipAddress;
  this.userAgent = userAgent || this.userAgent;
  return this.save();
};

// Instance method: Track link click
emailLogSchema.methods.trackClick = function (url, ipAddress, userAgent) {
  if (!this.clickedAt) {
    this.clickedAt = new Date();
  }
  this.clickCount += 1;
  this.clickedLinks.push({
    url,
    clickedAt: new Date(),
  });
  this.ipAddress = ipAddress || this.ipAddress;
  this.userAgent = userAgent || this.userAgent;
  return this.save();
};

// Static method: Get email statistics
emailLogSchema.statics.getStatistics = async function (tenantId, startDate, endDate) {
  const matchStage = {
    tenant: mongoose.Types.ObjectId(tenantId),
  };

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSent: { $sum: 1 },
        delivered: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
        },
        bounced: {
          $sum: { $cond: [{ $eq: ['$status', 'bounced'] }, 1, 0] },
        },
        opened: {
          $sum: { $cond: [{ $gt: ['$openCount', 0] }, 1, 0] },
        },
        clicked: {
          $sum: { $cond: [{ $gt: ['$clickCount', 0] }, 1, 0] },
        },
        totalOpens: { $sum: '$openCount' },
        totalClicks: { $sum: '$clickCount' },
      },
    },
    {
      $project: {
        _id: 0,
        totalSent: 1,
        delivered: 1,
        failed: 1,
        bounced: 1,
        opened: 1,
        clicked: 1,
        totalOpens: 1,
        totalClicks: 1,
        deliveryRate: {
          $multiply: [
            { $divide: ['$delivered', '$totalSent'] },
            100,
          ],
        },
        openRate: {
          $multiply: [
            { $divide: ['$opened', '$delivered'] },
            100,
          ],
        },
        clickRate: {
          $multiply: [
            { $divide: ['$clicked', '$delivered'] },
            100,
          ],
        },
      },
    },
  ]);

  return stats[0] || {
    totalSent: 0,
    delivered: 0,
    failed: 0,
    bounced: 0,
    opened: 0,
    clicked: 0,
    totalOpens: 0,
    totalClicks: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
  };
};

// Static method: Get failed emails for retry
emailLogSchema.statics.getForRetry = function (tenantId, maxRetries = 3) {
  return this.find({
    tenant: tenantId,
    status: 'failed',
    retryCount: { $lt: maxRetries },
    $or: [
      { nextRetryAt: { $exists: false } },
      { nextRetryAt: { $lte: new Date() } },
    ],
  })
    .sort({ queuedAt: 1 })
    .limit(100);
};

// Static method: Get emails by entity
emailLogSchema.statics.getByEntity = function (tenantId, entityType, entityId) {
  return this.find({
    tenant: tenantId,
    'relatedTo.entityType': entityType,
    'relatedTo.entityId': entityId,
  })
    .sort({ createdAt: -1 })
    .populate('template', 'name slug');
};

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

module.exports = EmailLog;
