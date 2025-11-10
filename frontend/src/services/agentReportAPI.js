import api from './api';

const API_BASE = '/agent-portal/reports';

/**
 * Get sales report
 */
export const getSalesReport = async (params = {}) => {
  const { data } = await api.get(`${API_BASE}/sales`, { params });
  return data;
};

/**
 * Get booking trends
 */
export const getBookingTrends = async (params = {}) => {
  const { data } = await api.get(`${API_BASE}/booking-trends`, { params });
  return data;
};

/**
 * Get customer insights
 */
export const getCustomerInsights = async () => {
  const { data } = await api.get(`${API_BASE}/customer-insights`);
  return data;
};

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = async (params = {}) => {
  const { data } = await api.get(`${API_BASE}/revenue`, { params });
  return data;
};

/**
 * Get performance summary
 */
export const getPerformanceSummary = async () => {
  const { data } = await api.get(`${API_BASE}/performance`);
  return data;
};

export default {
  getSalesReport,
  getBookingTrends,
  getCustomerInsights,
  getRevenueAnalytics,
  getPerformanceSummary,
};
