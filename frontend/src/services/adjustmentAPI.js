import api from './api';

const BASE_URL = '/adjustments';

export const adjustmentAPI = {
  // Get all adjustments
  getAdjustments: async (params) => {
    const { data } = await api.get(BASE_URL, { params });
    return data;
  },

  // Get single adjustment
  getAdjustment: async (id) => {
    const { data } = await api.get(`${BASE_URL}/${id}`);
    return data;
  },

  // Get adjustments for a booking
  getBookingAdjustments: async (bookingId) => {
    const { data } = await api.get(`${BASE_URL}/booking/${bookingId}`);
    return data;
  },

  // Create adjustment
  createAdjustment: async (adjustmentData) => {
    const { data } = await api.post(BASE_URL, adjustmentData);
    return data;
  },

  // Update adjustment
  updateAdjustment: async (id, adjustmentData) => {
    const { data } = await api.put(`${BASE_URL}/${id}`, adjustmentData);
    return data;
  },

  // Approve adjustment
  approveAdjustment: async (id, notes) => {
    const { data } = await api.post(`${BASE_URL}/${id}/approve`, { notes });
    return data;
  },

  // Reject adjustment
  rejectAdjustment: async (id, reason) => {
    const { data } = await api.post(`${BASE_URL}/${id}/reject`, { reason });
    return data;
  },

  // Reverse adjustment
  reverseAdjustment: async (id, reason) => {
    const { data } = await api.post(`${BASE_URL}/${id}/reverse`, { reason });
    return data;
  },

  // Get pending approvals
  getPendingApprovals: async () => {
    const { data } = await api.get(`${BASE_URL}/pending-approvals`);
    return data;
  },

  // Get financial summary
  getFinancialSummary: async (startDate, endDate) => {
    const { data } = await api.get(`${BASE_URL}/summary`, {
      params: { startDate, endDate },
    });
    return data;
  },

  // Bulk approve
  bulkApprove: async (adjustmentIds, notes) => {
    const { data } = await api.post(`${BASE_URL}/bulk-approve`, {
      adjustmentIds,
      notes,
    });
    return data;
  },
};

export default adjustmentAPI;
