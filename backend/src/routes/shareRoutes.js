const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

// Generate share token
router.post('/generate', shareController.generateShareToken);

// Get share tokens for an entity
router.get('/:entityType/:entityId', shareController.getEntityShareTokens);

// Deactivate share token
router.delete('/:tokenId', shareController.deactivateShareToken);

// Get share token analytics
router.get('/:tokenId/analytics', shareController.getShareTokenAnalytics);

// Extend share token expiration
router.patch('/:tokenId/extend', shareController.extendShareToken);

module.exports = router;
