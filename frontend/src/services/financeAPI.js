import api from './api';

// Finance Dashboard
export const getFinanceDashboard = () => api.get('/finance/dashboard');

// Tax Settings
export const getTaxSettings = () => api.get('/finance/tax-settings');
export const updateTaxSettings = (data) => api.put('/finance/tax-settings', data);
export const addTaxCategory = (data) => api.post('/finance/tax-settings/categories', data);
export const deleteTaxCategory = (id) => api.delete(`/finance/tax-settings/categories/${id}`);

// Payments
export const getPayments = (params) => api.get('/finance/payments', { params });
export const getPayment = (id) => api.get(`/finance/payments/${id}`);
export const processRefund = (id, data) => api.post(`/finance/payments/${id}/refund`, data);
export const reconcilePayment = (id, data) => api.post(`/finance/payments/${id}/reconcile`, data);
export const exportPayments = (params) => api.get('/finance/payments/export', { params, responseType: 'blob' });

// Invoices
export const getInvoices = (params) => api.get('/finance/invoices', { params });
export const generateInvoice = (data) => api.post('/finance/invoices/generate', data);
export const downloadInvoice = (id) => api.get(`/finance/invoices/${id}/download`, { responseType: 'blob' });
export const sendInvoiceEmail = (id) => api.post(`/finance/invoices/${id}/send`);
export const exportInvoices = (params) => api.get('/finance/invoices/export', { params, responseType: 'blob' });

// Reconciliation
export const getReconciliationData = (params) => api.get('/finance/reconciliation', { params });
export const reconcileItems = (data) => api.post('/finance/reconciliation/reconcile', data);
export const markDiscrepancy = (id) => api.post(`/finance/reconciliation/${id}/discrepancy`);
export const exportReconciliation = (params) => api.get('/finance/reconciliation/export', { params, responseType: 'blob' });

// Financial Reports
export const getFinancialReports = (params) => api.get('/finance/reports', { params });
export const getReport = (params) => api.get('/finance/reports/generate', { params });
export const exportReport = (params) => api.get('/finance/reports/export', { params, responseType: 'blob' });

// Finance Settings
export const getFinanceSettings = () => api.get('/finance/settings');
export const updateFinanceSettings = (data) => api.put('/finance/settings', data);

export default {
  getFinanceDashboard,
  getTaxSettings,
  updateTaxSettings,
  addTaxCategory,
  deleteTaxCategory,
  getPayments,
  getPayment,
  processRefund,
  reconcilePayment,
  exportPayments,
  getInvoices,
  generateInvoice,
  downloadInvoice,
  sendInvoiceEmail,
  exportInvoices,
  getReconciliationData,
  reconcileItems,
  markDiscrepancy,
  exportReconciliation,
  getFinancialReports,
  getReport,
  exportReport,
  getFinanceSettings,
  updateFinanceSettings,
};

