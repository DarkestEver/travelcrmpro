const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseHandler');
const Customer = require('../models/Customer');
const QuoteRequest = require('../models/QuoteRequest');
const Booking = require('../models/Booking');

/**
 * @desc    Get agent dashboard statistics
 * @route   GET /api/v1/agent/stats
 * @access  Private (Agent only)
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  // Get counts in parallel for performance
  const [
    totalCustomers,
    pendingQuotes,
    confirmedBookings,
    thisMonthBookings,
    totalRevenue,
  ] = await Promise.all([
    // Total customers
    Customer.countDocuments({ agentId, tenantId }),
    
    // Pending quote requests
    QuoteRequest.countDocuments({
      agentId,
      tenantId,
      status: { $in: ['pending', 'reviewing'] },
    }),
    
    // Confirmed bookings
    Booking.countDocuments({
      agentId,
      tenantId,
      status: 'confirmed',
    }),
    
    // This month's bookings
    Booking.countDocuments({
      agentId,
      tenantId,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),
    
    // Total revenue (sum of confirmed bookings)
    Booking.aggregate([
      {
        $match: {
          agentId: agentId,
          tenantId: tenantId,
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]),
  ]);

  // Get quote statistics
  const quoteStats = await QuoteRequest.aggregate([
    {
      $match: {
        agentId: agentId,
        tenantId: tenantId,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    customers: {
      total: totalCustomers,
      change: 0, // TODO: Calculate month-over-month change
    },
    quotes: {
      pending: pendingQuotes,
      total: quoteStats.reduce((sum, stat) => sum + stat.count, 0),
      byStatus: quoteStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
    },
    bookings: {
      confirmed: confirmedBookings,
      thisMonth: thisMonthBookings,
    },
    revenue: {
      total: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      currency: 'USD', // TODO: Get from tenant settings
    },
    agent: {
      level: req.user.agentLevel || 'bronze',
      creditLimit: req.user.creditLimit || 0,
      commissionRate: req.user.commissionRate || 10,
    },
  };

  successResponse(res, 200, 'Agent stats retrieved successfully', { stats });
});

/**
 * @desc    Get agent recent activity
 * @route   GET /api/v1/agent/activity
 * @access  Private (Agent only)
 */
exports.getRecentActivity = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const limit = parseInt(req.query.limit) || 10;

  // Get recent activities from different collections
  const [recentCustomers, recentQuotes, recentBookings] = await Promise.all([
    // Recent customers
    Customer.find({ agentId, tenantId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('firstName lastName email createdAt')
      .lean(),
    
    // Recent quote requests
    QuoteRequest.find({ agentId, tenantId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'firstName lastName')
      .select('destination status createdAt quotedAt')
      .lean(),
    
    // Recent bookings
    Booking.find({ agentId, tenantId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'firstName lastName')
      .populate('itineraryId', 'title')
      .select('status totalAmount createdAt')
      .lean(),
  ]);

  // Combine and format activities
  const activities = [];

  // Add customer activities
  recentCustomers.forEach((customer) => {
    activities.push({
      type: 'customer',
      action: 'created',
      title: `New customer: ${customer.firstName} ${customer.lastName}`,
      description: customer.email,
      timestamp: customer.createdAt,
      icon: 'user',
    });
  });

  // Add quote activities
  recentQuotes.forEach((quote) => {
    const customerName = quote.customerId
      ? `${quote.customerId.firstName} ${quote.customerId.lastName}`
      : 'Unknown';
    activities.push({
      type: 'quote',
      action: quote.status,
      title: `Quote request ${quote.status}`,
      description: `${customerName} • ${quote.destination.country}`,
      timestamp: quote.quotedAt || quote.createdAt,
      icon: 'document',
    });
  });

  // Add booking activities
  recentBookings.forEach((booking) => {
    const customerName = booking.customerId
      ? `${booking.customerId.firstName} ${booking.customerId.lastName}`
      : 'Unknown';
    const itineraryTitle = booking.itineraryId?.title || 'Unknown itinerary';
    activities.push({
      type: 'booking',
      action: booking.status,
      title: `Booking ${booking.status}`,
      description: `${customerName} • ${itineraryTitle}`,
      timestamp: booking.createdAt,
      icon: 'calendar',
    });
  });

  // Sort by timestamp and limit
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const limitedActivities = activities.slice(0, limit);

  successResponse(res, 200, 'Recent activity retrieved successfully', {
    activities: limitedActivities,
  });
});
