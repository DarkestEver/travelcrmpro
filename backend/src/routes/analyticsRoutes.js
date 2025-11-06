const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');
const { successResponse } = require('../utils/response');

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get dashboard analytics
 * @access  Private (Admin, Operator, Agent)
 */
router.get(
  '/dashboard',
  authenticate,
  authorize('super_admin', 'operator', 'agent'),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const filters = {
        startDate,
        endDate,
        tenantId: req.tenantId,
      };

      // If user is agent, filter by their ID
      if (req.user.role === 'agent') {
        const Agent = require('../models/Agent');
        const agent = await Agent.findOne({ user: req.user.id });
        if (agent) {
          filters.agentId = agent._id;
        }
      }

      const analytics = await analyticsService.getDashboardAnalytics(filters);

      return successResponse(
        res,
        200,
        'Dashboard analytics fetched successfully',
        analytics
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/trends
 * @desc    Get booking trends
 * @access  Private (Admin, Operator)
 */
router.get(
  '/trends',
  authenticate,
  authorize('super_admin', 'operator'),
  async (req, res, next) => {
    try {
      const { period = 'daily', limit = 30 } = req.query;

      const trends = await analyticsService.getBookingTrends(period, parseInt(limit), req.tenantId);

      return successResponse(res, trends, 'Booking trends fetched successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/revenue-breakdown
 * @desc    Get revenue breakdown by category
 * @access  Private (Admin, Operator)
 */
router.get(
  '/revenue-breakdown',
  authenticate,
  authorize('super_admin', 'operator'),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const breakdown = await analyticsService.getRevenueBreakdown({
        startDate,
        endDate,
        tenantId: req.tenantId,
      });

      return successResponse(
        res,
        breakdown,
        'Revenue breakdown fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/top-agents
 * @desc    Get top performing agents
 * @access  Private (Admin, Operator)
 */
router.get(
  '/top-agents',
  authenticate,
  authorize('super_admin', 'operator'),
  async (req, res, next) => {
    try {
      const { limit = 10 } = req.query;

      const topAgents = await analyticsService.getTopAgents(parseInt(limit), req.tenantId);

      return successResponse(
        res,
        topAgents,
        'Top agents fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/customers
 * @desc    Get customer analytics
 * @access  Private (Admin, Operator, Agent)
 */
router.get(
  '/customers',
  authenticate,
  authorize('super_admin', 'operator', 'agent'),
  async (req, res, next) => {
    try {
      let agentId = null;

      // If user is agent, filter by their ID
      if (req.user.role === 'agent') {
        const Agent = require('../models/Agent');
        const agent = await Agent.findOne({ user: req.user.id });
        if (agent) {
          agentId = agent._id;
        }
      }

      const analytics = await analyticsService.getCustomerAnalytics(agentId, req.tenantId);

      return successResponse(
        res,
        analytics,
        'Customer analytics fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/conversion-funnel
 * @desc    Get conversion funnel data
 * @access  Private (Admin, Operator, Agent)
 */
router.get(
  '/conversion-funnel',
  authenticate,
  authorize('super_admin', 'operator', 'agent'),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const filters = {
        startDate,
        endDate,
        tenantId: req.tenantId,
      };

      // If user is agent, filter by their ID
      if (req.user.role === 'agent') {
        const Agent = require('../models/Agent');
        const agent = await Agent.findOne({ user: req.user.id });
        if (agent) {
          filters.agentId = agent._id;
        }
      }

      const funnel = await analyticsService.getConversionFunnel(filters);

      return successResponse(
        res,
        funnel,
        'Conversion funnel fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/agent-performance/:agentId
 * @desc    Get agent performance report
 * @access  Private (Admin, Operator, Agent - own data only)
 */
router.get(
  '/agent-performance/:agentId',
  authenticate,
  authorize('super_admin', 'operator', 'agent'),
  async (req, res, next) => {
    try {
      const { agentId } = req.params;

      // If user is agent, ensure they can only view their own data
      if (req.user.role === 'agent') {
        const Agent = require('../models/Agent');
        const agent = await Agent.findOne({ user: req.user.id });

        if (!agent || agent._id.toString() !== agentId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied',
          });
        }
      }

      const report = await analyticsService.getAgentPerformanceReport(agentId, req.tenantId);

      return successResponse(
        res,
        report,
        'Agent performance report fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/export
 * @desc    Export analytics data to CSV
 * @access  Private (Admin, Operator)
 */
router.get(
  '/export',
  authenticate,
  authorize('super_admin', 'operator'),
  async (req, res, next) => {
    try {
      const { type = 'bookings', startDate, endDate } = req.query;

      const Booking = require('../models/Booking');
      const Quote = require('../models/Quote');

      let data = [];
      let columns = [];

      if (type === 'bookings') {
        const matchFilter = { status: { $in: ['confirmed', 'completed'] } };
        if (startDate && endDate) {
          matchFilter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          };
        }

        const bookings = await Booking.find(matchFilter)
          .populate('customer', 'name email')
          .populate('agent')
          .lean();

        data = bookings.map(b => ({
          bookingNumber: b.bookingNumber,
          customer: b.customer?.name || 'N/A',
          status: b.status,
          totalAmount: b.financial.totalAmount,
          paidAmount: b.financial.paidAmount,
          bookingDate: new Date(b.bookingDate).toLocaleDateString(),
          travelStart: new Date(b.travelDates.startDate).toLocaleDateString(),
        }));

        columns = [
          'bookingNumber',
          'customer',
          'status',
          'totalAmount',
          'paidAmount',
          'bookingDate',
          'travelStart',
        ];
      } else if (type === 'quotes') {
        const matchFilter = {};
        if (startDate && endDate) {
          matchFilter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          };
        }

        const quotes = await Quote.find(matchFilter)
          .populate('customer', 'name email')
          .populate('agent')
          .lean();

        data = quotes.map(q => ({
          quoteNumber: q.quoteNumber,
          customer: q.customer?.name || 'N/A',
          status: q.status,
          totalPrice: q.pricing.totalPrice,
          createdDate: new Date(q.createdAt).toLocaleDateString(),
          validUntil: new Date(q.validUntil).toLocaleDateString(),
        }));

        columns = [
          'quoteNumber',
          'customer',
          'status',
          'totalPrice',
          'createdDate',
          'validUntil',
        ];
      }

      const csv = analyticsService.generateCSV(data, columns);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${type}-export-${Date.now()}.csv"`
      );

      return res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/revenue
 * @desc    Get revenue report
 * @access  Private (Admin, Operator)
 */
router.get(
  '/revenue',
  authenticate,
  authorize('super_admin', 'operator'),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      const revenue = await analyticsService.getRevenueBreakdown({
        startDate,
        endDate,
      });

      return successResponse(res, 200, 'Revenue report fetched successfully', revenue);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/agent-performance
 * @desc    Get agent performance analytics
 * @access  Private (Admin, Operator)
 */
router.get(
  '/agent-performance',
  authenticate,
  authorize('super_admin', 'operator'),
  async (req, res, next) => {
    try {
      const { limit = 10 } = req.query;

      const performance = await analyticsService.getTopAgents(parseInt(limit));

      return successResponse(res, 200, 'Agent performance fetched successfully', performance);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/booking-trends
 * @desc    Get booking trends
 * @access  Private (Admin, Operator)
 */
router.get(
  '/booking-trends',
  authenticate,
  authorize('super_admin', 'operator'),
  async (req, res, next) => {
    try {
      const { period = 'month', limit = 12 } = req.query;

      const trends = await analyticsService.getBookingTrends(period, parseInt(limit));

      return successResponse(res, 200, 'Booking trends fetched successfully', trends);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/forecast
 * @desc    Get revenue forecast
 * @access  Private (Admin, Operator)
 */
router.get(
  '/forecast',
  authenticate,
  authorize('super_admin', 'operator'),
  async (req, res, next) => {
    try {
      const { months = 6 } = req.query;

      // Simple forecast based on historical data
      const forecast = await analyticsService.getRevenueBreakdown({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)),
        endDate: new Date()
      });

      return successResponse(res, 200, 'Revenue forecast fetched successfully', { forecast, months: parseInt(months) });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/user-activity
 * @desc    Get user activity statistics
 * @access  Private (Admin, Operator)
 */
router.get(
  '/user-activity',
  authenticate,
  authorize('super_admin', 'operator'),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const { User } = require('../models');
      const AuditLog = require('../models/AuditLog');
      
      // Build date query
      const dateQuery = {};
      if (startDate || endDate) {
        dateQuery.timestamp = {};
        if (startDate) dateQuery.timestamp.$gte = new Date(startDate);
        if (endDate) dateQuery.timestamp.$lte = new Date(endDate);
      }
      
      // Get total users by role
      const usersByRole = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      
      // Get active users (logged in within period)
      const activeUsers = await AuditLog.distinct('userId', {
        action: 'login',
        ...dateQuery
      });
      
      // Get login statistics
      const loginStats = await AuditLog.aggregate([
        { $match: { action: 'login', ...dateQuery } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]);
      
      // Get most active users
      const mostActiveUsers = await AuditLog.aggregate([
        { $match: dateQuery },
        { $group: { _id: '$userId', activityCount: { $sum: 1 } } },
        { $sort: { activityCount: -1 } },
        { $limit: 10 }
      ]);
      
      // Populate user details
      await AuditLog.populate(mostActiveUsers, {
        path: '_id',
        select: 'name email role'
      });
      
      return successResponse(res, 200, 'User activity statistics fetched successfully', {
        usersByRole,
        totalActiveUsers: activeUsers.length,
        loginTrends: loginStats,
        mostActiveUsers
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/system-health
 * @desc    Get detailed system health metrics
 * @access  Private (Admin)
 */
router.get(
  '/system-health',
  authenticate,
  authorize('super_admin'),
  async (req, res, next) => {
    try {
      const os = require('os');
      const mongoose = require('mongoose');
      
      // Database status
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      
      // Get database stats
      const dbStats = await mongoose.connection.db.stats();
      
      // System metrics
      const systemMetrics = {
        platform: os.platform(),
        architecture: os.arch(),
        cpuCores: os.cpus().length,
        totalMemory: (os.totalmem() / (1024 ** 3)).toFixed(2) + ' GB',
        freeMemory: (os.freemem() / (1024 ** 3)).toFixed(2) + ' GB',
        memoryUsage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2) + '%',
        uptime: Math.floor(os.uptime() / 3600) + ' hours',
        loadAverage: os.loadavg()
      };
      
      // Database metrics
      const databaseMetrics = {
        status: dbStatus,
        collections: dbStats.collections,
        dataSize: (dbStats.dataSize / (1024 ** 2)).toFixed(2) + ' MB',
        storageSize: (dbStats.storageSize / (1024 ** 2)).toFixed(2) + ' MB',
        indexes: dbStats.indexes,
        indexSize: (dbStats.indexSize / (1024 ** 2)).toFixed(2) + ' MB'
      };
      
      // Application metrics
      const { User, Customer, Agent, Booking, Quote } = require('../models');
      const applicationMetrics = {
        totalUsers: await User.countDocuments(),
        totalCustomers: await Customer.countDocuments(),
        totalAgents: await Agent.countDocuments(),
        totalBookings: await Booking.countDocuments(),
        totalQuotes: await Quote.countDocuments(),
        activeBookings: await Booking.countDocuments({ bookingStatus: { $in: ['pending', 'confirmed'] } }),
        pendingQuotes: await Quote.countDocuments({ status: 'draft' })
      };
      
      return successResponse(res, 200, 'System health metrics fetched successfully', {
        system: systemMetrics,
        database: databaseMetrics,
        application: applicationMetrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/analytics/settings
 * @desc    Get system settings and configuration
 * @access  Private (Admin, Operator)
 */
router.get(
  '/settings',
  authenticate,
  authorize('super_admin', 'operator'),
  async (req, res, next) => {
    try {
      // Return current system settings
      const settings = {
        application: {
          name: process.env.APP_NAME || 'Travel CRM',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          apiVersion: 'v1'
        },
        features: {
          websockets: false, // Currently disabled
          pdfGeneration: true,
          emailNotifications: true,
          smsNotifications: false,
          auditLogging: true,
          rateLimiting: true
        },
        limits: {
          maxFileSize: '10mb',
          requestsPerWindow: 100,
          authRequestsPerWindow: 5,
          windowDuration: '15 minutes'
        },
        integrations: {
          redis: false, // Currently disabled
          mongodb: true,
          swagger: true
        },
        security: {
          jwtExpiry: process.env.JWT_EXPIRES_IN || '7d',
          passwordMinLength: 8,
          maxLoginAttempts: 5,
          corsEnabled: true
        }
      };
      
      return successResponse(res, 200, 'System settings fetched successfully', settings);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
