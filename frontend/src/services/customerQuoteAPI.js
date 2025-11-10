/**
 * Customer Quote API Service
 */

import customerAPI from './customerAuthAPI';

/**
 * Submit new quote request
 */
export const submitQuoteRequest = async (quoteData) => {
  const response = await customerAPI.post('/quotes/request', quoteData);
  return response.data;
};

/**
 * Get all quotes
 */
export const getQuotes = async (params = {}) => {
  const response = await customerAPI.get('/quotes', { params });
  return response.data;
};

/**
 * Get quote by ID
 */
export const getQuoteById = async (id) => {
  const response = await customerAPI.get(`/quotes/${id}`);
  return response.data;
};

/**
 * Accept quote
 */
export const acceptQuote = async (id) => {
  const response = await customerAPI.post(`/quotes/${id}/accept`);
  return response.data;
};

/**
 * Decline quote
 */
export const declineQuote = async (id, reason) => {
  const response = await customerAPI.post(`/quotes/${id}/decline`, { reason });
  return response.data;
};
