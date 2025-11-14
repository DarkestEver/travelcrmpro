/**
 * Demand Forecasting Service
 * Phase 7.1: Historical data analysis, trend detection, and demand predictions
 * 
 * Features:
 * - Historical booking analysis
 * - Seasonal trend detection
 * - Occupancy rate predictions
 * - Revenue forecasting
 * - Peak period identification
 * - ML-ready data preparation
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Inventory = require('../models/Inventory');
const logger = require('../utils/logger');

/**
 * Analyze historical booking data
 * @param {Object} params - Analysis parameters
 * @returns {Object} Historical analysis results
 */
exports.analyzeHistoricalData = async ({
  tenantId,
  startDate,
  endDate,
  inventoryType, // hotel, tour, flight, etc.
  groupBy = 'month' // day, week, month, quarter
}) => {
  try {
    const dateFormat = {
      day: '%Y-%m-%d',
      week: '%Y-W%V',
      month: '%Y-%m',
      quarter: '%Y-Q' + Math.floor(new Date().getMonth() / 3 + 1)
    };

    const pipeline = [
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          'travelDates.startDate': { $gte: new Date(startDate), $lte: new Date(endDate) },
          bookingStatus: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'itineraries',
          localField: 'itineraryId',
          foreignField: '_id',
          as: 'itinerary'
        }
      },
      { $unwind: '$itinerary' },
      ...(inventoryType ? [{
        $match: {
          'itinerary.type': inventoryType
        }
      }] : []),
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat[groupBy] || dateFormat.month, date: '$travelDates.startDate' }
          },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$financial.totalAmount' },
          averageBookingValue: { $avg: '$financial.totalAmount' },
          totalTravelers: { $sum: { $size: '$travelers' } },
          uniqueCustomers: { $addToSet: '$customerId' },
          bookingsByStatus: {
            $push: {
              status: '$bookingStatus',
              amount: '$financial.totalAmount'
            }
          }
        }
      },
      {
        $project: {
          period: '$_id',
          totalBookings: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          averageBookingValue: { $round: ['$averageBookingValue', 2] },
          totalTravelers: 1,
          uniqueCustomers: { $size: '$uniqueCustomers' },
          averageTravelersPerBooking: {
            $round: [{ $divide: ['$totalTravelers', '$totalBookings'] }, 1]
          }
        }
      },
      { $sort: { period: 1 } }
    ];

    const historicalData = await Booking.aggregate(pipeline);

    // Calculate growth rates
    const dataWithGrowth = historicalData.map((current, index) => {
      if (index === 0) {
        return { ...current, bookingGrowth: 0, revenueGrowth: 0 };
      }

      const previous = historicalData[index - 1];
      const bookingGrowth = ((current.totalBookings - previous.totalBookings) / previous.totalBookings) * 100;
      const revenueGrowth = ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100;

      return {
        ...current,
        bookingGrowth: Math.round(bookingGrowth * 10) / 10,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10
      };
    });

    return {
      summary: {
        totalPeriods: historicalData.length,
        totalBookings: historicalData.reduce((sum, d) => sum + d.totalBookings, 0),
        totalRevenue: historicalData.reduce((sum, d) => sum + d.totalRevenue, 0),
        averageBookingsPerPeriod: Math.round(historicalData.reduce((sum, d) => sum + d.totalBookings, 0) / historicalData.length),
        averageRevenuePerPeriod: Math.round(historicalData.reduce((sum, d) => sum + d.totalRevenue, 0) / historicalData.length)
      },
      data: dataWithGrowth
    };
  } catch (error) {
    logger.error('Error analyzing historical data:', error);
    throw error;
  }
};

/**
 * Detect seasonal trends in booking patterns
 * @param {Object} params - Trend detection parameters
 * @returns {Object} Seasonal trends and patterns
 */
exports.detectSeasonalTrends = async ({
  tenantId,
  yearsBack = 3,
  inventoryType
}) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - yearsBack);

    const pipeline = [
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          'travelDates.startDate': { $gte: startDate, $lte: endDate },
          bookingStatus: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'itineraries',
          localField: 'itineraryId',
          foreignField: '_id',
          as: 'itinerary'
        }
      },
      { $unwind: '$itinerary' },
      ...(inventoryType ? [{
        $match: {
          'itinerary.type': inventoryType
        }
      }] : []),
      {
        $group: {
          _id: {
            month: { $month: '$travelDates.startDate' },
            year: { $year: '$travelDates.startDate' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$financial.totalAmount' },
          travelers: { $sum: { $size: '$travelers' } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ];

    const monthlyData = await Booking.aggregate(pipeline);

    // Group by month across all years
    const seasonalPatterns = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    monthlyData.forEach(item => {
      const month = item._id.month;
      const monthName = monthNames[month - 1];

      if (!seasonalPatterns[monthName]) {
        seasonalPatterns[monthName] = {
          month: monthName,
          monthNumber: month,
          years: [],
          totalBookings: 0,
          totalRevenue: 0,
          totalTravelers: 0,
          occurrences: 0
        };
      }

      seasonalPatterns[monthName].years.push({
        year: item._id.year,
        bookings: item.bookings,
        revenue: item.revenue,
        travelers: item.travelers
      });
      seasonalPatterns[monthName].totalBookings += item.bookings;
      seasonalPatterns[monthName].totalRevenue += item.revenue;
      seasonalPatterns[monthName].totalTravelers += item.travelers;
      seasonalPatterns[monthName].occurrences += 1;
    });

    // Calculate averages and classify seasons
    const seasonalTrends = Object.values(seasonalPatterns).map(pattern => {
      const avgBookings = pattern.totalBookings / pattern.occurrences;
      const avgRevenue = pattern.totalRevenue / pattern.occurrences;
      const avgTravelers = pattern.totalTravelers / pattern.occurrences;

      return {
        ...pattern,
        averageBookings: Math.round(avgBookings),
        averageRevenue: Math.round(avgRevenue),
        averageTravelers: Math.round(avgTravelers)
      };
    });

    // Find peak, shoulder, and off-peak seasons
    const sortedByBookings = [...seasonalTrends].sort((a, b) => b.averageBookings - a.averageBookings);
    const peakThreshold = sortedByBookings[0].averageBookings * 0.7;
    const offPeakThreshold = sortedByBookings[sortedByBookings.length - 1].averageBookings * 1.5;

    const classifiedSeasons = seasonalTrends.map(trend => ({
      ...trend,
      season: trend.averageBookings >= peakThreshold
        ? 'peak'
        : trend.averageBookings <= offPeakThreshold
        ? 'off-peak'
        : 'shoulder'
    }));

    return {
      summary: {
        peakMonths: classifiedSeasons.filter(s => s.season === 'peak').map(s => s.month),
        shoulderMonths: classifiedSeasons.filter(s => s.season === 'shoulder').map(s => s.month),
        offPeakMonths: classifiedSeasons.filter(s => s.season === 'off-peak').map(s => s.month),
        highestDemandMonth: sortedByBookings[0].month,
        lowestDemandMonth: sortedByBookings[sortedByBookings.length - 1].month
      },
      trends: classifiedSeasons.sort((a, b) => a.monthNumber - b.monthNumber)
    };
  } catch (error) {
    logger.error('Error detecting seasonal trends:', error);
    throw error;
  }
};

/**
 * Predict occupancy rates based on historical patterns
 * @param {Object} params - Prediction parameters
 * @returns {Object} Occupancy predictions
 */
exports.predictOccupancy = async ({
  tenantId,
  inventoryId,
  startDate,
  endDate,
  useSeasonalAdjustment = true
}) => {
  try {
    // Get inventory capacity
    const inventory = await Inventory.findOne({ _id: inventoryId, tenantId });
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const capacity = inventory.capacity || 1;

    // Get historical booking data for same period in previous years
    const targetStart = new Date(startDate);
    const targetEnd = new Date(endDate);
    const daysInPeriod = Math.ceil((targetEnd - targetStart) / (1000 * 60 * 60 * 24));

    // Look back 3 years for same period
    const historicalPeriods = [];
    for (let i = 1; i <= 3; i++) {
      const histStart = new Date(targetStart);
      histStart.setFullYear(histStart.getFullYear() - i);
      const histEnd = new Date(targetEnd);
      histEnd.setFullYear(histEnd.getFullYear() - i);

      historicalPeriods.push({ start: histStart, end: histEnd });
    }

    // Aggregate historical data
    const historicalData = await Promise.all(
      historicalPeriods.map(async (period, index) => {
        const bookings = await Booking.countDocuments({
          tenantId: mongoose.Types.ObjectId(tenantId),
          itineraryId: inventoryId,
          'travelDates.startDate': { $gte: period.start, $lte: period.end },
          bookingStatus: { $in: ['confirmed', 'completed'] }
        });

        const travelers = await Booking.aggregate([
          {
            $match: {
              tenantId: mongoose.Types.ObjectId(tenantId),
              itineraryId: inventoryId,
              'travelDates.startDate': { $gte: period.start, $lte: period.end },
              bookingStatus: { $in: ['confirmed', 'completed'] }
            }
          },
          {
            $group: {
              _id: null,
              totalTravelers: { $sum: { $size: '$travelers' } }
            }
          }
        ]);

        const totalTravelers = travelers.length > 0 ? travelers[0].totalTravelers : 0;
        const occupancyRate = (totalTravelers / (capacity * daysInPeriod)) * 100;

        return {
          year: period.start.getFullYear(),
          bookings,
          travelers: totalTravelers,
          occupancyRate: Math.round(occupancyRate * 10) / 10
        };
      })
    );

    // Calculate prediction using weighted average (recent years weighted more)
    const weights = [0.5, 0.3, 0.2]; // Most recent year has highest weight
    let predictedOccupancy = 0;

    historicalData.forEach((data, index) => {
      predictedOccupancy += data.occupancyRate * weights[index];
    });

    // Apply seasonal adjustment if enabled
    let seasonalMultiplier = 1.0;
    if (useSeasonalAdjustment) {
      const month = targetStart.getMonth() + 1;
      const seasonalTrends = await exports.detectSeasonalTrends({
        tenantId,
        yearsBack: 3,
        inventoryType: inventory.type
      });

      const monthTrend = seasonalTrends.trends.find(t => t.monthNumber === month);
      if (monthTrend) {
        const avgBookings = seasonalTrends.trends.reduce((sum, t) => sum + t.averageBookings, 0) / 12;
        seasonalMultiplier = monthTrend.averageBookings / avgBookings;
      }
    }

    predictedOccupancy *= seasonalMultiplier;
    predictedOccupancy = Math.min(100, Math.max(0, Math.round(predictedOccupancy * 10) / 10));

    // Determine confidence level
    const variance = historicalData.reduce((sum, data) => {
      return sum + Math.pow(data.occupancyRate - (predictedOccupancy / seasonalMultiplier), 2);
    }, 0) / historicalData.length;

    const confidence = variance < 100 ? 'high' : variance < 400 ? 'medium' : 'low';

    return {
      inventory: {
        id: inventory._id,
        name: inventory.name,
        type: inventory.type,
        capacity
      },
      period: {
        start: startDate,
        end: endDate,
        days: daysInPeriod
      },
      prediction: {
        occupancyRate: predictedOccupancy,
        expectedBookings: Math.round((predictedOccupancy / 100) * capacity * daysInPeriod / (inventory.type === 'hotel' ? 1 : 10)),
        expectedTravelers: Math.round((predictedOccupancy / 100) * capacity * daysInPeriod),
        seasonalMultiplier: Math.round(seasonalMultiplier * 100) / 100,
        confidence
      },
      historicalData: historicalData.map(d => ({
        year: d.year,
        occupancyRate: d.occupancyRate,
        bookings: d.bookings,
        travelers: d.travelers
      }))
    };
  } catch (error) {
    logger.error('Error predicting occupancy:', error);
    throw error;
  }
};

/**
 * Forecast revenue based on historical patterns and predictions
 * @param {Object} params - Forecasting parameters
 * @returns {Object} Revenue forecast
 */
exports.forecastRevenue = async ({
  tenantId,
  months = 3,
  inventoryType,
  confidenceInterval = 0.95
}) => {
  try {
    // Get historical data for same months in previous years
    const today = new Date();
    const forecastPeriods = [];

    for (let i = 0; i < months; i++) {
      const periodStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const periodEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);

      forecastPeriods.push({
        month: periodStart.toLocaleString('default', { month: 'long' }),
        year: periodStart.getFullYear(),
        start: periodStart,
        end: periodEnd
      });
    }

    const forecasts = await Promise.all(
      forecastPeriods.map(async (period) => {
        // Get historical data for this month from previous 3 years
        const historicalRevenue = [];

        for (let year = 1; year <= 3; year++) {
          const histStart = new Date(period.start);
          histStart.setFullYear(histStart.getFullYear() - year);
          const histEnd = new Date(period.end);
          histEnd.setFullYear(histEnd.getFullYear() - year);

          const result = await Booking.aggregate([
            {
              $match: {
                tenantId: mongoose.Types.ObjectId(tenantId),
                'travelDates.startDate': { $gte: histStart, $lte: histEnd },
                bookingStatus: { $in: ['confirmed', 'completed'] }
              }
            },
            ...(inventoryType ? [{
              $lookup: {
                from: 'itineraries',
                localField: 'itineraryId',
                foreignField: '_id',
                as: 'itinerary'
              }
            }, {
              $unwind: '$itinerary'
            }, {
              $match: { 'itinerary.type': inventoryType }
            }] : []),
            {
              $group: {
                _id: null,
                revenue: { $sum: '$financial.totalAmount' },
                bookings: { $sum: 1 }
              }
            }
          ]);

          historicalRevenue.push({
            year: histStart.getFullYear(),
            revenue: result.length > 0 ? result[0].revenue : 0,
            bookings: result.length > 0 ? result[0].bookings : 0
          });
        }

        // Calculate weighted average (recent years weighted more)
        const weights = [0.5, 0.3, 0.2];
        let forecastedRevenue = 0;
        let forecastedBookings = 0;

        historicalRevenue.forEach((data, index) => {
          forecastedRevenue += data.revenue * weights[index];
          forecastedBookings += data.bookings * weights[index];
        });

        // Calculate trend adjustment (growth rate from historical data)
        const growthRate = historicalRevenue.length >= 2
          ? ((historicalRevenue[0].revenue - historicalRevenue[1].revenue) / historicalRevenue[1].revenue)
          : 0;

        forecastedRevenue *= (1 + growthRate);
        forecastedBookings *= (1 + growthRate);

        // Calculate confidence intervals
        const mean = historicalRevenue.reduce((sum, d) => sum + d.revenue, 0) / historicalRevenue.length;
        const variance = historicalRevenue.reduce((sum, d) => Math.pow(d.revenue - mean, 2) + sum, 0) / historicalRevenue.length;
        const stdDev = Math.sqrt(variance);
        const zScore = confidenceInterval === 0.95 ? 1.96 : 2.58; // 95% or 99%

        const confidenceLower = Math.max(0, forecastedRevenue - (zScore * stdDev));
        const confidenceUpper = forecastedRevenue + (zScore * stdDev);

        return {
          period: `${period.month} ${period.year}`,
          month: period.month,
          year: period.year,
          forecast: {
            revenue: Math.round(forecastedRevenue),
            bookings: Math.round(forecastedBookings),
            averageBookingValue: Math.round(forecastedRevenue / forecastedBookings),
            growthRate: Math.round(growthRate * 100 * 10) / 10
          },
          confidence: {
            level: `${confidenceInterval * 100}%`,
            lower: Math.round(confidenceLower),
            upper: Math.round(confidenceUpper),
            range: Math.round(confidenceUpper - confidenceLower)
          },
          historicalData: historicalRevenue
        };
      })
    );

    return {
      summary: {
        totalForecastedRevenue: Math.round(forecasts.reduce((sum, f) => sum + f.forecast.revenue, 0)),
        totalForecastedBookings: Math.round(forecasts.reduce((sum, f) => sum + f.forecast.bookings, 0)),
        averageMonthlyRevenue: Math.round(forecasts.reduce((sum, f) => sum + f.forecast.revenue, 0) / months),
        averageGrowthRate: Math.round((forecasts.reduce((sum, f) => sum + f.forecast.growthRate, 0) / months) * 10) / 10
      },
      forecasts
    };
  } catch (error) {
    logger.error('Error forecasting revenue:', error);
    throw error;
  }
};

/**
 * Identify peak demand periods
 * @param {Object} params - Peak identification parameters
 * @returns {Object} Peak periods and insights
 */
exports.identifyPeakPeriods = async ({
  tenantId,
  yearsBack = 2,
  inventoryType,
  threshold = 75 // Occupancy percentage to consider as "peak"
}) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - yearsBack);

    // Get all bookings grouped by week
    const pipeline = [
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          'travelDates.startDate': { $gte: startDate, $lte: endDate },
          bookingStatus: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'itineraries',
          localField: 'itineraryId',
          foreignField: '_id',
          as: 'itinerary'
        }
      },
      { $unwind: '$itinerary' },
      ...(inventoryType ? [{
        $match: {
          'itinerary.type': inventoryType
        }
      }] : []),
      {
        $group: {
          _id: {
            year: { $year: '$travelDates.startDate' },
            week: { $isoWeek: '$travelDates.startDate' },
            month: { $month: '$travelDates.startDate' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$financial.totalAmount' },
          travelers: { $sum: { $size: '$travelers' } }
        }
      },
      { $sort: { '_id.year': -1, '_id.week': -1 } }
    ];

    const weeklyData = await Booking.aggregate(pipeline);

    // Calculate average bookings per week
    const avgBookingsPerWeek = weeklyData.reduce((sum, w) => sum + w.bookings, 0) / weeklyData.length;

    // Identify peak weeks (above threshold)
    const peakWeeks = weeklyData.filter(w => w.bookings >= (avgBookingsPerWeek * (threshold / 100)));

    // Group peak weeks by month
    const peakMonths = {};
    peakWeeks.forEach(week => {
      const monthName = new Date(2024, week._id.month - 1).toLocaleString('default', { month: 'long' });
      if (!peakMonths[monthName]) {
        peakMonths[monthName] = {
          month: monthName,
          peakWeeks: 0,
          totalBookings: 0,
          totalRevenue: 0
        };
      }
      peakMonths[monthName].peakWeeks += 1;
      peakMonths[monthName].totalBookings += week.bookings;
      peakMonths[monthName].totalRevenue += week.revenue;
    });

    return {
      summary: {
        totalWeeksAnalyzed: weeklyData.length,
        peakWeeksIdentified: peakWeeks.length,
        averageBookingsPerWeek: Math.round(avgBookingsPerWeek),
        peakThreshold: `${threshold}% above average`
      },
      peakMonths: Object.values(peakMonths).sort((a, b) => b.peakWeeks - a.peakWeeks),
      insights: {
        recommendedCapacityIncrease: peakWeeks.length > weeklyData.length * 0.3 ? 'high' : 'moderate',
        pricingOpportunity: peakWeeks.length > 0 ? 'dynamic pricing recommended' : 'stable pricing',
        marketingFocus: Object.keys(peakMonths).slice(0, 3).join(', ')
      }
    };
  } catch (error) {
    logger.error('Error identifying peak periods:', error);
    throw error;
  }
};

/**
 * Prepare ML-ready dataset for advanced forecasting
 * @param {Object} params - Dataset parameters
 * @returns {Object} ML-ready dataset
 */
exports.prepareMLDataset = async ({
  tenantId,
  yearsBack = 3,
  inventoryType,
  includeFeatures = ['bookings', 'revenue', 'travelers', 'seasonality', 'dayOfWeek', 'leadTime']
}) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - yearsBack);

    const pipeline = [
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          'travelDates.startDate': { $gte: startDate, $lte: endDate },
          bookingStatus: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'itineraries',
          localField: 'itineraryId',
          foreignField: '_id',
          as: 'itinerary'
        }
      },
      { $unwind: '$itinerary' },
      ...(inventoryType ? [{
        $match: {
          'itinerary.type': inventoryType
        }
      }] : []),
      {
        $project: {
          date: '$travelDates.startDate',
          bookingDate: '$createdAt',
          revenue: '$financial.totalAmount',
          travelers: { $size: '$travelers' },
          year: { $year: '$travelDates.startDate' },
          month: { $month: '$travelDates.startDate' },
          dayOfWeek: { $dayOfWeek: '$travelDates.startDate' },
          week: { $isoWeek: '$travelDates.startDate' },
          leadTime: {
            $divide: [
              { $subtract: ['$travelDates.startDate', '$createdAt'] },
              86400000 // milliseconds in a day
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ];

    const rawData = await Booking.aggregate(pipeline);

    // Transform into ML-ready format
    const dataset = rawData.map(record => {
      const features = {};

      if (includeFeatures.includes('bookings')) features.bookings = 1;
      if (includeFeatures.includes('revenue')) features.revenue = record.revenue;
      if (includeFeatures.includes('travelers')) features.travelers = record.travelers;
      if (includeFeatures.includes('seasonality')) {
        features.month = record.month;
        features.season = Math.floor((record.month - 1) / 3) + 1; // 1-4 for quarters
      }
      if (includeFeatures.includes('dayOfWeek')) features.dayOfWeek = record.dayOfWeek;
      if (includeFeatures.includes('leadTime')) features.leadTime = Math.round(record.leadTime);

      return {
        date: record.date,
        ...features
      };
    });

    // Generate summary statistics
    const stats = {
      totalRecords: dataset.length,
      dateRange: {
        start: startDate,
        end: endDate
      },
      features: includeFeatures,
      statistics: {
        averageRevenue: Math.round(rawData.reduce((sum, r) => sum + r.revenue, 0) / rawData.length),
        averageTravelers: Math.round((rawData.reduce((sum, r) => sum + r.travelers, 0) / rawData.length) * 10) / 10,
        averageLeadTime: Math.round(rawData.reduce((sum, r) => sum + r.leadTime, 0) / rawData.length)
      }
    };

    return {
      metadata: stats,
      dataset
    };
  } catch (error) {
    logger.error('Error preparing ML dataset:', error);
    throw error;
  }
};

module.exports = exports;
