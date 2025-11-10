/**
 * Payment Refund Controller
 * Handles refund processing (agent access only)
 */

const paymentService = require('../../services/paymentService');
const { formatAmount } = require('../../config/stripe');

/**
 * Process a refund for a payment
 * POST /api/v1/payments/:id/refund
 */
exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid refund amount is required',
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Refund reason is required',
      });
    }

    // Process refund
    const result = await paymentService.processRefund(id, amount, reason, userId);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        payment: {
          id: result.payment._id,
          status: result.payment.status,
          refunded: result.payment.refunded,
          refundAmount: result.payment.refundAmount,
          formattedRefundAmount: formatAmount(result.payment.refundAmount, result.payment.currency),
          refundedAt: result.payment.refundedAt,
          refundReason: result.payment.refundReason,
        },
        refund: {
          id: result.refund.id,
          status: result.refund.status,
        },
      },
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund',
    });
  }
};

/**
 * Get payment details (agent view with more info)
 * GET /api/v1/payments/:id
 */
exports.getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const payment = await paymentService.getPaymentByIntentId(id);

    // Verify tenant access
    if (payment.tenantId.toString() !== tenantId.toString()) {
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
          stripePaymentIntentId: payment.stripePaymentIntentId,
          stripeChargeId: payment.stripeChargeId,
          amount: payment.amount,
          currency: payment.currency,
          formattedAmount: formatAmount(payment.amount, payment.currency),
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          receiptNumber: payment.receiptNumber,
          receiptUrl: payment.receiptUrl,
          paidAt: payment.paidAt,
          failureReason: payment.failureReason,
          failureCode: payment.failureCode,
          refunded: payment.refunded,
          refundAmount: payment.refundAmount,
          refundedAt: payment.refundedAt,
          refundReason: payment.refundReason,
          ipAddress: payment.ipAddress,
          userAgent: payment.userAgent,
          metadata: payment.metadata,
          createdAt: payment.createdAt,
          invoice: payment.invoiceId ? {
            id: payment.invoiceId._id,
            number: payment.invoiceId.invoiceNumber,
            total: payment.invoiceId.total,
            status: payment.invoiceId.status,
          } : null,
          customer: payment.customerId ? {
            id: payment.customerId._id,
            name: `${payment.customerId.firstName} ${payment.customerId.lastName}`,
            email: payment.customerId.email,
          } : null,
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
 * Get all payments for tenant
 * GET /api/v1/payments
 */
exports.getAllPayments = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, startDate, endDate, customerId, invoiceId } = req.query;

    // Build query
    const query = { tenantId };
    
    if (status) {
      query.status = status;
    }
    
    if (customerId) {
      query.customerId = customerId;
    }
    
    if (invoiceId) {
      query.invoiceId = invoiceId;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const payments = await require('../../models/StripePayment')
      .find(query)
      .populate('customerId', 'firstName lastName email')
      .populate('invoiceId', 'invoiceNumber total status')
      .sort({ createdAt: -1 })
      .limit(100);

    // Calculate totals
    const totalAmount = payments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunded = payments
      .filter(p => p.refunded)
      .reduce((sum, p) => sum + p.refundAmount, 0);

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
          refunded: p.refunded,
          refundAmount: p.refundAmount,
          customer: p.customerId ? {
            id: p.customerId._id,
            name: `${p.customerId.firstName} ${p.customerId.lastName}`,
            email: p.customerId.email,
          } : null,
          invoice: p.invoiceId ? {
            id: p.invoiceId._id,
            number: p.invoiceId.invoiceNumber,
            total: p.invoiceId.total,
            status: p.invoiceId.status,
          } : null,
          createdAt: p.createdAt,
        })),
        summary: {
          total: payments.length,
          totalAmount,
          totalRefunded,
          netAmount: totalAmount - totalRefunded,
          currency: 'INR', // TODO: Support multiple currencies in summary
        },
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payments',
    });
  }
};
