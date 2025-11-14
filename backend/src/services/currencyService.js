const axios = require('axios');

/**
 * Currency Service
 * Handles currency exchange rates and conversions
 * Uses Open Exchange Rates API (free tier: 1000 requests/month)
 */
class CurrencyService {
  constructor() {
    this.baseCurrency = 'USD';
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY || '';
    this.apiUrl = 'https://open.exchangeratesapi.io/v1/latest';
    
    // In-memory cache
    this.ratesCache = null;
    this.cacheTimestamp = null;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    // Supported currencies (50+ major currencies)
    this.supportedCurrencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
      { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
      { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
      { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
      { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
      { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
      { code: 'THB', name: 'Thai Baht', symbol: '฿' },
      { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
      { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
      { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
      { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
      { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
      { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
      { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
      { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
      { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
      { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
      { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
      { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
      { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
      { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr' },
      { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
      { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
      { code: 'COP', name: 'Colombian Peso', symbol: '$' },
      { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
      { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
      { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
      { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
      { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
      { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs' },
      { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
      { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' }
    ];
  }
  
  /**
   * Get all supported currencies
   */
  getSupportedCurrencies() {
    return this.supportedCurrencies;
  }
  
  /**
   * Get currency info by code
   */
  getCurrencyInfo(code) {
    return this.supportedCurrencies.find(c => c.code === code);
  }
  
  /**
   * Check if cache is valid
   */
  isCacheValid() {
    if (!this.ratesCache || !this.cacheTimestamp) {
      return false;
    }
    
    const now = Date.now();
    return (now - this.cacheTimestamp) < this.cacheExpiry;
  }
  
  /**
   * Fetch latest exchange rates from API
   * Falls back to static rates if API fails
   */
  async fetchExchangeRates() {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        console.log('💱 Using cached exchange rates');
        return this.ratesCache;
      }
      
      // If no API key, use fallback rates
      if (!this.apiKey) {
        console.warn('⚠️ No EXCHANGE_RATE_API_KEY set, using fallback rates');
        return this.getFallbackRates();
      }
      
      console.log('💱 Fetching exchange rates from API...');
      
      const response = await axios.get(this.apiUrl, {
        params: {
          access_key: this.apiKey,
          base: this.baseCurrency,
          symbols: this.supportedCurrencies.map(c => c.code).join(',')
        },
        timeout: 5000
      });
      
      if (response.data && response.data.rates) {
        this.ratesCache = {
          baseCurrency: this.baseCurrency,
          rates: response.data.rates,
          timestamp: new Date(response.data.timestamp * 1000),
          lastUpdated: new Date()
        };
        this.cacheTimestamp = Date.now();
        
        console.log('✅ Exchange rates updated successfully');
        return this.ratesCache;
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('❌ Error fetching exchange rates:', error.message);
      
      // If cache exists (even if expired), use it
      if (this.ratesCache) {
        console.warn('⚠️ Using expired cache due to API error');
        return this.ratesCache;
      }
      
      // Otherwise use fallback
      console.warn('⚠️ Using fallback rates');
      return this.getFallbackRates();
    }
  }
  
  /**
   * Get fallback rates (approximate static rates)
   * Used when API is unavailable
   */
  getFallbackRates() {
    // Approximate rates as of Nov 2025
    const fallbackRates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      AUD: 1.53,
      CAD: 1.38,
      CHF: 0.88,
      CNY: 7.24,
      INR: 83.12,
      MXN: 17.05,
      BRL: 4.97,
      ZAR: 18.65,
      SGD: 1.34,
      HKD: 7.81,
      NZD: 1.68,
      KRW: 1320.0,
      SEK: 10.82,
      NOK: 10.98,
      DKK: 6.88,
      PLN: 3.95,
      THB: 35.5,
      MYR: 4.47,
      IDR: 15680.0,
      PHP: 55.8,
      TWD: 31.8,
      RUB: 92.5,
      TRY: 32.15,
      AED: 3.67,
      SAR: 3.75,
      QAR: 3.64,
      EGP: 48.75,
      ILS: 3.72,
      CZK: 22.8,
      HUF: 358.0,
      BGN: 1.8,
      RON: 4.57,
      HRK: 6.94,
      ISK: 138.0,
      CLP: 890.0,
      ARS: 850.0,
      COP: 4100.0,
      PEN: 3.78,
      VND: 24500.0,
      PKR: 278.0,
      BDT: 110.0,
      LKR: 325.0,
      NPR: 133.0,
      KES: 154.0,
      NGN: 775.0,
      GHS: 15.8
    };
    
    return {
      baseCurrency: 'USD',
      rates: fallbackRates,
      timestamp: new Date(),
      lastUpdated: new Date(),
      isFallback: true
    };
  }
  
  /**
   * Convert amount from one currency to another
   */
  async convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const rates = await this.fetchExchangeRates();
    
    // Convert to base currency (USD) first
    let amountInBase;
    if (fromCurrency === this.baseCurrency) {
      amountInBase = amount;
    } else {
      const fromRate = rates.rates[fromCurrency];
      if (!fromRate) {
        throw new Error(`Exchange rate not found for ${fromCurrency}`);
      }
      amountInBase = amount / fromRate;
    }
    
    // Convert from base to target currency
    if (toCurrency === this.baseCurrency) {
      return amountInBase;
    } else {
      const toRate = rates.rates[toCurrency];
      if (!toRate) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }
      return amountInBase * toRate;
    }
  }
  
  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return 1;
    }
    
    const rates = await this.fetchExchangeRates();
    
    if (fromCurrency === this.baseCurrency) {
      return rates.rates[toCurrency];
    } else if (toCurrency === this.baseCurrency) {
      return 1 / rates.rates[fromCurrency];
    } else {
      // Cross rate: convert via base currency
      const fromRate = rates.rates[fromCurrency];
      const toRate = rates.rates[toCurrency];
      return toRate / fromRate;
    }
  }
  
  /**
   * Format amount with currency symbol
   */
  formatAmount(amount, currencyCode) {
    const currency = this.getCurrencyInfo(currencyCode);
    if (!currency) {
      return `${amount} ${currencyCode}`;
    }
    
    // Format based on currency
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    return `${currency.symbol}${formatted}`;
  }
  
  /**
   * Get all current exchange rates
   */
  async getAllRates() {
    return await this.fetchExchangeRates();
  }
  
  /**
   * Force refresh exchange rates
   */
  async refreshRates() {
    this.ratesCache = null;
    this.cacheTimestamp = null;
    return await this.fetchExchangeRates();
  }
}

module.exports = new CurrencyService();
