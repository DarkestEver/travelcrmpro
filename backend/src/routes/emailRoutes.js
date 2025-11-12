const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect } = require('../middleware/auth');

// Public webhook endpoint (no auth - secured by secret token)
router.post('/webhook', emailController.receiveEmail);

// Protected routes (require authentication)
router.use(protect);

// Email CRUD
router.get('/', emailController.getEmails);
router.get('/stats', emailController.getEmailStats); // Updated to use new stats method
router.get('/:id', emailController.getEmailById);
router.delete('/:id', emailController.deleteEmail);

// Email processing actions
router.post('/:id/categorize', emailController.categorizeEmail);
router.post('/:id/extract', emailController.extractData);
router.post('/:id/match', emailController.matchPackages);
router.post('/:id/respond', emailController.generateResponse);
router.post('/:id/retry', emailController.retryProcessing); // NEW: Retry failed processing
router.post('/:id/reply', emailController.replyToEmail); // NEW: Manual reply from UI
router.patch('/:id/extracted-data', emailController.updateExtractedData); // NEW: Update extracted data

// Email-to-Quote workflow (NEW)
router.post('/:id/convert-to-quote', emailController.convertEmailToQuote);

module.exports = router;
