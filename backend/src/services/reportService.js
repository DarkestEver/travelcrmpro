/**
 * Report Service
 * Business logic for generating financial and analytics reports
 */

const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const User = require('../models/User');

/**
 * Generate Revenue Report
 */
exports.generateRevenueReport = async ({
  tenantId,
  startDate,
  endDate,
  groupBy = 'day',
  agentId,
  destinationId
}) => {
  const matchStage = {
    tenantId,
    bookingStatus: { $in: ['confirmed', 'completed'] },
    createdAt: { $gte: startDate, $lte: endDate }
  };

  if (agentId) matchStage.agentId = agentId;
  if (destinationId) matchStage['itineraryId.destination'] = destinationId;

  // Group by logic
  let groupByField;
  if (groupBy === 'day') {
    groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  } else if (groupBy === 'week') {
    groupByField = { $week: '$createdAt' };
  } else if (groupBy === 'month') {
    groupByField = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  } else if (groupBy === 'agent') {
    groupByField = '$agentId';
  } else if (groupBy === 'destination') {
    groupByField = '$itineraryId.destination';
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: groupByField,
        totalRevenue: { $sum: '$financial.totalAmount' },
        bookingCount: { $sum: 1 },
        avgBookingValue: { $avg: '$financial.totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const data = await Booking.aggregate(pipeline);

  // Calculate totals
  const totals = data.reduce((acc, item) => ({
    totalRevenue: acc.totalRevenue + item.totalRevenue,
    bookingCount: acc.bookingCount + item.bookingCount
  }), { totalRevenue: 0, bookingCount: 0 });

  return {
    period: { startDate, endDate },
    groupBy,
    data,
    totals: {
      ...totals,
      avgBookingValue: totals.bookingCount > 0 ? totals.totalRevenue / totals.bookingCount : 0
    }
  };
};

/**
 * Generate Commission Report
 */
exports.generateCommissionReport = async ({
  tenantId,
  startDate,
  endDate,
  agentId,
  status
}) => {
  const matchStage = {
    tenantId,
    createdAt: { $gte: startDate, $lte: endDate }
  };

  if (agentId) matchStage.agentId = agentId;
  if (status) matchStage['commission.status'] = status;

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'agentId',
        foreignField: '_id',
        as: 'agent'
      }
    },
    { $unwind: '$agent' },
    {
      $group: {
        _id: '$agentId',
        agentName: { $first: { $concat: ['$agent.firstName', ' ', '$agent.lastName'] } },
        agentEmail: { $first: '$agent.email' },
        totalCommission: { $sum: '$financial.commission' },
        paidCommission: {
          $sum: {
            $cond: [
              { $eq: ['$commission.status', 'paid'] },
              '$financial.commission',
              0
            ]
          }
        },
        pendingCommission: {
          $sum: {
            $cond: [
              { $eq: ['$commission.status', 'pending'] },
              '$financial.commission',
              0
            ]
          }
        },
        bookingCount: { $sum: 1 }
      }
    },
    { $sort: { totalCommission: -1 } }
  ];

  const data = await Booking.aggregate(pipeline);

  const totals = data.reduce((acc, item) => ({
    totalCommission: acc.totalCommission + item.totalCommission,
    paidCommission: acc.paidCommission + item.paidCommission,
    pendingCommission: acc.pendingCommission + item.pendingCommission,
    bookingCount: acc.bookingCount + item.bookingCount
  }), { totalCommission: 0, paidCommission: 0, pendingCommission: 0, bookingCount: 0 });

  return {
    period: { startDate, endDate },
    data,
    totals
  };
};

/**
 * Generate Tax Report
 */
exports.generateTaxReport = async ({
  tenantId,
  startDate,
  endDate,
  taxType = 'all',
  groupBy = 'month'
}) => {
  const matchStage = {
    tenantId,
    status: { $in: ['sent', 'paid', 'partially_paid'] },
    invoiceDate: { $gte: startDate, $lte: endDate }
  };

  let groupByField;
  if (groupBy === 'month') {
    groupByField = { $dateToString: { format: '%Y-%m', date: '$invoiceDate' } };
  } else if (groupBy === 'quarter') {
    groupByField = { 
      $concat: [
        { $toString: { $year: '$invoiceDate' } },
        '-Q',
        { $toString: { $ceil: { $divide: [{ $month: '$invoiceDate' }, 3] } } }
      ]
    };
  } else {
    groupByField = { $year: '$invoiceDate' };
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: groupByField,
        totalTax: { $sum: '$tax' },
        invoiceCount: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        taxableAmount: { $sum: '$subtotal' }
      }
    },
    {
      $addFields: {
        effectiveTaxRate: {
          $cond: [
            { $gt: ['$taxableAmount', 0] },
            { $multiply: [{ $divide: ['$totalTax', '$taxableAmount'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const data = await Invoice.aggregate(pipeline);

  const totals = data.reduce((acc, item) => ({
    totalTax: acc.totalTax + item.totalTax,
    invoiceCount: acc.invoiceCount + item.invoiceCount,
    totalAmount: acc.totalAmount + item.totalAmount,
    taxableAmount: acc.taxableAmount + item.taxableAmount
  }), { totalTax: 0, invoiceCount: 0, totalAmount: 0, taxableAmount: 0 });

  totals.effectiveTaxRate = totals.taxableAmount > 0 
    ? (totals.totalTax / totals.taxableAmount) * 100 
    : 0;

  return {
    period: { startDate, endDate },
    groupBy,
    data,
    totals
  };
};

/**
 * Generate Profit & Loss Report
 */
exports.generateProfitLossReport = async ({
  tenantId,
  startDate,
  endDate
}) => {
  // Revenue (from completed bookings)
  const revenueResult = await Booking.aggregate([
    {
      $match: {
        tenantId,
        bookingStatus: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$financial.totalAmount' },
        commission: { $sum: '$financial.commission' }
      }
    }
  ]);

  const revenue = revenueResult[0] || { revenue: 0, commission: 0 };

  // Cost of Goods Sold (supplier payments)
  const cogsResult = await Booking.aggregate([
    {
      $match: {
        tenantId,
        bookingStatus: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        supplierCosts: { $sum: '$financial.supplierCost' }
      }
    }
  ]);

  const cogs = cogsResult[0]?.supplierCosts || 0;

  // Calculate profit
  const grossProfit = revenue.revenue - cogs;
  const netProfit = grossProfit - revenue.commission;

  return {
    period: { startDate, endDate },
    revenue: {
      total: revenue.revenue,
      count: revenueResult.length
    },
    costs: {
      supplierCosts: cogs,
      commissions: revenue.commission,
      total: cogs + revenue.commission
    },
    profit: {
      gross: grossProfit,
      net: netProfit,
      margin: revenue.revenue > 0 ? (netProfit / revenue.revenue) * 100 : 0
    }
  };
};

/**
 * Generate Booking Trends Report
 */
exports.generateBookingTrendsReport = async ({
  tenantId,
  startDate,
  endDate,
  groupBy = 'week'
}) => {
  let groupByField;
  if (groupBy === 'day') {
    groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  } else if (groupBy === 'week') {
    groupByField = { $isoWeek: '$createdAt' };
  } else {
    groupByField = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  }

  const pipeline = [
    {
      $match: {
        tenantId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: groupByField,
        confirmed: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'confirmed'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'pending'] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] }
        },
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$financial.totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const data = await Booking.aggregate(pipeline);

  return {
    period: { startDate, endDate },
    groupBy,
    data
  };
};

/**
 * Generate Agent Performance Report
 */
exports.generateAgentPerformanceReport = async ({
  tenantId,
  startDate,
  endDate
}) => {
  const pipeline = [
    {
      $match: {
        tenantId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'agentId',
        foreignField: '_id',
        as: 'agent'
      }
    },
    { $unwind: '$agent' },
    {
      $group: {
        _id: '$agentId',
        agentName: { $first: { $concat: ['$agent.firstName', ' ', '$agent.lastName'] } },
        totalBookings: { $sum: 1 },
        confirmedBookings: {
          $sum: { $cond: [{ $in: ['$bookingStatus', ['confirmed', 'completed']] }, 1, 0] }
        },
        totalRevenue: { $sum: '$financial.totalAmount' },
        totalCommission: { $sum: '$financial.commission' },
        avgBookingValue: { $avg: '$financial.totalAmount' }
      }
    },
    {
      $addFields: {
        conversionRate: {
          $cond: [
            { $gt: ['$totalBookings', 0] },
            { $multiply: [{ $divide: ['$confirmedBookings', '$totalBookings'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ];

  const data = await Booking.aggregate(pipeline);

  return {
    period: { startDate, endDate },
    data
  };
};

/**
 * Generate Customer Analytics
 */
exports.generateCustomerAnalytics = async ({
  tenantId,
  startDate,
  endDate,
  segment
}) => {
  // Customer acquisition
  const newCustomers = await Customer.countDocuments({
    tenantId,
    createdAt: { $gte: startDate, $lte: endDate }
  });

  // Customer lifetime value
  const clvResult = await Booking.aggregate([
    {
      $match: {
        tenantId,
        bookingStatus: { $in: ['confirmed', 'completed'] }
      }
    },
    {
      $group: {
        _id: '$customerId',
        totalSpent: { $sum: '$financial.totalAmount' },
        bookingCount: { $sum: 1 },
        firstBooking: { $min: '$createdAt' },
        lastBooking: { $max: '$createdAt' }
      }
    },
    {
      $group: {
        _id: null,
        avgLifetimeValue: { $avg: '$totalSpent' },
        avgBookingsPerCustomer: { $avg: '$bookingCount' }
      }
    }
  ]);

  const clv = clvResult[0] || { avgLifetimeValue: 0, avgBookingsPerCustomer: 0 };

  return {
    period: { startDate, endDate },
    newCustomers,
    avgLifetimeValue: clv.avgLifetimeValue,
    avgBookingsPerCustomer: clv.avgBookingsPerCustomer
  };
};

/**
 * Generate Dashboard Summary
 */
exports.generateDashboardSummary = async ({ tenantId, userId, role }) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const matchStage = { tenantId };
  if (role === 'agent') {
    matchStage.agentId = userId;
  }

  // This month stats
  const thisMonthBookings = await Booking.countDocuments({
    ...matchStage,
    createdAt: { $gte: startOfMonth }
  });

  const thisMonthRevenue = await Booking.aggregate([
    {
      $match: {
        ...matchStage,
        bookingStatus: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: startOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$financial.totalAmount' }
      }
    }
  ]);

  // Last month for comparison
  const lastMonthBookings = await Booking.countDocuments({
    ...matchStage,
    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
  });

  const lastMonthRevenue = await Booking.aggregate([
    {
      $match: {
        ...matchStage,
        bookingStatus: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$financial.totalAmount' }
      }
    }
  ]);

  const thisMonthRev = thisMonthRevenue[0]?.total || 0;
  const lastMonthRev = lastMonthRevenue[0]?.total || 0;

  return {
    thisMonth: {
      bookings: thisMonthBookings,
      revenue: thisMonthRev
    },
    lastMonth: {
      bookings: lastMonthBookings,
      revenue: lastMonthRev
    },
    growth: {
      bookings: lastMonthBookings > 0 ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 : 0,
      revenue: lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0
    }
  };
};

/**
 * Export data to CSV
 */
exports.exportToCSV = async (data, reportType) => {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      // Handle nested objects, dates, and special characters
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Export data to PDF
 */
exports.exportToPDF = async (data, reportType, title) => {
  // For now, return a simple message
  // In production, integrate with a PDF library like pdfkit or puppeteer
  throw new Error('PDF export not yet implemented. Use CSV export or integrate PDF library.');
};
