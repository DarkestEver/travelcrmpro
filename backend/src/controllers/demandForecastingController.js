/**
 * Demand Forecasting Controller
 * Phase 7.1: API endpoints for demand analysis and predictions
 */

const asyncHandler = require('express-async-handler');
const demandForecastingService = require('../services/demandForecastingService');
const { successResponse } = require('../utils/responseHelper');

/**
 * @desc    Get historical booking analysis
 * @route   GET /api/v1/demand-forecasting/historical-analysis
 * @access  Private (admin, operator)
 */
exports.getHistoricalAnalysis = asyncHandler(async (req, res) => {
  const { startDate, endDate, inventoryType, groupBy } = req.query;
  const tenantId = req.tenant._id;

  const analysis = await demandForecastingService.analyzeHistoricalData({
    tenantId,
    startDate: startDate || new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    endDate: endDate || new Date(),
    inventoryType,
    groupBy: groupBy || 'month'
  });

  successResponse(res, 200, 'Historical analysis generated successfully', analysis);
});

/**
 * @desc    Get seasonal trends
 * @route   GET /api/v1/demand-forecasting/seasonal-trends
 * @access  Private (admin, operator)
 */
exports.getSeasonalTrends = asyncHandler(async (req, res) => {
  const { yearsBack, inventoryType } = req.query;
  const tenantId = req.tenant._id;

  const trends = await demandForecastingService.detectSeasonalTrends({
    tenantId,
    yearsBack: parseInt(yearsBack) || 3,
    inventoryType
  });

  successResponse(res, 200, 'Seasonal trends analyzed successfully', trends);
});

/**
 * @desc    Predict occupancy rates
 * @route   GET /api/v1/demand-forecasting/occupancy-prediction
 * @access  Private (admin, operator)
 */
exports.getOccupancyPrediction = asyncHandler(async (req, res) => {
  const { inventoryId, startDate, endDate, useSeasonalAdjustment } = req.query;
  const tenantId = req.tenant._id;

  if (!inventoryId || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'inventoryId, startDate, and endDate are required'
    });
  }

  const prediction = await demandForecastingService.predictOccupancy({
    tenantId,
    inventoryId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    useSeasonalAdjustment: useSeasonalAdjustment !== 'false'
  });

  successResponse(res, 200, 'Occupancy prediction generated successfully', prediction);
});

/**
 * @desc    Get revenue forecast
 * @route   GET /api/v1/demand-forecasting/revenue-forecast
 * @access  Private (admin, operator)
 */
exports.getRevenueForecast = asyncHandler(async (req, res) => {
  const { months, inventoryType, confidenceInterval } = req.query;
  const tenantId = req.tenant._id;

  const forecast = await demandForecastingService.forecastRevenue({
    tenantId,
    months: parseInt(months) || 3,
    inventoryType,
    confidenceInterval: parseFloat(confidenceInterval) || 0.95
  });

  successResponse(res, 200, 'Revenue forecast generated successfully', forecast);
});

/**
 * @desc    Identify peak demand periods
 * @route   GET /api/v1/demand-forecasting/peak-periods
 * @access  Private (admin, operator)
 */
exports.getPeakPeriods = asyncHandler(async (req, res) => {
  const { yearsBack, inventoryType, threshold } = req.query;
  const tenantId = req.tenant._id;

  const peakPeriods = await demandForecastingService.identifyPeakPeriods({
    tenantId,
    yearsBack: parseInt(yearsBack) || 2,
    inventoryType,
    threshold: parseInt(threshold) || 75
  });

  successResponse(res, 200, 'Peak periods identified successfully', peakPeriods);
});

/**
 * @desc    Get ML-ready dataset
 * @route   GET /api/v1/demand-forecasting/ml-dataset
 * @access  Private (admin only)
 */
exports.getMLDataset = asyncHandler(async (req, res) => {
  const { yearsBack, inventoryType, features } = req.query;
  const tenantId = req.tenant._id;

  const includeFeatures = features
    ? features.split(',')
    : ['bookings', 'revenue', 'travelers', 'seasonality', 'dayOfWeek', 'leadTime'];

  const dataset = await demandForecastingService.prepareMLDataset({
    tenantId,
    yearsBack: parseInt(yearsBack) || 3,
    inventoryType,
    includeFeatures
  });

  successResponse(res, 200, 'ML dataset prepared successfully', dataset);
});

/**
 * @desc    Get comprehensive demand insights
 * @route   GET /api/v1/demand-forecasting/insights
 * @access  Private (admin, operator)
 */
exports.getDemandInsights = asyncHandler(async (req, res) => {
  const { inventoryType } = req.query;
  const tenantId = req.tenant._id;

  // Run multiple analyses in parallel
  const [seasonalTrends, peakPeriods, revenueForecast] = await Promise.all([
    demandForecastingService.detectSeasonalTrends({
      tenantId,
      yearsBack: 3,
      inventoryType
    }),
    demandForecastingService.identifyPeakPeriods({
      tenantId,
      yearsBack: 2,
      inventoryType,
      threshold: 75
    }),
    demandForecastingService.forecastRevenue({
      tenantId,
      months: 3,
      inventoryType,
      confidenceInterval: 0.95
    })
  ]);

  const insights = {
    seasonal: {
      peakMonths: seasonalTrends.summary.peakMonths,
      offPeakMonths: seasonalTrends.summary.offPeakMonths,
      highestDemandMonth: seasonalTrends.summary.highestDemandMonth,
      lowestDemandMonth: seasonalTrends.summary.lowestDemandMonth
    },
    peaks: {
      peakWeeksIdentified: peakPeriods.summary.peakWeeksIdentified,
      topMonths: peakPeriods.peakMonths.slice(0, 3),
      capacityRecommendation: peakPeriods.insights.recommendedCapacityIncrease,
      pricingStrategy: peakPeriods.insights.pricingOpportunity
    },
    forecast: {
      next3MonthsRevenue: revenueForecast.summary.totalForecastedRevenue,
      averageMonthlyRevenue: revenueForecast.summary.averageMonthlyRevenue,
      growthRate: revenueForecast.summary.averageGrowthRate,
      monthlyForecasts: revenueForecast.forecasts.map(f => ({
        month: f.month,
        revenue: f.forecast.revenue,
        bookings: f.forecast.bookings
      }))
    },
    recommendations: {
      pricing: peakPeriods.insights.pricingOpportunity,
      capacity: peakPeriods.insights.recommendedCapacityIncrease,
      marketing: `Focus on ${peakPeriods.insights.marketingFocus}`,
      inventory: seasonalTrends.summary.offPeakMonths.length > 0
        ? `Increase promotions during ${seasonalTrends.summary.offPeakMonths.join(', ')}`
        : 'Maintain current strategy'
    }
  };

  successResponse(res, 200, 'Demand insights generated successfully', insights);
});

module.exports = exports;
