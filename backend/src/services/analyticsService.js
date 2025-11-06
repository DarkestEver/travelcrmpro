const Booking = require('../models/Booking');
const Quote = require('../models/Quote');
const Agent = require('../models/Agent');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(filters = {}) {
    try {
      const { startDate, endDate, agentId, tenantId } = filters;

      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);

      const matchFilter = {};
      if (tenantId) matchFilter.tenantId = tenantId;
      if (Object.keys(dateFilter).length > 0) {
        matchFilter.createdAt = dateFilter;
      }
      if (agentId) {
        matchFilter.agent = agentId;
      }

      // Booking statistics
      const bookingStats = await Booking.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$financial.totalAmount' },
            totalPaid: { $sum: '$financial.paidAmount' },
            totalPending: { $sum: '$financial.pendingAmount' },
            avgBookingValue: { $avg: '$financial.totalAmount' },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
            },
            completedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            cancelledBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
            },
          },
        },
      ]);

      // Quote statistics
      const quoteStats = await Quote.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalQuotes: { $sum: 1 },
            acceptedQuotes: {
              $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] },
            },
            rejectedQuotes: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
            },
            pendingQuotes: {
              $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
            },
            totalQuoteValue: { $sum: '$pricing.totalPrice' },
          },
        },
      ]);

      const bookingData = bookingStats[0] || {};
      const quoteData = quoteStats[0] || {};

      return {
        bookings: {
          total: bookingData.totalBookings || 0,
          confirmed: bookingData.confirmedBookings || 0,
          completed: bookingData.completedBookings || 0,
          cancelled: bookingData.cancelledBookings || 0,
        },
        revenue: {
          total: bookingData.totalRevenue || 0,
          paid: bookingData.totalPaid || 0,
          pending: bookingData.totalPending || 0,
          average: bookingData.avgBookingValue || 0,
        },
        quotes: {
          total: quoteData.totalQuotes || 0,
          accepted: quoteData.acceptedQuotes || 0,
          rejected: quoteData.rejectedQuotes || 0,
          pending: quoteData.pendingQuotes || 0,
          totalValue: quoteData.totalQuoteValue || 0,
          conversionRate:
            quoteData.totalQuotes > 0
              ? ((quoteData.acceptedQuotes / quoteData.totalQuotes) * 100).toFixed(2)
              : 0,
        },
      };
    } catch (error) {
      logger.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Get booking trends (daily/weekly/monthly)
   */
  async getBookingTrends(period = 'daily', limit = 30, tenantId) {
    try {
      const groupByFormat =
        period === 'daily'
          ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          : period === 'weekly'
          ? { $dateToString: { format: '%Y-W%U', date: '$createdAt' } }
          : { $dateToString: { format: '%Y-%m', date: '$createdAt' } };

      const matchFilter = {};
      if (tenantId) matchFilter.tenantId = tenantId;

      const trends = await Booking.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: groupByFormat,
            bookings: { $sum: 1 },
            revenue: { $sum: '$financial.totalAmount' },
            avgValue: { $avg: '$financial.totalAmount' },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: limit },
      ]);

      return trends.reverse();
    } catch (error) {
      logger.error('Error getting booking trends:', error);
      throw error;
    }
  }

  /**
   * Get revenue breakdown by category
   */
  async getRevenueBreakdown(filters = {}) {
    try {
      const { startDate, endDate, agentId, tenantId } = filters;

      const matchFilter = { status: { $in: ['confirmed', 'completed'] } };
      if (tenantId) matchFilter.tenantId = tenantId;
      if (startDate && endDate) {
        matchFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      if (agentId) {
        matchFilter.agent = agentId;
      }

      const breakdown = await Booking.aggregate([
        { $match: matchFilter },
        {
          $lookup: {
            from: 'itineraries',
            localField: 'itinerary',
            foreignField: '_id',
            as: 'itineraryDetails',
          },
        },
        { $unwind: '$itineraryDetails' },
        {
          $group: {
            _id: '$itineraryDetails.travelStyle',
            revenue: { $sum: '$financial.totalAmount' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]);

      const total = breakdown.reduce((sum, item) => sum + item.revenue, 0);

      return breakdown.map(item => ({
        category: item._id || 'Other',
        revenue: item.revenue,
        bookings: item.bookings,
        percentage: total > 0 ? ((item.revenue / total) * 100).toFixed(2) : 0,
      }));
    } catch (error) {
      logger.error('Error getting revenue breakdown:', error);
      throw error;
    }
  }

  /**
   * Get top performing agents
   */
  async getTopAgents(limit = 10, tenantId) {
    try {
      const matchFilter = { status: { $in: ['confirmed', 'completed'] } };
      if (tenantId) matchFilter.tenantId = tenantId;

      const topAgents = await Booking.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$agent',
            totalRevenue: { $sum: '$financial.totalAmount' },
            totalBookings: { $sum: 1 },
            avgBookingValue: { $avg: '$financial.totalAmount' },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'agents',
            localField: '_id',
            foreignField: '_id',
            as: 'agentDetails',
          },
        },
        { $unwind: '$agentDetails' },
        {
          $lookup: {
            from: 'users',
            localField: 'agentDetails.user',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $unwind: '$userDetails' },
        {
          $project: {
            agentName: '$userDetails.name',
            agencyName: '$agentDetails.agencyName',
            totalRevenue: 1,
            totalBookings: 1,
            avgBookingValue: 1,
            tier: '$agentDetails.tier',
          },
        },
      ]);

      return topAgents;
    } catch (error) {
      logger.error('Error getting top agents:', error);
      throw error;
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(agentId = null, tenantId) {
    try {
      const matchFilter = {};
      if (tenantId) matchFilter.tenantId = tenantId;
      if (agentId) {
        matchFilter.agent = agentId;
      }

      const stats = await Customer.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            totalBookings: { $sum: '$totalBookings' },
            totalSpent: { $sum: '$totalSpent' },
            avgSpentPerCustomer: { $avg: '$totalSpent' },
          },
        },
      ]);

      const data = stats[0] || {};

      // Get customer distribution by booking count
      const distribution = await Customer.aggregate([
        { $match: matchFilter },
        { $match: matchFilter },
        {
          $bucket: {
            groupBy: '$totalBookings',
            boundaries: [0, 1, 3, 5, 10, 999],
            default: 'Other',
            output: {
              count: { $sum: 1 },
              customers: { $push: '$name' },
            },
          },
        },
      ]);

      return {
        total: data.totalCustomers || 0,
        totalBookings: data.totalBookings || 0,
        totalSpent: data.totalSpent || 0,
        avgSpentPerCustomer: data.avgSpentPerCustomer || 0,
        distribution: distribution.map(d => ({
          range:
            d._id === 'Other'
              ? '10+'
              : `${d._id}-${d._id === 0 ? '0' : d._id + 2}`,
          count: d.count,
        })),
      };
    } catch (error) {
      logger.error('Error getting customer analytics:', error);
      throw error;
    }
  }

  /**
   * Get conversion funnel
   */
  async getConversionFunnel(filters = {}) {
    try {
      const { startDate, endDate, agentId, tenantId } = filters;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const matchFilter = { ...dateFilter };
      if (tenantId) matchFilter.tenantId = tenantId;
      if (agentId) matchFilter.agent = agentId;

      const quotes = await Quote.countDocuments(matchFilter);
      const sent = await Quote.countDocuments({
        ...matchFilter,
        status: { $in: ['sent', 'accepted', 'rejected'] },
      });
      const accepted = await Quote.countDocuments({
        ...matchFilter,
        status: 'accepted',
      });
      const bookings = await Booking.countDocuments(matchFilter);

      return [
        {
          stage: 'Quotes Created',
          count: quotes,
          percentage: 100,
          dropOff: 0,
        },
        {
          stage: 'Quotes Sent',
          count: sent,
          percentage: quotes > 0 ? ((sent / quotes) * 100).toFixed(2) : 0,
          dropOff: quotes - sent,
        },
        {
          stage: 'Quotes Accepted',
          count: accepted,
          percentage: sent > 0 ? ((accepted / sent) * 100).toFixed(2) : 0,
          dropOff: sent - accepted,
        },
        {
          stage: 'Bookings Created',
          count: bookings,
          percentage: accepted > 0 ? ((bookings / accepted) * 100).toFixed(2) : 0,
          dropOff: accepted - bookings,
        },
      ];
    } catch (error) {
      logger.error('Error getting conversion funnel:', error);
      throw error;
    }
  }

  /**
   * Get agent performance report
   */
  async getAgentPerformanceReport(agentId, tenantId) {
    try {
      const matchFilter = { agent: agentId };
      if (tenantId) matchFilter.tenantId = tenantId;

      const bookingStats = await Booking.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$financial.totalAmount' },
            avgBookingValue: { $avg: '$financial.totalAmount' },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
            },
          },
        },
      ]);

      const quoteStats = await Quote.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalQuotes: { $sum: 1 },
            acceptedQuotes: {
              $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] },
            },
          },
        },
      ]);

      const customerMatchFilter = { agent: agentId };
      if (tenantId) customerMatchFilter.tenantId = tenantId;
      const customerCount = await Customer.countDocuments(customerMatchFilter);

      const booking = bookingStats[0] || {};
      const quote = quoteStats[0] || {};

      return {
        bookings: {
          total: booking.totalBookings || 0,
          confirmed: booking.confirmedBookings || 0,
          revenue: booking.totalRevenue || 0,
          avgValue: booking.avgBookingValue || 0,
        },
        quotes: {
          total: quote.totalQuotes || 0,
          accepted: quote.acceptedQuotes || 0,
          conversionRate:
            quote.totalQuotes > 0
              ? ((quote.acceptedQuotes / quote.totalQuotes) * 100).toFixed(2)
              : 0,
        },
        customers: customerCount,
      };
    } catch (error) {
      logger.error('Error getting agent performance report:', error);
      throw error;
    }
  }

  /**
   * Export analytics to CSV
   */
  generateCSV(data, columns) {
    try {
      const headers = columns.join(',');
      const rows = data.map(row => columns.map(col => row[col] || '').join(',')).join('\n');
      return `${headers}\n${rows}`;
    } catch (error) {
      logger.error('Error generating CSV:', error);
      throw error;
    }
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();

module.exports = analyticsService;
