const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const emailDashboardController = require('../controllers/emailDashboardController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public webhook endpoint (no auth - secured by secret token)
router.post('/webhook', emailController.receiveEmail);

// Protected routes (require authentication)
router.use(protect);

// Email Dashboard & Analytics (NEW)
router.get('/dashboard-stats', emailDashboardController.getDashboardStats);
router.get('/analytics', emailDashboardController.getAnalytics);
router.get('/review-queue', emailDashboardController.getReviewQueue);

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
router.post('/:id/reply', upload.array('attachments', 10), emailController.replyToEmail); // NEW: Manual reply from UI with attachments
router.post('/:id/forward', emailController.forwardEmail); // NEW: Forward email to another recipient
router.patch('/:id/extracted-data', emailController.updateExtractedData); // NEW: Update extracted data

// Email-to-Quote workflow (NEW)
router.post('/:id/convert-to-quote', emailController.convertEmailToQuote);

// Email Threading (NEW)
router.get('/:id/thread', emailController.getEmailThread);
router.post('/:id/rebuild-thread', emailController.rebuildEmailThread);

// Re-categorize and duplicate detection (NEW)
router.get('/search-by-email', emailController.searchByEmail);
router.patch('/:id/category', emailController.updateEmailCategory);
router.patch('/:id/recategorize', emailController.recategorizeEmail); // Manual re-categorization with duplicate linking
router.get('/search-queries', emailController.searchQueries); // Search existing queries for duplicate detection
router.post('/:id/link-query', emailController.linkToQuery); // Link email as child query to parent

module.exports = router;
