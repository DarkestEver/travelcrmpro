/**
 * Report Routes
 * Financial reports and analytics endpoints
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

// All routes require authentication
router.use(protect);

// Revenue report - accessible by agents and admins
router.get('/revenue', reportController.getRevenueReport);

// Commission report - accessible by agents and admins
router.get('/commission', reportController.getCommissionReport);

// Tax report - admin only
router.get('/tax', requireRole(['admin', 'accountant']), reportController.getTaxReport);

// Profit & Loss report - admin only
router.get('/profit-loss', requireRole(['admin', 'accountant']), reportController.getProfitLossReport);

// Booking trends - accessible by agents and admins
router.get('/booking-trends', reportController.getBookingTrendsReport);

// Agent performance - admin only
router.get('/agent-performance', requireRole(['admin']), reportController.getAgentPerformanceReport);

// Customer analytics - admin only
router.get('/customer-analytics', requireRole(['admin']), reportController.getCustomerAnalytics);

// Dashboard summary - all authenticated users
router.get('/dashboard-summary', reportController.getDashboardSummary);

// Export routes
router.post('/export/csv', reportController.exportReportCSV);
router.post('/export/pdf', requireRole(['admin', 'accountant']), reportController.exportReportPDF);

module.exports = router;
