const express = require('express');
const router = express.Router();
const {
  getAllItineraries,
  getItinerary,
  createItinerary,
  updateItinerary,
  duplicateItinerary,
  deleteItinerary,
  archiveItinerary,
  publishAsTemplate,
  calculateCost,
  getTemplates,
  generateShareLink,
  getSharedItinerary,
  addDay,
  updateDay,
  deleteDay,
  addComponent,
  updateComponent,
  deleteComponent,
  reorderComponents,
  getItineraryStats,
  cloneItinerary,
  importItinerary,
} = require('../controllers/itineraryController');
const { protect, restrictTo, loadAgent } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

// All routes require authentication except shared links
router.get('/share/:token', getSharedItinerary);

router.use(protect);

// Template routes
router.get('/templates', getTemplates);

// CRUD routes
router.get('/', restrictTo('super_admin', 'operator', 'agent'), loadAgent, getAllItineraries);
router.post('/', restrictTo('super_admin', 'operator', 'agent'), auditLogger('create', 'itinerary'), createItinerary);
router.post('/import', restrictTo('super_admin', 'operator', 'agent'), auditLogger('create', 'itinerary'), importItinerary);

router.get('/:id', getItinerary);
router.put('/:id', auditLogger('update', 'itinerary'), updateItinerary);
router.delete('/:id', auditLogger('delete', 'itinerary'), deleteItinerary);

// Additional operations
router.post('/:id/duplicate', auditLogger('create', 'itinerary'), duplicateItinerary);
router.post('/:id/clone', auditLogger('create', 'itinerary'), cloneItinerary);
router.patch('/:id/archive', auditLogger('update', 'itinerary'), archiveItinerary);
router.patch('/:id/publish-template', restrictTo('super_admin', 'operator'), auditLogger('update', 'itinerary'), publishAsTemplate);
router.get('/:id/calculate-cost', calculateCost);
router.get('/:id/stats', getItineraryStats);

// Sharing
router.post('/:id/share', generateShareLink);

// Day management
router.post('/:id/days', auditLogger('update', 'itinerary'), addDay);
router.put('/:id/days/:dayId', auditLogger('update', 'itinerary'), updateDay);
router.delete('/:id/days/:dayId', auditLogger('update', 'itinerary'), deleteDay);

// Component management
router.post('/:id/days/:dayId/components', auditLogger('update', 'itinerary'), addComponent);
router.put('/:id/days/:dayId/components/:componentId', auditLogger('update', 'itinerary'), updateComponent);
router.delete('/:id/days/:dayId/components/:componentId', auditLogger('update', 'itinerary'), deleteComponent);
router.put('/:id/days/:dayId/reorder', auditLogger('update', 'itinerary'), reorderComponents);

module.exports = router;
