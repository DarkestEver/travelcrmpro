const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

/**
 * @route GET /health
 * @desc Basic health check
 * @access Public
 */
router.get('/health', healthController.health);

/**
 * @route GET /ready
 * @desc Readiness check (DB + Redis connectivity)
 * @access Public
 */
router.get('/ready', healthController.ready);

/**
 * @route GET /version
 * @desc API version information
 * @access Public
 */
router.get('/version', healthController.version);

module.exports = router;
