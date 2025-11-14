/**
 * Demand Forecasting Routes
 * Phase 7.1: Routes for demand analysis and predictions
 */

const express = require('express');
const router = express.Router();
const demandForecastingController = require('../controllers/demandForecastingController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Admin and operator access for most forecasting endpoints
router.use(restrictTo('admin', 'operator'));

// Historical analysis
router.get(
  '/historical-analysis',
  demandForecastingController.getHistoricalAnalysis
);

// Seasonal trends
router.get(
  '/seasonal-trends',
  demandForecastingController.getSeasonalTrends
);

// Occupancy prediction
router.get(
  '/occupancy-prediction',
  demandForecastingController.getOccupancyPrediction
);

// Revenue forecast
router.get(
  '/revenue-forecast',
  demandForecastingController.getRevenueForecast
);

// Peak periods identification
router.get(
  '/peak-periods',
  demandForecastingController.getPeakPeriods
);

// Comprehensive insights
router.get(
  '/insights',
  demandForecastingController.getDemandInsights
);

// ML dataset (admin only)
router.get(
  '/ml-dataset',
  restrictTo('admin'),
  demandForecastingController.getMLDataset
);

module.exports = router;
