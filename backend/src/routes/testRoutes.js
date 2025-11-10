/**
 * Email Test Routes
 * For testing email functionality (development only)
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendTestEmail,
  getEmailTypes
} = require('../controllers/emailTestController');

// Only enable in development
if (process.env.NODE_ENV === 'development') {
  router.use(protect);
  
  router.post('/email', sendTestEmail);
  router.get('/email/types', getEmailTypes);
} else {
  // Disabled in production
  router.all('*', (req, res) => {
    res.status(403).json({
      success: false,
      message: 'Test endpoints are only available in development mode'
    });
  });
}

module.exports = router;
