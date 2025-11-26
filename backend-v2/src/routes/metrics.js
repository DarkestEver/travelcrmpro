const express = require('express');
const metrics = require('../lib/metrics');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /metrics
 * @desc Prometheus metrics endpoint
 * @access Private (admin only)
 */
router.get('/', authenticate, requireRole('super_admin', 'tenant_admin'), async (req, res) => {
  try {
    res.set('Content-Type', metrics.getContentType());
    const metricsData = await metrics.getMetrics();
    res.send(metricsData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

module.exports = router;
