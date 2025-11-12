const { Quote, Itinerary, Agent, Customer } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination, parseSort } = require('../utils/pagination');

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

// @desc    Create quote from email match
// @route   POST /api/v1/quotes/from-email
// @access  Private
const createQuoteFromEmail = asyncHandler(async (req, res) => {
  const { 
    emailId, 
    matchedItineraryIds, 
    includePdfAttachment = false,
    customPricing 
  } = req.body;

  // Get email with extracted data
  const EmailLog = require('../models/EmailLog');
  const email = await EmailLog.findById(emailId);
  
  if (!email) {
    throw new AppError('Email not found', 404);
  }

  if (!email.extractedData) {
    throw new AppError('No extracted data found in email', 400);
  }

  const extractedData = email.extractedData;

  // Fetch matched itineraries
  const itineraries = await Itinerary.find({
    _id: { $in: matchedItineraryIds },
    tenantId: req.tenantId
  });

  if (itineraries.length === 0) {
    throw new AppError('No itineraries found', 404);
  }

  // Calculate total pricing
  let totalBaseCost = 0;
  itineraries.forEach(itinerary => {
    totalBaseCost += itinerary.estimatedCost?.baseCost || itinerary.estimatedCost?.totalCost || 0;
  });

  // Apply custom pricing if provided
  const baseCost = customPricing?.baseCost || totalBaseCost;
  const markup = customPricing?.markup || { percentage: 15, amount: baseCost * 0.15 };
  const totalPrice = baseCost + markup.amount;

  // Generate quote number
  const count = await Quote.countDocuments({ tenantId: req.tenantId });
  const year = new Date().getFullYear();
  const quoteNumber = `Q${year}-${String(count + 1).padStart(6, '0')}`;

  // Create quote
  const quote = await Quote.create({
    tenantId: req.tenantId,
    quoteNumber,
    itineraryId: itineraries[0]._id, // Primary itinerary
    matchedItineraries: matchedItineraryIds,
    
    // Customer details from email
    customerName: extractedData.customerInfo?.name || email.from.name,
    customerEmail: email.from.email,
    customerPhone: extractedData.customerInfo?.phone,
    
    // Travel details
    destination: extractedData.destination,
    additionalDestinations: extractedData.additionalDestinations,
    startDate: extractedData.dates?.preferredStart,
    endDate: extractedData.dates?.preferredEnd,
    duration: extractedData.dates?.duration,
    
    // Travelers
    adults: extractedData.travelers?.adults || 1,
    children: extractedData.travelers?.children || 0,
    childAges: extractedData.travelers?.childAges || [],
    infants: extractedData.travelers?.infants || 0,
    
    // Package details
    packageType: extractedData.packageType,
    mealPlan: extractedData.mealPlan,
    activities: extractedData.activities || [],
    specialRequirements: extractedData.specialRequirements || [],
    
    // Budget
    estimatedBudget: extractedData.budget?.amount,
    currency: extractedData.budget?.currency || 'USD',
    
    // Source tracking
    source: 'email',
    emailId: emailId,
    extractionConfidence: extractedData.confidence,
    dataCompleteness: extractedData.completeness,
    missingFields: extractedData.missingFields || [],
    
    // Pricing
    pricing: {
      baseCost,
      markup,
      totalPrice,
      currency: extractedData.budget?.currency || 'USD'
    },
    
    // Validity (30 days default)
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    
    status: 'draft',
    createdBy: req.user._id
  });

  // Update email with quote reference
  email.quotesGenerated = email.quotesGenerated || [];
  email.quotesGenerated.push({
    quoteId: quote._id,
    quoteNumber: quote.quoteNumber,
    status: 'draft',
    totalPrice: quote.pricing.totalPrice,
    currency: quote.pricing.currency,
    includedItineraries: itineraries.map(it => ({
      itineraryId: it._id,
      title: it.title
    })),
    includePdfAttachment,
    sentBy: req.user._id,
    createdAt: new Date()
  });
  
  if (!email.linkedQuote) {
    email.linkedQuote = quote._id;
  }
  
  await email.save();

  // Populate for response
  await quote.populate('itineraryId', 'title destination duration estimatedCost');

  successResponse(res, 201, 'Quote created successfully from email', { quote });
});

// @desc    Send multiple quotes in a single email
// @route   POST /api/v1/quotes/send-multiple
// @access  Private (Operator, Admin, Super Admin)
const sendMultipleQuotes = asyncHandler(async (req, res) => {
  const { quoteIds, emailId, message } = req.body;

  if (!quoteIds || quoteIds.length === 0) {
    throw new AppError('Please provide at least one quote to send', 400);
  }

  // Fetch all quotes
  const quotes = await Quote.find({
    _id: { $in: quoteIds },
    tenantId: req.tenantId
  }).populate('itineraryId', 'title destination duration estimatedCost themes inclusions');

  if (quotes.length === 0) {
    throw new AppError('No quotes found', 404);
  }

  // Validate all quotes have the same customer email
  const customerEmail = quotes[0].customerEmail;
  const allSameCustomer = quotes.every(q => q.customerEmail === customerEmail);
  
  if (!allSameCustomer) {
    throw new AppError('All quotes must be for the same customer', 400);
  }

  // Get email log if provided
  const EmailLog = require('../models/EmailLog');
  let email = null;
  if (emailId) {
    email = await EmailLog.findById(emailId);
  }

  // Prepare email content with all quotes
  const emailSubject = `Travel Packages - ${quotes.length} Quote${quotes.length > 1 ? 's' : ''} for Your Trip`;
  
  let emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Your Travel Quote${quotes.length > 1 ? 's' : ''}</h2>
      <p>Dear ${quotes[0].customerName || 'Valued Customer'},</p>
      ${message ? `<p>${message}</p>` : '<p>Thank you for your inquiry! We have prepared the following package options for you:</p>'}
      
      <div style="margin: 20px 0;">
  `;

  // Add each quote details
  quotes.forEach((quote, index) => {
    const itinerary = quote.itineraryId;
    emailBody += `
      <div style="border: 2px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #F9FAFB;">
        <h3 style="color: #1F2937; margin-top: 0;">Option ${index + 1}: ${itinerary?.title || 'Custom Package'}</h3>
        <p style="color: #6B7280; margin: 8px 0;">Quote Number: <strong>${quote.quoteNumber}</strong></p>
        
        <div style="margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>📍 Destination:</strong> ${quote.destination || itinerary?.destination || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>📅 Duration:</strong> ${quote.duration || itinerary?.duration || 'N/A'} days</p>
          <p style="margin: 5px 0;"><strong>👥 Travelers:</strong> ${quote.adults || 0} Adult(s)${quote.children > 0 ? `, ${quote.children} Child(ren)` : ''}</p>
          ${quote.packageType ? `<p style="margin: 5px 0;"><strong>📦 Package Type:</strong> ${quote.packageType}</p>` : ''}
          ${quote.mealPlan ? `<p style="margin: 5px 0;"><strong>🍽️ Meal Plan:</strong> ${quote.mealPlan}</p>` : ''}
        </div>
        
        ${itinerary?.inclusions?.length ? `
          <div style="margin: 15px 0;">
            <strong>✅ Inclusions:</strong>
            <ul style="margin: 5px 0; padding-left: 20px;">
              ${itinerary.inclusions.map(inc => `<li>${inc}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div style="background: #4F46E5; color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
          <p style="margin: 0; font-size: 18px;"><strong>Total Price: ${quote.pricing?.currency || 'USD'} ${quote.pricing?.totalPrice?.toLocaleString() || 'N/A'}</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Valid until: ${new Date(quote.validUntil).toLocaleDateString()}</p>
        </div>
        
        ${quote.pdfUrl ? `
          <p style="margin-top: 15px;">
            <a href="${quote.pdfUrl}" style="color: #4F46E5; text-decoration: none;">📄 Download Detailed Itinerary PDF</a>
          </p>
        ` : ''}
      </div>
    `;
  });

  emailBody += `
      </div>
      
      <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <h4 style="margin-top: 0; color: #1F2937;">Next Steps:</h4>
        <ol style="color: #4B5563; line-height: 1.8;">
          <li>Review all the package options above</li>
          <li>Reply to this email with your preferred option</li>
          <li>We'll confirm availability and proceed with booking</li>
        </ol>
      </div>
      
      <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
        If you have any questions or would like to customize any package, please don't hesitate to reach out!
      </p>
      
      <p style="margin-top: 20px; color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 15px;">
        This quote is valid for 30 days from the date of issue. Terms and conditions apply.
      </p>
    </div>
  `;

  // Send email using your email service
  try {
    const { sendEmail } = require('../utils/email');
    console.log('📧 Attempting to send email to:', customerEmail);
    console.log('📧 Email subject:', emailSubject);
    
    await sendEmail({
      to: customerEmail,
      subject: emailSubject,
      html: emailBody
    });
    
    console.log('✅ Email sent successfully');
  } catch (emailError) {
    console.error('❌ Failed to send email:', emailError);
    console.error('Error details:', {
      message: emailError.message,
      stack: emailError.stack,
      to: customerEmail
    });
    
    // In development, don't fail the request if email fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Development mode: Continuing despite email error');
    } else {
      throw new AppError('Failed to send email. Please try again.', 500);
    }
  }

  // Update all quotes status to 'sent'
  const sentAt = new Date();
  await Quote.updateMany(
    { _id: { $in: quoteIds } },
    { 
      $set: { 
        status: 'sent',
        emailSentAt: sentAt
      } 
    }
  );

  // Update email log if provided
  if (email) {
    email.quotesGenerated.forEach(q => {
      if (quoteIds.includes(q.quoteId.toString())) {
        q.status = 'sent';
        q.sentAt = sentAt;
        q.sentBy = req.user._id;
      }
    });
    
    // Add to response/reply tracking
    if (!email.responseData) {
      email.responseData = {};
    }
    email.responseData.lastQuoteSentAt = sentAt;
    email.responseData.totalQuotesSent = quoteIds.length;
    
    await email.save();
  }

  successResponse(res, 200, `Successfully sent ${quotes.length} quote${quotes.length > 1 ? 's' : ''} to ${customerEmail}`, {
    sentQuotes: quotes.length,
    customerEmail,
    quoteNumbers: quotes.map(q => q.quoteNumber)
  });
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
  createQuoteFromEmail,
  sendMultipleQuotes,
};
