const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const paymentGatewayService = require('../services/paymentGatewayService');
const { ValidationError, NotFoundError, ForbiddenError, AppError } = require('../lib/errors');
const logger = require('../lib/logger');

/**
 * Get all payments with filtering
 * GET /api/v1/payments
 */
const getAllPayments = async (req, res) => {
  const tenantId = req.user.tenant;
  const userId = req.userId;
  const userRole = req.user.role;
  const {
    status,
    method,
    startDate,
    endDate,
    bookingId,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { tenant: tenantId };

  // Status filter
  if (status) filter.status = status;

  // Method filter
  if (method) filter.method = method;

  // Booking filter
  if (bookingId) filter.booking = bookingId;

  // Date range filter
  if (startDate || endDate) {
    filter.completedAt = {};
    if (startDate) filter.completedAt.$gte = new Date(startDate);
    if (endDate) filter.completedAt.$lte = new Date(endDate);
  }

  // Search by transaction ID or customer
  if (search) {
    filter.$or = [
      { transactionId: { $regex: search, $options: 'i' } },
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'customer.email': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('booking', 'bookingNumber customer travelStartDate')
      .populate('processedBy', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Payment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: payments,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

/**
 * Get payment by ID
 * GET /api/v1/payments/:id
 */
const getPayment = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenant;

  const payment = await Payment.findOne({ _id: id, tenant: tenantId })
    .populate('booking')
    .populate('processedBy', 'firstName lastName email')
    .populate('refund.refundedBy', 'firstName lastName');

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  res.json({
    success: true,
    data: payment,
  });
};

/**
 * Create payment
 * POST /api/v1/payments
 */
const createPayment = async (req, res) => {
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const paymentData = req.body;

  // Validate booking exists
  const booking = await Booking.findOne({
    _id: paymentData.booking,
    tenant: tenantId,
  });

  if (!booking) {
    throw new ValidationError('Booking not found', 'BOOKING_NOT_FOUND');
  }

  // Generate transaction ID
  const transactionId = await Payment.generateTransactionId(tenantId);

  // Create payment
  const payment = await Payment.create({
    ...paymentData,
    transactionId,
    tenant: tenantId,
    processedBy: userId,
    customer: {
      name: paymentData.customer?.name || booking.customer.name,
      email: paymentData.customer?.email || booking.customer.email,
    },
  });

  // If payment is completed, update booking
  if (payment.status === 'completed') {
    booking.addPayment({
      amount: payment.amount,
      method: payment.method,
      status: 'completed',
      transactionId: payment.transactionId,
      paidAt: payment.completedAt || new Date(),
    });
    await booking.save();
  }

  const populated = await Payment.findById(payment._id)
    .populate('booking', 'bookingNumber customer')
    .populate('processedBy', 'firstName lastName email');

  logger.info('Payment created', {
    paymentId: payment._id,
    transactionId,
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
 * Update payment status
 * PATCH /api/v1/payments/:id/status
 */
const updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const { status, gatewayData, failureReason, failureCode } = req.body;

  const payment = await Payment.findOne({ _id: id, tenant: tenantId });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  // Update status based on new status
  if (status === 'completed') {
    payment.markCompleted(gatewayData);
    
    // Update booking payment
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.addPayment({
        amount: payment.amount,
        method: payment.method,
        status: 'completed',
        transactionId: payment.transactionId,
        paidAt: new Date(),
      });
      await booking.save();
    }
  } else if (status === 'failed') {
    payment.markFailed(failureReason, failureCode);
  } else {
    payment.status = status;
  }

  await payment.save();

  const populated = await Payment.findById(payment._id)
    .populate('booking', 'bookingNumber')
    .populate('processedBy', 'firstName lastName');

  logger.info('Payment status updated', {
    paymentId: payment._id,
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
 * Process refund
 * POST /api/v1/payments/:id/refund
 */
const processRefund = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const { refundAmount, reason, refundTransactionId } = req.body;

  const payment = await Payment.findOne({ _id: id, tenant: tenantId });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.status !== 'completed') {
    throw new ValidationError('Can only refund completed payments', 'INVALID_STATUS');
  }

  // Process refund
  payment.processRefund(refundAmount, reason, userId, refundTransactionId);
  await payment.save();

  // Update booking if needed
  const booking = await Booking.findById(payment.booking);
  if (booking) {
    // Recalculate payment status
    booking.updatePaymentStatus();
    await booking.save();
  }

  const populated = await Payment.findById(payment._id)
    .populate('booking', 'bookingNumber')
    .populate('refund.refundedBy', 'firstName lastName');

  logger.info('Payment refunded', {
    paymentId: payment._id,
    refundAmount: refundAmount || payment.amount,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: populated,
  });
};

/**
 * Get payment statistics
 * GET /api/v1/payments/stats
 */
const getPaymentStats = async (req, res) => {
  const tenantId = req.user.tenant;
  const { startDate, endDate } = req.query;

  const [
    revenueStats,
    revenueByMethod,
    statusBreakdown,
  ] = await Promise.all([
    Payment.getRevenueStats(tenantId, startDate, endDate),
    Payment.getRevenueByMethod(tenantId),
    Payment.aggregate([
      { $match: { tenant: tenantId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      revenue: revenueStats,
      byMethod: revenueByMethod.reduce((acc, item) => {
        acc[item._id] = {
          revenue: item.totalRevenue,
          count: item.count,
        };
        return acc;
      }, {}),
      byStatus: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    },
  });
};

/**
 * Create payment intent (Stripe)
 * POST /api/v1/payments/create-intent
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { invoiceId, paymentMethodTypes, captureMethod } = req.body;

    // Find invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      tenant: req.user.tenant,
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      throw new AppError('Invoice is already paid', 400);
    }

    // Create payment intent
    const paymentIntent = await paymentGatewayService.createPaymentIntent(invoice, {
      paymentMethodTypes,
      captureMethod,
      metadata: {
        userId: req.user._id.toString(),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      },
      message: 'Payment intent created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Stripe webhook
 * POST /api/v1/payments/webhooks/stripe
 */
const handleStripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.rawBody; // Needs raw body for signature verification

    if (!signature) {
      throw new AppError('Missing stripe-signature header', 400);
    }

    if (!rawBody) {
      throw new AppError('Missing raw body for webhook verification', 400);
    }

    // Verify webhook signature
    const event = paymentGatewayService.verifyWebhookSignature(rawBody, signature);

    // Handle event
    await paymentGatewayService.handleWebhookEvent(event);

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error', {
      error: error.message,
    });
    next(error);
  }
};

/**
 * Process refund via Stripe
 * POST /api/v1/payments/:id/refund
 */
const processStripeRefund = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const paymentId = req.params.id;

    // Find payment
    const payment = await Payment.findOne({
      _id: paymentId,
      tenant: req.user.tenant,
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (!payment.stripePaymentIntentId) {
      throw new AppError('Payment was not processed through Stripe', 400);
    }

    if (payment.status === 'refunded') {
      throw new AppError('Payment is already refunded', 400);
    }

    // Create refund
    const refund = await paymentGatewayService.refundPayment(
      payment.stripePaymentIntentId,
      amount,
      reason || 'requested_by_customer'
    );

    // Update payment
    payment.status = 'refunded';
    payment.refundedAmount = refund.amount / 100;
    payment.refundedAt = new Date();
    payment.notes = payment.notes 
      ? `${payment.notes}\n\nRefund: ${refund.id}` 
      : `Refund: ${refund.id}`;
    await payment.save();

    // Update invoice
    if (payment.invoice) {
      const invoice = await Invoice.findById(payment.invoice);
      if (invoice) {
        invoice.refund(refund.amount / 100, reason || 'Refund processed');
        await invoice.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          currency: refund.currency,
          status: refund.status,
        },
        payment,
      },
      message: 'Refund processed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment intent status
 * GET /api/v1/payments/intent/:paymentIntentId
 */
const getPaymentIntentStatus = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await paymentGatewayService.getPaymentIntent(paymentIntentId);

    res.status(200).json({
      success: true,
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPayments,
  getPayment,
  createPayment,
  updatePaymentStatus,
  processRefund,
  getPaymentStats,
  createPaymentIntent,
  handleStripeWebhook,
  processStripeRefund,
  getPaymentIntentStatus,
};
