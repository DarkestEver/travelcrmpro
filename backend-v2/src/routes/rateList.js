const express = require('express');
const router = express.Router();
const rateListController = require('../controllers/rateListController');
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validation');
const {
  createRateListSchema,
  updateRateListSchema,
  calculatePriceSchema,
  validateDatesSchema,
  bulkUpdateSchema,
  cloneRateListSchema,
  queryParamsSchema,
} = require('../validation/rateListSchemas');

/**
 * Rate List Routes
 * All routes require authentication
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/v1/rate-lists
 * @desc    Get all rate lists with filters
 * @access  Private
 */
router.get('/', validateQuery(queryParamsSchema), rateListController.getAllRateLists);

/**
 * @route   GET /api/v1/rate-lists/stats
 * @desc    Get rate list statistics
 * @access  Private
 */
router.get('/stats', rateListController.getRateListStats);

/**
 * @route   GET /api/v1/rate-lists/supplier/:supplierId/active
 * @desc    Get active rate lists for supplier
 * @access  Private
 */
router.get('/supplier/:supplierId/active', rateListController.getActiveRateLists);

/**
 * @route   GET /api/v1/rate-lists/supplier/:supplierId/versions
 * @desc    Get all versions of rate lists for a supplier
 * @access  Private
 */
router.get('/supplier/:supplierId/versions', rateListController.getRateListVersions);

/**
 * @route   POST /api/v1/rate-lists/validate-dates
 * @desc    Check for overlapping rate lists
 * @access  Private
 */
router.post('/validate-dates', validate(validateDatesSchema), rateListController.validateDates);

/**
 * @route   PATCH /api/v1/rate-lists/bulk-update
 * @desc    Bulk update multiple rate lists
 * @access  Private
 */
router.patch('/bulk-update', validate(bulkUpdateSchema), rateListController.bulkUpdate);

/**
 * @route   POST /api/v1/rate-lists
 * @desc    Create new rate list
 * @access  Private
 */
router.post('/', validate(createRateListSchema), rateListController.createRateList);

/**
 * @route   GET /api/v1/rate-lists/:id
 * @desc    Get single rate list by ID
 * @access  Private
 */
router.get('/:id', rateListController.getRateList);

/**
 * @route   PATCH /api/v1/rate-lists/:id
 * @desc    Update rate list
 * @access  Private
 */
router.patch('/:id', validate(updateRateListSchema), rateListController.updateRateList);

/**
 * @route   DELETE /api/v1/rate-lists/:id
 * @desc    Delete rate list
 * @access  Private
 */
router.delete('/:id', rateListController.deleteRateList);

/**
 * @route   POST /api/v1/rate-lists/:id/publish
 * @desc    Publish rate list
 * @access  Private
 */
router.post('/:id/publish', rateListController.publishRateList);

/**
 * @route   POST /api/v1/rate-lists/:id/unpublish
 * @desc    Unpublish rate list
 * @access  Private
 */
router.post('/:id/unpublish', rateListController.unpublishRateList);

/**
 * @route   POST /api/v1/rate-lists/:id/clone
 * @desc    Clone rate list for versioning
 * @access  Private
 */
router.post('/:id/clone', validate(cloneRateListSchema), rateListController.cloneRateList);

/**
 * @route   POST /api/v1/rate-lists/:id/calculate-price
 * @desc    Calculate price for specific parameters
 * @access  Private
 */
router.post('/:id/calculate-price', validate(calculatePriceSchema), rateListController.calculatePrice);

module.exports = router;
