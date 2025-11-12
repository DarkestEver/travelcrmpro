const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public booking routes (no authentication required)
router.get('/bookings/:token', publicController.viewSharedBooking);

// Public quote routes
router.get('/quotes/:token', publicController.viewSharedQuote);
router.post('/quotes/:token/accept', publicController.acceptSharedQuote);
router.post('/quotes/:token/reject', publicController.rejectSharedQuote);

// Public itinerary routes
router.get('/itineraries/:token', publicController.viewSharedItinerary);

// Public tracking ID lookup routes
router.get('/tracking/:trackingId', publicController.lookupByTrackingId);
router.get('/tracking/search/:query', publicController.searchTrackingIds);

module.exports = router;
