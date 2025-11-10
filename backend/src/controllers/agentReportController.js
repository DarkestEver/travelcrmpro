const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const Booking = require('../models/Booking');
const Commission = require('../models/Commission');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

/**
 * @desc    Get sales report
 * @route   GET /api/v1/agent-portal/reports/sales
 * @access  Private (Agent only)
 */
exports.getSalesReport = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const { startDate, endDate } = req.query;

  console.log('📊 Fetching sales report for agent:', agentId);

  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const end = endDate ? new Date(endDate) : new Date();

  // Total sales
  const totalSales = await Booking.aggregate([
    {
      $match: {
        agentId,
        createdAt: { $gte: start, $lte: end },
        bookingStatus: { $in: ['confirmed', 'completed'] },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$financial.totalAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Sales by month
  const salesByMonth = await Booking.aggregate([
    {
      $match: {
        agentId,
        createdAt: { $gte: start, $lte: end },
        bookingStatus: { $in: ['confirmed', 'completed'] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalAmount: { $sum: '$financial.totalAmount' },
        bookingCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Sales by status
  const salesByStatus = await Booking.aggregate([
    {
      $match: {
        agentId,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$bookingStatus',
        totalAmount: { $sum: '$financial.totalAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Average booking value
  const avgBookingValue = totalSales[0]?.count > 0 
    ? totalSales[0].totalAmount / totalSales[0].count 
    : 0;

  const report = {
    period: { start, end },
    summary: {
      totalSales: totalSales[0]?.totalAmount || 0,
      bookingCount: totalSales[0]?.count || 0,
      avgBookingValue,
    },
    byMonth: salesByMonth,
    byStatus: salesByStatus,
  };

  successResponse(res, 200, 'Sales report generated', { report });
});

/**
 * @desc    Get booking trends
 * @route   GET /api/v1/agent-portal/reports/booking-trends
 * @access  Private (Agent only)
 */
exports.getBookingTrends = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const { period = 'monthly' } = req.query;

  console.log('📊 Fetching booking trends for agent:', agentId);

  // Last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Bookings trend
  const bookingsTrend = await Booking.aggregate([
    {
      $match: {
        agentId,
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] },
        },
        revenue: { $sum: '$financial.totalAmount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Conversion rate (quotes to bookings)
  const conversionRate = await Booking.aggregate([
    {
      $match: {
        agentId,
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
      },
    },
  ]);

  // Growth rate (compare last month vs previous month)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const [lastMonthBookings, previousMonthBookings] = await Promise.all([
    Booking.countDocuments({
      agentId,
      createdAt: { $gte: lastMonth },
    }),
    Booking.countDocuments({
      agentId,
      createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
    }),
  ]);

  const growthRate = previousMonthBookings > 0
    ? ((lastMonthBookings - previousMonthBookings) / previousMonthBookings) * 100
    : 0;

  const trends = {
    bookingsTrend,
    growthRate: Math.round(growthRate * 100) / 100,
    totalBookings: conversionRate[0]?.totalBookings || 0,
  };

  successResponse(res, 200, 'Booking trends retrieved', { trends });
});

/**
 * @desc    Get customer insights
 * @route   GET /api/v1/agent-portal/reports/customer-insights
 * @access  Private (Agent only)
 */
exports.getCustomerInsights = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  console.log('📊 Fetching customer insights for agent:', agentId);

  // Total customers
  const totalCustomers = await Customer.countDocuments({ agentId, tenantId });

  // Top customers by booking value
  const topCustomers = await Booking.aggregate([
    {
      $match: {
        agentId,
        bookingStatus: { $in: ['confirmed', 'completed'] },
      },
    },
    {
      $group: {
        _id: '$customerId',
        totalSpent: { $sum: '$financial.totalAmount' },
        bookingCount: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: '$customer' },
    {
      $project: {
        customerId: '$_id',
        customerName: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] },
        email: '$customer.email',
        totalSpent: 1,
        bookingCount: 1,
      },
    },
  ]);

  // New customers (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = await Customer.countDocuments({
    agentId,
    tenantId,
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Customer acquisition trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const acquisitionTrend = await Customer.aggregate([
    {
      $match: {
        agentId,
        tenantId,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Average booking per customer
  const avgBookingsPerCustomer = totalCustomers > 0
    ? await Booking.countDocuments({ agentId }) / totalCustomers
    : 0;

  const insights = {
    totalCustomers,
    newCustomers,
    topCustomers,
    acquisitionTrend,
    avgBookingsPerCustomer: Math.round(avgBookingsPerCustomer * 100) / 100,
  };

  successResponse(res, 200, 'Customer insights retrieved', { insights });
});

/**
 * @desc    Get revenue analytics
 * @route   GET /api/v1/agent-portal/reports/revenue
 * @access  Private (Agent only)
 */
exports.getRevenueAnalytics = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const { startDate, endDate } = req.query;

  console.log('📊 Fetching revenue analytics for agent:', agentId);

  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 12));
  const end = endDate ? new Date(endDate) : new Date();

  // Total revenue
  const totalRevenue = await Booking.aggregate([
    {
      $match: {
        agentId,
        createdAt: { $gte: start, $lte: end },
        bookingStatus: { $in: ['confirmed', 'completed'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$financial.totalAmount' },
      },
    },
  ]);

  // Commission earned
  const commissionEarned = await Commission.aggregate([
    {
      $match: {
        agentId,
        bookingDate: { $gte: start, $lte: end },
        status: { $in: ['approved', 'paid'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$commissionAmount' },
      },
    },
  ]);

  // Monthly revenue breakdown
  const monthlyRevenue = await Booking.aggregate([
    {
      $match: {
        agentId,
        createdAt: { $gte: start, $lte: end },
        bookingStatus: { $in: ['confirmed', 'completed'] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$financial.totalAmount' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Revenue by payment status
  const revenueByPaymentStatus = await Booking.aggregate([
    {
      $match: {
        agentId,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$paymentStatus',
        total: { $sum: '$financial.totalAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const analytics = {
    period: { start, end },
    totalRevenue: totalRevenue[0]?.total || 0,
    commissionEarned: commissionEarned[0]?.total || 0,
    monthlyRevenue,
    byPaymentStatus: revenueByPaymentStatus,
  };

  successResponse(res, 200, 'Revenue analytics retrieved', { analytics });
});

/**
 * @desc    Get performance summary
 * @route   GET /api/v1/agent-portal/reports/performance
 * @access  Private (Agent only)
 */
exports.getPerformanceSummary = asyncHandler(async (req, res) => {
  const agentId = req.user._id;

  console.log('📊 Fetching performance summary for agent:', agentId);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Last 30 days metrics
  const [bookings, revenue, commissions, customers] = await Promise.all([
    Booking.countDocuments({
      agentId,
      createdAt: { $gte: thirtyDaysAgo },
    }),
    Booking.aggregate([
      {
        $match: {
          agentId,
          createdAt: { $gte: thirtyDaysAgo },
          bookingStatus: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$financial.totalAmount' },
        },
      },
    ]),
    Commission.aggregate([
      {
        $match: {
          agentId,
          bookingDate: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$commissionAmount' },
        },
      },
    ]),
    Customer.countDocuments({
      agentId,
      createdAt: { $gte: thirtyDaysAgo },
    }),
  ]);

  // All time metrics
  const [totalBookings, totalRevenue, totalCommissions, totalCustomers] = await Promise.all([
    Booking.countDocuments({ agentId }),
    Booking.aggregate([
      {
        $match: {
          agentId,
          bookingStatus: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$financial.totalAmount' },
        },
      },
    ]),
    Commission.aggregate([
      {
        $match: { agentId, status: { $in: ['approved', 'paid'] } },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$commissionAmount' },
        },
      },
    ]),
    Customer.countDocuments({ agentId }),
  ]);

  const summary = {
    last30Days: {
      bookings,
      revenue: revenue[0]?.total || 0,
      commissions: commissions[0]?.total || 0,
      newCustomers: customers,
    },
    allTime: {
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalCommissions: totalCommissions[0]?.total || 0,
      totalCustomers,
    },
  };

  successResponse(res, 200, 'Performance summary retrieved', { summary });
});

module.exports = exports;
