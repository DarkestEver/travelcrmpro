const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itineraryController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const asyncHandler = require('../middleware/asyncHandler');
const {
  createItinerarySchema,
  updateItinerarySchema,
  addDaySchema,
  updateDaySchema,
  cloneItinerarySchema,
  sendToClientSchema,
} = require('../validation/itinerarySchemas');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/itineraries/stats
 * @desc    Get itinerary statistics
 * @access  Agent, Tenant Admin, Super Admin
 */
router.get(
  '/stats',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(itineraryController.getItineraryStats)
);

/**
 * @route   GET /api/v1/itineraries
 * @desc    Get all itineraries with filtering
 * @access  Agent, Tenant Admin, Super Admin
 */
router.get(
  '/',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(itineraryController.getAllItineraries)
);

/**
 * @route   POST /api/v1/itineraries
 * @desc    Create new itinerary
 * @access  Agent, Tenant Admin
 */
router.post(
  '/',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(createItinerarySchema),
  asyncHandler(itineraryController.createItinerary)
);

/**
 * @route   GET /api/v1/itineraries/:id
 * @desc    Get itinerary by ID
 * @access  Agent, Tenant Admin, Super Admin
 */
router.get(
  '/:id',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(itineraryController.getItinerary)
);

/**
 * @route   PUT /api/v1/itineraries/:id
 * @desc    Update itinerary
 * @access  Agent, Tenant Admin
 */
router.put(
  '/:id',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(updateItinerarySchema),
  asyncHandler(itineraryController.updateItinerary)
);

/**
 * @route   DELETE /api/v1/itineraries/:id
 * @desc    Delete itinerary
 * @access  Tenant Admin only
 */
router.delete(
  '/:id',
  checkRole(USER_ROLES.TENANT_ADMIN),
  asyncHandler(itineraryController.deleteItinerary)
);

/**
 * @route   POST /api/v1/itineraries/:id/days
 * @desc    Add day to itinerary
 * @access  Agent, Tenant Admin
 */
router.post(
  '/:id/days',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(addDaySchema),
  asyncHandler(itineraryController.addDay)
);

/**
 * @route   PUT /api/v1/itineraries/:id/days/:dayNumber
 * @desc    Update day in itinerary
 * @access  Agent, Tenant Admin
 */
router.put(
  '/:id/days/:dayNumber',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(updateDaySchema),
  asyncHandler(itineraryController.updateDay)
);

/**
 * @route   DELETE /api/v1/itineraries/:id/days/:dayNumber
 * @desc    Remove day from itinerary
 * @access  Agent, Tenant Admin
 */
router.delete(
  '/:id/days/:dayNumber',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  asyncHandler(itineraryController.removeDay)
);

/**
 * @route   GET /api/v1/itineraries/:id/calculate-costs
 * @desc    Calculate itinerary costs
 * @access  Agent, Tenant Admin, Super Admin
 */
router.get(
  '/:id/calculate-costs',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN),
  asyncHandler(itineraryController.calculateCosts)
);

/**
 * @route   POST /api/v1/itineraries/:id/clone
 * @desc    Clone itinerary
 * @access  Agent, Tenant Admin
 */
router.post(
  '/:id/clone',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(cloneItinerarySchema),
  asyncHandler(itineraryController.cloneItinerary)
);

/**
 * @route   POST /api/v1/itineraries/:id/send
 * @desc    Send itinerary to client
 * @access  Agent, Tenant Admin
 */
router.post(
  '/:id/send',
  checkRole(USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN),
  validate(sendToClientSchema),
  asyncHandler(itineraryController.sendToClient)
);

module.exports = router;
