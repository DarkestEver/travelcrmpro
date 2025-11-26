const Booking = require('../models/Booking');
const Itinerary = require('../models/Itinerary');
const Lead = require('../models/Lead');
const { ValidationError, NotFoundError, ForbiddenError } = require('../lib/errors');
const { USER_ROLES } = require('../config/constants');
const logger = require('../lib/logger');

/**
 * Get all bookings with filtering and pagination
 * GET /api/v1/bookings
 */
const getAllBookings = async (req, res) => {
  const tenantId = req.user.tenant;
  const userId = req.userId;
  const userRole = req.user.role;
  const {
    status,
    paymentStatus,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  // Build filter
  const filter = { tenant: tenantId };

  // Agents can only see their own bookings
  if (userRole === USER_ROLES.AGENT) {
    filter.createdBy = userId;
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Payment status filter
  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  // Date range filter
  if (startDate || endDate) {
    filter.travelStartDate = {};
    if (startDate) filter.travelStartDate.$gte = new Date(startDate);
    if (endDate) filter.travelStartDate.$lte = new Date(endDate);
  }

  // Search filter (booking number, customer name, email)
  if (search) {
    filter.$or = [
      { bookingNumber: { $regex: search, $options: 'i' } },
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'customer.email': { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('itinerary', 'title destination startDate endDate')
      .populate('lead', 'customer.name customer.email')
      .populate('createdBy', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: bookings,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

/**
 * Get single booking by ID
 * GET /api/v1/bookings/:id
 */
const getBooking = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenant;
  const userId = req.userId;
  const userRole = req.user.role;

  const booking = await Booking.findOne({ _id: id, tenant: tenantId })
    .populate('itinerary')
    .populate('lead', 'customer.name customer.email customer.phone')
    .populate('createdBy', 'firstName lastName email')
    .populate('lastModifiedBy', 'firstName lastName email')
    .populate('confirmedBy', 'firstName lastName email')
    .populate('payments.processedBy', 'firstName lastName')
    .populate('statusHistory.changedBy', 'firstName lastName')
    .populate('documents.uploadedBy', 'firstName lastName');

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Agents can only view their own bookings
  if (userRole === USER_ROLES.AGENT && booking.createdBy._id.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only view your own bookings');
  }

  res.json({
    success: true,
    data: booking,
  });
};

/**
 * Create new booking
 * POST /api/v1/bookings
 */
const createBooking = async (req, res) => {
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const bookingData = req.body;

  // Validate itinerary exists
  const itinerary = await Itinerary.findOne({
    _id: bookingData.itinerary,
    tenant: tenantId,
  });
  if (!itinerary) {
    throw new ValidationError('Itinerary not found', 'ITINERARY_NOT_FOUND');
  }

  // Validate lead exists if provided
  if (bookingData.lead) {
    const lead = await Lead.findOne({
      _id: bookingData.lead,
      tenant: tenantId,
    });
    if (!lead) {
      throw new ValidationError('Lead not found', 'LEAD_NOT_FOUND');
    }
  }

  // Generate booking number
  const bookingNumber = await Booking.generateBookingNumber(tenantId);

  // Calculate balance due
  const totalPaid = bookingData.payments
    ? bookingData.payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
    : 0;
  const balanceDue = bookingData.pricing.totalPrice - totalPaid;

  // Create booking
  const booking = await Booking.create({
    ...bookingData,
    bookingNumber,
    tenant: tenantId,
    createdBy: userId,
    lastModifiedBy: userId,
    totalPaid,
    balanceDue,
  });

  // Update payment status
  booking.updatePaymentStatus();
  await booking.save();

  // Populate before returning
  const populated = await Booking.findById(booking._id)
    .populate('itinerary', 'title destination startDate endDate')
    .populate('lead', 'customer.name customer.email')
    .populate('createdBy', 'firstName lastName email');

  logger.info('Booking created', {
    bookingId: booking._id,
    bookingNumber,
    userId,
    requestId: req.id,
  });

  res.status(201).json({
    success: true,
    data: populated,
  });
};

/**
 * Update booking
 * PUT /api/v1/bookings/:id
 */
const updateBooking = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const userRole = req.user.role;
  const updates = req.body;

  // Find booking
  const booking = await Booking.findOne({ _id: id, tenant: tenantId });
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Agents can only update their own bookings
  if (userRole === USER_ROLES.AGENT && booking.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only update your own bookings');
  }

  // Allowed fields for update
  const allowedFields = [
    'customer',
    'travelers',
    'travelStartDate',
    'travelEndDate',
    'pricing',
    'specialRequests',
    'internalNotes',
    'customerNotes',
  ];

  // Apply updates
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      booking[field] = updates[field];
    }
  });

  booking.lastModifiedBy = userId;

  // Recalculate payment status if pricing changed
  if (updates.pricing) {
    booking.updatePaymentStatus();
  }

  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate('itinerary', 'title destination startDate endDate')
    .populate('lead', 'customer.name customer.email')
    .populate('createdBy', 'firstName lastName email');

  logger.info('Booking updated', {
    bookingId: booking._id,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: populated,
  });
};

/**
 * Delete booking (admin only)
 * DELETE /api/v1/bookings/:id
 */
const deleteBooking = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenant;

  const booking = await Booking.findOneAndDelete({
    _id: id,
    tenant: tenantId,
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  logger.info('Booking deleted', {
    bookingId: id,
    userId: req.userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Booking deleted successfully',
  });
};

/**
 * Update booking status
 * PATCH /api/v1/bookings/:id/status
 */
const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const userRole = req.user.role;
  const { status, reason, notes } = req.body;

  // Find booking
  const booking = await Booking.findOne({ _id: id, tenant: tenantId });
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Agents can only update their own bookings
  if (userRole === USER_ROLES.AGENT && booking.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only update your own bookings');
  }

  // Update status
  booking.updateStatus(status, userId, reason, notes);
  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate('itinerary', 'title destination')
    .populate('createdBy', 'firstName lastName email')
    .populate('statusHistory.changedBy', 'firstName lastName');

  logger.info('Booking status updated', {
    bookingId: booking._id,
    status,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: populated,
  });
};

/**
 * Add payment to booking
 * POST /api/v1/bookings/:id/payments
 */
const addPayment = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const userRole = req.user.role;
  const paymentData = req.body;

  // Find booking
  const booking = await Booking.findOne({ _id: id, tenant: tenantId });
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Agents can only add payments to their own bookings
  if (userRole === USER_ROLES.AGENT && booking.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only add payments to your own bookings');
  }

  // Add payment
  const payment = booking.addPayment({
    ...paymentData,
    processedBy: userId,
  });

  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate('payments.processedBy', 'firstName lastName');

  logger.info('Payment added to booking', {
    bookingId: booking._id,
    paymentId: payment._id,
    amount: payment.amount,
    userId,
    requestId: req.id,
  });

  res.status(201).json({
    success: true,
    data: populated,
  });
};

/**
 * Update payment
 * PUT /api/v1/bookings/:id/payments/:paymentId
 */
const updatePayment = async (req, res) => {
  const { id, paymentId } = req.params;
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const userRole = req.user.role;
  const updates = req.body;

  // Find booking
  const booking = await Booking.findOne({ _id: id, tenant: tenantId });
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Agents can only update payments on their own bookings
  if (userRole === USER_ROLES.AGENT && booking.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only update payments on your own bookings');
  }

  // Find payment
  const payment = booking.payments.id(paymentId);
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  // Update payment fields
  const allowedFields = ['amount', 'method', 'status', 'transactionId', 'reference', 'notes', 'receiptUrl'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      payment[field] = updates[field];
    }
  });

  // Update payment status
  booking.updatePaymentStatus();
  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate('payments.processedBy', 'firstName lastName');

  logger.info('Payment updated', {
    bookingId: booking._id,
    paymentId,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: populated,
  });
};

/**
 * Add document to booking
 * POST /api/v1/bookings/:id/documents
 */
const addDocument = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const userRole = req.user.role;
  const documentData = req.body;

  // Find booking
  const booking = await Booking.findOne({ _id: id, tenant: tenantId });
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Agents can only add documents to their own bookings
  if (userRole === USER_ROLES.AGENT && booking.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only add documents to your own bookings');
  }

  // Add document
  const document = booking.addDocument(documentData, userId);
  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate('documents.uploadedBy', 'firstName lastName');

  logger.info('Document added to booking', {
    bookingId: booking._id,
    documentId: document._id,
    userId,
    requestId: req.id,
  });

  res.status(201).json({
    success: true,
    data: populated,
  });
};

/**
 * Get booking statistics
 * GET /api/v1/bookings/stats
 */
const getBookingStats = async (req, res) => {
  const tenantId = req.user.tenant;
  const userId = req.userId;
  const userRole = req.user.role;

  // Base filter
  const baseFilter = { tenant: tenantId };
  if (userRole === USER_ROLES.AGENT) {
    baseFilter.createdBy = userId;
  }

  // Get stats
  const [
    byStatus,
    byPaymentStatus,
    totalRevenue,
    upcomingTrips,
  ] = await Promise.all([
    // Count by status
    Booking.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    
    // Count by payment status
    Booking.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    ]),
    
    // Total revenue (fully paid bookings)
    Booking.aggregate([
      {
        $match: {
          ...baseFilter,
          paymentStatus: 'fully-paid',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.totalPrice' },
          count: { $sum: 1 },
        },
      },
    ]),
    
    // Upcoming trips (next 30 days)
    Booking.getUpcoming(tenantId, 30).then(trips => trips.length),
  ]);

  res.json({
    success: true,
    data: {
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPaymentStatus: byPaymentStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      revenue: {
        total: totalRevenue[0]?.total || 0,
        bookingsCount: totalRevenue[0]?.count || 0,
      },
      upcomingTrips,
    },
  });
};

module.exports = {
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
  addPayment,
  updatePayment,
  addDocument,
  getBookingStats,
};
