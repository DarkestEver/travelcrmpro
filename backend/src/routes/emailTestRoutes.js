/**
 * Email Test Routes
 * Routes for testing email functionality
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendTestEmail,
  getEmailTypes
} = require('../controllers/emailTestController');

// All routes require authentication
router.use(protect);

// Email test routes
router.post('/test', sendTestEmail);
router.get('/types', getEmailTypes);

module.exports = router;
