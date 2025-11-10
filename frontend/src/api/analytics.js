import api from './config';

export const analyticsAPI = {
  // Get analytics overview
  getOverview: async (dateRange = '30d') => {
    const { data } = await api.get(`/analytics/overview?range=${dateRange}`);
    return data;
  },

  // Get revenue data
  getRevenue: async (dateRange = '30d') => {
    const { data } = await api.get(`/analytics/revenue?range=${dateRange}`);
    return data;
  },

  // Get booking trends
  getBookingTrends: async (dateRange = '30d') => {
    const { data } = await api.get(`/analytics/booking-trends?range=${dateRange}`);
    return data;
  },

  // Get agent performance
  getAgentPerformance: async () => {
    const { data } = await api.get('/analytics/agent-performance');
    return data;
  },

  // Get customer acquisition
  getCustomerAcquisition: async (dateRange = '30d') => {
    const { data } = await api.get(`/analytics/customer-acquisition?range=${dateRange}`);
    return data;
  },

  // Get top destinations
  getTopDestinations: async (dateRange = '30d') => {
    const { data } = await api.get(`/analytics/top-destinations?range=${dateRange}`);
    return data;
  },

  // Get supplier ratings
  getSupplierRatings: async () => {
    const { data } = await api.get('/analytics/supplier-ratings');
    return data;
  },

  // Export analytics report
  exportReport: async (type, dateRange) => {
    const { data } = await api.get(`/analytics/export?type=${type}&range=${dateRange}`, {
      responseType: 'blob'
    });
    return data;
  }
};
