const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Lead = require('../models/Lead');
const Itinerary = require('../models/Itinerary');
const EmailLog = require('../models/EmailLog');
const User = require('../models/User');
const logger = require('../lib/logger');

/**
 * Get dashboard overview
 * GET /api/v1/reports/dashboard
 */
const getDashboard = async (req, res) => {
  const tenantId = req.user.tenant;
  const userId = req.userId;
  const userRole = req.user.role;

  // Base filters
  const baseFilter = { tenant: tenantId };
  const userFilter = userRole === 'agent' ? { ...baseFilter, createdBy: userId } : baseFilter;

  // Get current month dates
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    totalBookings,
    monthlyBookings,
    totalRevenue,
    monthlyRevenue,
    pendingBookings,
    confirmedBookings,
    totalLeads,
    activeLeads,
    upcomingTrips,
  ] = await Promise.all([
    Booking.countDocuments(userFilter),
    Booking.countDocuments({
      ...userFilter,
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
    }),
    Payment.getRevenueStats(tenantId),
    Payment.getRevenueStats(tenantId, firstDayOfMonth, lastDayOfMonth),
    Booking.countDocuments({ ...userFilter, status: 'pending' }),
    Booking.countDocuments({ ...userFilter, status: 'confirmed' }),
    Lead.countDocuments(userFilter),
    Lead.countDocuments({ ...userFilter, status: { $in: ['new', 'contacted', 'qualified'] } }),
    Booking.getUpcoming(tenantId, 30).then(trips => trips.length),
  ]);

  res.json({
    success: true,
    data: {
      bookings: {
        total: totalBookings,
        monthly: monthlyBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
      },
      revenue: {
        total: totalRevenue.totalRevenue,
        monthly: monthlyRevenue.totalRevenue,
        transactions: totalRevenue.totalTransactions,
      },
      leads: {
        total: totalLeads,
        active: activeLeads,
      },
      upcomingTrips,
    },
  });
};

/**
 * Get revenue report
 * GET /api/v1/reports/revenue
 */
const getRevenueReport = async (req, res) => {
  const tenantId = req.user.tenant;
  const { startDate, endDate, groupBy = 'month' } = req.query;

  const match = {
    tenant: tenantId,
    status: 'completed',
  };

  if (startDate || endDate) {
    match.completedAt = {};
    if (startDate) match.completedAt.$gte = new Date(startDate);
    if (endDate) match.completedAt.$lte = new Date(endDate);
  }

  // Group by period
  let groupId;
  if (groupBy === 'day') {
    groupId = {
      year: { $year: '$completedAt' },
      month: { $month: '$completedAt' },
      day: { $dayOfMonth: '$completedAt' },
    };
  } else if (groupBy === 'week') {
    groupId = {
      year: { $year: '$completedAt' },
      week: { $week: '$completedAt' },
    };
  } else {
    groupId = {
      year: { $year: '$completedAt' },
      month: { $month: '$completedAt' },
    };
  }

  const revenue = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: groupId,
        totalRevenue: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageTransaction: { $avg: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  const [totalStats, byMethod] = await Promise.all([
    Payment.getRevenueStats(tenantId, startDate, endDate),
    Payment.getRevenueByMethod(tenantId),
  ]);

  res.json({
    success: true,
    data: {
      summary: totalStats,
      byPeriod: revenue,
      byMethod,
    },
  });
};

/**
 * Get booking report
 * GET /api/v1/reports/bookings
 */
const getBookingReport = async (req, res) => {
  const tenantId = req.user.tenant;
  const { startDate, endDate } = req.query;

  const match = { tenant: tenantId };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const [
    byStatus,
    byMonth,
    byPaymentStatus,
    totalStats,
  ] = await Promise.all([
    Booking.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalPrice' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Booking.aggregate([
      { $match: match },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalPrice' },
          averageBookingValue: { $avg: '$pricing.totalPrice' },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      summary: totalStats[0] || { totalBookings: 0, totalRevenue: 0, averageBookingValue: 0 },
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPaymentStatus: byPaymentStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byMonth,
    },
  });
};

/**
 * Get leads report
 * GET /api/v1/reports/leads
 */
const getLeadsReport = async (req, res) => {
  const tenantId = req.user.tenant;
  const { startDate, endDate } = req.query;

  const match = { tenant: tenantId };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const [
    byStatus,
    bySource,
    byMonth,
    conversionRate,
  ] = await Promise.all([
    Lead.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: match },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: match },
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
    ]),
    Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const conversionStats = conversionRate[0] || { total: 0, converted: 0 };

  res.json({
    success: true,
    data: {
      summary: {
        total: conversionStats.total,
        converted: conversionStats.converted,
        conversionRate: conversionStats.total > 0
          ? ((conversionStats.converted / conversionStats.total) * 100).toFixed(2)
          : 0,
      },
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      bySource: bySource.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byMonth,
    },
  });
};

/**
 * Get agent performance report
 * GET /api/v1/reports/agents
 */
const getAgentPerformance = async (req, res) => {
  const tenantId = req.user.tenant;
  const { startDate, endDate } = req.query;

  const match = { tenant: tenantId };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const [
    bookingsByAgent,
    leadsByAgent,
    revenuByAgent,
  ] = await Promise.all([
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$createdBy',
          bookings: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalPrice' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent',
        },
      },
      { $unwind: '$agent' },
      {
        $project: {
          agentId: '$_id',
          agentName: { $concat: ['$agent.firstName', ' ', '$agent.lastName'] },
          bookings: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]),
    Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$assignedTo',
          leads: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
          },
        },
      },
    ]),
    Payment.aggregate([
      {
        $match: {
          tenant: tenantId,
          status: 'completed',
          ...(startDate && { completedAt: { $gte: new Date(startDate) } }),
          ...(endDate && { completedAt: { $lte: new Date(endDate) } }),
        },
      },
      {
        $group: {
          _id: '$processedBy',
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      bookings: bookingsByAgent,
      leads: leadsByAgent,
      revenue: revenuByAgent,
    },
  });
};

/**
 * Export report
 * GET /api/v1/reports/export
 */
const exportReport = async (req, res) => {
  const { type, format = 'json' } = req.query;

  // For now, just return JSON
  // In production, you would generate CSV/PDF here
  let data;

  switch (type) {
    case 'revenue':
      data = await getRevenueReport(req, { ...res, json: (d) => d });
      break;
    case 'bookings':
      data = await getBookingReport(req, { ...res, json: (d) => d });
      break;
    case 'leads':
      data = await getLeadsReport(req, { ...res, json: (d) => d });
      break;
    default:
      data = await getDashboard(req, { ...res, json: (d) => d });
  }

  if (format === 'csv') {
    // Would generate CSV here
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
    res.send('CSV export not implemented yet');
  } else {
    res.json({
      success: true,
      data: data.data,
    });
  }
};

module.exports = {
  getDashboard,
  getRevenueReport,
  getBookingReport,
  getLeadsReport,
  getAgentPerformance,
  exportReport,
};
