/**
 * Customer Booking API Service
 */

import customerAPI from './customerAuthAPI';

/**
 * Get all bookings
 */
export const getBookings = async (params = {}) => {
  const response = await customerAPI.get('/bookings', { params });
  return response.data;
};

/**
 * Get booking by ID
 */
export const getBookingById = async (id) => {
  const response = await customerAPI.get(`/bookings/${id}`);
  return response.data;
};

/**
 * Get booking voucher
 */
export const getBookingVoucher = async (id) => {
  const response = await customerAPI.get(`/bookings/${id}/voucher`);
  return response.data;
};

/**
 * Request booking cancellation
 */
export const requestCancellation = async (id, reason) => {
  const response = await customerAPI.post(`/bookings/${id}/cancel-request`, { reason });
  return response.data;
};
