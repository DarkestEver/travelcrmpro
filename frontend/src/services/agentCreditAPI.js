import api from './api';

const API_BASE = '/agent-portal/credit';

/**
 * Get agent's credit status
 */
export const getCreditStatus = async () => {
  const { data } = await api.get(`${API_BASE}/status`);
  return data;
};

/**
 * Get credit usage history
 */
export const getCreditHistory = async (params = {}) => {
  const { data } = await api.get(`${API_BASE}/history`, { params });
  return data;
};

/**
 * Check if amount is within credit limit
 */
export const checkCredit = async (amount) => {
  const { data } = await api.post(`${API_BASE}/check`, { amount });
  return data;
};

/**
 * Request credit limit increase
 */
export const requestCreditIncrease = async (requestedLimit, reason) => {
  const { data } = await api.post(`${API_BASE}/request-increase`, {
    requestedLimit,
    reason,
  });
  return data;
};

export default {
  getCreditStatus,
  getCreditHistory,
  checkCredit,
  requestCreditIncrease,
};
