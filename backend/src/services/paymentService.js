/**
 * Payment Service - Business Logic Layer
 * Handles payment processing logic separate from controller
 */

const { stripe, convertToStripeAmount, validateAmount, validateCurrency } = require('../config/stripe');
const StripePayment = require('../models/StripePayment');
const Invoice = require('../models/Invoice');

/**
 * Create a payment intent for an invoice
 */
exports.createPaymentIntent = async ({ invoiceId, amount, currency, customerId, tenantId, saveCard = false, metadata = {} }) => {
  // Validate inputs
  validateCurrency(currency);
  validateAmount(amount, currency);

  // Get invoice
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Verify invoice belongs to customer and tenant
  if (invoice.customerId.toString() !== customerId.toString()) {
    throw new Error('Unauthorized access to invoice');
  }
  
  if (invoice.tenantId.toString() !== tenantId.toString()) {
    throw new Error('Unauthorized access to invoice');
  }

  // Check if amount is valid for this invoice
  const outstandingBalance = invoice.balance || (invoice.total - (invoice.amountPaid || 0));
  if (amount > outstandingBalance) {
    throw new Error(`Payment amount (${amount}) exceeds outstanding balance (${outstandingBalance})`);
  }

  // Convert to Stripe amount (smallest currency unit)
  const stripeAmount = convertToStripeAmount(amount, currency);

  // Create payment intent in Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: stripeAmount,
    currency: currency.toLowerCase(),
    metadata: {
      invoiceId: invoiceId.toString(),
      customerId: customerId.toString(),
      tenantId: tenantId.toString(),
      ...metadata,
    },
    setup_future_usage: saveCard ? 'off_session' : undefined,
  });

  // Create payment record in database
  const payment = await StripePayment.create({
    tenantId,
    invoiceId,
    customerId,
    bookingId: invoice.bookingId,
    stripePaymentIntentId: paymentIntent.id,
    amount,
    currency: currency.toUpperCase(),
    status: 'pending',
    description: `Payment for invoice ${invoice.invoiceNumber}`,
    savePaymentMethod: saveCard,
    metadata,
  });

  return {
    payment,
    paymentIntent,
    clientSecret: paymentIntent.client_secret,
  };
};

/**
 * Get payment by payment intent ID
 */
exports.getPaymentByIntentId = async (paymentIntentId) => {
  const payment = await StripePayment.findOne({ stripePaymentIntentId: paymentIntentId })
    .populate('invoiceId')
    .populate('customerId', 'firstName lastName email');
  
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  return payment;
};

/**
 * Update invoice after successful payment
 */
exports.updateInvoiceAfterPayment = async (payment) => {
  const invoice = await Invoice.findById(payment.invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Add payment to invoice payments array
  invoice.payments = invoice.payments || [];
  invoice.payments.push({
    amount: payment.amount,
    paymentDate: payment.paidAt,
    paymentMethod: payment.paymentMethod.type === 'card' 
      ? `${payment.paymentMethod.card.brand} ending in ${payment.paymentMethod.card.last4}`
      : payment.paymentMethod.type,
    transactionId: payment.stripeChargeId,
    notes: `Online payment via Stripe - Receipt: ${payment.receiptNumber}`,
  });

  // Update amounts
  invoice.amountPaid = (invoice.amountPaid || 0) + payment.amount;
  invoice.balance = invoice.total - invoice.amountPaid;

  // Update status if fully paid
  if (invoice.balance <= 0) {
    invoice.status = 'paid';
    invoice.paidDate = payment.paidAt;
  } else if (invoice.amountPaid > 0) {
    invoice.status = 'partial';
  }

  await invoice.save();
  return invoice;
};

/**
 * Get payment history for an invoice
 */
exports.getPaymentHistory = async (invoiceId, tenantId) => {
  const payments = await StripePayment.find({
    invoiceId,
    tenantId,
  }).sort({ createdAt: -1 });

  return payments;
};

/**
 * Get payment history for a customer
 */
exports.getCustomerPaymentHistory = async (customerId, tenantId) => {
  const payments = await StripePayment.find({
    customerId,
    tenantId,
    status: 'succeeded',
  })
    .populate('invoiceId', 'invoiceNumber total')
    .sort({ paidAt: -1 })
    .limit(50);

  return payments;
};

/**
 * Process refund for a payment
 */
exports.processRefund = async (paymentId, refundAmount, reason, userId) => {
  const payment = await StripePayment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'succeeded') {
    throw new Error('Can only refund successful payments');
  }

  // Process refund
  const refund = await payment.processRefund(refundAmount, reason, userId);

  // Update invoice if needed
  const invoice = await Invoice.findById(payment.invoiceId);
  if (invoice) {
    invoice.amountPaid = (invoice.amountPaid || 0) - refundAmount;
    invoice.balance = invoice.total - invoice.amountPaid;
    
    // Revert status if needed
    if (invoice.status === 'paid' && invoice.balance > 0) {
      invoice.status = invoice.amountPaid > 0 ? 'partial' : 'pending';
    }
    
    await invoice.save();
  }

  return { payment, refund };
};
