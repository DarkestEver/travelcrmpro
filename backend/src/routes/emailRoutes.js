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
router.get('/stats', emailController.getStats);
router.get('/:id', emailController.getEmailById);
router.delete('/:id', emailController.deleteEmail);

// Email processing actions
router.post('/:id/categorize', emailController.categorizeEmail);
router.post('/:id/extract', emailController.extractData);
router.post('/:id/match', emailController.matchPackages);
router.post('/:id/respond', emailController.generateResponse);

module.exports = router;
