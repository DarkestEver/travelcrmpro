import api from './api';

const emailAPI = {
  // Get all emails with filters
  getEmails: async (params = {}) => {
    const response = await api.get('/emails', { params });
    return response.data;
  },

  // Get single email by ID
  getEmailById: async (id) => {
    const response = await api.get(`/emails/${id}`);
    return response.data;
  },

  // Get email statistics
  getStats: async (params = {}) => {
    const response = await api.get('/emails/stats', { params });
    return response.data;
  },

  // Categorize email
  categorizeEmail: async (id) => {
    const response = await api.post(`/emails/${id}/categorize`);
    return response.data;
  },

  // Extract data from email
  extractData: async (id, type) => {
    const response = await api.post(`/emails/${id}/extract`, { type });
    return response.data;
  },

  // Match packages
  matchPackages: async (id) => {
    const response = await api.post(`/emails/${id}/match`);
    return response.data;
  },

  // Generate response
  generateResponse: async (id, templateType, context) => {
    const response = await api.post(`/emails/${id}/respond`, {
      templateType,
      context
    });
    return response.data;
  },

  // Reply to email manually
  replyToEmail: async (id, replyData) => {
    const response = await api.post(`/emails/${id}/reply`, replyData);
    return response.data;
  },

  // Delete email
  deleteEmail: async (id) => {
    const response = await api.delete(`/emails/${id}`);
    return response.data;
  },

  // Webhook endpoint (for testing)
  sendTestEmail: async (emailData) => {
    const response = await api.post('/emails/webhook', emailData);
    return response.data;
  }
};

export default emailAPI;
