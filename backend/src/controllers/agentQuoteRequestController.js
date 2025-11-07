const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const QuoteRequest = require('../models/QuoteRequest');
const Customer = require('../models/Customer');

/**
 * @desc    Submit a new quote request
 * @route   POST /api/v1/agent-portal/quote-requests
 * @access  Private (Agent only)
 */
exports.submitQuoteRequest = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  const {
    customerId,
    destination,
    travelDates,
    travelers,
    budget,
    preferences,
    inspirationNotes,
  } = req.body;

  // Verify customer belongs to agent
  const customer = await Customer.findOne({ _id: customerId, agentId, tenantId });
  if (!customer) {
    throw new AppError('Customer not found or does not belong to you', 404);
  }

  // Create quote request
  const quoteRequest = await QuoteRequest.create({
    tenantId,
    agentId,
    customerId,
    destination,
    travelDates,
    travelers,
    budget,
    preferences,
    inspirationNotes,
    status: 'pending',
  });

  // Populate customer details
  await quoteRequest.populate('customerId', 'firstName lastName email');

  successResponse(res, 201, 'Quote request submitted successfully', {
    quoteRequest,
  });
});

/**
 * @desc    Get all quote requests for the agent
 * @route   GET /api/v1/agent-portal/quote-requests
 * @access  Private (Agent only)
 */
exports.getMyQuoteRequests = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  const {
    page = 1,
    limit = 10,
    status,
    search,
    sortBy = '-createdAt',
  } = req.query;

  const query = { agentId, tenantId };

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Search by customer name or destination
  if (search) {
    const customers = await Customer.find({
      agentId,
      tenantId,
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');

    query.$or = [
      { customerId: { $in: customers.map((c) => c._id) } },
      { 'destination.country': { $regex: search, $options: 'i' } },
      { 'destination.city': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [quoteRequests, total] = await Promise.all([
    QuoteRequest.find(query)
      .populate('customerId', 'firstName lastName email phone')
      .populate('quoteItineraryId', 'title totalPrice')
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    QuoteRequest.countDocuments(query),
  ]);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit),
  };

  successResponse(res, 200, 'Quote requests retrieved successfully', {
    quoteRequests,
    pagination,
  });
});

/**
 * @desc    Get single quote request details
 * @route   GET /api/v1/agent-portal/quote-requests/:id
 * @access  Private (Agent only)
 */
exports.getQuoteRequestById = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;

  const quoteRequest = await QuoteRequest.findOne({
    _id: id,
    agentId,
    tenantId,
  })
    .populate('customerId', 'firstName lastName email phone address city country')
    .populate('quoteItineraryId')
    .populate('assignedSuppliers.supplierId', 'name email');

  if (!quoteRequest) {
    throw new AppError('Quote request not found', 404);
  }

  successResponse(res, 200, 'Quote request retrieved successfully', {
    quoteRequest,
  });
});

/**
 * @desc    Accept a quote
 * @route   PUT /api/v1/agent-portal/quote-requests/:id/accept
 * @access  Private (Agent only)
 */
exports.acceptQuote = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;

  const quoteRequest = await QuoteRequest.findOne({
    _id: id,
    agentId,
    tenantId,
  });

  if (!quoteRequest) {
    throw new AppError('Quote request not found', 404);
  }

  // Validate status
  if (quoteRequest.status !== 'quoted') {
    throw new AppError(
      `Cannot accept quote with status '${quoteRequest.status}'. Quote must be in 'quoted' status.`,
      400
    );
  }

  // Check if quote has not expired
  if (quoteRequest.quoteValidUntil && new Date() > quoteRequest.quoteValidUntil) {
    throw new AppError('This quote has expired', 400);
  }

  // Update status
  quoteRequest.status = 'accepted';
  quoteRequest.statusHistory.push({
    status: 'accepted',
    updatedBy: agentId,
    comment: 'Quote accepted by agent',
  });

  await quoteRequest.save();

  // Populate for response
  await quoteRequest.populate('customerId', 'firstName lastName email');
  await quoteRequest.populate('quoteItineraryId', 'title totalPrice');

  successResponse(res, 200, 'Quote accepted successfully', {
    quoteRequest,
  });
});

/**
 * @desc    Reject a quote
 * @route   PUT /api/v1/agent-portal/quote-requests/:id/reject
 * @access  Private (Agent only)
 */
exports.rejectQuote = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const { reason } = req.body;

  const quoteRequest = await QuoteRequest.findOne({
    _id: id,
    agentId,
    tenantId,
  });

  if (!quoteRequest) {
    throw new AppError('Quote request not found', 404);
  }

  // Validate status
  if (quoteRequest.status !== 'quoted') {
    throw new AppError(
      `Cannot reject quote with status '${quoteRequest.status}'. Quote must be in 'quoted' status.`,
      400
    );
  }

  // Update status
  quoteRequest.status = 'rejected';
  quoteRequest.statusHistory.push({
    status: 'rejected',
    updatedBy: agentId,
    comment: reason || 'Quote rejected by agent',
  });

  await quoteRequest.save();

  // Populate for response
  await quoteRequest.populate('customerId', 'firstName lastName email');
  await quoteRequest.populate('quoteItineraryId', 'title totalPrice');

  successResponse(res, 200, 'Quote rejected', {
    quoteRequest,
  });
});

/**
 * @desc    Cancel a quote request (before it's quoted)
 * @route   DELETE /api/v1/agent-portal/quote-requests/:id
 * @access  Private (Agent only)
 */
exports.cancelQuoteRequest = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const { reason } = req.body;

  const quoteRequest = await QuoteRequest.findOne({
    _id: id,
    agentId,
    tenantId,
  });

  if (!quoteRequest) {
    throw new AppError('Quote request not found', 404);
  }

  // Can only cancel pending or reviewing requests
  if (!['pending', 'reviewing'].includes(quoteRequest.status)) {
    throw new AppError(
      `Cannot cancel quote request with status '${quoteRequest.status}'`,
      400
    );
  }

  // Update status instead of deleting
  quoteRequest.status = 'cancelled';
  quoteRequest.statusHistory.push({
    status: 'cancelled',
    updatedBy: agentId,
    comment: reason || 'Cancelled by agent',
  });

  await quoteRequest.save();

  successResponse(res, 200, 'Quote request cancelled', {
    quoteRequest,
  });
});

/**
 * @desc    Get quote request statistics
 * @route   GET /api/v1/agent-portal/quote-requests/stats
 * @access  Private (Agent only)
 */
exports.getQuoteRequestStats = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  const [statusBreakdown, totalRequests, recentRequests] = await Promise.all([
    // Status breakdown
    QuoteRequest.aggregate([
      { $match: { agentId, tenantId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Total requests
    QuoteRequest.countDocuments({ agentId, tenantId }),

    // Recent requests (last 30 days)
    QuoteRequest.countDocuments({
      agentId,
      tenantId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  const stats = {
    total: totalRequests,
    recent: recentRequests,
    byStatus: statusBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };

  successResponse(res, 200, 'Quote request statistics retrieved', { stats });
});
