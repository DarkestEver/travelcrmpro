/**
 * Payment Webhook Controller
 * Handles Stripe webhook events
 */

const { stripe } = require('../../config/stripe');
const paymentService = require('../../services/paymentService');
const StripePayment = require('../../models/StripePayment');

/**
 * Handle Stripe webhook events
 * POST /api/v1/payments/webhook
 */
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      message: `Webhook Error: ${err.message}`,
    });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
};

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  try {
    // Find payment record
    const payment = await paymentService.getPaymentByIntentId(paymentIntent.id);
    
    if (!payment) {
      console.error('Payment record not found for intent:', paymentIntent.id);
      return;
    }

    // Skip if already processed
    if (payment.status === 'succeeded') {
      console.log('Payment already processed:', paymentIntent.id);
      return;
    }

    // Get charge details
    const charge = paymentIntent.charges?.data?.[0];
    
    // Extract payment method details
    const paymentMethodDetails = charge?.payment_method_details;
    const chargeData = {
      chargeId: charge?.id,
      receiptUrl: charge?.receipt_url,
      paymentMethodDetails,
    };

    // Mark payment as succeeded
    await payment.markAsSucceeded(chargeData);

    // Update invoice
    await paymentService.updateInvoiceAfterPayment(payment);

    // TODO: Send payment confirmation email
    console.log(`Payment ${payment._id} processed successfully`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  try {
    const payment = await paymentService.getPaymentByIntentId(paymentIntent.id);
    
    if (!payment) {
      console.error('Payment record not found for intent:', paymentIntent.id);
      return;
    }

    // Mark payment as failed
    await payment.markAsFailed(
      paymentIntent.last_payment_error?.message || 'Payment failed',
      paymentIntent.last_payment_error?.code
    );

    // TODO: Send payment failed notification
    console.log(`Payment ${payment._id} marked as failed`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent) {
  console.log('Payment canceled:', paymentIntent.id);

  try {
    const payment = await StripePayment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!payment) {
      console.error('Payment record not found for intent:', paymentIntent.id);
      return;
    }

    // Update status to canceled
    payment.status = 'canceled';
    await payment.save();

    console.log(`Payment ${payment._id} marked as canceled`);
  } catch (error) {
    console.error('Error handling payment canceled:', error);
    throw error;
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge) {
  console.log('Charge refunded:', charge.id);

  try {
    const payment = await StripePayment.findOne({
      stripeChargeId: charge.id,
    });

    if (!payment) {
      console.error('Payment record not found for charge:', charge.id);
      return;
    }

    // Update refund details
    const refund = charge.refunds?.data?.[0];
    if (refund) {
      payment.refunded = true;
      payment.refundAmount = refund.amount / 100; // Convert from cents
      payment.refundedAt = new Date(refund.created * 1000);
      payment.refundReason = refund.reason || 'No reason provided';
      payment.stripeRefundId = refund.id;
      payment.status = 'refunded';

      await payment.save();

      // Update invoice
      const invoice = await require('../../models/Invoice').findById(payment.invoiceId);
      if (invoice) {
        invoice.amountPaid = (invoice.amountPaid || 0) - payment.refundAmount;
        invoice.balance = invoice.total - invoice.amountPaid;
        
        // Revert status if needed
        if (invoice.status === 'paid' && invoice.balance > 0) {
          invoice.status = invoice.amountPaid > 0 ? 'partial' : 'pending';
        }
        
        await invoice.save();
      }

      console.log(`Payment ${payment._id} refunded successfully`);
    }
  } catch (error) {
    console.error('Error handling charge refunded:', error);
    throw error;
  }
}

/**
 * Handle payment requires action (3D Secure)
 */
async function handlePaymentRequiresAction(paymentIntent) {
  console.log('Payment requires action:', paymentIntent.id);

  try {
    const payment = await StripePayment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!payment) {
      console.error('Payment record not found for intent:', paymentIntent.id);
      return;
    }

    // Update status to requires_action
    payment.status = 'requires_action';
    await payment.save();

    console.log(`Payment ${payment._id} requires additional action`);
  } catch (error) {
    console.error('Error handling payment requires action:', error);
    throw error;
  }
}
