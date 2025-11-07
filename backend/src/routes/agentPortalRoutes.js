const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAgent } = require('../middleware/agentAuth');
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

module.exports = router;
