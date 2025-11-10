/**
 * Customer Portal Notification Controller
 * Handles customer notifications
 */

const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/response');
const Notification = require('../../models/Notification');

/**
 * @desc    Get all notifications for customer
 * @route   GET /api/v1/customer/notifications
 * @access  Private (Customer)
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;
  
  const {
    type,
    priority,
    read,
    page = 1,
    limit = 20,
  } = req.query;

  // Build query
  const query = {
    recipientId: customerId,
    recipientModel: 'Customer',
    tenantId,
  };

  if (type) {
    query.type = type;
  }

  if (priority) {
    query.priority = priority;
  }

  if (read !== undefined) {
    query.read = read === 'true';
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ ...query, read: false }),
  ]);

  successResponse(res, 200, 'Notifications retrieved successfully', {
    notifications,
    unreadCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/v1/customer/notifications/unread-count
 * @access  Private (Customer)
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const count = await Notification.countDocuments({
    recipientId: customerId,
    recipientModel: 'Customer',
    tenantId,
    read: false,
  });

  successResponse(res, 200, 'Unread count retrieved', {
    unreadCount: count,
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/customer/notifications/:id/read
 * @access  Private (Customer)
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const notification = await Notification.findOne({
    _id: id,
    recipientId: customerId,
    recipientModel: 'Customer',
    tenantId,
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  notification.read = true;
  notification.readAt = Date.now();
  await notification.save();

  successResponse(res, 200, 'Notification marked as read', {
    notification,
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/customer/notifications/mark-all-read
 * @access  Private (Customer)
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  await Notification.updateMany(
    {
      recipientId: customerId,
      recipientModel: 'Customer',
      tenantId,
      read: false,
    },
    {
      $set: {
        read: true,
        readAt: Date.now(),
      },
    }
  );

  successResponse(res, 200, 'All notifications marked as read', {});
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/customer/notifications/:id
 * @access  Private (Customer)
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    recipientId: customerId,
    recipientModel: 'Customer',
    tenantId,
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  successResponse(res, 200, 'Notification deleted', {});
});

module.exports = exports;
