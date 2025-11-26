const Stripe = require('stripe');
const config = require('../config');
const logger = require('../lib/logger');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

/**
 * Payment Gateway Service
 * Handles Stripe payment processing, webhooks, and refunds
 */

class PaymentGatewayService {
  constructor() {
    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || config.stripe?.secretKey, {
      apiVersion: '2023-10-16',
    });
    
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || config.stripe?.webhookSecret;
  }

  /**
   * Create payment intent for invoice
   * @param {Object} invoice - Invoice object
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Stripe PaymentIntent
   */
  async createPaymentIntent(invoice, options = {}) {
    try {
      const {
        customerId,
        paymentMethodTypes = ['card'],
        captureMethod = 'automatic',
        metadata = {},
      } = options;

      logger.info('Creating Stripe payment intent', {
        invoiceId: invoice._id,
        amount: invoice.total,
        currency: invoice.currency,
      });

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(invoice.total * 100), // Convert to cents
        currency: invoice.currency.toLowerCase(),
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        capture_method: captureMethod,
        metadata: {
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          tenantId: invoice.tenant.toString(),
          bookingId: invoice.booking?.toString(),
          ...metadata,
        },
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.customer.name}`,
        receipt_email: invoice.customer.email,
      });

      // Update invoice with payment intent
      invoice.stripePaymentIntentId = paymentIntent.id;
      invoice.stripePaymentStatus = paymentIntent.status;
      await invoice.save();

      logger.info('Payment intent created successfully', {
        paymentIntentId: paymentIntent.id,
        invoiceId: invoice._id,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent', {
        error: error.message,
        invoiceId: invoice._id,
      });
      throw error;
    }
  }

  /**
   * Capture payment intent (for manual capture)
   * @param {String} paymentIntentId - Stripe PaymentIntent ID
   * @param {Number} amount - Amount to capture (optional)
   * @returns {Promise<Object>} Updated PaymentIntent
   */
  async capturePayment(paymentIntentId, amount = null) {
    try {
      logger.info('Capturing payment intent', { paymentIntentId, amount });

      const captureOptions = amount 
        ? { amount_to_capture: Math.round(amount * 100) }
        : {};

      const paymentIntent = await this.stripe.paymentIntents.capture(
        paymentIntentId,
        captureOptions
      );

      logger.info('Payment captured successfully', {
        paymentIntentId,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to capture payment', {
        error: error.message,
        paymentIntentId,
      });
      throw error;
    }
  }

  /**
   * Cancel payment intent
   * @param {String} paymentIntentId - Stripe PaymentIntent ID
   * @returns {Promise<Object>} Canceled PaymentIntent
   */
  async cancelPayment(paymentIntentId) {
    try {
      logger.info('Canceling payment intent', { paymentIntentId });

      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);

      logger.info('Payment canceled successfully', { paymentIntentId });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to cancel payment', {
        error: error.message,
        paymentIntentId,
      });
      throw error;
    }
  }

  /**
   * Create refund for payment
   * @param {String} paymentIntentId - Stripe PaymentIntent ID
   * @param {Number} amount - Amount to refund (optional, defaults to full refund)
   * @param {String} reason - Refund reason
   * @returns {Promise<Object>} Stripe Refund object
   */
  async refundPayment(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      logger.info('Creating refund', {
        paymentIntentId,
        amount,
        reason,
      });

      const refundOptions = {
        payment_intent: paymentIntentId,
        reason,
      };

      if (amount) {
        refundOptions.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundOptions);

      logger.info('Refund created successfully', {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      });

      return refund;
    } catch (error) {
      logger.error('Failed to create refund', {
        error: error.message,
        paymentIntentId,
      });
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * @param {String} payload - Raw request body
   * @param {String} signature - Stripe signature header
   * @returns {Object} Verified event object
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      logger.info('Webhook signature verified', {
        eventType: event.type,
        eventId: event.id,
      });

      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe event object
   * @returns {Promise<void>}
   */
  async handleWebhookEvent(event) {
    logger.info('Processing webhook event', {
      type: event.type,
      id: event.id,
    });

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object);
          break;

        case 'charge.dispute.created':
          await this.handleDispute(event.data.object);
          break;

        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }
    } catch (error) {
      logger.error('Error handling webhook event', {
        error: error.message,
        eventType: event.type,
        eventId: event.id,
      });
      throw error;
    }
  }

  /**
   * Handle successful payment
   * @private
   */
  async handlePaymentSuccess(paymentIntent) {
    const invoiceId = paymentIntent.metadata.invoiceId;
    const tenantId = paymentIntent.metadata.tenantId;

    logger.info('Processing successful payment', {
      paymentIntentId: paymentIntent.id,
      invoiceId,
    });

    // Find invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      tenant: tenantId,
    });

    if (!invoice) {
      logger.error('Invoice not found for payment', { invoiceId });
      return;
    }

    // Update invoice
    const amount = paymentIntent.amount / 100;
    invoice.markAsPaid(amount, 'card');
    invoice.stripePaymentStatus = 'succeeded';
    await invoice.save();

    // Create payment record
    await Payment.create({
      tenant: tenantId,
      booking: invoice.booking,
      invoice: invoice._id,
      amount,
      currency: invoice.currency,
      method: 'card',
      status: 'completed',
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge,
      paidAt: new Date(),
      notes: `Payment via Stripe - ${paymentIntent.id}`,
    });

    // Update booking if linked
    if (invoice.booking) {
      const booking = await Booking.findById(invoice.booking);
      if (booking) {
        booking.pricing.paid += amount;
        booking.pricing.pending = booking.pricing.totalAmount - booking.pricing.paid;
        
        if (booking.pricing.paid >= booking.pricing.totalAmount) {
          booking.paymentStatus = 'paid';
        } else if (booking.pricing.paid > 0) {
          booking.paymentStatus = 'partial';
        }
        
        await booking.save();
      }
    }

    logger.info('Payment processed successfully', {
      invoiceId,
      amount,
    });
  }

  /**
   * Handle failed payment
   * @private
   */
  async handlePaymentFailed(paymentIntent) {
    const invoiceId = paymentIntent.metadata.invoiceId;
    const tenantId = paymentIntent.metadata.tenantId;

    logger.warn('Payment failed', {
      paymentIntentId: paymentIntent.id,
      invoiceId,
    });

    // Find invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      tenant: tenantId,
    });

    if (!invoice) {
      logger.error('Invoice not found for failed payment', { invoiceId });
      return;
    }

    // Update invoice
    invoice.stripePaymentStatus = 'failed';
    invoice.internalNotes = invoice.internalNotes
      ? `${invoice.internalNotes}\n\nPayment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
      : `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`;
    await invoice.save();

    // Create failed payment record
    await Payment.create({
      tenant: tenantId,
      booking: invoice.booking,
      invoice: invoice._id,
      amount: paymentIntent.amount / 100,
      currency: invoice.currency,
      method: 'card',
      status: 'failed',
      stripePaymentIntentId: paymentIntent.id,
      notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
    });
  }

  /**
   * Handle canceled payment
   * @private
   */
  async handlePaymentCanceled(paymentIntent) {
    const invoiceId = paymentIntent.metadata.invoiceId;
    const tenantId = paymentIntent.metadata.tenantId;

    logger.info('Payment canceled', {
      paymentIntentId: paymentIntent.id,
      invoiceId,
    });

    // Find invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      tenant: tenantId,
    });

    if (!invoice) {
      return;
    }

    // Update invoice
    invoice.stripePaymentStatus = 'canceled';
    await invoice.save();
  }

  /**
   * Handle refund
   * @private
   */
  async handleRefund(charge) {
    logger.info('Processing refund', {
      chargeId: charge.id,
      refundAmount: charge.amount_refunded / 100,
    });

    // Find payment by charge ID
    const payment = await Payment.findOne({
      stripeChargeId: charge.id,
    });

    if (!payment) {
      logger.error('Payment not found for refund', { chargeId: charge.id });
      return;
    }

    // Update payment status
    payment.status = 'refunded';
    payment.refundedAmount = charge.amount_refunded / 100;
    payment.refundedAt = new Date();
    await payment.save();

    // Update invoice
    if (payment.invoice) {
      const invoice = await Invoice.findById(payment.invoice);
      if (invoice) {
        invoice.refund(
          charge.amount_refunded / 100,
          'Stripe refund processed'
        );
        await invoice.save();
      }
    }

    logger.info('Refund processed successfully', {
      paymentId: payment._id,
      amount: charge.amount_refunded / 100,
    });
  }

  /**
   * Handle dispute/chargeback
   * @private
   */
  async handleDispute(dispute) {
    logger.warn('Dispute created', {
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount / 100,
      reason: dispute.reason,
    });

    // Find payment by charge ID
    const payment = await Payment.findOne({
      stripeChargeId: dispute.charge,
    });

    if (!payment) {
      logger.error('Payment not found for dispute', { chargeId: dispute.charge });
      return;
    }

    // Update payment
    payment.status = 'disputed';
    payment.notes = payment.notes
      ? `${payment.notes}\n\nDispute created: ${dispute.reason}`
      : `Dispute created: ${dispute.reason}`;
    await payment.save();

    // Update invoice
    if (payment.invoice) {
      const invoice = await Invoice.findById(payment.invoice);
      if (invoice) {
        invoice.internalNotes = invoice.internalNotes
          ? `${invoice.internalNotes}\n\nDispute: ${dispute.reason} (${dispute.amount / 100})`
          : `Dispute: ${dispute.reason} (${dispute.amount / 100})`;
        await invoice.save();
      }
    }
  }

  /**
   * Create customer in Stripe
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Stripe Customer object
   */
  async createCustomer(customerData) {
    try {
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        metadata: {
          userId: customerData.userId,
          tenantId: customerData.tenantId,
        },
      });

      logger.info('Stripe customer created', {
        customerId: customer.id,
        email: customerData.email,
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', {
        error: error.message,
        email: customerData.email,
      });
      throw error;
    }
  }

  /**
   * Retrieve payment intent
   * @param {String} paymentIntentId - Stripe PaymentIntent ID
   * @returns {Promise<Object>} PaymentIntent object
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error('Failed to retrieve payment intent', {
        error: error.message,
        paymentIntentId,
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new PaymentGatewayService();
