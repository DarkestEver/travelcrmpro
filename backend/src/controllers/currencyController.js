const { asyncHandler } = require('../middleware/errorHandler');
const currencyService = require('../services/currencyService');

/**
 * @desc    Get all supported currencies
 * @route   GET /api/v1/currency/supported
 * @access  Public
 */
exports.getSupportedCurrencies = asyncHandler(async (req, res) => {
  const currencies = currencyService.getSupportedCurrencies();
  
  res.json({
    success: true,
    count: currencies.length,
    data: currencies
  });
});

/**
 * @desc    Get current exchange rates
 * @route   GET /api/v1/currency/rates
 * @access  Public
 */
exports.getExchangeRates = asyncHandler(async (req, res) => {
  const { base } = req.query;
  
  const rates = await currencyService.getAllRates();
  
  // If specific base currency requested, recalculate rates
  if (base && base !== rates.baseCurrency) {
    const baseRate = rates.rates[base];
    if (!baseRate) {
      return res.status(400).json({
        success: false,
        message: `Invalid base currency: ${base}`
      });
    }
    
    // Recalculate all rates relative to new base
    const recalculatedRates = {};
    for (const [currency, rate] of Object.entries(rates.rates)) {
      recalculatedRates[currency] = rate / baseRate;
    }
    
    return res.json({
      success: true,
      data: {
        baseCurrency: base,
        rates: recalculatedRates,
        timestamp: rates.timestamp,
        lastUpdated: rates.lastUpdated,
        isFallback: rates.isFallback
      }
    });
  }
  
  res.json({
    success: true,
    data: rates
  });
});

/**
 * @desc    Convert amount between currencies
 * @route   POST /api/v1/currency/convert
 * @access  Public
 */
exports.convertAmount = asyncHandler(async (req, res) => {
  const { amount, fromCurrency, toCurrency } = req.body;
  
  if (!amount || !fromCurrency || !toCurrency) {
    return res.status(400).json({
      success: false,
      message: 'Amount, fromCurrency, and toCurrency are required'
    });
  }
  
  const convertedAmount = await currencyService.convert(
    parseFloat(amount),
    fromCurrency,
    toCurrency
  );
  
  const exchangeRate = await currencyService.getExchangeRate(fromCurrency, toCurrency);
  
  res.json({
    success: true,
    data: {
      originalAmount: parseFloat(amount),
      fromCurrency,
      toCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimals
      exchangeRate: Math.round(exchangeRate * 10000) / 10000, // 4 decimals for rate
      formatted: {
        from: currencyService.formatAmount(amount, fromCurrency),
        to: currencyService.formatAmount(convertedAmount, toCurrency)
      }
    }
  });
});

/**
 * @desc    Get exchange rate between two currencies
 * @route   GET /api/v1/currency/rate/:from/:to
 * @access  Public
 */
exports.getSpecificRate = asyncHandler(async (req, res) => {
  const { from, to } = req.params;
  
  const rate = await currencyService.getExchangeRate(from, to);
  
  res.json({
    success: true,
    data: {
      fromCurrency: from,
      toCurrency: to,
      rate: Math.round(rate * 10000) / 10000
    }
  });
});

/**
 * @desc    Refresh exchange rates (force update)
 * @route   POST /api/v1/currency/refresh
 * @access  Private (Admin only)
 */
exports.refreshExchangeRates = asyncHandler(async (req, res) => {
  const rates = await currencyService.refreshRates();
  
  res.json({
    success: true,
    message: 'Exchange rates refreshed successfully',
    data: rates
  });
});

/**
 * @desc    Get currency info
 * @route   GET /api/v1/currency/info/:code
 * @access  Public
 */
exports.getCurrencyInfo = asyncHandler(async (req, res) => {
  const { code } = req.params;
  
  const currency = currencyService.getCurrencyInfo(code);
  
  if (!currency) {
    return res.status(404).json({
      success: false,
      message: `Currency not found: ${code}`
    });
  }
  
  res.json({
    success: true,
    data: currency
  });
});

/**
 * @desc    Format amount with currency
 * @route   POST /api/v1/currency/format
 * @access  Public
 */
exports.formatCurrency = asyncHandler(async (req, res) => {
  const { amount, currencyCode } = req.body;
  
  if (!amount || !currencyCode) {
    return res.status(400).json({
      success: false,
      message: 'Amount and currencyCode are required'
    });
  }
  
  const formatted = currencyService.formatAmount(amount, currencyCode);
  
  res.json({
    success: true,
    data: {
      amount: parseFloat(amount),
      currencyCode,
      formatted
    }
  });
});
