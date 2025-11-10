/**
 * Notification API Service
 * Handles all notification-related API calls
 */

import api from './api';

export const notificationAPI = {
  /**
   * Get user's notifications with pagination and filters
   * @param {Object} params - Query parameters (page, limit, type, unreadOnly)
   * @returns {Promise} Notifications data
   */
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.type) queryParams.append('type', params.type);
    if (params.unreadOnly) queryParams.append('unreadOnly', 'true');
    
    const queryString = queryParams.toString();
    const url = `/notifications${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get unread notification count
   * @returns {Promise} Unread count
   */
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Get notifications summary (grouped by type)
   * @returns {Promise} Summary data
   */
  getSummary: async () => {
    const response = await api.get('/notifications/summary');
    return response.data;
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Updated notification
   */
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   * @returns {Promise} Result
   */
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Result
   */
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationAPI;
