import api from './api';

/**
 * Agent Portal API endpoints
 */
export const agentPortalAPI = {
  // Get dashboard stats
  getStats: () => api.get('/agent-portal/stats'),

  // Get recent activity
  getActivity: (params) => api.get('/agent-portal/activity', { params }),
};
