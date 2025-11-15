import api from '../api';

// Get all inventory items
export const getInventoryItems = async (params = {}) => {
  const response = await api.get('/inventory', { params });
  return response.data.data;
};

// Get inventory by ID
export const getInventoryById = async (id) => {
  const response = await api.get(`/inventory/${id}`);
  return response.data.data;
};

// Create inventory item
export const createInventory = async (data) => {
  const response = await api.post('/inventory', data);
  return response.data.data;
};

// Update inventory item
export const updateInventory = async (id, data) => {
  const response = await api.put(`/inventory/${id}`, data);
  return response.data.data;
};

// Delete inventory item
export const deleteInventory = async (id) => {
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
};

// Get availability calendar
export const getAvailabilityCalendar = async (id, startDate, endDate) => {
  const response = await api.get(`/inventory/${id}/availability`, {
    params: { startDate, endDate }
  });
  return response.data.data;
};

// Update availability
export const updateAvailability = async (id, data) => {
  const response = await api.post(`/inventory/${id}/availability`, data);
  return response.data.data;
};

// Get seasonal pricing
export const getSeasonalPricing = async (id) => {
  const response = await api.get(`/inventory/${id}/pricing/seasonal`);
  return response.data.data;
};

// Create seasonal pricing
export const createSeasonalPricing = async (id, data) => {
  const response = await api.post(`/inventory/${id}/pricing/seasonal`, data);
  return response.data.data;
};

// Update seasonal pricing
export const updateSeasonalPricing = async (id, pricingId, data) => {
  const response = await api.put(`/inventory/${id}/pricing/seasonal/${pricingId}`, data);
  return response.data.data;
};

// Delete seasonal pricing
export const deleteSeasonalPricing = async (id, pricingId) => {
  const response = await api.delete(`/inventory/${id}/pricing/seasonal/${pricingId}`);
  return response.data;
};

// Bulk upload inventory
export const bulkUploadInventory = async (formData) => {
  const response = await api.post('/inventory/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
};

// Get availability (alias for getAvailabilityCalendar)
export const getAvailability = async (id, startDate, endDate) => {
  return getAvailabilityCalendar(id, startDate, endDate);
};

// Bulk update availability
export const bulkUpdateAvailability = async (id, data) => {
  const response = await api.post(`/inventory/${id}/availability/bulk`, data);
  return response.data.data;
};

export default {
  getInventoryItems,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getAvailabilityCalendar,
  getAvailability,
  updateAvailability,
  bulkUpdateAvailability,
  getSeasonalPricing,
  createSeasonalPricing,
  updateSeasonalPricing,
  deleteSeasonalPricing,
  bulkUploadInventory
};
