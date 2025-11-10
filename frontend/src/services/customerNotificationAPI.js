/**
 * Customer Notification API Service
 */

import customerAPI from './customerAuthAPI';

/**
 * Get all notifications
 */
export const getNotifications = async (params = {}) => {
  const response = await customerAPI.get('/notifications', { params });
  return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  const response = await customerAPI.get('/notifications/unread-count');
  return response.data;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id) => {
  const response = await customerAPI.put(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  const response = await customerAPI.put('/notifications/mark-all-read');
  return response.data;
};

/**
 * Delete notification
 */
export const deleteNotification = async (id) => {
  const response = await customerAPI.delete(`/notifications/${id}`);
  return response.data;
};
