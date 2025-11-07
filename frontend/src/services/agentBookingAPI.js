import axios from 'axios';

const API_BASE = '/api/v1/agent-portal/bookings';

/**
 * Get all bookings for the authenticated agent
 */
export const getMyBookings = async (params = {}) => {
  const { data } = await axios.get(API_BASE, { params });
  return data.data;
};

/**
 * Get single booking details
 */
export const getBookingById = async (id) => {
  const { data } = await axios.get(`${API_BASE}/${id}`);
  return data.data.booking;
};

/**
 * Get booking statistics
 */
export const getBookingStats = async () => {
  const { data } = await axios.get(`${API_BASE}/stats`);
  return data.data.stats;
};

/**
 * Download booking voucher
 */
export const downloadVoucher = async (id) => {
  const { data } = await axios.get(`${API_BASE}/${id}/voucher`);
  return data.data;
};
