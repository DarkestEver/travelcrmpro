const { Booking, Quote, Agent, Customer } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination, parseSort } = require('../utils/pagination');
const { sendBookingConfirmationEmail } = require('../utils/email');
const commissionService = require('../services/commissionService');
const creditService = require('../services/creditService');

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

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private
const getAllBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const sortBy = parseSort(req, '-createdAt');
  const { bookingStatus, paymentStatus, agentId } = req.query;

  // Build query
  const query = {
    tenantId: req.tenantId, // Multi-tenant filter
  };
  if (bookingStatus) query.bookingStatus = bookingStatus;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  // Agents can only see their own bookings
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    query.agentId = req.agent._id;
  } else if (agentId) {
    query.agentId = agentId;
  }

  // Execute query
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('agentId', 'agencyName contactPerson')
      .populate('customerId', 'name email phone')
      .populate('itineraryId', 'title destination duration')
      .populate('quoteId', 'quoteNumber pricing')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query),
  ]);

  paginatedResponse(res, 200, bookings, page, limit, total);
});

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('agentId', 'agencyName contactPerson email phone')
    .populate('customerId', 'name email phone passportInfo emergencyContact')
    .populate({
      path: 'itineraryId',
      populate: {
        path: 'days.components.supplierId',
        select: 'companyName serviceTypes contactPersons',
      },
    })
    .populate('quoteId', 'quoteNumber pricing terms');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Check permissions
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    if (booking.agentId._id.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to view this booking', 403);
    }
  }

  successResponse(res, 200, 'Booking fetched successfully', { booking });
});

// @desc    Create booking from quote
// @route   POST /api/v1/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const { quoteId, travelers, travelDates, specialRequests } = req.body;

  // Verify quote exists and is accepted
  const quote = await Quote.findById(quoteId)
    .populate('agentId')
    .populate('customerId')
    .populate('itineraryId');

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  if (quote.status !== 'accepted') {
    throw new AppError('Can only create bookings from accepted quotes', 400);
  }

  // Check permissions
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    if (quote.agentId._id.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to create a booking for this quote', 403);
    }
  }

  // Check if booking already exists for this quote
  const existingBooking = await Booking.findOne({ quoteId });
  if (existingBooking) {
    throw new AppError('A booking already exists for this quote', 400);
  }

  // For agents: Check credit limit before creating booking
  if (req.user.role === 'agent') {
    const bookingAmount = quote.pricing.totalPrice;
    const creditCheck = await creditService.canMakeBooking(req.agent._id, bookingAmount);
    
    if (!creditCheck.canBook) {
      throw new AppError(
        `Insufficient credit limit. Required: ${creditCheck.required}, Available: ${creditCheck.available}`,
        400
      );
    }
  }

  // Create booking
  const booking = await Booking.create({
    tenantId: req.tenantId,
    quoteId,
    agentId: quote.agentId._id,
    customerId: quote.customerId._id,
    itineraryId: quote.itineraryId._id,
    createdBy: req.user.id,
    financial: {
      totalAmount: quote.pricing.totalPrice,
      paidAmount: 0,
      pendingAmount: quote.pricing.totalPrice,
    },
    travelers: travelers || [],
    travelDates: travelDates || quote.travelDates,
    specialRequests,
  });

  await booking.populate([
    { path: 'agentId', select: 'agencyName contactPerson' },
    { path: 'customerId', select: 'name email phone' },
    { path: 'itineraryId', select: 'title destination duration' },
    { path: 'quoteId', select: 'quoteNumber pricing' },
  ]);

  // Update agent's total bookings
  await Agent.findByIdAndUpdate(quote.agentId._id, {
    $inc: { totalBookings: 1 },
  });

  // Update customer's total bookings
  await Customer.findByIdAndUpdate(quote.customerId._id, {
    $inc: { totalBookings: 1 },
  });

  // For agents: Reserve credit for this booking
  if (req.user.role === 'agent') {
    try {
      await creditService.reserveCredit(
        req.agent._id,
        quote.pricing.totalPrice,
        booking._id
      );
    } catch (error) {
      console.error('Failed to reserve credit:', error);
      // If credit reservation fails, we should rollback the booking
      await Booking.findByIdAndDelete(booking._id);
      throw new AppError('Failed to reserve credit for booking', 500);
    }
  }

  // Send booking confirmation email
  try {
    const emailService = require('../services/emailService');
    const advancedNotificationService = require('../services/advancedNotificationService');
    
    if (quote.customerId && quote.customerId.email) {
      const bookingData = {
        bookingNumber: booking.bookingNumber,
        destination: quote.itineraryId?.destination || 'N/A',
        startDate: booking.travelDates?.startDate || new Date(),
        endDate: booking.travelDates?.endDate || new Date(),
        totalAmount: quote.pricing.totalPrice,
        status: booking.bookingStatus
      };

      // Send booking confirmation email to customer
      await emailService.sendBookingConfirmationEmail({
        to: quote.customerId.email,
        customerName: quote.customerId.name || `${quote.customerId.firstName} ${quote.customerId.lastName}`,
        booking: bookingData
      });

      console.log('✅ Booking confirmation email sent to:', quote.customerId.email);
    }

    // Create notification for agent
    if (req.user.role === 'agent') {
      await advancedNotificationService.createNotification({
        userId: req.agent._id,
        tenantId: req.tenantId,
        type: 'booking',
        priority: 'high',
        title: 'New Booking Created',
        message: `Booking ${booking.bookingNumber} created successfully for ${quote.customerId.name || quote.customerId.firstName}`,
        metadata: {
          bookingId: booking._id,
          bookingNumber: booking.bookingNumber,
          customerId: quote.customerId._id,
          customerName: quote.customerId.name || `${quote.customerId.firstName} ${quote.customerId.lastName}`,
          amount: quote.pricing.totalPrice
        },
        link: `/agent/bookings/${booking._id}`
      });
    }
  } catch (emailError) {
    console.error('❌ Failed to send booking confirmation email:', emailError);
    // Don't fail the booking creation if email fails
  }

  successResponse(res, 201, 'Booking created successfully', { booking });
});

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
const updateBooking = asyncHandler(async (req, res) => {
  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Check permissions
  if (req.user.role === 'agent' && booking.agentId.toString() !== req.agent._id.toString()) {
    throw new AppError('You do not have permission to update this booking', 403);
  }

  // Can't update cancelled bookings
  if (booking.bookingStatus === 'cancelled') {
    throw new AppError('Cannot update cancelled booking', 400);
  }

  booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: 'agentId', select: 'agencyName contactPerson' },
    { path: 'customerId', select: 'name email phone' },
    { path: 'itineraryId', select: 'title destination duration' },
  ]);

  successResponse(res, 200, 'Booking updated successfully', { booking });
});

// @desc    Add payment to booking
// @route   POST /api/v1/bookings/:id/payment
// @access  Private
const addPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, transactionId, notes } = req.body;

  const booking = await Booking.findById(req.params.id)
    .populate('agentId')
    .populate('customerId');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Check permissions
  if (req.user.role === 'agent' && booking.agentId._id.toString() !== req.agent._id.toString()) {
    throw new AppError('You do not have permission to add payment to this booking', 403);
  }

  // Validate amount
  if (amount <= 0) {
    throw new AppError('Payment amount must be greater than 0', 400);
  }

  if (amount > booking.financial.pendingAmount) {
    throw new AppError('Payment amount exceeds pending amount', 400);
  }

  // Add payment record
  booking.paymentRecords.push({
    amount,
    method: paymentMethod,
    transactionId,
    status: 'completed',
    paidAt: Date.now(),
    notes,
  });

  // Update paid and pending amounts (pre-save hook will recalculate)
  booking.financial.paidAmount += amount;

  await booking.save();

  // Update agent's total revenue
  await Agent.findByIdAndUpdate(booking.agentId._id, {
    $inc: { totalRevenue: amount },
  });

  // Update customer's total spent
  await Customer.findByIdAndUpdate(booking.customerId._id, {
    $inc: { totalSpent: amount },
  });

  // Update agent's available credit if applicable
  const agent = await Agent.findById(booking.agentId._id);
  if (agent && booking.paymentStatus === 'paid') {
    // Restore credit once booking is fully paid
    const creditUsed = booking.financial.totalAmount;
    agent.availableCredit = Math.min(agent.creditLimit, agent.availableCredit + creditUsed);
    await agent.save();
  }

  successResponse(res, 200, 'Payment added successfully', { booking });
});

// @desc    Confirm booking
// @route   PATCH /api/v1/bookings/:id/confirm
// @access  Private
const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('agentId')
    .populate('customerId')
    .populate('itineraryId');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Check permissions
  const isOwner = req.user.role === 'agent' && booking.agentId._id.toString() === req.agent._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to confirm this booking', 403);
  }

  // Can only confirm pending bookings
  if (booking.bookingStatus !== 'pending') {
    throw new AppError('Only pending bookings can be confirmed', 400);
  }

  // Check payment status
  if (booking.paymentStatus === 'pending') {
    throw new AppError('Booking must have at least partial payment before confirmation', 400);
  }

  booking.bookingStatus = 'confirmed';
  booking.confirmedAt = Date.now();
  await booking.save();

  // Send confirmation email
  try {
    await sendBookingConfirmationEmail(booking, booking.agentId, booking.customerId);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }

  successResponse(res, 200, 'Booking confirmed successfully', { booking });
});

// @desc    Cancel booking
// @route   PATCH /api/v1/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason, refundAmount } = req.body;

  const booking = await Booking.findById(req.params.id)
    .populate('agentId')
    .populate('customerId');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Check permissions
  const isOwner = req.user.role === 'agent' && booking.agentId._id.toString() === req.agent._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to cancel this booking', 403);
  }

  // Can't cancel already cancelled bookings
  if (booking.bookingStatus === 'cancelled') {
    throw new AppError('Booking is already cancelled', 400);
  }

  booking.bookingStatus = 'cancelled';
  booking.cancellation = {
    cancelledAt: Date.now(),
    cancelledBy: req.user._id,
    reason,
    refundAmount: refundAmount || 0,
  };

  await booking.save();

  // If there's a refund, update payment status
  if (refundAmount > 0) {
    booking.paymentStatus = 'refunded';
    booking.financial.paidAmount -= refundAmount;
    booking.financial.pendingAmount += refundAmount;
    await booking.save();

    // Update agent's total revenue
    await Agent.findByIdAndUpdate(booking.agentId._id, {
      $inc: { totalRevenue: -refundAmount },
    });

    // Update customer's total spent
    await Customer.findByIdAndUpdate(booking.customerId._id, {
      $inc: { totalSpent: -refundAmount },
    });
  }

  // Cancel any pending/approved commissions for this booking
  try {
    await commissionService.cancelCommission(booking._id);
  } catch (error) {
    console.error('Failed to cancel commission:', error);
    // Don't fail the cancellation if commission cancellation fails
  }

  // Release credit for agent bookings
  if (booking.agentId) {
    try {
      await creditService.releaseCredit(
        booking.agentId._id,
        booking.financial.totalAmount,
        booking._id
      );
    } catch (error) {
      console.error('Failed to release credit:', error);
      // Don't fail the cancellation if credit release fails
    }
  }

  successResponse(res, 200, 'Booking cancelled successfully', { booking });
});

// @desc    Complete booking
// @route   PATCH /api/v1/bookings/:id/complete
// @access  Private (operator, super_admin)
const completeBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Can only complete confirmed bookings
  if (booking.bookingStatus !== 'confirmed') {
    throw new AppError('Only confirmed bookings can be marked as completed', 400);
  }

  // Check if travel dates have passed
  if (new Date() < booking.travelDates.endDate) {
    throw new AppError('Booking cannot be completed before travel end date', 400);
  }

  booking.bookingStatus = 'completed';
  await booking.save();

  // Automatically create commission for agent if applicable
  try {
    await commissionService.createCommissionForBooking(booking._id);
  } catch (error) {
    console.error('Failed to create commission:', error);
    // Don't fail the booking completion if commission creation fails
    // Just log the error for manual intervention
  }

  // Release credit for agent bookings (credit is no longer "held")
  if (booking.agentId) {
    try {
      await creditService.releaseCredit(
        booking.agentId._id,
        booking.financial.totalAmount,
        booking._id
      );
    } catch (error) {
      console.error('Failed to release credit:', error);
      // Don't fail the completion if credit release fails
    }
  }

  successResponse(res, 200, 'Booking completed successfully', { booking });
});

// @desc    Get booking statistics
// @route   GET /api/v1/bookings/stats
// @access  Private
const getBookingStats = asyncHandler(async (req, res) => {
  const query = {};

  // Agents can only see their own stats
  if (req.user.role === 'agent') {
    query.agentId = req.agent._id;
  } else if (req.query.agentId) {
    query.agentId = req.query.agentId;
  }

  const [
    total,
    pending,
    confirmed,
    completed,
    cancelled,
    totalRevenue,
    pendingPayments,
  ] = await Promise.all([
    Booking.countDocuments(query),
    Booking.countDocuments({ ...query, bookingStatus: 'pending' }),
    Booking.countDocuments({ ...query, bookingStatus: 'confirmed' }),
    Booking.countDocuments({ ...query, bookingStatus: 'completed' }),
    Booking.countDocuments({ ...query, bookingStatus: 'cancelled' }),
    Booking.aggregate([
      { $match: { ...query, paymentStatus: { $in: ['partial', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$financial.paidAmount' } } },
    ]),
    Booking.aggregate([
      { $match: { ...query, paymentStatus: { $in: ['pending', 'partial'] } } },
      { $group: { _id: null, total: { $sum: '$financial.pendingAmount' } } },
    ]),
  ]);

  const stats = {
    total,
    byStatus: { pending, confirmed, completed, cancelled },
    totalRevenue: totalRevenue[0]?.total || 0,
    pendingPayments: pendingPayments[0]?.total || 0,
  };

  successResponse(res, 200, 'Booking statistics fetched successfully', { stats });
});

module.exports = {
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  addPayment,
  confirmBooking,
  cancelBooking,
  completeBooking,
  getBookingStats,
};
