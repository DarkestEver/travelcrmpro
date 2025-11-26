# Phase 19: Internationalization & Localization (i18n)

**Status:** ❌ Not Started  
**Priority:** P3 (Low - Future Expansion)  
**Estimated Time:** 3-4 days  
**Dependencies:** All previous phases

## Overview

Multi-language support, currency/number/date formatting, tax regionalization, timezone handling, and translation management for international markets.

## Supported Languages (Initial)

- 🇺🇸 English (en) - Default
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇮🇳 Hindi (hi)
- 🇸🇦 Arabic (ar) - RTL support

## Implementation Plan

### 1. Install i18next (0.25 day)

```bash
npm install i18next i18next-http-middleware i18next-fs-backend
```

### 2. Configure i18next (0.5 day)

```javascript
// src/config/i18n.js
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    preload: ['en', 'es', 'fr', 'de', 'hi', 'ar'],
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['querystring', 'cookie', 'header'],
      caches: ['cookie'],
    },
    ns: ['common', 'errors', 'emails', 'reports'],
    defaultNS: 'common',
  });

module.exports = i18next;
```

### 3. Translation Files Structure

```
locales/
  en/
    common.json
    errors.json
    emails.json
    reports.json
  es/
    common.json
    errors.json
    emails.json
    reports.json
  fr/
    common.json
    errors.json
    emails.json
    reports.json
```

### 4. Sample Translation Files (0.5 day)

```json
// locales/en/common.json
{
  "welcome": "Welcome to Travel CRM",
  "booking": {
    "created": "Booking created successfully",
    "confirmed": "Booking confirmed",
    "cancelled": "Booking cancelled",
    "status": {
      "pending": "Pending",
      "confirmed": "Confirmed",
      "completed": "Completed",
      "cancelled": "Cancelled"
    }
  },
  "payment": {
    "received": "Payment received",
    "pending": "Payment pending",
    "failed": "Payment failed"
  },
  "currency": {
    "usd": "US Dollar",
    "eur": "Euro",
    "gbp": "British Pound",
    "inr": "Indian Rupee"
  }
}
```

```json
// locales/es/common.json
{
  "welcome": "Bienvenido a Travel CRM",
  "booking": {
    "created": "Reserva creada exitosamente",
    "confirmed": "Reserva confirmada",
    "cancelled": "Reserva cancelada",
    "status": {
      "pending": "Pendiente",
      "confirmed": "Confirmado",
      "completed": "Completado",
      "cancelled": "Cancelado"
    }
  },
  "payment": {
    "received": "Pago recibido",
    "pending": "Pago pendiente",
    "failed": "Pago fallido"
  }
}
```

```json
// locales/en/errors.json
{
  "validation": {
    "required": "{{field}} is required",
    "invalid_email": "Invalid email address",
    "invalid_phone": "Invalid phone number",
    "min_length": "{{field}} must be at least {{min}} characters",
    "max_length": "{{field}} must not exceed {{max}} characters"
  },
  "auth": {
    "invalid_credentials": "Invalid email or password",
    "token_expired": "Your session has expired. Please login again.",
    "unauthorized": "You are not authorized to perform this action"
  },
  "booking": {
    "not_found": "Booking not found",
    "already_confirmed": "Booking is already confirmed",
    "cannot_cancel": "This booking cannot be cancelled"
  }
}
```

### 5. Middleware Integration (0.25 day)

```javascript
// In app.js
const i18next = require('./config/i18n');
const middleware = require('i18next-http-middleware');

app.use(middleware.handle(i18next));

// Now all requests have req.t() function
```

### 6. Response Localization (0.5 day)

```javascript
// src/middleware/responseMiddleware.js (UPDATE)
module.exports = (req, res, next) => {
  res.success = (data, message) => {
    res.json({
      success: true,
      message: message ? req.t(message) : undefined,
      data,
    });
  };

  res.error = (messageKey, statusCode = 400, details = {}) => {
    res.status(statusCode).json({
      success: false,
      message: req.t(messageKey, details),
    });
  };

  next();
};

// Usage in controllers
async createBooking(req, res) {
  const booking = await Booking.create(req.body);
  res.success(booking, 'booking.created');
}
```

### 7. Email Template Localization (0.5 day)

```javascript
// src/models/EmailTemplate.js (UPDATE)
const emailTemplateSchema = new mongoose.Schema({
  // ... existing fields ...

  translations: {
    en: {
      subject: String,
      body: String,
    },
    es: {
      subject: String,
      body: String,
    },
    fr: {
      subject: String,
      body: String,
    },
    de: {
      subject: String,
      body: String,
    },
    hi: {
      subject: String,
      body: String,
    },
    ar: {
      subject: String,
      body: String,
    },
  },
});

// Method: Get localized template
emailTemplateSchema.methods.getLocalized = function(locale = 'en') {
  return this.translations[locale] || this.translations.en;
};
```

### 8. Currency & Number Formatting (0.5 day)

```javascript
// src/utils/formatters.js
const { formatCurrency, formatNumber, formatDate } = require('i18n-js');

class Formatters {
  // Format currency based on locale
  formatCurrency(amount, currency, locale = 'en') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Format number with locale-specific separators
  formatNumber(number, locale = 'en') {
    return new Intl.NumberFormat(locale).format(number);
  }

  // Format date based on locale
  formatDate(date, locale = 'en', options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(new Date(date));
  }

  // Format relative time (e.g., "2 days ago")
  formatRelativeTime(date, locale = 'en') {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diff = Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    return rtf.format(diff, 'day');
  }
}

module.exports = new Formatters();

// Usage
const formatters = require('../utils/formatters');
const formatted = formatters.formatCurrency(2500, 'USD', 'en'); // "$2,500.00"
const formattedEs = formatters.formatCurrency(2500, 'EUR', 'es'); // "2.500,00 €"
```

### 9. Timezone Handling (0.5 day)

```javascript
// Add timezone to User model
const userSchema = new mongoose.Schema({
  // ... existing fields ...

  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'hi', 'ar'],
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
});

// Add timezone to Tenant model
const tenantSchema = new mongoose.Schema({
  // ... existing fields ...

  settings: {
    defaultLanguage: {
      type: String,
      default: 'en',
    },
    defaultTimezone: {
      type: String,
      default: 'UTC',
    },
    defaultCurrency: {
      type: String,
      default: 'USD',
    },
  },
});

// Timezone conversion utility
const moment = require('moment-timezone');

function convertToUserTimezone(date, userTimezone) {
  return moment(date).tz(userTimezone).format();
}

function convertFromUserTimezone(date, userTimezone) {
  return moment.tz(date, userTimezone).utc().format();
}
```

### 10. Tax Regionalization (0.5 day)

```javascript
// src/services/taxService.js
class TaxService {
  getTaxRate(country, state = null) {
    const taxRates = {
      'US': {
        'CA': 0.0725, // California
        'NY': 0.08,   // New York
        'TX': 0.0625, // Texas
        default: 0.07,
      },
      'GB': 0.20,     // UK VAT
      'IN': 0.18,     // India GST
      'DE': 0.19,     // Germany VAT
      'FR': 0.20,     // France VAT
      'ES': 0.21,     // Spain VAT
      default: 0.10,
    };

    if (typeof taxRates[country] === 'object') {
      return taxRates[country][state] || taxRates[country].default;
    }

    return taxRates[country] || taxRates.default;
  }

  calculateTax(amount, country, state = null) {
    const rate = this.getTaxRate(country, state);
    return amount * rate;
  }

  getTaxName(country) {
    const taxNames = {
      'US': 'Sales Tax',
      'GB': 'VAT',
      'IN': 'GST',
      'DE': 'MwSt',
      'FR': 'TVA',
      'ES': 'IVA',
    };

    return taxNames[country] || 'Tax';
  }
}

module.exports = new TaxService();
```

### 11. Locale Detection Middleware (0.25 day)

```javascript
// src/middleware/localeMiddleware.js
module.exports = (req, res, next) => {
  // Priority: 1. Query param, 2. User preference, 3. Accept-Language header
  let locale = req.query.lang || 
               req.user?.preferences?.language || 
               req.tenant?.settings?.defaultLanguage ||
               req.acceptsLanguages(['en', 'es', 'fr', 'de', 'hi', 'ar']) ||
               'en';

  req.locale = locale;
  req.i18n.changeLanguage(locale);

  // Set timezone
  req.timezone = req.user?.preferences?.timezone || 
                 req.tenant?.settings?.defaultTimezone || 
                 'UTC';

  // Set currency
  req.currency = req.user?.preferences?.currency || 
                 req.tenant?.settings?.defaultCurrency || 
                 'USD';

  next();
};
```

### 12. PDF Generation with Localization (0.25 day)

```javascript
// When generating PDFs, use user's locale
const generateQuotePDF = async (quote, locale = 'en') => {
  const formatters = require('../utils/formatters');
  
  const html = `
    <html>
      <head>
        <style>
          ${locale === 'ar' ? 'body { direction: rtl; }' : ''}
        </style>
      </head>
      <body>
        <h1>${i18next.t('quote.title', { lng: locale })}</h1>
        <p>${i18next.t('quote.total', { lng: locale })}: ${formatters.formatCurrency(quote.total, quote.currency, locale)}</p>
      </body>
    </html>
  `;

  // Generate PDF from HTML
};
```

## API Endpoints

```javascript
// Get available languages
GET /i18n/languages
Returns: ['en', 'es', 'fr', 'de', 'hi', 'ar']

// Get translations for a language
GET /i18n/translations/:lang
Returns: { common: {...}, errors: {...}, emails: {...} }

// Update user language preference
PATCH /users/me/preferences
Body: { language: 'es', timezone: 'America/New_York', currency: 'EUR' }
```

## Implementation Checklist

### Setup
- [ ] Install i18next dependencies
- [ ] Configure i18next
- [ ] Create locales directory structure
- [ ] Add middleware to app.js

### Translations
- [ ] Create English translations (common, errors, emails)
- [ ] Create Spanish translations
- [ ] Create French translations
- [ ] Create German translations
- [ ] Create Hindi translations
- [ ] Create Arabic translations (RTL support)

### Localization
- [ ] Localize API responses
- [ ] Localize error messages
- [ ] Localize email templates
- [ ] Localize PDF templates
- [ ] Implement currency formatting
- [ ] Implement number formatting
- [ ] Implement date formatting

### Timezone
- [ ] Add timezone to User model
- [ ] Add timezone to Tenant model
- [ ] Implement timezone conversion
- [ ] Apply timezone to SLA deadlines
- [ ] Apply timezone to reports

### Tax Regionalization
- [ ] Create tax service
- [ ] Add tax rates by country
- [ ] Apply regional tax in pricing
- [ ] Display tax name by country

### Testing
- [ ] Test language switching
- [ ] Test currency formatting
- [ ] Test date formatting
- [ ] Test RTL support (Arabic)
- [ ] Test timezone conversions

## Acceptance Criteria

- [ ] 6 languages supported (en, es, fr, de, hi, ar)
- [ ] API responses localized based on user preference
- [ ] Error messages translated
- [ ] Email templates translated
- [ ] Currency formatting correct per locale
- [ ] Date formatting correct per locale
- [ ] Timezone handling working
- [ ] Tax rates regionalized
- [ ] RTL support for Arabic
- [ ] All tests passing

## Environment Variables

```env
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,es,fr,de,hi,ar
DEFAULT_TIMEZONE=UTC
DEFAULT_CURRENCY=USD
```

## Translation Management

### Using Translation Management Tool (Optional)

```bash
# Export translations to JSON
npm run i18n:export

# Import translations from Crowdin/Lokalise
npm run i18n:import

# Check for missing translations
npm run i18n:check
```

## Notes

- Start with English, then add languages based on target markets
- Use professional translators (not just Google Translate)
- Test RTL languages (Arabic, Hebrew) thoroughly
- Currency conversion requires live exchange rates (future)
- Timezone handling is critical for SLA deadlines
- Regional tax rates must be updated regularly
- Consider cultural differences in date/number formats
- Email templates should be fully translated, not just messages
