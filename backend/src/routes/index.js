const express = require('express');
const { identifyTenant, requireTenant } = require('../middleware/tenant');
const authRoutes = require('./authRoutes');
const tenantRoutes = require('./tenantRoutes');
const agentRoutes = require('./agentRoutes');
const agentPortalRoutes = require('./agentPortalRoutes');
const customerRoutes = require('./customerRoutes');
const customerPortalRoutes = require('./v1/customerPortalRoutes');
const supplierRoutes = require('./supplierRoutes');
const itineraryRoutes = require('./itineraryRoutes');
const quoteRoutes = require('./quoteRoutes');
const bookingRoutes = require('./bookingRoutes');
const notificationRoutes = require('./notificationRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const uploadRoutes = require('./uploadRoutes');
const emailTestRoutes = require('./emailTestRoutes');
const testRoutes = require('./testRoutes');
const paymentWebhookRoutes = require('./paymentWebhookRoutes');
const agentPaymentRoutes = require('./agentPaymentRoutes');
const financeRoutes = require('./finance');
const adjustmentRoutes = require('./adjustments');
const emailAccountRoutes = require('./emailAccounts');
const emailRoutes = require('./emailRoutes');
const reviewQueueRoutes = require('./reviewQueueRoutes');
const publicRoutes = require('./publicRoutes');
const shareRoutes = require('./shareRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const expenseRoutes = require('./expenseRoutes');
const reportRoutes = require('./reportRoutes');
const bankReconciliationRoutes = require('./bankReconciliationRoutes');
const currencyRoutes = require('./currencyRoutes');
const supplierInventoryRoutes = require('./supplierInventoryRoutes');
const rateSheetRoutes = require('./rateSheetRoutes');
const healthCheckRoutes = require('./healthCheckRoutes');
const demandForecastingRoutes = require('./demandForecastingRoutes');

const router = express.Router();

// Health check routes (must be before tenant middleware)
router.use('/health', healthCheckRoutes);

// Apply tenant middleware to all routes except auth and health
router.use(identifyTenant);
router.use('/auth', authRoutes); // Auth routes don't need requireTenant yet
router.use('/payments', paymentWebhookRoutes); // Webhook routes (no auth needed, before requireTenant)
router.use('/customer', customerPortalRoutes); // Customer self-service portal (before requireTenant)
router.use('/public', publicRoutes); // Public shareable links (no auth needed, before requireTenant)

// Email webhook endpoint (public, no auth needed - before requireTenant)
const emailController = require('../controllers/emailController');
router.post('/emails/webhook', emailController.receiveEmail);

router.use(requireTenant); // Require valid tenant for all routes below

// API routes
router.use('/tenants', tenantRoutes);
router.use('/agents', agentRoutes);
router.use('/agent-portal', agentPortalRoutes); // Agent self-service portal
router.use('/agent-payments', agentPaymentRoutes); // Agent payment management
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/supplier-inventory', supplierInventoryRoutes); // Supplier inventory management
router.use('/rate-sheets', rateSheetRoutes); // Supplier rate sheet management
router.use('/itineraries', itineraryRoutes);
router.use('/quotes', quoteRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/upload', uploadRoutes);
router.use('/finance', financeRoutes); // Finance management portal
router.use('/adjustments', adjustmentRoutes); // Booking adjustments
router.use('/email-accounts', emailAccountRoutes); // Email account management
router.use('/emails', emailRoutes); // AI Email automation
router.use('/review-queue', reviewQueueRoutes); // Manual review queue
router.use('/share', shareRoutes); // Share token management (authenticated)
router.use('/assignments', assignmentRoutes); // Query assignment system
router.use('/expenses', expenseRoutes); // Expense tracking
router.use('/reports', reportRoutes); // Financial reports and analytics
router.use('/bank-reconciliation', bankReconciliationRoutes); // Bank reconciliation
router.use('/currency', currencyRoutes); // Currency conversion and exchange rates
router.use('/demand-forecasting', demandForecastingRoutes); // Demand forecasting and predictions
router.use('/email', emailTestRoutes); // Email test endpoints
router.use('/test', testRoutes); // Test endpoints (development only)

module.exports = router;
