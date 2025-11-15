import api from '../api';

// Get sync status
export const getSyncStatus = async () => {
  const response = await api.get('/inventory-sync/status');
  return response.data.data;
};

// Get sync history
export const getSyncHistory = async (params = {}) => {
  const response = await api.get('/inventory-sync/history', { params });
  return response.data.data;
};

// Trigger manual sync
export const triggerSync = async (supplierId) => {
  const response = await api.post('/inventory-sync/trigger', { supplierId });
  return response.data.data;
};

// Get conflicts
export const getConflicts = async () => {
  const response = await api.get('/inventory-sync/conflicts');
  return response.data.data;
};

// Resolve conflict
export const resolveConflict = async (conflictId, resolution) => {
  const response = await api.post(`/inventory-sync/conflicts/${conflictId}/resolve`, { resolution });
  return response.data.data;
};

// Get sync schedule
export const getSyncSchedule = async () => {
  const response = await api.get('/inventory-sync/schedule');
  return response.data.data;
};

// Update sync schedule
export const updateSyncSchedule = async (data) => {
  const response = await api.put('/inventory-sync/schedule', data);
  return response.data.data;
};

// Get error logs
export const getErrorLogs = async (params = {}) => {
  const response = await api.get('/inventory-sync/errors', { params });
  return response.data.data;
};

// Alias for get conflicts (backward compatibility)
export const getSyncConflicts = getConflicts;

// Alias for get error logs (backward compatibility)
export const getSyncErrors = getErrorLogs;

// Retry sync operation
export const retrySyncOperation = async (operationId) => {
  const response = await api.post(`/inventory-sync/operations/${operationId}/retry`);
  return response.data.data;
};

// Clear resolved errors
export const clearResolvedErrors = async () => {
  const response = await api.delete('/inventory-sync/errors/resolved');
  return response.data;
};

// Get sync suppliers
export const getSyncSuppliers = async () => {
  const response = await api.get('/inventory-sync/suppliers');
  return response.data.data;
};

// Alias for trigger sync (backward compatibility)
export const triggerManualSync = triggerSync;

export default {
  getSyncStatus,
  getSyncHistory,
  triggerSync,
  triggerManualSync,
  getConflicts,
  getSyncConflicts,
  resolveConflict,
  getSyncSchedule,
  updateSyncSchedule,
  getErrorLogs,
  getSyncErrors,
  retrySyncOperation,
  clearResolvedErrors,
  getSyncSuppliers
};
