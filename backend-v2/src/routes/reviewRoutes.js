const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const reviewValidation = require('../validation/reviewValidation');

/**
 * Public routes
 */
router.get(
  '/public/reviews/featured',
  validate(reviewValidation.getFeaturedReviews, 'query'),
  reviewController.getFeaturedReviews
);

router.get(
  '/public/reviews/bookings/:bookingId',
  validate(reviewValidation.getPublicReviews, 'query'),
  reviewController.getPublicBookingReviews
);

router.get(
  '/public/reviews/suppliers/:supplierId',
  validate(reviewValidation.getPublicReviews, 'query'),
  reviewController.getPublicSupplierReviews
);

router.get(
  '/public/reviews/agents/:agentId',
  validate(reviewValidation.getPublicReviews, 'query'),
  reviewController.getPublicAgentReviews
);

/**
 * Protected routes - Customer can submit reviews
 */
router.post(
  '/reviews/booking/:bookingId',
  authenticate,
  authorize(['customer']),
  validate(reviewValidation.submitBookingReview),
  reviewController.submitBookingReview
);

router.post(
  '/reviews/supplier/:supplierId',
  authenticate,
  authorize(['customer']),
  validate(reviewValidation.submitSupplierReview),
  reviewController.submitSupplierReview
);

router.post(
  '/reviews/agent/:agentId',
  authenticate,
  authorize(['customer']),
  validate(reviewValidation.submitAgentReview),
  reviewController.submitAgentReview
);

/**
 * Customer can update/delete their pending reviews
 */
router.patch(
  '/reviews/:id',
  authenticate,
  authorize(['customer']),
  validate(reviewValidation.updateReview),
  reviewController.updateReview
);

router.delete(
  '/reviews/:id',
  authenticate,
  authorize(['customer']),
  reviewController.deleteReview
);

/**
 * All authenticated users can view reviews
 */
router.get(
  '/reviews',
  authenticate,
  validate(reviewValidation.getReviews, 'query'),
  reviewController.getAllReviews
);

router.get(
  '/reviews/stats',
  authenticate,
  authorize(['admin', 'manager']),
  reviewController.getReviewStats
);

router.get(
  '/reviews/:id',
  authenticate,
  reviewController.getReviewById
);

/**
 * Moderation routes - Admin/Manager only
 */
router.post(
  '/reviews/:id/approve',
  authenticate,
  authorize(['admin', 'manager']),
  reviewController.approveReview
);

router.post(
  '/reviews/:id/reject',
  authenticate,
  authorize(['admin', 'manager']),
  validate(reviewValidation.rejectReview),
  reviewController.rejectReview
);

router.post(
  '/reviews/:id/flag',
  authenticate,
  authorize(['admin', 'manager']),
  validate(reviewValidation.flagReview),
  reviewController.flagReview
);

/**
 * Feature management - Admin/Manager only
 */
router.post(
  '/reviews/:id/feature',
  authenticate,
  authorize(['admin', 'manager']),
  reviewController.featureReview
);

router.post(
  '/reviews/:id/unfeature',
  authenticate,
  authorize(['admin', 'manager']),
  reviewController.unfeatureReview
);

/**
 * Business response - Admin/Manager only
 */
router.post(
  '/reviews/:id/respond',
  authenticate,
  authorize(['admin', 'manager']),
  validate(reviewValidation.respondToReview),
  reviewController.respondToReview
);

router.patch(
  '/reviews/:id/response',
  authenticate,
  authorize(['admin', 'manager']),
  validate(reviewValidation.updateResponse),
  reviewController.updateResponse
);

router.delete(
  '/reviews/:id/response',
  authenticate,
  authorize(['admin', 'manager']),
  reviewController.deleteResponse
);

/**
 * Voting - All authenticated users
 */
router.post(
  '/reviews/:id/vote/helpful',
  authenticate,
  reviewController.voteHelpful
);

router.post(
  '/reviews/:id/vote/unhelpful',
  authenticate,
  reviewController.voteUnhelpful
);

module.exports = router;
