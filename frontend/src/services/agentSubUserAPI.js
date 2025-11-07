import api from './api';

const API_BASE = '/agent-portal/sub-users';

/**
 * Get all sub-users for the authenticated agent
 */
export const getMySubUsers = async (params = {}) => {
  const data = await api.get(API_BASE, { params });
  return data.data;
};

/**
 * Get single sub-user by ID
 */
export const getSubUserById = async (id) => {
  const data = await api.get(`${API_BASE}/${id}`);
  return data.data.subUser;
};

/**
 * Create a new sub-user
 */
export const createSubUser = async (subUserData) => {
  const data = await api.post(API_BASE, subUserData);
  return data.data.subUser;
};

/**
 * Update sub-user
 */
export const updateSubUser = async (id, subUserData) => {
  const data = await api.put(`${API_BASE}/${id}`, subUserData);
  return data.data.subUser;
};

/**
 * Delete sub-user
 */
export const deleteSubUser = async (id) => {
  const data = await api.delete(`${API_BASE}/${id}`);
  return data;
};

/**
 * Update sub-user permissions
 */
export const updatePermissions = async (id, permissions) => {
  const data = await api.patch(`${API_BASE}/${id}/permissions`, {
    permissions,
  });
  return data.data.subUser;
};

/**
 * Toggle sub-user active status
 */
export const toggleStatus = async (id) => {
  const data = await api.patch(`${API_BASE}/${id}/toggle-status`);
  return data.data.subUser;
};

/**
 * Get sub-user statistics
 */
export const getSubUserStats = async () => {
  const data = await api.get(`${API_BASE}/stats`);
  return data.data.stats;
};

/**
 * Get activity logs for a sub-user
 */
export const getSubUserActivityLogs = async (subUserId, params = {}) => {
  const data = await api.get(`${API_BASE}/${subUserId}/activity-logs`, { params });
  return data.data;
};
