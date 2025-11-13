import api from './api';

const emailAccountsAPI = {
  // Get all email accounts
  getAll: async () => {
    const response = await api.get('/email-accounts');
    return response.data;
  },
  
  // Get single account
  getById: async (id) => {
    const response = await api.get(`/email-accounts/${id}`);
    return response.data;
  },
  
  // Create new account
  create: async (data) => {
    const response = await api.post('/email-accounts', data);
    return response.data;
  },
  
  // Update account
  update: async (id, data) => {
    const response = await api.put(`/email-accounts/${id}`, data);
    return response.data;
  },
  
  // Delete account
  delete: async (id) => {
    const response = await api.delete(`/email-accounts/${id}`);
    return response.data;
  },
  
  // Test IMAP connection
  testIMAP: async (id) => {
    const response = await api.post(`/email-accounts/${id}/test-imap`);
    return response; // Already unwrapped by axios interceptor
  },
  
  // Test SMTP connection
  testSMTP: async (id) => {
    const response = await api.post(`/email-accounts/${id}/test-smtp`);
    return response; // Already unwrapped by axios interceptor
  },
  
  // Set as primary
  setPrimary: async (id) => {
    const response = await api.post(`/email-accounts/${id}/set-primary`);
    return response.data;
  },
  
  // Sync account (Phase 2)
  sync: async (id) => {
    const response = await api.post(`/email-accounts/${id}/sync`);
    return response.data;
  },
  
  // Watcher Management
  addWatcher: async (id, watcherData) => {
    const response = await api.post(`/email-accounts/${id}/watchers`, watcherData);
    return response.data;
  },
  
  removeWatcher: async (id, email) => {
    const response = await api.delete(`/email-accounts/${id}/watchers/${encodeURIComponent(email)}`);
    return response.data;
  },
  
  toggleWatcher: async (id, email) => {
    const response = await api.patch(`/email-accounts/${id}/watchers/${encodeURIComponent(email)}/toggle`);
    return response.data;
  }
};

export default emailAccountsAPI;
