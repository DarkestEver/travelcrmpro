/**
 * Customer Portal Invoice Controller
 * Handles customer invoice viewing and payment history
 */

const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/response');
const Invoice = require('../../models/Invoice');

/**
 * @desc    Get all invoices for customer
 * @route   GET /api/v1/customer/invoices
 * @access  Private (Customer)
 */
exports.getInvoices = asyncHandler(async (req, res) => {
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
    query.status = status;
  }

  if (search) {
    query.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { 'booking.bookingNumber': { $regex: search, $options: 'i' } },
    ];
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate('agentId', 'agencyName contactPerson email phone')
      .populate('bookingId', 'bookingNumber')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Invoice.countDocuments(query),
  ]);

  successResponse(res, 200, 'Invoices retrieved successfully', {
    invoices,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get invoice details by ID
 * @route   GET /api/v1/customer/invoices/:id
 * @access  Private (Customer)
 */
exports.getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const invoice = await Invoice.findOne({
    _id: id,
    customerId,
    tenantId,
  })
    .populate('agentId', 'agencyName contactPerson email phone address logo')
    .populate('bookingId', 'bookingNumber')
    .lean();

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  successResponse(res, 200, 'Invoice details retrieved', {
    invoice,
  });
});

/**
 * @desc    Get payment history for customer
 * @route   GET /api/v1/customer/invoices/payments/history
 * @access  Private (Customer)
 */
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  // Get all invoices with payments
  const invoices = await Invoice.find({
    customerId,
    tenantId,
    'payments.0': { $exists: true }, // Has at least one payment
  })
    .select('invoiceNumber payments total status createdAt')
    .populate('bookingId', 'bookingNumber')
    .sort({ createdAt: -1 })
    .lean();

  // Extract and flatten all payments
  const payments = [];
  invoices.forEach((invoice) => {
    invoice.payments.forEach((payment) => {
      payments.push({
        ...payment,
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice._id,
        bookingNumber: invoice.bookingId?.bookingNumber,
      });
    });
  });

  // Sort payments by date (most recent first)
  payments.sort((a, b) => new Date(b.paidAt || b.date) - new Date(a.paidAt || a.date));

  successResponse(res, 200, 'Payment history retrieved', {
    payments,
  });
});

/**
 * @desc    Get invoice PDF
 * @route   GET /api/v1/customer/invoices/:id/pdf
 * @access  Private (Customer)
 */
exports.getInvoicePDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const invoice = await Invoice.findOne({
    _id: id,
    customerId,
    tenantId,
  })
    .populate('agentId', 'agencyName contactPerson email phone address logo')
    .populate('customerId', 'firstName lastName email phone address')
    .populate('bookingId', 'bookingNumber')
    .lean();

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  // Return invoice data (frontend will generate PDF)
  successResponse(res, 200, 'Invoice PDF data retrieved', {
    invoice,
  });
});

/**
 * @desc    Get invoice summary statistics
 * @route   GET /api/v1/customer/invoices/summary
 * @access  Private (Customer)
 */
exports.getInvoiceSummary = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const tenantId = req.user.tenantId;

  const summary = await Invoice.aggregate([
    { $match: { customerId, tenantId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        totalPaid: { $sum: '$amountPaid' },
        totalDue: { $sum: '$amountDue' },
      },
    },
  ]);

  // Calculate totals
  const totals = {
    allInvoices: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalDue: 0,
    byStatus: {},
  };

  summary.forEach((item) => {
    totals.allInvoices += item.count;
    totals.totalAmount += item.totalAmount;
    totals.totalPaid += item.totalPaid;
    totals.totalDue += item.totalDue;
    totals.byStatus[item._id] = {
      count: item.count,
      amount: item.totalAmount,
      paid: item.totalPaid,
      due: item.totalDue,
    };
  });

  successResponse(res, 200, 'Invoice summary retrieved', {
    summary: totals,
  });
});

module.exports = exports;
