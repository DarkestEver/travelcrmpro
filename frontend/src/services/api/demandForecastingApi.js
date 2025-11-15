import api from '../api';

// Get forecasts
export const getForecasts = async (params = {}) => {
  const response = await api.get('/demand-forecasting', { params });
  return response.data.data;
};

// Get forecast by ID
export const getForecastById = async (id) => {
  const response = await api.get(`/demand-forecasting/${id}`);
  return response.data.data;
};

// Generate new forecast
export const generateForecast = async (data) => {
  const response = await api.post('/demand-forecasting/generate', data);
  return response.data.data;
};

// Get historical analysis
export const getHistoricalAnalysis = async (params = {}) => {
  const response = await api.get('/demand-forecasting/historical', { params });
  return response.data.data;
};

// Get seasonal patterns
export const getSeasonalPatterns = async (params = {}) => {
  const response = await api.get('/demand-forecasting/patterns/seasonal', { params });
  return response.data.data;
};

// Get predictive insights
export const getPredictiveInsights = async (params = {}) => {
  const response = await api.get('/demand-forecasting/insights', { params });
  return response.data.data;
};

// Get forecast accuracy
export const getForecastAccuracy = async (id) => {
  const response = await api.get(`/demand-forecasting/${id}/accuracy`);
  return response.data.data;
};

// Alias for generate forecast (backward compatibility)
export const generateNewForecast = generateForecast;

export default {
  getForecasts,
  getForecastById,
  generateForecast,
  generateNewForecast,
  getHistoricalAnalysis,
  getSeasonalPatterns,
  getPredictiveInsights,
  getForecastAccuracy
};
