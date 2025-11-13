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

  // Try ShareToken first (new system)
  try {
    const shareToken = await shareService.getTokenWithEntity(token, password);

    if (shareToken.entityType !== 'Itinerary') {
      throw new AppError('Invalid share link for itinerary', 400);
    }

    const itinerary = await Itinerary.findById(shareToken.entityId).lean();

    if (!itinerary) {
      throw new AppError('Itinerary not found', 404);
    }

    return successResponse(res, 200, 'Itinerary retrieved successfully', {
      itinerary,
      tenant: shareToken.tenantId,
      shareMetadata: {
        allowedActions: shareToken.metadata.allowedActions,
        customMessage: shareToken.metadata.customMessage
      }
    });
  } catch (shareTokenError) {
    // If ShareToken not found, try embedded shareableLink (old system)
    if (shareTokenError.statusCode !== 404) {
      throw shareTokenError; // Re-throw if it's not a "not found" error
    }

    // Fallback to old embedded shareableLink system
    const itinerary = await Itinerary.findOne({ 'shareableLink.token': token })
      .populate('createdBy', 'name email')
      .populate('days.components.supplierId', 'companyName');

    if (!itinerary) {
      throw new AppError('Share link not found', 404);
    }

    // Check if link expired
    if (itinerary.shareableLink.expiresAt < new Date()) {
      throw new AppError('Share link has expired', 403);
    }

    // Check for single-use link already accessed
    if (itinerary.shareableLink.singleUse && itinerary.shareableLink.accessCount > 0) {
      throw new AppError('This share link has already been used', 403);
    }

    // Check password if required
    if (itinerary.shareableLink.password) {
      if (!password) {
        return res.status(401).json({
          success: false,
          message: 'Password required to access this itinerary'
        });
      }
      
      const crypto = require('crypto');
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      
      if (hashedPassword !== itinerary.shareableLink.password) {
        throw new AppError('Incorrect password', 401);
      }
    }

    // Track first access for single-use links
    if (itinerary.shareableLink.singleUse && !itinerary.shareableLink.firstAccessedAt) {
      itinerary.shareableLink.firstAccessedAt = new Date();
    }

    // Increment view count and access count
    itinerary.shareableLink.views = (itinerary.shareableLink.views || 0) + 1;
    itinerary.shareableLink.accessCount = (itinerary.shareableLink.accessCount || 0) + 1;
    itinerary.viewCount = (itinerary.viewCount || 0) + 1;
    itinerary.lastViewedAt = new Date();

    // Deactivate single-use link after first access
    if (itinerary.shareableLink.singleUse) {
      itinerary.shareableLink.isActive = false;
    }

    await itinerary.save();

    return successResponse(res, 200, 'Itinerary retrieved successfully', {
      itinerary,
      shareMetadata: {
        allowedActions: ['view', 'download'],
        customMessage: null
      }
    });
  }
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

/**
 * @desc    Lookup email conversation by tracking ID (Public)
 * @route   GET /api/v1/public/tracking/:trackingId
 * @access  Public
 */
const lookupByTrackingId = asyncHandler(async (req, res) => {
  const EmailLog = require('../models/EmailLog');
  const { trackingId } = req.params;

  // Validate tracking ID format: PREFIX-HASH5-SEQUENCE6
  const trackingIdPattern = /^[A-Z]{2,10}-[A-Z0-9]{5}-\d{6}$/;
  if (!trackingIdPattern.test(trackingId)) {
    throw new AppError('Invalid tracking ID format', 400);
  }

  // Find the email by tracking ID
  const email = await EmailLog.findOne({ trackingId })
    .select('trackingId subject from to createdAt direction status threadMetadata')
    .lean();

  if (!email) {
    throw new AppError('No conversation found with this tracking ID', 404);
  }

  // Find all related emails in the conversation
  let conversationEmails = [];
  
  if (email.threadMetadata && email.threadMetadata.threadId) {
    // Find all emails in the same thread
    conversationEmails = await EmailLog.find({
      'threadMetadata.threadId': email.threadMetadata.threadId
    })
      .select('trackingId subject from to createdAt direction status bodyText bodyHtml')
      .sort({ createdAt: 1 })
      .lean();
  } else {
    // If no thread, just return this email
    const fullEmail = await EmailLog.findOne({ trackingId })
      .select('trackingId subject from to createdAt direction status bodyText bodyHtml')
      .lean();
    conversationEmails = [fullEmail];
  }

  // Sanitize email bodies (remove sensitive info, truncate)
  const sanitizedEmails = conversationEmails.map(email => ({
    trackingId: email.trackingId,
    subject: email.subject,
    from: email.from?.email ? {
      name: email.from.name || 'Unknown',
      email: email.from.email
    } : null,
    to: email.to?.[0]?.email ? {
      name: email.to[0].name || 'Unknown',
      email: email.to[0].email
    } : null,
    createdAt: email.createdAt,
    direction: email.direction,
    status: email.status,
    // Truncate body to first 500 chars for preview
    bodyPreview: email.bodyText 
      ? email.bodyText.substring(0, 500) + (email.bodyText.length > 500 ? '...' : '')
      : email.bodyHtml 
        ? email.bodyHtml.replace(/<[^>]*>/g, '').substring(0, 500) + '...'
        : 'No content'
  }));

  // Calculate conversation metadata
  const conversationMeta = {
    trackingId,
    emailCount: sanitizedEmails.length,
    firstEmailDate: sanitizedEmails[0].createdAt,
    lastEmailDate: sanitizedEmails[sanitizedEmails.length - 1].createdAt,
    status: sanitizedEmails[sanitizedEmails.length - 1].status,
    participants: {
      customer: sanitizedEmails.find(e => e.direction === 'inbound')?.from || 
                sanitizedEmails.find(e => e.direction === 'outbound')?.to,
      agent: sanitizedEmails.find(e => e.direction === 'outbound')?.from ||
             sanitizedEmails.find(e => e.direction === 'inbound')?.to
    }
  };

  successResponse(res, 200, 'Conversation found', {
    conversation: conversationMeta,
    emails: sanitizedEmails
  });
});

/**
 * @desc    Search for tracking ID (Public - for autocomplete)
 * @route   GET /api/v1/public/tracking/search/:query
 * @access  Public
 */
const searchTrackingIds = asyncHandler(async (req, res) => {
  const EmailLog = require('../models/EmailLog');
  const { query } = req.params;

  // Basic validation
  if (!query || query.length < 3) {
    throw new AppError('Search query must be at least 3 characters', 400);
  }

  // Search for tracking IDs that start with the query
  const emails = await EmailLog.find({
    trackingId: { $regex: `^${query}`, $options: 'i' }
  })
    .select('trackingId subject createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const results = emails.map(email => ({
    trackingId: email.trackingId,
    subject: email.subject,
    date: email.createdAt
  }));

  successResponse(res, 200, 'Search results', { results });
});

module.exports = {
  viewSharedBooking,
  viewSharedQuote,
  viewSharedItinerary,
  acceptSharedQuote,
  rejectSharedQuote,
  lookupByTrackingId,
  searchTrackingIds
};
