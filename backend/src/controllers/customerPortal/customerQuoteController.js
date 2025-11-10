/**
 * Customer Portal Quote Controller
 * Handles customer quote requests and tracking
 */

const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/response');
const Quote = require('../../models/Quote');

/**
 * @desc    Submit new quote request
 * @route   POST /api/v1/customer/quotes/request
 * @access  Private (Customer)
 */
exports.submitQuoteRequest = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;
  const agentId = req.user.agentId; // Customer's assigned agent

  const {
    destination,
    startDate,
    endDate,
    numberOfTravelers,
    budget,
    accommodationType,
    transportationType,
    specialRequests,
    preferences,
  } = req.body;

  // Validation
  if (!destination || !startDate || !numberOfTravelers) {
    throw new AppError('Destination, start date, and number of travelers are required', 400);
  }

  // Generate quote number
  const quoteCount = await Quote.countDocuments({ tenantId });
  const quoteNumber = `QT-${Date.now()}-${quoteCount + 1}`;

  // Create quote
  const quote = await Quote.create({
    quoteNumber,
    customerId,
    agentId: agentId || undefined, // Assign to customer's agent if exists
    tenantId,
    destination,
    travelDates: {
      startDate,
      endDate: endDate || startDate,
    },
    numberOfTravelers,
    budget: {
      min: budget?.min || 0,
      max: budget?.max || 0,
      currency: budget?.currency || 'USD',
    },
    accommodationType,
    transportationType,
    specialRequests,
    preferences: {
      dietaryRestrictions: preferences?.dietaryRestrictions || [],
      interests: preferences?.interests || [],
      accessibility: preferences?.accessibility || [],
    },
    status: 'pending',
  });

  // TODO: Send notification to agent
  // await createNotification({
  //   type: 'new_quote_request',
  //   recipientId: agentId,
  //   data: { quoteId: quote._id, quoteNumber: quote.quoteNumber }
  // });

  successResponse(res, 201, 'Quote request submitted successfully', {
    quote,
  });
});

/**
 * @desc    Get all quotes for customer
 * @route   GET /api/v1/customer/quotes
 * @access  Private (Customer)
 */
exports.getQuotes = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;
  
  const {
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  // Build query
  const query = { customerId, tenantId };

  if (status) {
    query.status = status;
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [quotes, total] = await Promise.all([
    Quote.find(query)
      .populate('agentId', 'agencyName contactPerson email phone')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Quote.countDocuments(query),
  ]);

  successResponse(res, 200, 'Quotes retrieved successfully', {
    quotes,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get quote details by ID
 * @route   GET /api/v1/customer/quotes/:id
 * @access  Private (Customer)
 */
exports.getQuoteById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const quote = await Quote.findOne({
    _id: id,
    customerId,
    tenantId,
  })
    .populate('agentId', 'agencyName contactPerson email phone')
    .populate('itineraryId', 'title destination startDate endDate duration')
    .lean();

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  successResponse(res, 200, 'Quote details retrieved', {
    quote,
  });
});

/**
 * @desc    Accept quote
 * @route   POST /api/v1/customer/quotes/:id/accept
 * @access  Private (Customer)
 */
exports.acceptQuote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const quote = await Quote.findOne({
    _id: id,
    customerId,
    tenantId,
  });

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  if (quote.status !== 'sent') {
    throw new AppError('Only sent quotes can be accepted', 400);
  }

  quote.status = 'accepted';
  quote.acceptedAt = Date.now();
  await quote.save();

  // TODO: Send notification to agent
  // await createNotification({
  //   type: 'quote_accepted',
  //   recipientId: quote.agentId,
  //   data: { quoteId: quote._id, quoteNumber: quote.quoteNumber }
  // });

  successResponse(res, 200, 'Quote accepted successfully', {
    quote,
  });
});

/**
 * @desc    Decline quote
 * @route   POST /api/v1/customer/quotes/:id/decline
 * @access  Private (Customer)
 */
exports.declineQuote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const quote = await Quote.findOne({
    _id: id,
    customerId,
    tenantId,
  });

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  if (quote.status !== 'sent') {
    throw new AppError('Only sent quotes can be declined', 400);
  }

  quote.status = 'rejected';
  quote.rejectedAt = Date.now();
  quote.rejectionReason = reason;
  await quote.save();

  successResponse(res, 200, 'Quote declined', {
    quote,
  });
});

module.exports = exports;
