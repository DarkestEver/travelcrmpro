import api from '../api';

// Get all bank accounts
export const getBankAccounts = async () => {
  const response = await api.get('/bank-reconciliation/accounts');
  return response.data.data;
};

// Get bank statements
export const getBankStatements = async (accountId, params = {}) => {
  const response = await api.get(`/bank-reconciliation/statements/${accountId}`, { params });
  return response.data.data;
};

// Upload bank statement
export const uploadBankStatement = async (accountId, formData) => {
  const response = await api.post(`/bank-reconciliation/statements/${accountId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
};

// Get unmatched transactions
export const getUnmatchedTransactions = async (accountId) => {
  const response = await api.get(`/bank-reconciliation/transactions/${accountId}/unmatched`);
  return response.data.data;
};

// Match transaction
export const matchTransaction = async (transactionId, data) => {
  const response = await api.post(`/bank-reconciliation/transactions/${transactionId}/match`, data);
  return response.data.data;
};

// Get discrepancies
export const getDiscrepancies = async (accountId, params = {}) => {
  const response = await api.get(`/bank-reconciliation/discrepancies/${accountId}`, { params });
  return response.data.data;
};

// Resolve discrepancy
export const resolveDiscrepancy = async (discrepancyId, data) => {
  const response = await api.post(`/bank-reconciliation/discrepancies/${discrepancyId}/resolve`, data);
  return response.data.data;
};

// Get reconciliation history
export const getReconciliationHistory = async (accountId, params = {}) => {
  const response = await api.get(`/bank-reconciliation/history/${accountId}`, { params });
  return response.data.data;
};

// Generate reconciliation report
export const generateReconciliationReport = async (accountId, params = {}) => {
  const response = await api.get(`/bank-reconciliation/reports/${accountId}`, { 
    params,
    responseType: 'blob'
  });
  return response.data;
};

export default {
  getBankAccounts,
  getBankStatements,
  uploadBankStatement,
  getUnmatchedTransactions,
  matchTransaction,
  getDiscrepancies,
  resolveDiscrepancy,
  getReconciliationHistory,
  generateReconciliationReport
};
