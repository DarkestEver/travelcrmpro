/**
 * Stripe Payment Configuration
 * Centralized Stripe setup and utilities
 */

const Stripe = require('stripe');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use latest stable API version
});

/**
 * Supported currencies configuration
 */
const SUPPORTED_CURRENCIES = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    minAmount: 100, // Minimum 100 paise (₹1)
    zeroDecimal: false,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    minAmount: 50, // Minimum 50 cents ($0.50)
    zeroDecimal: false,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    minAmount: 50, // Minimum 50 cents (€0.50)
    zeroDecimal: false,
  },
};

/**
 * Get currency configuration
 */
const getCurrencyConfig = (currencyCode) => {
  const currency = currencyCode?.toUpperCase() || process.env.PAYMENT_CURRENCY_DEFAULT || 'INR';
  return SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;
};

/**
 * Convert amount to Stripe format (smallest currency unit)
 * Example: ₹100 -> 10000 paise for INR
 */
const convertToStripeAmount = (amount, currency = 'INR') => {
  const config = getCurrencyConfig(currency);
  
  if (config.zeroDecimal) {
    // For zero-decimal currencies (like JPY), return as-is
    return Math.round(amount);
  }
  
  // For decimal currencies, multiply by 100
  return Math.round(amount * 100);
};

/**
 * Convert from Stripe format to display amount
 * Example: 10000 paise -> ₹100 for INR
 */
const convertFromStripeAmount = (stripeAmount, currency = 'INR') => {
  const config = getCurrencyConfig(currency);
  
  if (config.zeroDecimal) {
    return stripeAmount;
  }
  
  return stripeAmount / 100;
};

/**
 * Format amount for display
 */
const formatAmount = (amount, currency = 'INR') => {
  const config = getCurrencyConfig(currency);
  
  if (config.zeroDecimal) {
    return `${config.symbol}${amount.toLocaleString()}`;
  }
  
  return `${config.symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Validate payment amount
 */
const validateAmount = (amount, currency = 'INR') => {
  const config = getCurrencyConfig(currency);
  const stripeAmount = convertToStripeAmount(amount, currency);
  
  if (stripeAmount < config.minAmount) {
    const minDisplay = formatAmount(convertFromStripeAmount(config.minAmount, currency), currency);
    throw new Error(`Minimum payment amount is ${minDisplay}`);
  }
  
  return true;
};

/**
 * Validate currency support
 */
const validateCurrency = (currency) => {
  const upperCurrency = currency?.toUpperCase();
  
  if (!SUPPORTED_CURRENCIES[upperCurrency]) {
    const supported = Object.keys(SUPPORTED_CURRENCIES).join(', ');
    throw new Error(`Currency ${currency} is not supported. Supported currencies: ${supported}`);
  }
  
  return true;
};

/**
 * Payment method types configuration
 */
const PAYMENT_METHOD_TYPES = ['card']; // Can add 'upi', 'netbanking' for India

/**
 * Get payment method types for currency
 */
const getPaymentMethodTypes = (currency = 'INR') => {
  // For INR, we can support additional Indian payment methods
  if (currency.toUpperCase() === 'INR') {
    return ['card']; // Can add 'upi', 'netbanking', 'wallet' when enabled
  }
  
  return ['card'];
};

module.exports = {
  stripe,
  SUPPORTED_CURRENCIES,
  PAYMENT_METHOD_TYPES,
  getCurrencyConfig,
  convertToStripeAmount,
  convertFromStripeAmount,
  formatAmount,
  validateAmount,
  validateCurrency,
  getPaymentMethodTypes,
};
