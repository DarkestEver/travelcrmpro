import api from './api';

const API_BASE = '/agent-portal/commissions';

/**
 * Get commission summary for agent
 */
export const getCommissionSummary = async () => {
  const { data } = await api.get(`${API_BASE}/summary`);
  return data;
};

/**
 * Get commission statistics
 */
export const getCommissionStats = async () => {
  const { data } = await api.get(`${API_BASE}/stats`);
  return data;
};

/**
 * Get commission history with filters
 */
export const getMyCommissions = async (params = {}) => {
  const { data } = await api.get(API_BASE, { params });
  return data;
};

/**
 * Get single commission by ID
 */
export const getCommissionById = async (id) => {
  const { data } = await api.get(`${API_BASE}/${id}`);
  return data;
};

export default {
  getCommissionSummary,
  getCommissionStats,
  getMyCommissions,
  getCommissionById,
};
