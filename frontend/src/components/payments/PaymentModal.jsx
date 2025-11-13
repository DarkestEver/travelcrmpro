/**
 * Payment Modal Component
 * Wraps StripePaymentForm with Elements provider and modal UI
 */

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import PropTypes from 'prop-types';
import StripePaymentForm from './StripePaymentForm';

// Initialize Stripe - using environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentModal = ({ invoice, isOpen, onClose, onPaymentSuccess }) => {
  const [paymentStatus, setPaymentStatus] = useState('form'); // 'form', 'success', 'error'
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('form');
      setPaymentDetails(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSuccess = (details) => {
    setPaymentDetails(details);
    setPaymentStatus('success');
    
    // Call parent success handler after a brief delay to show success message
    setTimeout(() => {
      if (onPaymentSuccess) {
        onPaymentSuccess(details);
      }
    }, 2000);
  };

  const handleError = (error) => {
    setErrorMessage(error);
    setPaymentStatus('error');
  };

  const handleClose = () => {
    if (paymentStatus === 'form') {
      onClose();
    } else if (paymentStatus === 'success') {
      onClose();
      // Refresh page or update invoice list
      window.location.reload();
    } else {
      // On error, allow retry
      setPaymentStatus('form');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        className="payment-modal-container bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-800">
            {paymentStatus === 'success' ? 'Payment Successful!' : 'Make a Payment'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close modal"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content px-6 py-6">
          {paymentStatus === 'form' && (
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                invoice={invoice}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={handleClose}
              />
            </Elements>
          )}

          {paymentStatus === 'success' && (
            <div className="success-screen text-center py-8">
              <div className="success-icon mb-6 flex justify-center">
                <div className="bg-green-100 rounded-full p-6">
                  <FaCheckCircle className="text-6xl text-green-500" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Payment Successful!
              </h3>
              
              <p className="text-gray-600 mb-6">
                Your payment has been processed successfully.
              </p>

              {paymentDetails && (
                <div className="payment-summary bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
                  <h4 className="font-semibold text-gray-700 mb-4">Payment Summary</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-bold text-green-600">
                        {invoice.currency || 'USD'} ${paymentDetails.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Number:</span>
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-xs">
                        {paymentDetails.paymentIntent.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">Credit Card</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="success-actions space-y-3">
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
                <p className="text-xs text-gray-500">
                  A receipt has been sent to your email address
                </p>
              </div>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="error-screen text-center py-8">
              <div className="error-icon mb-6 flex justify-center">
                <div className="bg-red-100 rounded-full p-6">
                  <FaTimes className="text-6xl text-red-500" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Payment Failed
              </h3>
              
              <p className="text-gray-600 mb-4">
                We couldn't process your payment.
              </p>

              <div className="error-message bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>

              <div className="error-actions space-y-3">
                <button
                  onClick={() => setPaymentStatus('form')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

PaymentModal.propTypes = {
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
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPaymentSuccess: PropTypes.func,
};

export default PaymentModal;
