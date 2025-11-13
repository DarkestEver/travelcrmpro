/**
 * Customer Portal Booking Controller
 * Handles customer booking viewing and management
 */

const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/response');
const Booking = require('../../models/Booking');
const Itinerary = require('../../models/Itinerary');

/**
 * @desc    Get all bookings for customer
 * @route   GET /api/v1/customer/bookings
 * @access  Private (Customer)
 */
exports.getBookings = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;
  
  const {
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  // Build query
  const query = { customerId, tenantId };

  if (status) {
    query.bookingStatus = status;
  }

  if (search) {
    query.$or = [
      { bookingNumber: { $regex: search, $options: 'i' } },
      { 'destination': { $regex: search, $options: 'i' } },
    ];
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('itineraryId', 'title destination startDate endDate duration coverImage')
      .populate('agentId', 'agencyName contactPerson email phone')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Booking.countDocuments(query),
  ]);

  successResponse(res, 200, 'Bookings retrieved successfully', {
    bookings,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get booking details by ID
 * @route   GET /api/v1/customer/bookings/:id
 * @access  Private (Customer)
 */
exports.getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const booking = await Booking.findOne({
    _id: id,
    customerId,
    tenantId,
  })
    .populate('itineraryId')
    .populate('agentId', 'agencyName contactPerson email phone address')
    .populate('quoteId', 'quoteNumber pricing')
    .lean();

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Get itinerary details if exists
  let itineraryDetails = null;
  if (booking.itineraryId) {
    itineraryDetails = await Itinerary.findById(booking.itineraryId)
      .populate('days.activities.supplier', 'name contactPerson phone email')
      .lean();
  }

  successResponse(res, 200, 'Booking details retrieved', {
    booking: {
      ...booking,
      itinerary: itineraryDetails,
    },
  });
});

/**
 * @desc    Get booking voucher/confirmation
 * @route   GET /api/v1/customer/bookings/:id/voucher
 * @access  Private (Customer)
 */
exports.getBookingVoucher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const booking = await Booking.findOne({
    _id: id,
    customerId,
    tenantId,
  })
    .populate('itineraryId')
    .populate('customerId')
    .populate('agentId', 'agencyName contactPerson email phone address logo')
    .lean();

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.bookingStatus !== 'confirmed') {
    throw new AppError('Voucher only available for confirmed bookings', 400);
  }

  // Generate PDF voucher
  const { generateVoucherPDF } = require('../../utils/pdfGenerator');
  const pdfBuffer = await generateVoucherPDF(booking, booking.customerId);

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=voucher-${booking.bookingNumber}.pdf`
  );
  res.setHeader('Content-Length', pdfBuffer.length);

  // Send PDF buffer
  res.send(pdfBuffer);
});

/**
 * @desc    Cancel booking request
 * @route   POST /api/v1/customer/bookings/:id/cancel-request
 * @access  Private (Customer)
 */
exports.requestCancellation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const booking = await Booking.findOne({
    _id: id,
    customerId,
    tenantId,
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.bookingStatus === 'cancelled') {
    throw new AppError('Booking is already cancelled', 400);
  }

  // Update booking with cancellation request
  booking.cancellationRequest = {
    requested: true,
    requestedAt: Date.now(),
    reason: reason || 'Customer requested cancellation',
    status: 'pending',
  };

  await booking.save();

  // TODO: Send notification to agent
  // await createNotification({
  //   type: 'booking_cancellation_request',
  //   recipientId: booking.agentId,
  //   data: { bookingId: booking._id, bookingNumber: booking.bookingNumber }
  // });

  successResponse(res, 200, 'Cancellation request submitted', {
    booking,
  });
});

module.exports = exports;
