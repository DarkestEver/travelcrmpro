const express = require('express');
const { identifyTenant, requireTenant } = require('../middleware/tenant');
const authRoutes = require('./authRoutes');
const tenantRoutes = require('./tenantRoutes');
const agentRoutes = require('./agentRoutes');
const agentPortalRoutes = require('./agentPortalRoutes');
const customerRoutes = require('./customerRoutes');
const supplierRoutes = require('./supplierRoutes');
const itineraryRoutes = require('./itineraryRoutes');
const quoteRoutes = require('./quoteRoutes');
const bookingRoutes = require('./bookingRoutes');
const notificationRoutes = require('./notificationRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const uploadRoutes = require('./uploadRoutes');

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
router.use(requireTenant); // Require valid tenant for all routes below

// API routes
router.use('/tenants', tenantRoutes);
router.use('/agents', agentRoutes);
router.use('/agent-portal', agentPortalRoutes); // Agent self-service portal
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/itineraries', itineraryRoutes);
router.use('/quotes', quoteRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
