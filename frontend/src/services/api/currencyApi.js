import api from '../api';

// Get supported currencies
export const getSupportedCurrencies = async () => {
  const response = await api.get('/currency/supported');
  return response.data.data;
};

// Get exchange rates
export const getExchangeRates = async (baseCurrency = 'USD') => {
  const response = await api.get('/currency/rates', { params: { base: baseCurrency } });
  return response.data.data;
};

// Convert currency
export const convertCurrency = async (amount, from, to) => {
  const response = await api.post('/currency/convert', { amount, from, to });
  return response.data.data;
};

// Get historical rates
export const getHistoricalRates = async (currency, startDate, endDate) => {
  const response = await api.get('/currency/historical', {
    params: { currency, startDate, endDate }
  });
  return response.data.data;
};

// Update exchange rate (admin only)
export const updateExchangeRate = async (data) => {
  const response = await api.post('/currency/rates/update', data);
  return response.data.data;
};

// Get base currency
export const getBaseCurrency = async () => {
  const response = await api.get('/currency/base');
  return response.data.data;
};

// Set base currency (admin only)
export const setBaseCurrency = async (currency) => {
  const response = await api.post('/currency/base', { currency });
  return response.data.data;
};

// Get all currencies (alias for getSupportedCurrencies)
export const getCurrencies = async () => {
  return getSupportedCurrencies();
};

export default {
  getSupportedCurrencies,
  getCurrencies,
  getExchangeRates,
  convertCurrency,
  getHistoricalRates,
  updateExchangeRate,
  getBaseCurrency,
  setBaseCurrency
};
