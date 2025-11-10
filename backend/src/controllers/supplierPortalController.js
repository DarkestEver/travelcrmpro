const { Booking, Supplier } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination, parseSort } = require('../utils/pagination');

/**
 * @desc    Get supplier dashboard statistics
 * @route   GET /api/v1/suppliers/dashboard-stats
 * @access  Private (Supplier only)
 */
const getSupplierDashboardStats = asyncHandler(async (req, res) => {
  // Get supplier from request (set by auth middleware)
  const supplierId = req.user.supplierId;

  if (!supplierId) {
    throw new AppError('Supplier profile not found for this user', 404);
  }

  // Get booking statistics for this supplier
  const bookings = await Booking.find({
    'supplier': supplierId,
    tenantId: req.tenantId,
  });

  // Calculate stats
  const stats = {
    totalBookings: bookings.length,
    pendingConfirmations: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    totalRevenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    activeServices: 0, // Placeholder - will be implemented with inventory
  };

  successResponse(res, 200, 'Dashboard stats retrieved successfully', stats);
});

/**
 * @desc    Get bookings assigned to supplier
 * @route   GET /api/v1/suppliers/my-bookings
 * @access  Private (Supplier only)
 */
const getSupplierBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const sortBy = parseSort(req, '-createdAt');
  const { status, search } = req.query;

  const supplierId = req.user.supplierId;

  if (!supplierId) {
    throw new AppError('Supplier profile not found for this user', 404);
  }

  // Build query
  const query = {
    'supplier': supplierId,
    tenantId: req.tenantId,
  };

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { destination: { $regex: search, $options: 'i' } },
    ];
  }

  // Execute query
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('agent', 'name email agentCode')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query),
  ]);

  paginatedResponse(res, 200, bookings, page, limit, total);
});

/**
 * @desc    Update booking status by supplier
 * @route   PUT /api/v1/suppliers/bookings/:bookingId/status
 * @access  Private (Supplier only)
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  const supplierId = req.user.supplierId;

  if (!supplierId) {
    throw new AppError('Supplier profile not found for this user', 404);
  }

  // Validate status
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  // Find booking assigned to this supplier
  const booking = await Booking.findOne({
    _id: bookingId,
    'supplier': supplierId,
    tenantId: req.tenantId,
  });

  if (!booking) {
    throw new AppError('Booking not found or not assigned to you', 404);
  }

  // Update status
  booking.status = status;
  booking.updatedBy = req.user._id;

  // Add status change to history if booking has history array
  if (booking.statusHistory) {
    booking.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: `Status updated by supplier to ${status}`,
    });
  }

  await booking.save();

  successResponse(res, 200, 'Booking status updated successfully', booking);
});

module.exports = {
  getSupplierDashboardStats,
  getSupplierBookings,
  updateBookingStatus,
};
