/**
 * Customer Invoice API Service
 */

import customerAPI from './customerAuthAPI';

/**
 * Get all invoices
 */
export const getInvoices = async (params = {}) => {
  const response = await customerAPI.get('/invoices', { params });
  return response.data;
};

/**
 * Get invoice by ID
 */
export const getInvoiceById = async (id) => {
  const response = await customerAPI.get(`/invoices/${id}`);
  return response.data;
};

/**
 * Get invoice summary
 */
export const getInvoiceSummary = async () => {
  const response = await customerAPI.get('/invoices/summary');
  return response.data;
};

/**
 * Get payment history
 */
export const getPaymentHistory = async () => {
  const response = await customerAPI.get('/invoices/payments/history');
  return response.data;
};

/**
 * Get invoice PDF data
 */
export const getInvoicePDF = async (id) => {
  const response = await customerAPI.get(`/invoices/${id}/pdf`);
  return response.data;
};
