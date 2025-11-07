const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAgent } = require('../middleware/agentAuth');
const { requireMainAgent } = require('../middleware/subUserAuth');
const {
  getDashboardStats,
  getRecentActivity,
} = require('../controllers/agentStatsController');
const {
  getMyCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  importCustomers,
  downloadCSVTemplate,
} = require('../controllers/agentCustomerController');
const {
  submitQuoteRequest,
  getMyQuoteRequests,
  getQuoteRequestById,
  acceptQuote,
  rejectQuote,
  cancelQuoteRequest,
  getQuoteRequestStats,
} = require('../controllers/agentQuoteRequestController');
const {
  getMyBookings,
  getBookingById,
  getBookingStats,
  downloadVoucher,
} = require('../controllers/agentBookingController');
const {
  createSubUser,
  getMySubUsers,
  getSubUserById,
  updateSubUser,
  deleteSubUser,
  updatePermissions,
  toggleStatus,
  getSubUserStats,
  getSubUserActivityLogs,
} = require('../controllers/agentSubUserController');

// Apply authentication middleware to all routes
router.use(protect);
router.use(requireAgent);

/**
 * Agent Portal Stats Routes
 * These are for the agent's self-service portal
 */
router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);

/**
 * Agent Customer Routes
 */
router.get('/customers/stats', getCustomerStats);
router.get('/customers', getMyCustomers);
router.post('/customers', createCustomer);
router.post('/customers/import', importCustomers);
router.get('/customers/import/template', downloadCSVTemplate);
router.get('/customers/:id', getCustomerById);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

/**
 * Agent Quote Request Routes
 */
router.get('/quote-requests/stats', getQuoteRequestStats);
router.get('/quote-requests', getMyQuoteRequests);
router.post('/quote-requests', submitQuoteRequest);
router.get('/quote-requests/:id', getQuoteRequestById);
router.put('/quote-requests/:id/accept', acceptQuote);
router.put('/quote-requests/:id/reject', rejectQuote);
router.delete('/quote-requests/:id', cancelQuoteRequest);

/**
 * Agent Booking Routes
 */
router.get('/bookings/stats', getBookingStats);
router.get('/bookings', getMyBookings);
router.get('/bookings/:id', getBookingById);
router.get('/bookings/:id/voucher', downloadVoucher);

/**
 * Agent Sub-User Routes
 * Only main agents can manage sub-users
 */
router.get('/sub-users/stats', requireMainAgent, getSubUserStats);
router.get('/sub-users', requireMainAgent, getMySubUsers);
router.post('/sub-users', requireMainAgent, createSubUser);
router.get('/sub-users/:id', requireMainAgent, getSubUserById);
router.get('/sub-users/:id/activity-logs', requireMainAgent, getSubUserActivityLogs);
router.put('/sub-users/:id', requireMainAgent, updateSubUser);
router.delete('/sub-users/:id', requireMainAgent, deleteSubUser);
router.patch('/sub-users/:id/permissions', requireMainAgent, updatePermissions);
router.patch('/sub-users/:id/toggle-status', requireMainAgent, toggleStatus);

module.exports = router;
