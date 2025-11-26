const Query = require('../models/Query');
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Document = require('../models/Document');
const Review = require('../models/Review');
const { NotFoundError, ForbiddenError } = require('../lib/errors');

/**
 * Customer Portal Controller
 * Self-service endpoints for customers
 */

/**
 * Get customer dashboard
 * GET /customer/dashboard
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const customerId = req.user._id;
    const tenantId = req.user.tenant;

    // Get upcoming bookings
    const upcomingBookings = await Booking.find({
      tenant: tenantId,
      'customer.email': req.user.email,
      status: { $in: ['confirmed', 'pending'] },
      travelStartDate: { $gte: new Date() },
    })
      .sort('travelStartDate')
      .limit(5)
      .lean();

    // Get recent quotes
    const recentQuotes = await Quote.find({
      tenant: tenantId,
      'customer.email': req.user.email,
      status: { $in: ['draft', 'sent', 'viewed'] },
    })
      .sort('-createdAt')
      .limit(5)
      .lean();

    // Get pending payments
    const pendingPayments = await Payment.find({
      tenant: tenantId,
      'customer.email': req.user.email,
      status: { $in: ['pending', 'processing'] },
    })
      .populate('booking', 'bookingNumber')
      .sort('-createdAt')
      .limit(5)
      .lean();

    // Get expiring documents (within 90 days)
    const expiringDocuments = await Document.getExpiringDocuments(tenantId, 90)
      .where('customer').equals(customerId)
      .limit(10);

    // Calculate stats
    const totalBookings = await Booking.countDocuments({
      tenant: tenantId,
      'customer.email': req.user.email,
    });

    const totalSpentResult = await Booking.aggregate([
      {
        $match: {
          tenant: tenantId,
          'customer.email': req.user.email,
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.grandTotal' },
        },
      },
    ]);

    const totalSpent = totalSpentResult[0]?.total || 0;

    const documentsCount = await Document.countDocuments({
      tenant: tenantId,
      customer: customerId,
    });

    res.json({
      success: true,
      data: {
        upcomingBookings,
        recentQuotes,
        pendingPayments,
        expiringDocuments,
        stats: {
          totalBookings,
          totalSpent,
          documentsCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my queries
 * GET /customer/queries
 */
exports.getMyQueries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      tenant: req.user.tenant,
      'customer.email': req.user.email,
    };

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [queries, totalCount] = await Promise.all([
      Query.find(query)
        .populate('assignedTo', 'firstName lastName')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Query.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        queries,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get query details
 * GET /customer/queries/:id
 */
exports.getQueryById = async (req, res, next) => {
  try {
    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      'customer.email': req.user.email,
    })
      .populate('assignedTo', 'firstName lastName email')
      .populate('quotes');

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    res.json({
      success: true,
      data: query,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new query
 * POST /customer/queries/create
 */
exports.createQuery = async (req, res, next) => {
  try {
    const queryNumber = await Query.generateQueryNumber(req.user.tenant);

    const queryData = {
      tenant: req.user.tenant,
      queryNumber,
      source: req.body.source || 'website',
      customer: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        phone: req.user.phone || req.body.phone,
      },
      tripDetails: {
        destination: req.body.destination,
        travelDates: req.body.travelDates,
        travelers: {
          adults: req.body.numberOfTravelers || 2,
        },
      },
      budget: req.body.budget,
      message: req.body.message,
      priority: req.body.priority || 'medium',
      createdBy: req.user._id,
    };

    const newQuery = new Query(queryData);
    newQuery.calculateSLA();
    await newQuery.save();

    res.status(201).json({
      success: true,
      data: newQuery,
      message: 'Query created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my quotes
 * GET /customer/quotes
 */
exports.getMyQuotes = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      tenant: req.user.tenant,
      'customer.email': req.user.email, // Customer is an embedded object, not a reference
    };

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [quotes, totalCount] = await Promise.all([
      Quote.find(query)
        .populate('itinerary', 'itineraryNumber destination')
        .populate('createdBy', 'firstName lastName')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Quote.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        quotes,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quote details
 * GET /customer/quotes/:id
 */
exports.getQuoteById = async (req, res, next) => {
  try {
    // First check if quote exists in tenant
    const quoteExists = await Quote.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!quoteExists) {
      throw new NotFoundError('Quote not found');
    }

    // Then check if it belongs to this customer
    const quote = await Quote.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      'customer.email': req.user.email,
    })
      .populate('itinerary')
      .populate('createdBy', 'firstName lastName email');

    if (!quote) {
      throw new ForbiddenError('Access denied to this quote');
    }

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my bookings
 * GET /customer/bookings
 */
exports.getMyBookings = async (req, res, next) => {
  try {
    const { status, upcoming, past, page = 1, limit = 20 } = req.query;

    const query = {
      tenant: req.user.tenant,
      'customer.email': req.user.email,
    };

    if (status) query.status = status;

    if (upcoming === 'true') {
      query.travelStartDate = { $gte: new Date() };
    }

    if (past === 'true') {
      query.travelEndDate = { $lt: new Date() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate('itinerary')
        .sort('-travelStartDate')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Booking.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking details
 * GET /customer/bookings/:id
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      'customer.email': req.user.email,
    })
      .populate('itinerary')
      .populate('quote');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my payments
 * GET /customer/payments
 */
exports.getMyPayments = async (req, res, next) => {
  try {
    const { status, bookingId, page = 1, limit = 20 } = req.query;

    const query = {
      tenant: req.user.tenant,
      'customer.email': req.user.email,
    };

    if (status) query.status = status;
    if (bookingId) query.booking = bookingId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, totalCount] = await Promise.all([
      Payment.find(query)
        .populate('booking', 'bookingNumber')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Payment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment details
 * GET /customer/payments/:id
 */
exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      'customer.email': req.user.email,
    })
      .populate('booking', 'bookingNumber customer')
      .populate('invoice');

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my documents
 * GET /customer/documents
 */
exports.getMyDocuments = async (req, res, next) => {
  try {
    const { documentType, bookingId, verificationStatus, page = 1, limit = 20 } = req.query;

    const query = {
      tenant: req.user.tenant,
      customer: req.user._id,
    };

    if (documentType) query.documentType = documentType;
    if (bookingId) query.booking = bookingId;
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [documents, totalCount] = await Promise.all([
      Document.find(query)
        .populate('booking', 'bookingNumber destination')
        .populate('verifiedBy', 'firstName lastName')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Document.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get expiring documents
 * GET /customer/documents/expiring
 */
exports.getExpiringDocuments = async (req, res, next) => {
  try {
    const { days = 90 } = req.query;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const documents = await Document.find({
      tenant: req.user.tenant,
      customer: req.user._id,
      expiryDate: { $lte: expiryDate, $gte: new Date() },
    })
      .populate('booking', 'bookingNumber')
      .sort('expiryDate');

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit review
 * POST /customer/reviews/submit
 */
exports.submitReview = async (req, res, next) => {
  try {
    const { bookingId, overallRating, ratings, reviewText, photos, highlights, wouldRecommend, traveledWith } = req.body;

    // First verify booking exists and belongs to customer
    const booking = await Booking.findOne({
      _id: bookingId,
      tenant: req.user.tenant,
      'customer.email': req.user.email,
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Then check if completed
    if (booking.status !== 'completed') {
      throw new ForbiddenError('Reviews can only be submitted for completed bookings');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      tenant: req.user.tenant,
      booking: bookingId,
    });

    if (existingReview) {
      throw new ForbiddenError('Review already submitted for this booking');
    }

    const review = new Review({
      tenant: req.user.tenant,
      customer: req.user._id,
      booking: bookingId,
      overallRating,
      ratings,
      reviewText,
      photos,
      highlights,
      wouldRecommend,
      traveledWith,
      tripDate: booking.travelStartDate,
      createdBy: req.user._id,
    });

    await review.save();

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my reviews
 * GET /customer/reviews
 */
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      tenant: req.user.tenant,
      customer: req.user._id,
    })
      .populate('booking', 'bookingNumber destination')
      .sort('-createdAt')
      .lean();

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payments for booking
 * GET /customer/bookings/:bookingId/payments
 */
exports.getBookingPayments = async (req, res, next) => {
  try {
    // Verify booking belongs to customer
    const booking = await Booking.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      'customer.email': req.user.email,
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const payments = await Payment.find({
      tenant: req.user.tenant,
      booking: req.params.id,
    })
      .sort('dueDate');

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};
