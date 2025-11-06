import api from './api'

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) =>
    api.post(`/auth/reset-password/${token}`, { password }),
}

// Agents API
export const agentsAPI = {
  getAll: (params) => api.get('/agents', { params }),
  getOne: (id) => api.get(`/agents/${id}`),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  delete: (id) => api.delete(`/agents/${id}`),
  approve: (id, data) => api.patch(`/agents/${id}/approve`, data),
  suspend: (id, reason) => api.patch(`/agents/${id}/suspend`, { reason }),
  reactivate: (id) => api.patch(`/agents/${id}/reactivate`),
  getStats: (id) => api.get(`/agents/${id}/stats`),
  // NEW: Commission tracking
  getCommission: (id) => api.get(`/agents/${id}/commission`),
  updateCommission: (id, data) => api.put(`/agents/${id}/commission`, data),
  getBookings: (id, params) => api.get(`/agents/${id}/bookings`, { params }),
  getQuotes: (id, params) => api.get(`/agents/${id}/quotes`, { params }),
}

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  addNote: (id, note) => api.post(`/customers/${id}/notes`, { note }),
  getStats: (id) => api.get(`/customers/${id}/stats`),
  bulkImport: (customers) => api.post('/customers/bulk-import', { customers }),
  // NEW: Advanced search and management
  search: (params) => api.get('/customers/search', { params }),
  updatePreferences: (id, preferences) => api.put(`/customers/${id}/preferences`, preferences),
  getDocuments: (id) => api.get(`/customers/${id}/documents`),
  addDocument: (id, document) => api.post(`/customers/${id}/documents`, document),
  getTravelHistory: (id) => api.get(`/customers/${id}/travel-history`),
}

// Suppliers API
export const suppliersAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  approve: (id) => api.patch(`/suppliers/${id}/approve`),
  suspend: (id) => api.patch(`/suppliers/${id}/suspend`),
  reactivate: (id) => api.patch(`/suppliers/${id}/reactivate`),
  updateRating: (id, rating, review) =>
    api.patch(`/suppliers/${id}/rating`, { rating, review }),
  getStats: (id) => api.get(`/suppliers/${id}/stats`),
}

// Itineraries API
export const itinerariesAPI = {
  getAll: (params) => api.get('/itineraries', { params }),
  getTemplates: (params) => api.get('/itineraries/templates', { params }),
  getOne: (id) => api.get(`/itineraries/${id}`),
  getById: (id) => api.get(`/itineraries/${id}`).then(res => res.data.data),
  create: (data) => api.post('/itineraries', data),
  update: (id, data) => api.put(`/itineraries/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/itineraries/${id}`),
  duplicate: (id) => api.post(`/itineraries/${id}/duplicate`),
  archive: (id) => api.patch(`/itineraries/${id}/archive`),
  publishTemplate: (id, visibility) =>
    api.patch(`/itineraries/${id}/publish-template`, { templateVisibility: visibility }),
  calculateCost: (id) => api.get(`/itineraries/${id}/calculate-cost`),
  // PHASE 1: Day Management
  addDay: (id, dayData) => api.post(`/itineraries/${id}/days`, dayData).then(res => res.data.data),
  updateDay: (id, dayId, dayData) => api.put(`/itineraries/${id}/days/${dayId}`, dayData).then(res => res.data.data),
  deleteDay: (id, dayId) => api.delete(`/itineraries/${id}/days/${dayId}`).then(res => res.data.data),
  // PHASE 1: Component Management
  addComponent: (id, dayId, componentData) => 
    api.post(`/itineraries/${id}/days/${dayId}/components`, componentData).then(res => res.data.data),
  updateComponent: (id, dayId, componentId, componentData) => 
    api.put(`/itineraries/${id}/days/${dayId}/components/${componentId}`, componentData).then(res => res.data.data),
  deleteComponent: (id, dayId, componentId) => 
    api.delete(`/itineraries/${id}/days/${dayId}/components/${componentId}`).then(res => res.data.data),
  reorderComponents: (id, dayId, componentIds) => 
    api.put(`/itineraries/${id}/days/${dayId}/reorder`, { componentIds }).then(res => res.data.data),
  // PHASE 1: Sharing & Analytics
  generateShareLink: (id, options) => api.post(`/itineraries/${id}/share`, options).then(res => res.data.data),
  getSharedItinerary: (token, password) => 
    api.get(`/itineraries/share/${token}`, { params: { password } }).then(res => res.data.data),
  getStats: (id) => api.get(`/itineraries/${id}/stats`).then(res => res.data.data),
  clone: (id) => api.post(`/itineraries/${id}/clone`).then(res => res.data.data),
  // Detailed itinerary info (legacy)
  getActivities: (id) => api.get(`/itineraries/${id}/activities`),
  getAccommodations: (id) => api.get(`/itineraries/${id}/accommodations`),
  getPricing: (id) => api.get(`/itineraries/${id}/pricing`),
}

// Quotes API
export const quotesAPI = {
  getAll: (params) => api.get('/quotes', { params }),
  getOne: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  delete: (id) => api.delete(`/quotes/${id}`),
  send: (id) => api.post(`/quotes/${id}/send`),
  accept: (id) => api.patch(`/quotes/${id}/accept`),
  reject: (id, reason) => api.patch(`/quotes/${id}/reject`, { reason }),
  getStats: (params) => api.get('/quotes/stats', { params }),
  // NEW: Quote management features
  duplicate: (id) => api.post(`/quotes/${id}/duplicate`),
  getRevisions: (id) => api.get(`/quotes/${id}/revisions`),
  exportPDF: (id) => api.get(`/quotes/${id}/export`, { responseType: 'blob' }),
}

// Bookings API
export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getOne: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  addPayment: (id, paymentData) => api.post(`/bookings/${id}/payment`, paymentData),
  confirm: (id) => api.patch(`/bookings/${id}/confirm`),
  cancel: (id, reason, refundAmount) =>
    api.patch(`/bookings/${id}/cancel`, { reason, refundAmount }),
  complete: (id) => api.patch(`/bookings/${id}/complete`),
  getStats: (params) => api.get('/bookings/stats', { params }),
  // NEW: Booking extended features
  generateVoucher: (id) => api.post(`/bookings/${id}/generate-voucher`, {}, { responseType: 'blob' }),
  getDocuments: (id) => api.get(`/bookings/${id}/documents`),
  addNote: (id, note) => api.post(`/bookings/${id}/notes`, { note }),
  getTimeline: (id) => api.get(`/bookings/${id}/timeline`),
  exportPDF: (id) => api.get(`/bookings/${id}/export`, { responseType: 'blob' }),
}

// NEW: Audit Logs API
export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getStats: (params) => api.get('/audit-logs/stats', { params }),
  getByResource: (resourceType, resourceId, params) => 
    api.get(`/audit-logs/resource/${resourceType}/${resourceId}`, { params }),
  getByUser: (userId, params) => api.get(`/audit-logs/user/${userId}`, { params }),
}

// NEW: Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getRevenue: (params) => api.get('/analytics/revenue', { params }),
  getAgentPerformance: (params) => api.get('/analytics/agent-performance', { params }),
  getBookingTrends: (params) => api.get('/analytics/booking-trends', { params }),
  getForecast: (params) => api.get('/analytics/forecast', { params }),
  getUserActivity: (params) => api.get('/analytics/user-activity', { params }),
  getSystemHealth: () => api.get('/analytics/system-health'),
  getSettings: () => api.get('/analytics/settings'),
}

export default {
  auth: authAPI,
  agents: agentsAPI,
  customers: customersAPI,
  suppliers: suppliersAPI,
  itineraries: itinerariesAPI,
  quotes: quotesAPI,
  bookings: bookingsAPI,
  auditLogs: auditLogsAPI,
  analytics: analyticsAPI,
}
