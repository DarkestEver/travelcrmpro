import api from '../api';

// Get all rate sheets
export const getRateSheets = async (params = {}) => {
  const response = await api.get('/rate-sheets', { params });
  return response.data.data;
};

// Get rate sheet by ID
export const getRateSheetById = async (id) => {
  const response = await api.get(`/rate-sheets/${id}`);
  return response.data.data;
};

// Create rate sheet
export const createRateSheet = async (data) => {
  const response = await api.post('/rate-sheets', data);
  return response.data.data;
};

// Update rate sheet
export const updateRateSheet = async (id, data) => {
  const response = await api.put(`/rate-sheets/${id}`, data);
  return response.data.data;
};

// Delete rate sheet
export const deleteRateSheet = async (id) => {
  const response = await api.delete(`/rate-sheets/${id}`);
  return response.data;
};

// Get rate sheet versions
export const getRateSheetVersions = async (id) => {
  const response = await api.get(`/rate-sheets/${id}/versions`);
  return response.data.data;
};

// Publish rate sheet
export const publishRateSheet = async (id) => {
  const response = await api.post(`/rate-sheets/${id}/publish`);
  return response.data.data;
};

// Compare rate sheets
export const compareRateSheets = async (id1, id2) => {
  const response = await api.get('/rate-sheets/compare', {
    params: { id1, id2 }
  });
  return response.data.data;
};

// Restore rate sheet version
export const restoreRateSheetVersion = async (id, versionId) => {
  const response = await api.post(`/rate-sheets/${id}/versions/${versionId}/restore`);
  return response.data.data;
};

// Compare rate sheet versions
export const compareRateSheetVersions = async (id, version1Id, version2Id) => {
  const response = await api.get(`/rate-sheets/${id}/versions/compare`, {
    params: { version1: version1Id, version2: version2Id }
  });
  return response.data.data;
};

// Archive rate sheet
export const archiveRateSheet = async (id) => {
  const response = await api.post(`/rate-sheets/${id}/archive`);
  return response.data.data;
};

export default {
  getRateSheets,
  getRateSheetById,
  createRateSheet,
  updateRateSheet,
  deleteRateSheet,
  getRateSheetVersions,
  publishRateSheet,
  compareRateSheets,
  restoreRateSheetVersion,
  compareRateSheetVersions,
  archiveRateSheet
};
