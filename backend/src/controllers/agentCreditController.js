const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const creditService = require('../services/creditService');

/**
 * @desc    Get agent's credit status
 * @route   GET /api/v1/agent-portal/credit/status
 * @access  Private (Agent only)
 */
exports.getCreditStatus = asyncHandler(async (req, res) => {
  const agentId = req.user._id;

  console.log('💳 Fetching credit status for agent:', agentId);

  const creditStatus = await creditService.getCreditStatus(agentId);

  console.log('💳 Credit Status:', creditStatus);

  successResponse(res, 200, 'Credit status retrieved successfully', {
    credit: creditStatus,
  });
});

/**
 * @desc    Get credit usage history
 * @route   GET /api/v1/agent-portal/credit/history
 * @access  Private (Agent only)
 */
exports.getCreditHistory = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const { startDate, endDate, limit } = req.query;

  console.log('💳 Fetching credit history for agent:', agentId);

  const history = await creditService.getCreditHistory(agentId, {
    startDate,
    endDate,
    limit: limit ? parseInt(limit) : 50,
  });

  successResponse(res, 200, 'Credit history retrieved successfully', {
    history,
    count: history.length,
  });
});

/**
 * @desc    Check if booking amount is within credit limit
 * @route   POST /api/v1/agent-portal/credit/check
 * @access  Private (Agent only)
 */
exports.checkCredit = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new AppError('Valid amount is required', 400);
  }

  console.log(`💳 Checking credit availability for agent ${agentId}: ${amount}`);

  const result = await creditService.canMakeBooking(agentId, amount);

  successResponse(res, 200, 'Credit check completed', {
    check: result,
  });
});

/**
 * @desc    Request credit limit increase
 * @route   POST /api/v1/agent-portal/credit/request-increase
 * @access  Private (Agent only)
 */
exports.requestCreditIncrease = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const { requestedLimit, reason } = req.body;

  if (!requestedLimit || requestedLimit <= 0) {
    throw new AppError('Valid requested limit is required', 400);
  }

  const currentStatus = await creditService.getCreditStatus(agentId);

  if (requestedLimit <= currentStatus.creditLimit) {
    throw new AppError('Requested limit must be greater than current limit', 400);
  }

  // In a real system, this would create a request ticket for admin approval
  // For now, we'll just return a success message
  console.log(`💳 Credit increase request from agent ${agentId}`);
  console.log(`   Current: ${currentStatus.creditLimit} → Requested: ${requestedLimit}`);
  console.log(`   Reason: ${reason}`);

  successResponse(res, 200, 'Credit increase request submitted successfully', {
    request: {
      currentLimit: currentStatus.creditLimit,
      requestedLimit,
      reason,
      status: 'pending',
      message: 'Your request has been submitted for admin review',
    },
  });
});

module.exports = exports;
