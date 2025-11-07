import api from './api';

/**
 * Agent Customer API Service
 * All endpoints for agent customer management
 */

/**
 * Get all customers for the authenticated agent
 * @param {Object} params - Query parameters (page, limit, search, sortBy)
 * @returns {Promise} Response with customers array and pagination
 */
export const getMyCustomers = async (params = {}) => {
  const response = await api.get('/agent-portal/customers', { params });
  return response.data;
};

/**
 * Get a single customer by ID
 * @param {string} customerId - Customer ID
 * @returns {Promise} Response with customer data
 */
export const getCustomerById = async (customerId) => {
  const response = await api.get(`/agent-portal/customers/${customerId}`);
  return response.data;
};

/**
 * Create a new customer
 * @param {Object} customerData - Customer data
 * @returns {Promise} Response with created customer
 */
export const createCustomer = async (customerData) => {
  const response = await api.post('/agent-portal/customers', customerData);
  return response.data;
};

/**
 * Update an existing customer
 * @param {string} customerId - Customer ID
 * @param {Object} customerData - Updated customer data
 * @returns {Promise} Response with updated customer
 */
export const updateCustomer = async (customerId, customerData) => {
  const response = await api.put(`/agent-portal/customers/${customerId}`, customerData);
  return response.data;
};

/**
 * Delete a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise} Response with success message
 */
export const deleteCustomer = async (customerId) => {
  const response = await api.delete(`/agent-portal/customers/${customerId}`);
  return response.data;
};

/**
 * Get customer statistics
 * @returns {Promise} Response with customer stats
 */
export const getCustomerStats = async () => {
  const response = await api.get('/agent-portal/customers/stats');
  return response.data;
};

/**
 * Import customers from CSV
 * @param {string} csvData - CSV data as string
 * @returns {Promise} Response with import results
 */
export const importCustomers = async (csvData) => {
  const response = await api.post('/agent-portal/customers/import', { csvData });
  return response.data;
};

/**
 * Download CSV template for customer import
 * @returns {Promise} Response with CSV template
 */
export const downloadCSVTemplate = async () => {
  const response = await api.get('/agent-portal/customers/import/template', {
    responseType: 'blob',
  });
  return response.data;
};
