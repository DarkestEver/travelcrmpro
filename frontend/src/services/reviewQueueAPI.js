import api from './api';

const reviewQueueAPI = {
  // Get review queue items
  getQueue: async (params = {}) => {
    const response = await api.get('/review-queue', { params });
    return response.data;
  },

  // Get my assigned reviews
  getMyQueue: async () => {
    const response = await api.get('/review-queue/my-queue');
    return response.data;
  },

  // Get unassigned reviews
  getUnassigned: async () => {
    const response = await api.get('/review-queue/unassigned');
    return response.data;
  },

  // Get SLA breached items
  getBreachedSLA: async () => {
    const response = await api.get('/review-queue/breached');
    return response.data;
  },

  // Get queue statistics
  getStats: async () => {
    const response = await api.get('/review-queue/stats');
    return response.data;
  },

  // Get single review item
  getReviewItem: async (id) => {
    const response = await api.get(`/review-queue/${id}`);
    return response.data;
  },

  // Assign review
  assignReview: async (id, userId) => {
    const response = await api.post(`/review-queue/${id}/assign`, { userId });
    return response.data;
  },

  // Complete review
  completeReview: async (id, decision, notes) => {
    const response = await api.post(`/review-queue/${id}/complete`, {
      decision,
      notes
    });
    return response.data;
  },

  // Escalate review
  escalateReview: async (id, reason) => {
    const response = await api.post(`/review-queue/${id}/escalate`, { reason });
    return response.data;
  },

  // Add comment
  addComment: async (id, comment) => {
    const response = await api.post(`/review-queue/${id}/comment`, { comment });
    return response.data;
  }
};

export default reviewQueueAPI;
