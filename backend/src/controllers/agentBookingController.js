const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');

/**
 * @desc    Get all bookings for the authenticated agent
 * @route   GET /api/v1/agent-portal/bookings
 * @access  Private (Agent only)
 */
exports.getMyBookings = asyncHandler(async (req, res) => {
  try {
    const agentId = req.user._id;
    const tenantId = req.user.tenantId;

    console.log('📦 Fetching bookings for agent:', agentId, 'tenant:', tenantId);

    const {
      page = 1,
      limit = 10,
      status,
      search,
      dateFrom,
      dateTo,
      sortBy = '-createdAt',
    } = req.query;

    const query = { agentId, tenantId };

    // Filter by status
    if (status && status.trim()) {
      query.bookingStatus = status;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom && dateFrom.trim()) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo && dateTo.trim()) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

  // Search by customer name or booking number
  if (search && search.trim()) {
    try {
      const customers = await Customer.find({
        agentId,
        tenantId,
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const customerIds = customers.map((c) => c._id);
      
      query.$or = [
        ...(customerIds.length > 0 ? [{ customerId: { $in: customerIds } }] : []),
        { bookingNumber: { $regex: search, $options: 'i' } },
      ];
    } catch (searchError) {
      console.log('Search error:', searchError);
      // Continue without search filter if there's an error
    }
  }

  const skip = (page - 1) * limit;

  console.log('📦 Booking query:', JSON.stringify(query));

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('customerId', 'firstName lastName email phone')
      .populate('itineraryId', 'title destination startDate endDate duration')
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    Booking.countDocuments(query),
  ]);

  console.log('📦 Found bookings:', total);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit),
  };

  successResponse(res, 200, 'Bookings retrieved successfully', {
    bookings,
    pagination,
  });
  } catch (error) {
    console.error('❌ Booking fetch error:', error);
    throw error;
  }
});

/**
 * @desc    Get single booking details
 * @route   GET /api/v1/agent-portal/bookings/:id
 * @access  Private (Agent only)
 */
exports.getBookingById = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;

  const booking = await Booking.findOne({
    _id: id,
    agentId,
    tenantId,
  })
    .populate('customerId', 'firstName lastName email phone address city country passportNumber')
    .populate('itineraryId')
    .populate('quoteRequestId', 'destination travelDates travelers budget');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  successResponse(res, 200, 'Booking retrieved successfully', {
    booking,
  });
});

/**
 * @desc    Get booking statistics
 * @route   GET /api/v1/agent-portal/bookings/stats
 * @access  Private (Agent only)
 */
exports.getBookingStats = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  const [statusBreakdown, totalBookings, thisMonthBookings, totalRevenue] = await Promise.all([
    // Status breakdown
    Booking.aggregate([
      { $match: { agentId, tenantId } },
      { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
    ]),

    // Total bookings
    Booking.countDocuments({ agentId, tenantId }),

    // This month bookings
    Booking.countDocuments({
      agentId,
      tenantId,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),

    // Total revenue from confirmed bookings
    Booking.aggregate([
      {
        $match: {
          agentId,
          tenantId,
          bookingStatus: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$financial.totalAmount' },
        },
      },
    ]),
  ]);

  const stats = {
    total: totalBookings,
    thisMonth: thisMonthBookings,
    revenue: totalRevenue[0]?.total || 0,
    byStatus: statusBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };

  successResponse(res, 200, 'Booking statistics retrieved', { stats });
});

/**
 * @desc    Download booking voucher
 * @route   GET /api/v1/agent-portal/bookings/:id/voucher
 * @access  Private (Agent only)
 */
exports.downloadVoucher = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;

  const booking = await Booking.findOne({
    _id: id,
    agentId,
    tenantId,
  })
    .populate('customerId')
    .populate('itineraryId');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Only confirmed bookings can have vouchers
  if (booking.bookingStatus !== 'confirmed') {
    throw new AppError('Voucher only available for confirmed bookings', 400);
  }

  // In a real implementation, you would generate a PDF here
  // For now, we'll return booking data formatted for voucher
  const voucherData = {
    bookingReference: booking.bookingNumber,
    bookingDate: booking.createdAt,
    customer: {
      name: `${booking.customerId.firstName} ${booking.customerId.lastName}`,
      email: booking.customerId.email,
      phone: booking.customerId.phone,
      passportNumber: booking.customerId.passportNumber,
    },
    itinerary: {
      title: booking.itineraryId?.title,
      destination: booking.itineraryId?.destination,
      startDate: booking.itineraryId?.startDate || booking.travelDates?.startDate,
      endDate: booking.itineraryId?.endDate || booking.travelDates?.endDate,
      duration: booking.itineraryId?.duration,
    },
    payment: {
      totalAmount: booking.financial.totalAmount,
      currency: booking.financial.currency,
      paymentStatus: booking.paymentStatus,
      paidAmount: booking.financial.paidAmount,
    },
    status: booking.bookingStatus,
  };

  // TODO: Generate actual PDF voucher
  // For now, return JSON data
  res.json({
    success: true,
    message: 'Voucher data retrieved',
    data: {
      voucher: voucherData,
      // In production, this would be a download URL or PDF buffer
      downloadUrl: `/vouchers/${booking.bookingNumber}.pdf`,
    },
  });
});
