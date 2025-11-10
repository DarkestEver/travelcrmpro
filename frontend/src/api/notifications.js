import api from './config';

export const notificationsAPI = {
  // Get all notifications for current user
  getAll: async () => {
    const { data } = await api.get('/notifications');
    return data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const { data } = await api.get('/notifications/unread-count');
    return data;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const { data } = await api.patch('/notifications/mark-all-read');
    return data;
  },

  // Delete notification
  delete: async (id) => {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },

  // Get notification settings
  getSettings: async () => {
    const { data } = await api.get('/notifications/settings');
    return data;
  },

  // Update notification settings
  updateSettings: async (settings) => {
    const { data } = await api.put('/notifications/settings', settings);
    return data;
  }
};
