const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const Commission = require('../models/Commission');
const Booking = require('../models/Booking');

/**
 * @desc    Get commission summary for agent
 * @route   GET /api/v1/agent-portal/commissions/summary
 * @access  Private (Agent only)
 */
exports.getCommissionSummary = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  console.log('💰 Fetching commission summary for agent:', agentId);

  // Get totals by status
  const [pending, approved, paid, total] = await Promise.all([
    Commission.getAgentTotalCommission(agentId, 'pending'),
    Commission.getAgentTotalCommission(agentId, 'approved'),
    Commission.getAgentTotalCommission(agentId, 'paid'),
    Commission.getAgentTotalCommission(agentId),
  ]);

  // Get this month's commissions
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  const thisMonth = await Commission.aggregate([
    {
      $match: {
        agentId,
        bookingDate: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$commissionAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Get last 6 months trend
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const trend = await Commission.getAgentCommissionsByPeriod(agentId, sixMonthsAgo, new Date());

  const summary = {
    pending: {
      amount: pending.total,
      count: pending.count,
    },
    approved: {
      amount: approved.total,
      count: approved.count,
    },
    paid: {
      amount: paid.total,
      count: paid.count,
    },
    total: {
      amount: total.total,
      count: total.count,
    },
    thisMonth: {
      amount: thisMonth[0]?.total || 0,
      count: thisMonth[0]?.count || 0,
    },
    trend,
  };

  console.log('💰 Commission summary:', summary);

  successResponse(res, 200, 'Commission summary retrieved', { summary });
});

/**
 * @desc    Get commission history for agent
 * @route   GET /api/v1/agent-portal/commissions
 * @access  Private (Agent only)
 */
exports.getMyCommissions = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  const {
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    sortBy = '-bookingDate',
  } = req.query;

  console.log('💰 Fetching commissions for agent:', agentId);

  const query = { agentId, tenantId };

  // Filter by status
  if (status && status.trim()) {
    query.status = status;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.bookingDate = {};
    if (startDate && startDate.trim()) {
      query.bookingDate.$gte = new Date(startDate);
    }
    if (endDate && endDate.trim()) {
      query.bookingDate.$lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;

  const [commissions, total] = await Promise.all([
    Commission.find(query)
      .populate('bookingId', 'bookingNumber bookingStatus')
      .populate('customerId', 'firstName lastName email')
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    Commission.countDocuments(query),
  ]);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit),
  };

  console.log('💰 Found commissions:', total);

  successResponse(res, 200, 'Commissions retrieved successfully', {
    commissions,
    pagination,
  });
});

/**
 * @desc    Get single commission details
 * @route   GET /api/v1/agent-portal/commissions/:id
 * @access  Private (Agent only)
 */
exports.getCommissionById = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;

  const commission = await Commission.findOne({
    _id: id,
    agentId,
    tenantId,
  })
    .populate('bookingId')
    .populate('customerId')
    .populate('approvedBy', 'name email');

  if (!commission) {
    throw new AppError('Commission not found', 404);
  }

  successResponse(res, 200, 'Commission retrieved successfully', {
    commission,
  });
});

/**
 * @desc    Get commission statistics
 * @route   GET /api/v1/agent-portal/commissions/stats
 * @access  Private (Agent only)
 */
exports.getCommissionStats = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  console.log('💰 Fetching commission stats for agent:', agentId);

  // Get average commission rate
  const avgRate = await Commission.aggregate([
    { $match: { agentId, tenantId } },
    {
      $group: {
        _id: null,
        avgRate: { $avg: '$commissionRate' },
        avgAmount: { $avg: '$commissionAmount' },
      },
    },
  ]);

  // Get top customers by commission
  const topCustomers = await Commission.aggregate([
    { $match: { agentId, tenantId } },
    {
      $group: {
        _id: '$customerId',
        totalCommission: { $sum: '$commissionAmount' },
        bookingCount: { $sum: 1 },
      },
    },
    { $sort: { totalCommission: -1 } },
    { $limit: 5 },
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
        customerName: {
          $concat: ['$customer.firstName', ' ', '$customer.lastName'],
        },
        totalCommission: 1,
        bookingCount: 1,
      },
    },
  ]);

  // Get commission by status breakdown
  const statusBreakdown = await Commission.aggregate([
    { $match: { agentId, tenantId } },
    {
      $group: {
        _id: '$status',
        amount: { $sum: '$commissionAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    averageRate: avgRate[0]?.avgRate || 0,
    averageAmount: avgRate[0]?.avgAmount || 0,
    topCustomers,
    byStatus: statusBreakdown.reduce((acc, item) => {
      acc[item._id] = {
        amount: item.amount,
        count: item.count,
      };
      return acc;
    }, {}),
  };

  console.log('💰 Commission stats:', stats);

  successResponse(res, 200, 'Commission statistics retrieved', { stats });
});

/**
 * @desc    Create commission record (usually called internally when booking is completed)
 * @route   POST /api/v1/agent-portal/commissions
 * @access  Private (System/Operator)
 * @internal This is typically called automatically, not by agents
 */
exports.createCommission = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  console.log('💰 Creating commission for booking:', bookingId);

  // Get booking details
  const booking = await Booking.findById(bookingId)
    .populate('agentId')
    .populate('customerId');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Check if commission already exists
  const existingCommission = await Commission.findOne({ bookingId });
  if (existingCommission) {
    throw new AppError('Commission already exists for this booking', 400);
  }

  // Calculate commission
  const bookingAmount = booking.financial?.totalAmount || 0;
  const commissionRate = booking.agentId?.commissionRate || 10;
  const commissionAmount = Commission.calculateCommission(bookingAmount, commissionRate);

  // Set due date (30 days from booking completion)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  // Create commission record
  const commission = await Commission.create({
    tenantId: booking.tenantId,
    agentId: booking.agentId._id,
    bookingId: booking._id,
    customerId: booking.customerId._id,
    bookingAmount,
    commissionRate,
    commissionAmount,
    currency: booking.financial?.currency || 'USD',
    bookingDate: booking.createdAt,
    dueDate,
    status: 'pending',
  });

  console.log('💰 Commission created:', commission._id);

  successResponse(res, 201, 'Commission created successfully', { commission });
});

module.exports = exports;
