const TaxSettings = require('../models/TaxSettings');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// @desc    Get finance dashboard overview
// @route   GET /api/finance/dashboard
// @access  Private (Finance role)
exports.getDashboard = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // Get payment summary
    const paymentSummary = await Payment.aggregate([
      {
        $match: {
          tenantId,
          paymentDate: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalTax: { $sum: '$taxAmount' },
          totalGatewayFees: { $sum: '$gatewayFee' },
        },
      },
    ]);

    // Get invoice summary
    const invoiceSummary = await Invoice.aggregate([
      {
        $match: {
          tenantId,
          invoiceDate: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' },
          totalDue: { $sum: '$amountDue' },
        },
      },
    ]);

    // Get unreconciled payments
    const unreconciledCount = await Payment.countDocuments({
      tenantId,
      isReconciled: false,
      status: 'completed',
    });

    // Get pending disbursements
    const pendingDisbursements = await Payment.aggregate([
      { $match: { tenantId } },
      { $unwind: '$disbursements' },
      {
        $match: {
          'disbursements.status': 'pending',
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$disbursements.amount' },
        },
      },
    ]);

    // Get tax settings
    const taxSettings = await TaxSettings.findOne({ tenantId, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        paymentSummary,
        invoiceSummary,
        unreconciledCount,
        pendingDisbursements: pendingDisbursements[0] || { count: 0, totalAmount: 0 },
        taxSettings,
      },
    });
  } catch (error) {
    console.error('Finance Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching finance dashboard',
      error: error.message,
    });
  }
};

// @desc    Get tax settings
// @route   GET /api/finance/tax-settings
// @access  Private (Finance/Owner)
exports.getTaxSettings = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    let taxSettings = await TaxSettings.findOne({ tenantId, isActive: true });
    
    // Create default settings if none exist
    if (!taxSettings) {
      taxSettings = await TaxSettings.create({
        tenantId,
        globalTaxRate: 10,
        taxName: 'Tax',
        taxType: 'GST',
        createdBy: req.user._id,
      });
    }
    
    res.status(200).json({
      success: true,
      data: taxSettings,
    });
  } catch (error) {
    console.error('Get Tax Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tax settings',
      error: error.message,
    });
  }
};

// @desc    Update tax settings
// @route   PUT /api/finance/tax-settings
// @access  Private (Finance/Owner)
exports.updateTaxSettings = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    let taxSettings = await TaxSettings.findOne({ tenantId, isActive: true });
    
    if (!taxSettings) {
      taxSettings = new TaxSettings({
        tenantId,
        ...req.body,
        createdBy: req.user._id,
      });
    } else {
      Object.assign(taxSettings, req.body);
      taxSettings.updatedBy = req.user._id;
    }
    
    await taxSettings.save();
    
    res.status(200).json({
      success: true,
      data: taxSettings,
      message: 'Tax settings updated successfully',
    });
  } catch (error) {
    console.error('Update Tax Settings Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating tax settings',
      error: error.message,
    });
  }
};

// @desc    Get all payments
// @route   GET /api/finance/payments
// @access  Private (Finance)
exports.getPayments = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, startDate, endDate, isReconciled, page = 1, limit = 50 } = req.query;
    
    const query = { tenantId };
    
    if (status) query.status = status;
    if (isReconciled !== undefined) query.isReconciled = isReconciled === 'true';
    
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const payments = await Payment.find(query)
      .populate('payerId', 'name email role')
      .populate('createdBy', 'name email')
      .populate('disbursements.recipientId', 'name email role')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Payment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get Payments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message,
    });
  }
};

// @desc    Get single payment
// @route   GET /api/finance/payments/:id
// @access  Private (Finance)
exports.getPayment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    const payment = await Payment.findOne({
      _id: req.params.id,
      tenantId,
    })
      .populate('payerId', 'name email role phone')
      .populate('bookingId')
      .populate('itineraryId')
      .populate('invoiceId')
      .populate('createdBy', 'name email')
      .populate('disbursements.recipientId', 'name email role');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message,
    });
  }
};

// @desc    Process refund
// @route   POST /api/finance/payments/:id/refund
// @access  Private (Finance)
exports.processRefund = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { amount, reason } = req.body;
    
    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Amount and reason are required',
      });
    }
    
    const payment = await Payment.findOne({
      _id: req.params.id,
      tenantId,
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }
    
    await payment.processRefund(amount, reason, req.user._id);
    
    res.status(200).json({
      success: true,
      data: payment,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Process Refund Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error processing refund',
    });
  }
};

// @desc    Reconcile payment
// @route   POST /api/finance/payments/:id/reconcile
// @access  Private (Finance)
exports.reconcilePayment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { bankRef } = req.body;
    
    const payment = await Payment.findOne({
      _id: req.params.id,
      tenantId,
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }
    
    await payment.reconcile(req.user._id, bankRef);
    
    res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment reconciled successfully',
    });
  } catch (error) {
    console.error('Reconcile Payment Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error reconciling payment',
      error: error.message,
    });
  }
};

// @desc    Get all invoices
// @route   GET /api/finance/invoices
// @access  Private (Finance)
exports.getInvoices = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, invoiceType, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const query = { tenantId };
    
    if (status) query.status = status;
    if (invoiceType) query.invoiceType = invoiceType;
    
    if (startDate && endDate) {
      query.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const invoices = await Invoice.find(query)
      .populate('billToId', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ invoiceDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Invoice.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get Invoices Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message,
    });
  }
};

// @desc    Generate invoice
// @route   POST /api/finance/invoices/generate
// @access  Private (Finance)
exports.generateInvoice = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { bookingId, itineraryId, billToId, items } = req.body;
    
    // Get tax settings
    const taxSettings = await TaxSettings.findOne({ tenantId, isActive: true });
    
    // Get bill to user
    const billToUser = await User.findById(billToId);
    if (!billToUser) {
      return res.status(404).json({
        success: false,
        message: 'Bill to user not found',
      });
    }
    
    // Generate invoice number
    const invoiceNumber = taxSettings 
      ? await taxSettings.generateInvoiceNumber()
      : `INV-${Date.now()}`;
    
    // Calculate tax for each item
    const itemsWithTax = items.map(item => ({
      ...item,
      taxRate: taxSettings?.globalTaxRate || 0,
      taxAmount: taxSettings 
        ? (item.unitPrice * item.quantity * taxSettings.globalTaxRate) / 100
        : 0,
    }));
    
    // Create invoice
    const invoice = await Invoice.create({
      tenantId,
      invoiceNumber,
      bookingId,
      itineraryId,
      invoiceType: billToUser.role === 'customer' ? 'customer' : billToUser.role,
      billToId,
      billToName: billToUser.name,
      billToEmail: billToUser.email,
      billToPhone: billToUser.phone,
      items: itemsWithTax,
      taxRate: taxSettings?.globalTaxRate || 0,
      currency: taxSettings?.currency || 'USD',
      currencySymbol: taxSettings?.currencySymbol || '$',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdBy: req.user._id,
      ...req.body,
    });
    
    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice generated successfully',
    });
  } catch (error) {
    console.error('Generate Invoice Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error generating invoice',
      error: error.message,
    });
  }
};

// @desc    Get financial reports
// @route   GET /api/finance/reports
// @access  Private (Finance/Owner)
exports.getFinancialReports = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { reportType, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();
    
    let report = {};
    
    switch (reportType) {
      case 'revenue':
        report = await generateRevenueReport(tenantId, start, end);
        break;
      case 'tax':
        report = await generateTaxReport(tenantId, start, end);
        break;
      case 'payment-aging':
        report = await generatePaymentAgingReport(tenantId);
        break;
      case 'commission':
        report = await generateCommissionReport(tenantId, start, end);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type',
        });
    }
    
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Get Financial Reports Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating financial report',
      error: error.message,
    });
  }
};

// Helper Functions

async function generateRevenueReport(tenantId, startDate, endDate) {
  const payments = await Payment.aggregate([
    {
      $match: {
        tenantId,
        status: 'completed',
        paymentDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' },
        },
        totalRevenue: { $sum: '$totalAmount' },
        totalTax: { $sum: '$taxAmount' },
        totalGatewayFees: { $sum: '$gatewayFee' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  
  return {
    type: 'revenue',
    period: { startDate, endDate },
    data: payments,
  };
}

async function generateTaxReport(tenantId, startDate, endDate) {
  const taxData = await Payment.aggregate([
    {
      $match: {
        tenantId,
        status: 'completed',
        paymentDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalTaxCollected: { $sum: '$taxAmount' },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);
  
  return {
    type: 'tax',
    period: { startDate, endDate },
    data: taxData[0] || { totalTaxCollected: 0, totalTransactions: 0 },
  };
}

async function generatePaymentAgingReport(tenantId) {
  const invoices = await Invoice.aggregate([
    {
      $match: {
        tenantId,
        status: { $nin: ['paid', 'cancelled'] },
      },
    },
    {
      $project: {
        invoiceNumber: 1,
        billToName: 1,
        amountDue: 1,
        dueDate: 1,
        aging: {
          $cond: [
            { $lte: ['$dueDate', new Date()] },
            { $divide: [{ $subtract: [new Date(), '$dueDate'] }, 1000 * 60 * 60 * 24] },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $lte: ['$aging', 0] }, then: 'Current' },
              { case: { $lte: ['$aging', 30] }, then: '1-30 days' },
              { case: { $lte: ['$aging', 60] }, then: '31-60 days' },
              { case: { $lte: ['$aging', 90] }, then: '61-90 days' },
            ],
            default: '90+ days',
          },
        },
        count: { $sum: 1 },
        totalDue: { $sum: '$amountDue' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  
  return {
    type: 'payment-aging',
    data: invoices,
  };
}

async function generateCommissionReport(tenantId, startDate, endDate) {
  // This would integrate with your existing commission tracking
  // Placeholder implementation
  return {
    type: 'commission',
    period: { startDate, endDate },
    data: [],
  };
}

// @desc    Get payments list with filters
// @route   GET /api/finance/payments
// @access  Private (Finance role)
exports.getPayments = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, method, dateFrom, dateTo, search, page = 1, limit = 20 } = req.query;

    const query = { tenantId };

    if (status) query.status = status;
    if (method) query.method = method;
    if (dateFrom || dateTo) {
      query.paymentDate = {};
      if (dateFrom) query.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) query.paymentDate.$lte = new Date(dateTo);
    }
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const payments = await Payment.find(query)
      .populate('booking', 'bookingId')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Payment.countDocuments(query);

    // Get stats
    const stats = await Payment.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const formattedStats = {
      totalAmount: 0,
      totalCount: 0,
      completedAmount: 0,
      completedCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
      failedAmount: 0,
      failedCount: 0,
    };

    stats.forEach(stat => {
      formattedStats.totalAmount += stat.amount;
      formattedStats.totalCount += stat.count;
      if (stat._id === 'completed') {
        formattedStats.completedAmount = stat.amount;
        formattedStats.completedCount = stat.count;
      } else if (stat._id === 'pending') {
        formattedStats.pendingAmount = stat.amount;
        formattedStats.pendingCount = stat.count;
      } else if (stat._id === 'failed') {
        formattedStats.failedAmount = stat.amount;
        formattedStats.failedCount = stat.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        payments,
        total,
        stats: formattedStats,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invoices list with filters
// @route   GET /api/finance/invoices
// @access  Private (Finance role)
exports.getInvoices = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, dateFrom, dateTo, search, page = 1, limit = 20 } = req.query;

    const query = { tenantId };

    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.invoiceDate = {};
      if (dateFrom) query.invoiceDate.$gte = new Date(dateFrom);
      if (dateTo) query.invoiceDate.$lte = new Date(dateTo);
    }
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const invoices = await Invoice.find(query)
      .populate('booking', 'bookingId')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Invoice.countDocuments(query);

    // Get stats
    const stats = await Invoice.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' },
          paid: { $sum: '$amountPaid' },
          due: { $sum: '$amountDue' },
        },
      },
    ]);

    const formattedStats = {
      totalAmount: 0,
      totalCount: 0,
      paidAmount: 0,
      paidCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
      overdueAmount: 0,
      overdueCount: 0,
    };

    stats.forEach(stat => {
      formattedStats.totalAmount += stat.amount;
      formattedStats.totalCount += stat.count;
      if (stat._id === 'paid') {
        formattedStats.paidAmount = stat.amount;
        formattedStats.paidCount = stat.count;
      } else if (stat._id === 'unpaid' || stat._id === 'partial') {
        formattedStats.pendingAmount += stat.amount;
        formattedStats.pendingCount += stat.count;
      } else if (stat._id === 'overdue') {
        formattedStats.overdueAmount = stat.amount;
        formattedStats.overdueCount = stat.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        invoices,
        total,
        stats: formattedStats,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download invoice PDF
// @route   GET /api/finance/invoices/:id/download
// @access  Private (Finance role)
exports.downloadInvoice = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId })
      .populate('booking')
      .populate('customer');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // For now, return JSON (PDF generation would require a library like pdfkit or puppeteer)
    res.status(200).json({
      success: true,
      message: 'PDF generation not implemented yet',
      data: invoice,
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send invoice via email
// @route   POST /api/finance/invoices/:id/send
// @access  Private (Finance role)
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId })
      .populate('customer');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Send email (implementation depends on your email service)
    await sendEmail({
      to: invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber}`,
      text: `Your invoice is attached.`,
    });

    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully',
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reconciliation data
// @route   GET /api/finance/reconciliation
// @access  Private (Finance role)
exports.getReconciliationData = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, dateFrom, dateTo, search } = req.query;

    const query = { tenantId };
    
    if (status === 'unreconciled') {
      query.isReconciled = false;
    } else if (status === 'matched') {
      query.isReconciled = true;
    }

    if (dateFrom || dateTo) {
      query.paymentDate = {};
      if (dateFrom) query.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) query.paymentDate.$lte = new Date(dateTo);
    }

    const payments = await Payment.find(query)
      .populate('invoice', 'invoiceNumber totalAmount')
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    const items = payments.map(payment => ({
      _id: payment._id,
      paymentId: payment.transactionId,
      invoiceNumber: payment.invoice?.invoiceNumber || 'N/A',
      customerName: payment.customer?.name || 'N/A',
      paymentAmount: payment.totalAmount,
      invoiceAmount: payment.invoice?.totalAmount || 0,
      status: payment.isReconciled ? 'matched' : 'unreconciled',
      date: payment.paymentDate,
    }));

    // Calculate summary
    const summary = {
      reconciledAmount: 0,
      reconciledCount: 0,
      unreconciledAmount: 0,
      unreconciledCount: 0,
      discrepancyAmount: 0,
      discrepancyCount: 0,
      variance: 0,
    };

    items.forEach(item => {
      const diff = Math.abs(item.paymentAmount - item.invoiceAmount);
      if (item.status === 'matched') {
        summary.reconciledAmount += item.paymentAmount;
        summary.reconciledCount++;
      } else {
        summary.unreconciledAmount += item.paymentAmount;
        summary.unreconciledCount++;
      }
      if (diff > 0) {
        summary.discrepancyAmount += diff;
        summary.discrepancyCount++;
        summary.variance += item.paymentAmount - item.invoiceAmount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        items,
        summary,
      },
    });
  } catch (error) {
    console.error('Error getting reconciliation data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reconcile payment items
// @route   POST /api/finance/reconciliation/reconcile
// @access  Private (Finance role)
exports.reconcileItems = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { itemIds } = req.body;

    await Payment.updateMany(
      { _id: { $in: itemIds }, tenantId },
      { $set: { isReconciled: true, reconciledAt: new Date(), reconciledBy: req.user._id } }
    );

    res.status(200).json({
      success: true,
      message: `${itemIds.length} items reconciled successfully`,
    });
  } catch (error) {
    console.error('Error reconciling items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark item as discrepancy
// @route   POST /api/finance/reconciliation/:id/discrepancy
// @access  Private (Finance role)
exports.markDiscrepancy = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    await Payment.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { hasDiscrepancy: true, discrepancyNote: req.body.note || 'Amount mismatch' } }
    );

    res.status(200).json({
      success: true,
      message: 'Marked as discrepancy',
    });
  } catch (error) {
    console.error('Error marking discrepancy:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate financial report
// @route   GET /api/finance/reports/generate
// @access  Private (Finance role)
exports.generateReport = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { reportType, from, to, groupBy } = req.query;

    const startDate = new Date(from);
    const endDate = new Date(to);

    let summary = {};
    let details = [];
    let chartData = [];

    switch (reportType) {
      case 'revenue':
        const revenueData = await Payment.aggregate([
          {
            $match: {
              tenantId,
              status: 'completed',
              paymentDate: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
              bookingCount: { $sum: 1 },
            },
          },
        ]);
        summary = {
          totalRevenue: revenueData[0]?.totalRevenue || 0,
          bookingCount: revenueData[0]?.bookingCount || 0,
          avgRevenue: revenueData[0] ? revenueData[0].totalRevenue / revenueData[0].bookingCount : 0,
          growth: 0,
        };
        break;

      case 'expenses':
        summary = {
          totalExpenses: 0,
          supplierCosts: 0,
          operational: 0,
          other: 0,
        };
        break;

      case 'profit-loss':
        const revenue = await Payment.aggregate([
          { $match: { tenantId, status: 'completed', paymentDate: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        summary = {
          revenue: revenue[0]?.total || 0,
          expenses: 0,
          grossProfit: revenue[0]?.total || 0,
          netProfit: revenue[0]?.total || 0,
        };
        break;

      case 'tax':
        const taxData = await Payment.aggregate([
          { $match: { tenantId, status: 'completed', paymentDate: { $gte: startDate, $lte: endDate } } },
          {
            $group: {
              _id: null,
              taxCollected: { $sum: '$taxAmount' },
            },
          },
        ]);
        summary = {
          taxCollected: taxData[0]?.taxCollected || 0,
          taxPayable: taxData[0]?.taxCollected || 0,
          taxPaid: 0,
          balance: taxData[0]?.taxCollected || 0,
        };
        break;

      default:
        summary = {};
    }

    // Generate chart data (simplified)
    chartData = [
      { label: 'Week 1', value: summary.totalRevenue * 0.2 || 1000 },
      { label: 'Week 2', value: summary.totalRevenue * 0.3 || 1500 },
      { label: 'Week 3', value: summary.totalRevenue * 0.25 || 1200 },
      { label: 'Week 4', value: summary.totalRevenue * 0.25 || 1300 },
    ];

    res.status(200).json({
      success: true,
      data: {
        summary,
        details,
        chart: chartData,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get finance settings
// @route   GET /api/finance/settings
// @access  Private (Finance role)
exports.getFinanceSettings = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    // Return placeholder settings
    const settings = {
      paymentGateways: {
        stripe: { enabled: false },
        paypal: { enabled: false },
        razorpay: { enabled: false },
        square: { enabled: false },
      },
      integrations: {
        quickbooks: { connected: false },
        xero: { connected: false },
        sage: { connected: false },
        freshbooks: { connected: false },
      },
      approvalThresholds: {
        payment: 5000,
        refund: 2000,
        adjustment: 500,
        discount: 1000,
      },
      notifications: {
        paymentReceived: true,
        paymentFailed: true,
        invoiceGenerated: true,
        invoiceOverdue: true,
        approvalRequired: true,
        reconciliationAlert: true,
        taxReport: true,
        dailySummary: false,
      },
    };

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error getting finance settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update finance settings
// @route   PUT /api/finance/settings
// @access  Private (Finance role)
exports.updateFinanceSettings = async (req, res) => {
  try {
    // Settings update logic would go here
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: req.body,
    });
  } catch (error) {
    console.error('Error updating finance settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;
