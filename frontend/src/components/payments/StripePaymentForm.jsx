/**
 * Stripe Payment Form Component
 * Handles credit card payment processing using Stripe Elements
 */

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaCreditCard, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import PropTypes from 'prop-types';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: false,
};

const StripePaymentForm = ({ 
  invoice, 
  onSuccess, 
  onError,
  onCancel,
  customAmount = null 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [saveCard, setSaveCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  // Calculate amount to charge
  const paymentAmount = customAmount || (invoice.balance || (invoice.total - (invoice.amountPaid || 0)));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    if (!cardComplete) {
      setError('Please complete your card information.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/v1/customer/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          invoiceId: invoice._id,
          amount: paymentAmount,
          currency: invoice.currency || 'USD',
          saveCard,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const { clientSecret, payment } = await response.json();

      // Confirm card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: invoice.customerName || 'Customer',
              email: invoice.customerEmail,
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Payment successful
        onSuccess({
          paymentIntent,
          payment,
          amount: paymentAmount,
        });
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }

    } catch (err) {
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      {/* Payment Amount */}
      <div className="payment-amount-section mb-6">
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Payment Amount</p>
            <p className="text-2xl font-bold text-blue-900">
              {invoice.currency || 'USD'} ${paymentAmount.toFixed(2)}
            </p>
          </div>
          <FaCreditCard className="text-4xl text-blue-500" />
        </div>
        
        {customAmount && (
          <p className="text-xs text-gray-500 mt-2">
            * Custom amount. Outstanding balance: {invoice.currency || 'USD'} ${(invoice.balance || 0).toFixed(2)}
          </p>
        )}
      </div>

      {/* Invoice Details */}
      <div className="invoice-summary mb-6 p-4 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-3">Invoice Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice Number:</span>
            <span className="font-medium">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-medium">{invoice.currency || 'USD'} ${invoice.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-medium">{invoice.currency || 'USD'} ${(invoice.amountPaid || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-800 font-semibold">Outstanding Balance:</span>
            <span className="font-bold text-blue-600">
              {invoice.currency || 'USD'} ${(invoice.balance || (invoice.total - (invoice.amountPaid || 0))).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Card Input */}
      <div className="card-input-section mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
          <CardElement 
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          <FaLock className="inline mr-1" />
          Your payment is secure and encrypted
        </p>
      </div>

      {/* Save Card Option */}
      <div className="save-card-option mb-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={processing}
          />
          <span className="text-sm text-gray-700">
            Save card for future payments
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <FaExclamationTriangle className="text-red-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-800 font-medium">Payment Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Test Card Notice (only in development) */}
      {import.meta.env.DEV && (
        <div className="test-card-notice mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs font-semibold text-yellow-800 mb-2">🧪 Test Mode - Use Test Cards</p>
          <div className="text-xs text-yellow-700 space-y-1">
            <p>• Success: 4242 4242 4242 4242</p>
            <p>• Decline: 4000 0000 0000 0002</p>
            <p>• Any future date, any CVC</p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="button-group flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          disabled={processing}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={processing || !stripe || !cardComplete}
          className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all ${
            processing || !stripe || !cardComplete
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {processing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            `Pay ${invoice.currency || 'USD'} $${paymentAmount.toFixed(2)}`
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div className="security-notice mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-center text-gray-500">
          <FaLock className="inline mr-1" />
          Payments are processed securely by Stripe. Your card information is never stored on our servers.
        </p>
        <div className="flex justify-center items-center gap-4 mt-3">
          <img src="/stripe-badge.png" alt="Powered by Stripe" className="h-6 opacity-60" onError={(e) => e.target.style.display = 'none'} />
          <span className="text-xs text-gray-400">PCI DSS Compliant</span>
        </div>
      </div>
    </form>
  );
};

StripePaymentForm.propTypes = {
  invoice: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    invoiceNumber: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    amountPaid: PropTypes.number,
    balance: PropTypes.number,
    currency: PropTypes.string,
    customerName: PropTypes.string,
    customerEmail: PropTypes.string,
  }).isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  customAmount: PropTypes.number,
};

export default StripePaymentForm;
