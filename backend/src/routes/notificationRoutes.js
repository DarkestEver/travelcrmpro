const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const { successResponse } = require('../utils/response');

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await notificationService.getUserNotifications(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    return successResponse(res, 200, 'Notifications fetched successfully', result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user.id, 1, 1);

    return successResponse(
      res,
      200,
      'Unread count fetched successfully',
      { count: result.unreadCount }
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(
      req.user.id,
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return successResponse(res, 200, 'Notification marked as read', notification);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);

    return successResponse(res, 200, 'All notifications marked as read', null);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const deleted = await notificationService.deleteNotification(
      req.user.id,
      req.params.id
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return successResponse(res, 200, 'Notification deleted successfully', null);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/notifications/test
 * @desc    Send test notification (development only)
 * @access  Private
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test', authenticate, async (req, res, next) => {
    try {
      const notification = await notificationService.createNotification(
        req.user.id,
        {
          type: 'test',
          title: 'Test Notification',
          message: 'This is a test notification',
          priority: 'low',
          icon: '🔔',
        }
      );

      return successResponse(res, 200, 'Test notification created', notification);
    } catch (error) {
      next(error);
    }
  });
}

module.exports = router;
