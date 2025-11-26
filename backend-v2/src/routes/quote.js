const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validation');
const {
  createQuoteSchema,
  updateQuoteSchema,
  sendQuoteSchema,
  approveQuoteSchema,
  rejectQuoteSchema,
  reviseQuoteSchema,
  queryParamsSchema,
  expiringQuotesQuerySchema,
  statsQuerySchema,
} = require('../validation/quoteSchemas');

/**
 * Quote Routes
 * Base path: /api/v1/quotes
 */

// Public routes (for customer actions)
router.post('/:id/approve', validate(approveQuoteSchema), quoteController.approveQuote);
router.post('/:id/reject', validate(rejectQuoteSchema), quoteController.rejectQuote);

// Protected routes (require authentication)
router.use(authenticate);

// Main CRUD routes
router
  .route('/')
  .get(validateQuery(queryParamsSchema), quoteController.getAllQuotes)
  .post(validate(createQuoteSchema), quoteController.createQuote);

router
  .route('/:id')
  .get(quoteController.getQuote)
  .patch(validate(updateQuoteSchema), quoteController.updateQuote)
  .delete(quoteController.deleteQuote);

// Quote actions
router.post(
  '/:id/generate-pdf',
  quoteController.generatePDF
);

router.post(
  '/:id/send',
  validate(sendQuoteSchema),
  quoteController.sendQuote
);

router.post(
  '/:id/revise',
  validate(reviseQuoteSchema),
  quoteController.reviseQuote
);

router.post(
  '/:id/convert',
  quoteController.convertToBooking
);

// Quote information routes
router.get(
  '/:id/versions',
  quoteController.getQuoteVersions
);

// Statistics and reporting
router.get(
  '/stats/overview',
  validateQuery(statsQuerySchema),
  quoteController.getQuoteStats
);

router.get(
  '/expiring/list',
  validateQuery(expiringQuotesQuerySchema),
  quoteController.getExpiringQuotes
);

module.exports = router;
