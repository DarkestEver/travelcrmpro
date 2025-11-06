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
} = require('../controllers/itineraryController');
const { protect, restrictTo, loadAgent } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

// All routes require authentication
router.use(protect);

// Template routes
router.get('/templates', getTemplates);

// CRUD routes
router.get('/', restrictTo('super_admin', 'operator', 'agent'), loadAgent, getAllItineraries);
router.post('/', restrictTo('super_admin', 'operator', 'agent'), auditLogger('create', 'itinerary'), createItinerary);

router.get('/:id', getItinerary);
router.put('/:id', auditLogger('update', 'itinerary'), updateItinerary);
router.delete('/:id', auditLogger('delete', 'itinerary'), deleteItinerary);

// Additional operations
router.post('/:id/duplicate', auditLogger('create', 'itinerary'), duplicateItinerary);
router.patch('/:id/archive', auditLogger('update', 'itinerary'), archiveItinerary);
router.patch('/:id/publish-template', restrictTo('super_admin', 'operator'), auditLogger('update', 'itinerary'), publishAsTemplate);
router.get('/:id/calculate-cost', calculateCost);

// Extended itinerary routes
router.get('/:id/activities', async (req, res, next) => {
  try {
    const { Itinerary } = require('../models');
    const itinerary = await Itinerary.findById(req.params.id).select('activities');
    
    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Itinerary not found' });
    }
    
    res.json({ success: true, data: itinerary.activities || [] });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/accommodations', async (req, res, next) => {
  try {
    const { Itinerary } = require('../models');
    const itinerary = await Itinerary.findById(req.params.id).select('accommodations');
    
    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Itinerary not found' });
    }
    
    res.json({ success: true, data: itinerary.accommodations || [] });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/pricing', async (req, res, next) => {
  try {
    const { Itinerary } = require('../models');
    const itinerary = await Itinerary.findById(req.params.id).select('estimatedCost');
    
    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Itinerary not found' });
    }
    
    res.json({ 
      success: true, 
      data: {
        estimatedCost: itinerary.estimatedCost,
        breakdown: itinerary.estimatedCost?.breakdown || {},
        total: itinerary.estimatedCost?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
