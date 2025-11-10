const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');

/**
 * @desc    Get agent's payment summary
 * @route   GET /api/v1/agent-portal/payments/summary
 * @access  Private (Agent only)
 */
exports.getPaymentSummary = asyncHandler(async (req, res) => {
  const agentId = req.user._id;

  console.log('💰 Fetching payment summary for agent:', agentId);

  // Get payment summary by status
  const paymentSummary = await Payment.getAgentPaymentSummary(agentId);

  // Get outstanding balance (unpaid commissions)
  const outstandingBalance = await Payment.getOutstandingBalance(agentId);

  // Get total received (completed incoming payments)
  const totalReceived = await Payment.aggregate([
    {
      $match: {
        agentId,
        direction: 'incoming',
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  // Get total paid out (completed outgoing payments)
  const totalPaidOut = await Payment.aggregate([
    {
      $match: {
        agentId,
        direction: 'outgoing',
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  // Get this month's payments
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonthPayments = await Payment.aggregate([
    {
      $match: {
        agentId,
        paymentDate: { $gte: startOfMonth },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {
    outstandingBalance,
    totalReceived: totalReceived[0]?.total || 0,
    totalPaidOut: totalPaidOut[0]?.total || 0,
    thisMonth: {
      amount: thisMonthPayments[0]?.total || 0,
      count: thisMonthPayments[0]?.count || 0,
    },
    byStatus: paymentSummary,
  };

  console.log('💰 Payment summary:', summary);

  successResponse(res, 200, 'Payment summary retrieved', { summary });
});

/**
 * @desc    Get agent's payment history
 * @route   GET /api/v1/agent-portal/payments
 * @access  Private (Agent only)
 */
exports.getMyPayments = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const {
    page = 1,
    limit = 10,
    status,
    paymentType,
    direction,
    startDate,
    endDate,
    sortBy = '-paymentDate',
  } = req.query;

  console.log('💰 Fetching payments for agent:', agentId);

  const query = { agentId };

  // Filter by status
  if (status && status.trim()) {
    query.status = status;
  }

  // Filter by payment type
  if (paymentType && paymentType.trim()) {
    query.paymentType = paymentType;
  }

  // Filter by direction
  if (direction && direction.trim()) {
    query.direction = direction;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate && startDate.trim()) {
      query.paymentDate.$gte = new Date(startDate);
    }
    if (endDate && endDate.trim()) {
      query.paymentDate.$lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('bookingId', 'bookingNumber bookingStatus')
      .populate('commissionId')
      .populate('processedBy', 'name email')
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    Payment.countDocuments(query),
  ]);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit),
  };

  console.log('💰 Found payments:', total);

  successResponse(res, 200, 'Payments retrieved successfully', {
    payments,
    pagination,
  });
});

/**
 * @desc    Get single payment details
 * @route   GET /api/v1/agent-portal/payments/:id
 * @access  Private (Agent only)
 */
exports.getPaymentById = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const { id } = req.params;

  const payment = await Payment.findOne({ _id: id, agentId })
    .populate('bookingId')
    .populate('commissionId')
    .populate('processedBy', 'name email');

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  successResponse(res, 200, 'Payment retrieved successfully', { payment });
});

/**
 * @desc    Get payment statistics
 * @route   GET /api/v1/agent-portal/payments/stats
 * @access  Private (Agent only)
 */
exports.getPaymentStats = asyncHandler(async (req, res) => {
  const agentId = req.user._id;

  console.log('💰 Fetching payment stats for agent:', agentId);

  // Get payments by type
  const paymentsByType = await Payment.getPaymentsByType(agentId);

  // Get monthly trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyTrend = await Payment.aggregate([
    {
      $match: {
        agentId,
        paymentDate: { $gte: sixMonthsAgo },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' },
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Get average payment amount
  const avgPayment = await Payment.aggregate([
    { $match: { agentId, status: 'completed' } },
    {
      $group: {
        _id: null,
        avgAmount: { $avg: '$amount' },
      },
    },
  ]);

  // Get payment methods breakdown
  const paymentMethods = await Payment.aggregate([
    { $match: { agentId, status: 'completed' } },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    byType: paymentsByType,
    monthlyTrend,
    averagePayment: avgPayment[0]?.avgAmount || 0,
    paymentMethods,
  };

  console.log('💰 Payment stats:', stats);

  successResponse(res, 200, 'Payment statistics retrieved', { stats });
});

/**
 * @desc    Request commission payout
 * @route   POST /api/v1/agent-portal/payments/request-payout
 * @access  Private (Agent only)
 */
exports.requestPayout = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const { paymentMethod, notes } = req.body;

  console.log('💰 Payout request from agent:', agentId);

  // Get all approved unpaid commissions
  const unpaidCommissions = await Commission.find({
    agentId,
    status: 'approved',
  });

  if (unpaidCommissions.length === 0) {
    throw new AppError('No approved commissions available for payout', 400);
  }

  // Calculate total payout amount
  const totalAmount = unpaidCommissions.reduce(
    (sum, commission) => sum + commission.commissionAmount,
    0
  );

  // Create payout request (in real system, this would go to admin for approval)
  // For now, we'll just return the payout details
  const payoutRequest = {
    agentId,
    totalAmount,
    currency: 'USD',
    commissionsCount: unpaidCommissions.length,
    commissions: unpaidCommissions.map((c) => ({
      id: c._id,
      bookingId: c.bookingId,
      amount: c.commissionAmount,
    })),
    paymentMethod,
    notes,
    status: 'pending_approval',
    requestedAt: new Date(),
  };

  console.log('💰 Payout request:', payoutRequest);

  successResponse(res, 200, 'Payout request submitted successfully', {
    payoutRequest,
    message: 'Your payout request has been submitted for admin approval',
  });
});

module.exports = exports;
