import api from './api';

const API_BASE = '/agent-portal/payments';

/**
 * Get payment summary
 */
export const getPaymentSummary = async () => {
  const { data } = await api.get(`${API_BASE}/summary`);
  return data;
};

/**
 * Get payment statistics
 */
export const getPaymentStats = async () => {
  const { data } = await api.get(`${API_BASE}/stats`);
  return data;
};

/**
 * Get payment history with filters
 */
export const getMyPayments = async (params = {}) => {
  const { data } = await api.get(API_BASE, { params });
  return data;
};

/**
 * Get single payment by ID
 */
export const getPaymentById = async (id) => {
  const { data } = await api.get(`${API_BASE}/${id}`);
  return data;
};

/**
 * Request commission payout
 */
export const requestPayout = async (paymentMethod, notes) => {
  const { data } = await api.post(`${API_BASE}/request-payout`, {
    paymentMethod,
    notes,
  });
  return data;
};

export default {
  getPaymentSummary,
  getPaymentStats,
  getMyPayments,
  getPaymentById,
  requestPayout,
};
