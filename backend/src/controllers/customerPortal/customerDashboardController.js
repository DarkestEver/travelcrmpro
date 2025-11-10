/**
 * Customer Portal Dashboard Controller
 * Provides dashboard data for customers
 */

const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/response');
const Booking = require('../../models/Booking');
const Invoice = require('../../models/Invoice');
const Quote = require('../../models/Quote');

/**
 * @desc    Get customer dashboard summary
 * @route   GET /api/v1/customer/dashboard/summary
 * @access  Private (Customer)
 */
exports.getDashboardSummary = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  // Get bookings count by status
  const bookingsCount = await Booking.aggregate([
    { $match: { customerId, tenantId } },
    {
      $group: {
        _id: '$bookingStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get total bookings
  const totalBookings = await Booking.countDocuments({ customerId, tenantId });

  // Get invoices summary
  const invoicesSummary = await Invoice.aggregate([
    { $match: { customerId, tenantId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' }
      }
    }
  ]);

  // Get outstanding balance
  const outstandingInvoices = await Invoice.aggregate([
    {
      $match: {
        customerId,
        tenantId,
        status: { $in: ['pending', 'overdue'] }
      }
    },
    {
      $group: {
        _id: null,
        totalDue: { $sum: '$amountDue' }
      }
    }
  ]);

  // Get pending quotes
  const pendingQuotes = await Quote.countDocuments({
    customerId,
    tenantId,
    status: 'pending'
  });

  // Get upcoming bookings count
  const upcomingBookings = await Booking.countDocuments({
    customerId,
    tenantId,
    bookingStatus: 'confirmed',
    'travelDates.startDate': { $gte: new Date() }
  });

  const summary = {
    bookings: {
      total: totalBookings,
      upcoming: upcomingBookings,
      byStatus: bookingsCount.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    },
    invoices: {
      byStatus: invoicesSummary.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          amount: item.totalAmount
        };
        return acc;
      }, {}),
      outstandingBalance: outstandingInvoices[0]?.totalDue || 0
    },
    quotes: {
      pending: pendingQuotes
    }
  };

  successResponse(res, 200, 'Dashboard summary retrieved', { summary });
});

/**
 * @desc    Get upcoming trips
 * @route   GET /api/v1/customer/dashboard/upcoming-trips
 * @access  Private (Customer)
 */
exports.getUpcomingTrips = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const upcomingTrips = await Booking.find({
    customerId,
    tenantId,
    bookingStatus: 'confirmed',
    'travelDates.startDate': { $gte: new Date() }
  })
    .populate('itineraryId', 'title destination startDate endDate duration coverImage')
    .populate('agentId', 'agencyName contactPerson email phone')
    .sort({ 'travelDates.startDate': 1 })
    .limit(5)
    .lean();

  // Calculate days until trip
  const tripsWithDaysUntil = upcomingTrips.map(trip => ({
    ...trip,
    daysUntil: Math.ceil(
      (new Date(trip.travelDates?.startDate || trip.startDate) - new Date()) /
        (1000 * 60 * 60 * 24)
    )
  }));

  successResponse(res, 200, 'Upcoming trips retrieved', {
    trips: tripsWithDaysUntil
  });
});

/**
 * @desc    Get recent activity
 * @route   GET /api/v1/customer/dashboard/recent-activity
 * @access  Private (Customer)
 */
exports.getRecentActivity = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  // Get recent bookings
  const recentBookings = await Booking.find({
    customerId,
    tenantId
  })
    .select('bookingNumber bookingStatus createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Get recent invoices
  const recentInvoices = await Invoice.find({
    customerId,
    tenantId
  })
    .select('invoiceNumber status total createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Get recent quotes
  const recentQuotes = await Quote.find({
    customerId,
    tenantId
  })
    .select('quoteNumber status createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Combine and sort all activities
  const activities = [
    ...recentBookings.map(b => ({
      type: 'booking',
      id: b._id,
      number: b.bookingNumber,
      status: b.bookingStatus,
      date: b.createdAt
    })),
    ...recentInvoices.map(i => ({
      type: 'invoice',
      id: i._id,
      number: i.invoiceNumber,
      status: i.status,
      amount: i.total,
      date: i.createdAt
    })),
    ...recentQuotes.map(q => ({
      type: 'quote',
      id: q._id,
      number: q.quoteNumber,
      status: q.status,
      date: q.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  successResponse(res, 200, 'Recent activity retrieved', { activities });
});

module.exports = exports;
