const express = require('express');
const router = express.Router();
const {
  getSupportedCurrencies,
  getExchangeRates,
  convertAmount,
  getSpecificRate,
  refreshExchangeRates,
  getCurrencyInfo,
  formatCurrency
} = require('../controllers/currencyController');
const { protect, restrictTo } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/supported', getSupportedCurrencies);
router.get('/rates', getExchangeRates);
router.post('/convert', convertAmount);
router.get('/rate/:from/:to', getSpecificRate);
router.get('/info/:code', getCurrencyInfo);
router.post('/format', formatCurrency);

// Admin only routes
router.post('/refresh', protect, restrictTo('admin'), refreshExchangeRates);

module.exports = router;
