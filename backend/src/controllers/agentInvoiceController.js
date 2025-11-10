const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { generateInvoicePDF } = require('../services/invoicePdfService');
const emailService = require('../services/emailService');
const advancedNotificationService = require('../services/advancedNotificationService');
const path = require('path');

// @desc    Get invoice summary for agent
// @route   GET /api/v1/agent-portal/invoices/summary
// @access  Private/Agent
exports.getInvoiceSummary = asyncHandler(async (req, res) => {
  const summary = await Invoice.getAgentInvoicesSummary(
    req.user.tenantId,
    req.user._id
  );

  res.status(200).json({
    success: true,
    data: summary
  });
});

// @desc    Get all invoices for agent
// @route   GET /api/v1/agent-portal/invoices
// @access  Private/Agent
exports.getMyInvoices = asyncHandler(async (req, res) => {
  const { status, startDate, endDate, search, page = 1, limit = 10 } = req.query;

  const query = {
    tenantId: req.user.tenantId,
    agentId: req.user._id
  };

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.invoiceDate = {};
    if (startDate) query.invoiceDate.$gte = new Date(startDate);
    if (endDate) query.invoiceDate.$lte = new Date(endDate);
  }

  // Search by invoice number or customer name
  if (search) {
    const customers = await Customer.find({
      tenantId: req.user.tenantId,
      name: { $regex: search, $options: 'i' }
    }).select('_id');

    query.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { customerId: { $in: customers.map(c => c._id) } }
    ];
  }

  const skip = (page - 1) * limit;

  const invoices = await Invoice.find(query)
    .populate('customerId', 'name email phone')
    .populate('bookingId', 'bookingNumber destination')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments(query);

  res.status(200).json({
    success: true,
    count: invoices.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: invoices
  });
});

// @desc    Get single invoice
// @route   GET /api/v1/agent-portal/invoices/:id
// @access  Private/Agent
exports.getInvoiceById = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    tenantId: req.user.tenantId,
    agentId: req.user._id
  })
    .populate('customerId', 'name email phone address')
    .populate('bookingId', 'bookingNumber destination startDate endDate totalPrice');

  if (!invoice) {
    return next(new AppError('Invoice not found', 404));
  }

  res.status(200).json({
    success: true,
    data: invoice
  });
});

// @desc    Create invoice manually
// @route   POST /api/v1/agent-portal/invoices
// @access  Private/Agent
exports.createInvoice = asyncHandler(async (req, res, next) => {
  const {
    customerId,
    bookingId,
    items,
    dueDate,
    tax,
    discount,
    notes,
    terms
  } = req.body;

  // Verify customer belongs to agent
  const customer = await Customer.findOne({
    _id: customerId,
    tenantId: req.user.tenantId,
    createdBy: req.user._id
  });

  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  // If booking provided, verify it belongs to agent
  if (bookingId) {
    const booking = await Booking.findOne({
      _id: bookingId,
      tenantId: req.user.tenantId,
      agentId: req.user._id
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }
  }

  // Generate invoice number
  const invoiceNumber = await Invoice.generateInvoiceNumber(req.user.tenantId);

  // Calculate item amounts
  const processedItems = items.map(item => ({
    ...item,
    amount: item.quantity * item.unitPrice
  }));

  // Create invoice
  const invoice = await Invoice.create({
    tenantId: req.user.tenantId,
    agentId: req.user._id,
    customerId,
    bookingId: bookingId || null,
    invoiceNumber,
    invoiceDate: new Date(),
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    items: processedItems,
    tax: tax || 0,
    discount: discount || 0,
    notes,
    terms
  });

  // Populate for response
  await invoice.populate('customerId', 'name email phone');
  if (bookingId) {
    await invoice.populate('bookingId', 'bookingNumber destination');
  }

  res.status(201).json({
    success: true,
    data: invoice
  });
});

// @desc    Update invoice
// @route   PUT /api/v1/agent-portal/invoices/:id
// @access  Private/Agent
exports.updateInvoice = asyncHandler(async (req, res, next) => {
  let invoice = await Invoice.findOne({
    _id: req.params.id,
    tenantId: req.user.tenantId,
    agentId: req.user._id
  });

  if (!invoice) {
    return next(new AppError('Invoice not found', 404));
  }

  // Can only update draft invoices
  if (invoice.status !== 'draft') {
    return next(new AppError('Can only update draft invoices', 400));
  }

  const { items, dueDate, tax, discount, notes, terms } = req.body;

  // Update fields
  if (items) {
    invoice.items = items.map(item => ({
      ...item,
      amount: item.quantity * item.unitPrice
    }));
  }
  if (dueDate) invoice.dueDate = dueDate;
  if (tax !== undefined) invoice.tax = tax;
  if (discount !== undefined) invoice.discount = discount;
  if (notes !== undefined) invoice.notes = notes;
  if (terms !== undefined) invoice.terms = terms;

  await invoice.save();
  await invoice.populate('customerId', 'name email phone');

  res.status(200).json({
    success: true,
    data: invoice
  });
});

// @desc    Send invoice (mark as sent)
// @route   POST /api/v1/agent-portal/invoices/:id/send
// @access  Private/Agent
exports.sendInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    tenantId: req.user.tenantId,
    agentId: req.user._id
  }).populate('customer', 'name email');

  if (!invoice) {
    return next(new AppError('Invoice not found', 404));
  }

  if (invoice.status !== 'draft') {
    return next(new AppError('Invoice already sent', 400));
  }

  // Generate PDF
  const pdfPath = await generateInvoicePDF(invoice);

  // Send email to customer
  try {
    await emailService.sendInvoiceEmail({
      to: invoice.customer.email,
      customerName: invoice.customer.name,
      invoice,
      pdfPath
    });

    // Mark as sent after successful email
    await invoice.markAsSent();

    // Create notification for agent
    await advancedNotificationService.createInvoiceNotification({
      tenant: req.user.tenantId,
      user: req.user._id,
      invoice,
      action: 'sent'
    });

    res.status(200).json({
      success: true,
      data: invoice,
      message: 'Invoice sent successfully via email'
    });
  } catch (emailError) {
    console.error('Email send error:', emailError);
    // Even if email fails, we can mark as sent
    await invoice.markAsSent();
    
    res.status(200).json({
      success: true,
      data: invoice,
      message: 'Invoice marked as sent (email delivery failed)',
      warning: 'Email could not be delivered'
    });
  }
});

// @desc    Generate and download invoice PDF
// @route   GET /api/v1/agent-portal/invoices/:id/pdf
// @access  Private/Agent
exports.downloadInvoicePDF = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    tenantId: req.user.tenantId,
    agentId: req.user._id
  })
    .populate('customerId', 'name email phone address')
    .populate('bookingId', 'bookingNumber destination');

  if (!invoice) {
    return next(new AppError('Invoice not found', 404));
  }

  // Get tenant and agent info
  const tenant = await User.findById(req.user.tenantId);
  const agent = await User.findById(req.user._id);

  // Generate PDF
  const pdfPath = await generateInvoicePDF(invoice, tenant, agent);

  // Update invoice with PDF URL
  invoice.pdfUrl = `/uploads/invoices/invoice-${invoice.invoiceNumber}.pdf`;
  await invoice.save();

  // Send file
  res.download(pdfPath, `invoice-${invoice.invoiceNumber}.pdf`);
});

// @desc    Record payment for invoice
// @route   POST /api/v1/agent-portal/invoices/:id/payment
// @access  Private/Agent
exports.recordPayment = asyncHandler(async (req, res, next) => {
  const { amount, paymentMethod = 'Credit Card' } = req.body;

  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid payment amount', 400));
  }

  const invoice = await Invoice.findOne({
    _id: req.params.id,
    tenantId: req.user.tenantId,
    agentId: req.user._id
  }).populate('customerId', 'name email');

  if (!invoice) {
    return next(new AppError('Invoice not found', 404));
  }

  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    return next(new AppError('Cannot record payment for this invoice', 400));
  }

  if (amount > invoice.amountDue) {
    return next(new AppError('Payment amount exceeds amount due', 400));
  }

  await invoice.recordPayment(amount);

  // Send payment receipt email to customer
  try {
    if (invoice.customerId && invoice.customerId.email) {
      const emailService = require('../services/emailService');
      const advancedNotificationService = require('../services/advancedNotificationService');
      
      const paymentData = {
        amount,
        paymentDate: new Date(),
        method: paymentMethod
      };

      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        amountDue: invoice.amountDue
      };

      // Send payment receipt email
      await emailService.sendPaymentReceiptEmail({
        to: invoice.customerId.email,
        customerName: invoice.customerId.name,
        payment: paymentData,
        invoice: invoiceData
      });

      // Create notification for agent
      await advancedNotificationService.createNotification({
        userId: req.user._id,
        tenantId: req.user.tenantId,
        type: 'payment',
        priority: 'normal',
        title: 'Payment Received',
        message: `Payment of $${amount.toFixed(2)} received for invoice ${invoice.invoiceNumber}`,
        metadata: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount,
          customerId: invoice.customerId._id,
          customerName: invoice.customerId.name
        },
        link: `/agent/invoices/${invoice._id}`
      });

      console.log('✅ Payment receipt email sent to:', invoice.customerId.email);
    }
  } catch (emailError) {
    console.error('❌ Failed to send payment receipt email:', emailError);
    // Don't fail the payment recording if email fails
  }

  res.status(200).json({
    success: true,
    data: invoice,
    message: 'Payment recorded successfully'
  });
});

// @desc    Cancel invoice
// @route   POST /api/v1/agent-portal/invoices/:id/cancel
// @access  Private/Agent
exports.cancelInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    tenantId: req.user.tenantId,
    agentId: req.user._id
  });

  if (!invoice) {
    return next(new AppError('Invoice not found', 404));
  }

  if (invoice.status === 'paid') {
    return next(new AppError('Cannot cancel paid invoice', 400));
  }

  await invoice.cancel();

  res.status(200).json({
    success: true,
    data: invoice,
    message: 'Invoice cancelled successfully'
  });
});

// @desc    Delete invoice
// @route   DELETE /api/v1/agent-portal/invoices/:id
// @access  Private/Agent
exports.deleteInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    tenantId: req.user.tenantId,
    agentId: req.user._id
  });

  if (!invoice) {
    return next(new AppError('Invoice not found', 404));
  }

  // Can only delete draft invoices
  if (invoice.status !== 'draft') {
    return next(new AppError('Can only delete draft invoices', 400));
  }

  await invoice.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Invoice deleted successfully'
  });
});
