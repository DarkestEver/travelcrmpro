/**
 * Notification Model
 * Stores in-app notifications for users
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: [
        'invoice',
        'payment',
        'booking',
        'commission',
        'credit_alert',
        'system',
        'general'
      ],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    link: {
      type: String
    },
    icon: {
      type: String
    },
    color: {
      type: String
    },
    actionRequired: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
notificationSchema.index({ tenant: 1, user: 1, createdAt: -1 });
notificationSchema.index({ tenant: 1, user: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance Methods

/**
 * Mark notification as read
 */
notificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

/**
 * Mark notification as unread
 */
notificationSchema.methods.markAsUnread = async function() {
  if (this.isRead) {
    this.isRead = false;
    this.readAt = null;
    await this.save();
  }
  return this;
};

// Static Methods

/**
 * Create notification for user
 */
notificationSchema.statics.createForUser = async function({
  tenant,
  user,
  type,
  title,
  message,
  priority = 'normal',
  data = {},
  link,
  icon,
  color,
  actionRequired = false,
  expiresInDays = null
}) {
  const notificationData = {
    tenant,
    user,
    type,
    title,
    message,
    priority,
    data,
    link,
    icon,
    color,
    actionRequired
  };

  if (expiresInDays) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);
    notificationData.expiresAt = expiryDate;
  }

  return await this.create(notificationData);
};

/**
 * Get unread count for user
 */
notificationSchema.statics.getUnreadCount = async function(tenant, user) {
  return await this.countDocuments({
    tenant,
    user,
    isRead: false
  });
};

/**
 * Mark all as read for user
 */
notificationSchema.statics.markAllAsRead = async function(tenant, user) {
  return await this.updateMany(
    {
      tenant,
      user,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

/**
 * Delete old read notifications
 */
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await this.deleteMany({
    isRead: true,
    readAt: { $lt: cutoffDate }
  });
};

/**
 * Get notifications summary
 */
notificationSchema.statics.getSummary = async function(tenant, user) {
  const [total, unread, byType, byPriority] = await Promise.all([
    this.countDocuments({ tenant, user }),
    this.countDocuments({ tenant, user, isRead: false }),
    this.aggregate([
      { $match: { tenant, user, isRead: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: { tenant, user, isRead: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ])
  ]);

  return {
    total,
    unread,
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byPriority: byPriority.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
