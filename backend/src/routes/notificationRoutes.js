/**
 * Notification Routes
 * API routes for notifications
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyNotifications,
  getUnreadCount,
  getNotificationsSummary,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getNotificationById
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// Notification routes
router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/summary', getNotificationsSummary);
router.get('/:id', getNotificationById);
router.put('/:id/read', markAsRead);
router.put('/:id/unread', markAsUnread);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/delete-read/all', deleteAllRead);

module.exports = router;
