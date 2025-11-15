const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getTaxSettings,
  updateTaxSettings,
  getPayments,
  getPayment,
  processRefund,
  reconcilePayment,
  getInvoices,
  generateInvoice,
  downloadInvoice,
  sendInvoiceEmail,
  getReconciliationData,
  reconcileItems,
  markDiscrepancy,
  generateReport,
  getFinanceSettings,
  updateFinanceSettings,
  getFinancialReports,
} = require('../controllers/financeController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and finance/super_admin role
router.use(protect);
router.use(authorize('finance', 'super_admin', 'operator'));

// Root overview (redirects to dashboard data)
router.get('/', getDashboard);

// Dashboard
router.get('/dashboard', getDashboard);

// Tax Settings
router.get('/tax-settings', getTaxSettings);
router.put('/tax-settings', updateTaxSettings);

// Payments
router.get('/payments', getPayments);
router.get('/payments/:id', getPayment);
router.post('/payments/:id/refund', processRefund);
router.post('/payments/:id/reconcile', reconcilePayment);

// Invoices
router.get('/invoices', getInvoices);
router.post('/invoices/generate', generateInvoice);
router.get('/invoices/:id/download', downloadInvoice);
router.post('/invoices/:id/send', sendInvoiceEmail);

// Reconciliation
router.get('/reconciliation', getReconciliationData);
router.post('/reconciliation/reconcile', reconcileItems);
router.post('/reconciliation/:id/discrepancy', markDiscrepancy);

// Reports
router.get('/reports', getFinancialReports);
router.get('/reports/generate', generateReport);

// Settings
router.get('/settings', getFinanceSettings);
router.put('/settings', updateFinanceSettings);

module.exports = router;
