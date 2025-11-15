import api from '../api';

// Get performance metrics
export const getPerformanceMetrics = async (params = {}) => {
  const response = await api.get('/performance/metrics', { params });
  return response.data.data;
};

// Get slow queries
export const getSlowQueries = async (params = {}) => {
  const response = await api.get('/performance/queries/slow', { params });
  return response.data.data;
};

// Get cache statistics
export const getCacheStats = async () => {
  const response = await api.get('/performance/cache/stats');
  return response.data.data;
};

// Clear cache
export const clearCache = async (cacheType) => {
  const response = await api.post('/performance/cache/clear', { cacheType });
  return response.data;
};

// Get API response times
export const getAPIResponseTimes = async (params = {}) => {
  const response = await api.get('/performance/api/response-times', { params });
  return response.data.data;
};

// Get resource usage
export const getResourceUsage = async () => {
  const response = await api.get('/performance/resources/usage');
  return response.data.data;
};

// Get database metrics
export const getDatabaseMetrics = async () => {
  const response = await api.get('/performance/database/metrics');
  return response.data.data;
};

// Get endpoint statistics
export const getEndpointStats = async (params = {}) => {
  const response = await api.get('/performance/endpoints/stats', { params });
  return response.data.data;
};

// Get error rates
export const getErrorRates = async (params = {}) => {
  const response = await api.get('/performance/errors/rates', { params });
  return response.data.data;
};

// Optimize database
export const optimizeDatabase = async () => {
  const response = await api.post('/performance/database/optimize');
  return response.data;
};

// Get performance report
export const getPerformanceReport = async (params = {}) => {
  const response = await api.get('/performance/report', { 
    params,
    responseType: 'blob'
  });
  return response.data;
};

// Alias for get performance metrics (backward compatibility)
export const getDetailedMetrics = getPerformanceMetrics;

// Clear specific cache key
export const clearCacheKey = async (key) => {
  const response = await api.delete(`/performance/cache/key/${key}`);
  return response.data;
};

export default {
  getPerformanceMetrics,
  getDetailedMetrics,
  getSlowQueries,
  getCacheStats,
  clearCache,
  clearCacheKey,
  getAPIResponseTimes,
  getResourceUsage,
  getDatabaseMetrics,
  getEndpointStats,
  getErrorRates,
  optimizeDatabase,
  getPerformanceReport
};
