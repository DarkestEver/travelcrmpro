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

module.exports = router;
