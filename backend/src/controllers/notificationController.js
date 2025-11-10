/**
 * Notification Controller
 * Handles notification-related operations
 */

const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * @desc    Get my notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, priority, isRead } = req.query;

  const query = {
    tenant: req.user.tenant,
    user: req.user._id
  };

  if (type) query.type = type;
  if (priority) query.priority = priority;
  if (isRead !== undefined) query.isRead = isRead === 'true';

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    Notification.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: notifications
  });
});

/**
 * @desc    Get unread notifications count
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.getUnreadCount(req.user.tenant, req.user._id);

  res.status(200).json({
    success: true,
    data: { count }
  });
});

/**
 * @desc    Get notifications summary
 * @route   GET /api/v1/notifications/summary
 * @access  Private
 */
exports.getNotificationsSummary = asyncHandler(async (req, res) => {
  const summary = await Notification.getSummary(req.user.tenant, req.user._id);

  res.status(200).json({
    success: true,
    data: summary
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    user: req.user._id
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  await notification.markAsRead();

  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * @desc    Mark notification as unread
 * @route   PUT /api/v1/notifications/:id/unread
 * @access  Private
 */
exports.markAsUnread = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    user: req.user._id
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  await notification.markAsUnread();

  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/mark-all-read
 * @access  Private
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.markAllAsRead(req.user.tenant, req.user._id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: { modified: result.modifiedCount }
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    tenant: req.user.tenant,
    user: req.user._id
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
});

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/v1/notifications/delete-read
 * @access  Private
 */
exports.deleteAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({
    tenant: req.user.tenant,
    user: req.user._id,
    isRead: true
  });

  res.status(200).json({
    success: true,
    message: 'All read notifications deleted',
    data: { deleted: result.deletedCount }
  });
});

/**
 * @desc    Get notification by ID
 * @route   GET /api/v1/notifications/:id
 * @access  Private
 */
exports.getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    user: req.user._id
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  // Auto-mark as read when viewed
  if (!notification.isRead) {
    await notification.markAsRead();
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});
