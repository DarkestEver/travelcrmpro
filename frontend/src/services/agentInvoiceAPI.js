import api from './api';

export const getInvoiceSummary = async () => {
  const { data } = await api.get('/agent-portal/invoices/summary');
  return data.data;
};

export const getMyInvoices = async (params = {}) => {
  const { data } = await api.get('/agent-portal/invoices', { params });
  return data;
};

export const getInvoiceById = async (id) => {
  const { data } = await api.get(`/agent-portal/invoices/${id}`);
  return data.data;
};

export const createInvoice = async (invoiceData) => {
  const { data } = await api.post('/agent-portal/invoices', invoiceData);
  return data.data;
};

export const updateInvoice = async (id, invoiceData) => {
  const { data } = await api.put(`/agent-portal/invoices/${id}`, invoiceData);
  return data.data;
};

export const sendInvoice = async (id) => {
  const { data } = await api.post(`/agent-portal/invoices/${id}/send`);
  return data.data;
};

export const downloadInvoicePDF = async (id) => {
  const response = await api.get(`/agent-portal/invoices/${id}/pdf`, {
    responseType: 'blob'
  });
  return response.data;
};

export const recordPayment = async (id, amount) => {
  const { data } = await api.post(`/agent-portal/invoices/${id}/payment`, { amount });
  return data.data;
};

export const cancelInvoice = async (id) => {
  const { data } = await api.post(`/agent-portal/invoices/${id}/cancel`);
  return data.data;
};

export const deleteInvoice = async (id) => {
  const { data } = await api.delete(`/agent-portal/invoices/${id}`);
  return data;
};
