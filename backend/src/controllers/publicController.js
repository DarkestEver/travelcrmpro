const shareService = require('../services/shareService');
const Booking = require('../models/Booking');
const Quote = require('../models/Quote');
const Itinerary = require('../models/Itinerary');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');

/**
 * @desc    View shared booking
 * @route   GET /api/v1/public/bookings/:token
 * @access  Public
 */
const viewSharedBooking = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.query;

  const shareToken = await shareService.getTokenWithEntity(token, password);

  if (shareToken.entityType !== 'Booking') {
    throw new AppError('Invalid share link for booking', 400);
  }

  const booking = await Booking.findById(shareToken.entityId)
    .populate('customerId', 'name email phone')
    .populate('itineraryId')
    .lean();

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  successResponse(res, 200, 'Booking retrieved successfully', {
    booking,
    tenant: shareToken.tenantId,
    shareMetadata: {
      allowedActions: shareToken.metadata.allowedActions,
      customMessage: shareToken.metadata.customMessage
    }
  });
});

/**
 * @desc    View shared quote
 * @route   GET /api/v1/public/quotes/:token
 * @access  Public
 */
const viewSharedQuote = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.query;

  const shareToken = await shareService.getTokenWithEntity(token, password);

  if (shareToken.entityType !== 'Quote') {
    throw new AppError('Invalid share link for quote', 400);
  }

  const quote = await Quote.findById(shareToken.entityId)
    .populate('customerId', 'name email phone')
    .populate('itineraryId')
    .lean();

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  successResponse(res, 200, 'Quote retrieved successfully', {
    quote,
    tenant: shareToken.tenantId,
    shareMetadata: {
      allowedActions: shareToken.metadata.allowedActions,
      customMessage: shareToken.metadata.customMessage
    }
  });
});

/**
 * @desc    View shared itinerary
 * @route   GET /api/v1/public/itineraries/:token
 * @access  Public
 */
const viewSharedItinerary = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.query;

  const shareToken = await shareService.getTokenWithEntity(token, password);

  if (shareToken.entityType !== 'Itinerary') {
    throw new AppError('Invalid share link for itinerary', 400);
  }

  const itinerary = await Itinerary.findById(shareToken.entityId).lean();

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  successResponse(res, 200, 'Itinerary retrieved successfully', {
    itinerary,
    tenant: shareToken.tenantId,
    shareMetadata: {
      allowedActions: shareToken.metadata.allowedActions,
      customMessage: shareToken.metadata.customMessage
    }
  });
});

/**
 * @desc    Accept shared quote
 * @route   POST /api/v1/public/quotes/:token/accept
 * @access  Public
 */
const acceptSharedQuote = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, email, name, comments } = req.body;

  const shareToken = await shareService.validateToken(token, password);

  if (shareToken.entityType !== 'Quote') {
    throw new AppError('Invalid share link for quote', 400);
  }

  // Check if accept action is allowed
  if (!shareToken.metadata.allowedActions.includes('accept')) {
    throw new AppError('Accept action is not allowed for this share link', 403);
  }

  // Require email if configured
  if (shareToken.metadata.requireEmail && !email) {
    throw new AppError('Email is required to accept this quote', 400);
  }

  const quote = await Quote.findById(shareToken.entityId);

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  // Update quote status
  quote.status = 'accepted';
  quote.acceptedAt = new Date();
  quote.acceptedBy = { email, name };
  if (comments) {
    quote.customerComments = comments;
  }
  await quote.save();

  successResponse(res, 200, 'Quote accepted successfully', { quote });
});

/**
 * @desc    Reject shared quote
 * @route   POST /api/v1/public/quotes/:token/reject
 * @access  Public
 */
const rejectSharedQuote = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, email, reason } = req.body;

  const shareToken = await shareService.validateToken(token, password);

  if (shareToken.entityType !== 'Quote') {
    throw new AppError('Invalid share link for quote', 400);
  }

  if (!shareToken.metadata.allowedActions.includes('reject')) {
    throw new AppError('Reject action is not allowed for this share link', 403);
  }

  const quote = await Quote.findById(shareToken.entityId);

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  quote.status = 'rejected';
  quote.rejectedAt = new Date();
  quote.rejectedBy = { email };
  quote.rejectionReason = reason;
  await quote.save();

  successResponse(res, 200, 'Quote rejected', { quote });
});

module.exports = {
  viewSharedBooking,
  viewSharedQuote,
  viewSharedItinerary,
  acceptSharedQuote,
  rejectSharedQuote
};
