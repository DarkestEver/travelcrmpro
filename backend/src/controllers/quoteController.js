const { Quote, Itinerary, Agent, Customer } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination, parseSort } = require('../utils/pagination');
const { sendQuoteEmail } = require('../utils/email');

// Helper function to ensure agent profile exists
const ensureAgentProfile = (req, res) => {
  if (req.user.role === 'agent' && !req.agent) {
    res.status(404).json({
      success: false,
      message: 'Agent profile not found. Please contact administrator.',
    });
    return false;
  }
  return true;
};

// @desc    Get all quotes
// @route   GET /api/v1/quotes
// @access  Private
const getAllQuotes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const sortBy = parseSort(req, '-createdAt');
  const { status, agentId } = req.query;

  // Build query
  const query = {
    tenantId: req.tenantId, // Multi-tenant filter
  };
  if (status) query.status = status;

  // Agents can only see their own quotes
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    query.agentId = req.agent._id;
  } else if (agentId) {
    query.agentId = agentId;
  }

  // Execute query
  const [quotes, total] = await Promise.all([
    Quote.find(query)
      .populate('agentId', 'agencyName contactPerson')
      .populate('customerId', 'name email phone')
      .populate('itineraryId', 'title destination duration')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Quote.countDocuments(query),
  ]);

  paginatedResponse(res, 200, quotes, page, limit, total);
});

// @desc    Get single quote
// @route   GET /api/v1/quotes/:id
// @access  Private
const getQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id)
    .populate('agentId', 'agencyName contactPerson email phone')
    .populate('customerId', 'name email phone passportInfo')
    .populate({
      path: 'itineraryId',
      populate: {
        path: 'days.components.supplierId',
        select: 'companyName serviceTypes',
      },
    });

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  // Check permissions
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    if (quote.agentId._id.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to view this quote', 403);
    }
  }

  // Update status to 'viewed' if it was 'sent'
  if (quote.status === 'sent') {
    quote.status = 'viewed';
    quote.viewedAt = Date.now();
    await quote.save();
  }

  successResponse(res, 200, 'Quote fetched successfully', { quote });
});

// @desc    Create quote
// @route   POST /api/v1/quotes
// @access  Private (agent, operator, super_admin)
const createQuote = asyncHandler(async (req, res) => {
  const {
    itineraryId,
    customerId,
    numberOfTravelers,
    travelDates,
    validUntil,
    pricing,
    notes,
    terms,
  } = req.body;

  let { agentId } = req.body;

  // Agent users automatically use their own agentId
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    agentId = req.agent._id;
  }

  // Verify itinerary exists
  const itinerary = await Itinerary.findById(itineraryId);
  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Verify customer exists
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Verify agent exists
  const agent = await Agent.findById(agentId);
  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  // Check if customer belongs to agent (skip if customer doesn't have an assigned agent yet)
  if (customer.agentId && customer.agentId.toString() !== agentId.toString()) {
    throw new AppError('Customer does not belong to this agent', 400);
  }

  // If customer doesn't have an agent assigned, assign this agent
  if (!customer.agentId) {
    customer.agentId = agentId;
    await customer.save();
  }

  // Calculate pricing if not provided
  const pricingData = pricing || {
    baseCost: itinerary.estimatedCost.baseCost * numberOfTravelers,
    markup: 0,
    agentDiscount: 0,
    taxes: 0,
  };

  // Calculate total price if pricing is provided
  if (pricing && !pricing.totalPrice) {
    const markupAmount = pricing.markup?.amount || 0;
    const taxesAmount = pricing.taxes?.amount || 0;
    const discountAmount = pricing.agentDiscount?.amount || 0;
    pricingData.totalPrice = pricingData.baseCost + markupAmount + taxesAmount - discountAmount;
  } else if (!pricing) {
    // Auto-calculate for simple pricing
    pricingData.totalPrice = pricingData.baseCost + pricingData.markup - pricingData.agentDiscount + pricingData.taxes;
  }

  // Generate quote number
  const count = await Quote.countDocuments({ tenantId: req.tenantId });
  const year = new Date().getFullYear();
  const quoteNumber = `Q${year}-${String(count + 1).padStart(6, '0')}`;

  // Create quote
  const quote = await Quote.create({
    tenantId: req.tenantId,
    quoteNumber,
    itineraryId,
    agentId,
    customerId,
    numberOfTravelers,
    travelDates,
    validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    pricing: pricingData,
    notes,
    terms,
    createdBy: req.user._id, // Add the user who created the quote
  });

  await quote.populate([
    { path: 'agentId', select: 'agencyName contactPerson' },
    { path: 'customerId', select: 'name email phone' },
    { path: 'itineraryId', select: 'title destination duration' },
  ]);

  successResponse(res, 201, 'Quote created successfully', { quote });
});

// @desc    Update quote
// @route   PUT /api/v1/quotes/:id
// @access  Private
const updateQuote = asyncHandler(async (req, res) => {
  let quote = await Quote.findById(req.params.id);

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  // Check permissions
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    if (quote.agentId.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to update this quote', 403);
    }
  }

  // Can't update accepted, rejected, or expired quotes
  if (['accepted', 'rejected', 'expired'].includes(quote.status)) {
    throw new AppError(`Cannot update quote with status: ${quote.status}`, 400);
  }

  // Recalculate total price if pricing components changed
  if (req.body.pricing) {
    const pricing = { ...quote.pricing.toObject(), ...req.body.pricing };
    const markupAmount = pricing.markup?.amount || 0;
    const taxesAmount = pricing.taxes?.amount || 0;
    const discountAmount = pricing.agentDiscount?.amount || 0;
    pricing.totalPrice = pricing.baseCost + markupAmount + taxesAmount - discountAmount;
    req.body.pricing = pricing;
  }

  quote = await Quote.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: 'agentId', select: 'agencyName contactPerson' },
    { path: 'customerId', select: 'name email phone' },
    { path: 'itineraryId', select: 'title destination duration' },
  ]);

  successResponse(res, 200, 'Quote updated successfully', { quote });
});

// @desc    Send quote to customer
// @route   POST /api/v1/quotes/:id/send
// @access  Private
const sendQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id)
    .populate('agentId')
    .populate('customerId')
    .populate('itineraryId');

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  // Check permissions
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    if (quote.agentId._id.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to send this quote', 403);
    }
  }

  // Can only send draft quotes
  if (quote.status !== 'draft') {
    throw new AppError('Only draft quotes can be sent', 400);
  }

  // Send email
  try {
    await sendQuoteEmail(quote, quote.agentId, quote.customerId);
  } catch (error) {
    console.error('Failed to send quote email:', error);
    throw new AppError('Failed to send quote email', 500);
  }

  // Update quote status
  quote.status = 'sent';
  quote.sentAt = Date.now();
  await quote.save();

  successResponse(res, 200, 'Quote sent successfully', { quote });
});

// @desc    Accept quote
// @route   PATCH /api/v1/quotes/:id/accept
// @access  Private
const acceptQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id)
    .populate('agentId')
    .populate('customerId');

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  // Check if quote is expired
  if (new Date() > quote.validUntil) {
    quote.status = 'expired';
    await quote.save();
    throw new AppError('This quote has expired', 400);
  }

  // Can only accept sent or viewed quotes
  // In development/test mode, allow accepting draft quotes for testing
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const validStatuses = isDev ? ['sent', 'viewed', 'draft'] : ['sent', 'viewed'];
  
  if (!validStatuses.includes(quote.status)) {
    throw new AppError('Quote cannot be accepted in its current status', 400);
  }

  quote.status = 'accepted';
  quote.acceptedAt = Date.now();
  await quote.save();

  successResponse(res, 200, 'Quote accepted successfully', { quote });
});

// @desc    Reject quote
// @route   PATCH /api/v1/quotes/:id/reject
// @access  Private
const rejectQuote = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const quote = await Quote.findById(req.params.id)
    .populate('agentId')
    .populate('customerId');

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  // Can only reject sent or viewed quotes
  // In development/test mode, allow rejecting draft quotes for testing
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const validStatuses = isDev ? ['sent', 'viewed', 'draft'] : ['sent', 'viewed'];
  
  if (!validStatuses.includes(quote.status)) {
    throw new AppError('Quote cannot be rejected in its current status', 400);
  }

  quote.status = 'rejected';
  quote.rejectedAt = Date.now();
  if (reason) {
    quote.notes = quote.notes ? `${quote.notes}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`;
  }
  await quote.save();

  successResponse(res, 200, 'Quote rejected successfully', { quote });
});

// @desc    Delete quote
// @route   DELETE /api/v1/quotes/:id
// @access  Private
const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  // Check permissions
  let isOwner = false;
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    isOwner = quote.agentId.toString() === req.agent._id.toString();
  }
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to delete this quote', 403);
  }

  // Can't delete accepted quotes (they might have bookings)
  if (quote.status === 'accepted') {
    throw new AppError('Cannot delete accepted quotes', 400);
  }

  await quote.deleteOne();

  successResponse(res, 200, 'Quote deleted successfully');
});

// @desc    Get quote statistics
// @route   GET /api/v1/quotes/stats
// @access  Private
const getQuoteStats = asyncHandler(async (req, res) => {
  const query = {
    tenantId: req.tenantId, // Multi-tenant filter
  };

  // Agents can only see their own stats
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    query.agentId = req.agent._id;
  } else if (req.query.agentId) {
    query.agentId = req.query.agentId;
  }

  const [total, draft, sent, viewed, accepted, rejected, expired] = await Promise.all([
    Quote.countDocuments(query),
    Quote.countDocuments({ ...query, status: 'draft' }),
    Quote.countDocuments({ ...query, status: 'sent' }),
    Quote.countDocuments({ ...query, status: 'viewed' }),
    Quote.countDocuments({ ...query, status: 'accepted' }),
    Quote.countDocuments({ ...query, status: 'rejected' }),
    Quote.countDocuments({ ...query, status: 'expired' }),
  ]);

  // Calculate conversion rate
  const sentQuotes = sent + viewed + accepted + rejected + expired;
  const conversionRate = sentQuotes > 0 ? (accepted / sentQuotes * 100).toFixed(2) : 0;

  const stats = {
    total,
    byStatus: { draft, sent, viewed, accepted, rejected, expired },
    conversionRate: parseFloat(conversionRate),
  };

  successResponse(res, 200, 'Quote statistics fetched successfully', { stats });
});

module.exports = {
  getAllQuotes,
  getQuote,
  createQuote,
  updateQuote,
  sendQuote,
  acceptQuote,
  rejectQuote,
  deleteQuote,
  getQuoteStats,
};
