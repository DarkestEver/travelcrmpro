const express = require('express');
const router = express.Router();
const reviewQueueController = require('../controllers/reviewQueueController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Queue queries
router.get('/', reviewQueueController.getQueue);
router.get('/my-queue', reviewQueueController.getMyQueue);
router.get('/unassigned', reviewQueueController.getUnassignedQueue);
router.get('/breached', reviewQueueController.getBreachedSLA);
router.get('/stats', reviewQueueController.getStats);

// Item operations
router.get('/:id', reviewQueueController.getReviewItem);
router.post('/:id/assign', reviewQueueController.assignReview);
router.post('/:id/complete', reviewQueueController.completeReview);
router.post('/:id/escalate', reviewQueueController.escalateReview);
router.post('/:id/comment', reviewQueueController.addComment);

module.exports = router;
