/**
 * Payment Intent Controller
 * Handles creating and confirming payment intents
 */

const paymentService = require('../../services/paymentService');
const { validateCurrency, validateAmount, formatAmount } = require('../../config/stripe');

/**
 * Create a payment intent for an invoice
 * POST /api/v1/customer/payments/create-intent
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { invoiceId, amount, currency = 'INR', saveCard = false, metadata = {} } = req.body;
    const customerId = req.customer._id;
    const tenantId = req.customer.tenantId;

    // Validate required fields
    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required',
      });
    }

    // Validate currency
    try {
      validateCurrency(currency);
      validateAmount(amount, currency);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Create payment intent
    const result = await paymentService.createPaymentIntent({
      invoiceId,
      amount,
      currency,
      customerId,
      tenantId,
      saveCard,
      metadata: {
        ...metadata,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        paymentId: result.payment._id,
        clientSecret: result.clientSecret,
        amount: result.payment.amount,
        currency: result.payment.currency,
        formattedAmount: formatAmount(result.payment.amount, result.payment.currency),
      },
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent',
    });
  }
};

/**
 * Get payment details
 * GET /api/v1/customer/payments/:id
 */
exports.getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer._id;

    const payment = await paymentService.getPaymentByIntentId(id);

    // Verify ownership
    if (payment.customerId._id.toString() !== customerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to payment',
      });
    }

    res.json({
      success: true,
      data: {
        payment: {
          id: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          formattedAmount: formatAmount(payment.amount, payment.currency),
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          receiptNumber: payment.receiptNumber,
          receiptUrl: payment.receiptUrl,
          paidAt: payment.paidAt,
          invoice: {
            id: payment.invoiceId._id,
            number: payment.invoiceId.invoiceNumber,
            total: payment.invoiceId.total,
          },
          customer: {
            name: `${payment.customerId.firstName} ${payment.customerId.lastName}`,
            email: payment.customerId.email,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment details',
    });
  }
};

/**
 * Get payment history for an invoice
 * GET /api/v1/customer/payments/invoice/:invoiceId
 */
exports.getInvoicePayments = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const tenantId = req.customer.tenantId;

    const payments = await paymentService.getPaymentHistory(invoiceId, tenantId);

    res.json({
      success: true,
      data: {
        payments: payments.map(p => ({
          id: p._id,
          amount: p.amount,
          currency: p.currency,
          formattedAmount: formatAmount(p.amount, p.currency),
          status: p.status,
          paymentMethod: p.paymentMethod,
          receiptNumber: p.receiptNumber,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
        total: payments.length,
      },
    });
  } catch (error) {
    console.error('Error fetching invoice payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment history',
    });
  }
};

/**
 * Get customer's payment history
 * GET /api/v1/customer/payments/history
 */
exports.getCustomerPayments = async (req, res) => {
  try {
    const customerId = req.customer._id;
    const tenantId = req.customer.tenantId;

    const payments = await paymentService.getCustomerPaymentHistory(customerId, tenantId);

    res.json({
      success: true,
      data: {
        payments: payments.map(p => ({
          id: p._id,
          amount: p.amount,
          currency: p.currency,
          formattedAmount: formatAmount(p.amount, p.currency),
          status: p.status,
          paymentMethod: p.paymentMethod,
          receiptNumber: p.receiptNumber,
          paidAt: p.paidAt,
          invoice: p.invoiceId ? {
            id: p.invoiceId._id,
            number: p.invoiceId.invoiceNumber,
            total: p.invoiceId.total,
          } : null,
        })),
        total: payments.length,
      },
    });
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment history',
    });
  }
};
