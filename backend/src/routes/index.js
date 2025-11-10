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

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Apply tenant middleware to all routes except auth and health
router.use(identifyTenant);
router.use('/auth', authRoutes); // Auth routes don't need requireTenant yet
router.use('/payments', paymentWebhookRoutes); // Webhook routes (no auth needed, before requireTenant)
router.use('/customer', customerPortalRoutes); // Customer self-service portal (before requireTenant)
router.use(requireTenant); // Require valid tenant for all routes below

// API routes
router.use('/tenants', tenantRoutes);
router.use('/agents', agentRoutes);
router.use('/agent-portal', agentPortalRoutes); // Agent self-service portal
router.use('/agent-payments', agentPaymentRoutes); // Agent payment management
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
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
router.use('/email', emailTestRoutes); // Email test endpoints
router.use('/test', testRoutes); // Test endpoints (development only)

module.exports = router;
