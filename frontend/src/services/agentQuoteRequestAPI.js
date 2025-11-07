import api from './api';

/**
 * Agent Quote Request API Service
 * All endpoints for agent quote request management
 */

/**
 * Submit a new quote request
 * @param {Object} quoteData - Quote request data
 * @returns {Promise} Response with created quote request
 */
export const submitQuoteRequest = async (quoteData) => {
  const response = await api.post('/agent-portal/quote-requests', quoteData);
  return response.data;
};

/**
 * Get all quote requests for the authenticated agent
 * @param {Object} params - Query parameters (page, limit, status, search, sortBy)
 * @returns {Promise} Response with quote requests array and pagination
 */
export const getMyQuoteRequests = async (params = {}) => {
  const response = await api.get('/agent-portal/quote-requests', { params });
  return response.data;
};

/**
 * Get a single quote request by ID
 * @param {string} quoteRequestId - Quote request ID
 * @returns {Promise} Response with quote request data
 */
export const getQuoteRequestById = async (quoteRequestId) => {
  const response = await api.get(`/agent-portal/quote-requests/${quoteRequestId}`);
  return response.data;
};

/**
 * Accept a quote
 * @param {string} quoteRequestId - Quote request ID
 * @returns {Promise} Response with updated quote request
 */
export const acceptQuote = async (quoteRequestId) => {
  const response = await api.put(`/agent-portal/quote-requests/${quoteRequestId}/accept`);
  return response.data;
};

/**
 * Reject a quote
 * @param {string} quoteRequestId - Quote request ID
 * @param {string} reason - Rejection reason
 * @returns {Promise} Response with updated quote request
 */
export const rejectQuote = async (quoteRequestId, reason) => {
  const response = await api.put(`/agent-portal/quote-requests/${quoteRequestId}/reject`, { reason });
  return response.data;
};

/**
 * Cancel a quote request
 * @param {string} quoteRequestId - Quote request ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise} Response with updated quote request
 */
export const cancelQuoteRequest = async (quoteRequestId, reason) => {
  const response = await api.delete(`/agent-portal/quote-requests/${quoteRequestId}`, {
    data: { reason },
  });
  return response.data;
};

/**
 * Get quote request statistics
 * @returns {Promise} Response with quote request stats
 */
export const getQuoteRequestStats = async () => {
  const response = await api.get('/agent-portal/quote-requests/stats');
  return response.data;
};
