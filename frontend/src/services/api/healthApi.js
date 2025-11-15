import api from '../api';

// Get system health overview
export const getSystemHealth = async () => {
  const response = await api.get('/health');
  return response.data.data;
};

// Get service status
export const getServiceStatus = async () => {
  const response = await api.get('/health/services');
  return response.data.data;
};

// Get health metrics
export const getHealthMetrics = async (params = {}) => {
  const response = await api.get('/health/metrics', { params });
  return response.data.data;
};

// Get active alerts
export const getActiveAlerts = async () => {
  const response = await api.get('/health/alerts');
  return response.data.data;
};

// Acknowledge alert
export const acknowledgeAlert = async (alertId) => {
  const response = await api.post(`/health/alerts/${alertId}/acknowledge`);
  return response.data;
};

// Get uptime statistics
export const getUptimeStats = async (period = '30d') => {
  const response = await api.get('/health/uptime', { params: { period } });
  return response.data.data;
};

// Configure alert thresholds
export const configureAlertThresholds = async (config) => {
  const response = await api.post('/health/alerts/thresholds', config);
  return response.data;
};

// Restart service
export const restartService = async (serviceId) => {
  const response = await api.post(`/health/services/${serviceId}/restart`);
  return response.data;
};

export default {
  getSystemHealth,
  getServiceStatus,
  getHealthMetrics,
  getActiveAlerts,
  acknowledgeAlert,
  getUptimeStats,
  configureAlertThresholds,
  restartService
};
