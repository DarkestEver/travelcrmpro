const client = require('prom-client');
const logger = require('./logger');

/**
 * Prometheus Metrics Collection
 */

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom Metrics

// HTTP Request Duration
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// HTTP Request Counter
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active Connections
const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

// Database Query Duration
const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Database Query Counter
const dbQueryCounter = new client.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'collection'],
  registers: [register],
});

// Email Metrics
const emailCounter = new client.Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['template', 'status'],
  registers: [register],
});

// Payment Metrics
const paymentCounter = new client.Counter({
  name: 'payments_processed_total',
  help: 'Total number of payments processed',
  labelNames: ['status', 'method'],
  registers: [register],
});

const paymentAmount = new client.Counter({
  name: 'payment_amount_total',
  help: 'Total payment amount processed',
  labelNames: ['currency', 'status'],
  registers: [register],
});

// Booking Metrics
const bookingCounter = new client.Counter({
  name: 'bookings_total',
  help: 'Total number of bookings',
  labelNames: ['status'],
  registers: [register],
});

// Quote Metrics
const quoteCounter = new client.Counter({
  name: 'quotes_total',
  help: 'Total number of quotes',
  labelNames: ['status'],
  registers: [register],
});

// Lead Metrics
const leadCounter = new client.Counter({
  name: 'leads_total',
  help: 'Total number of leads',
  labelNames: ['status', 'source'],
  registers: [register],
});

// Cache Metrics
const cacheHitCounter = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
  registers: [register],
});

const cacheMissCounter = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
  registers: [register],
});

// Error Metrics
const errorCounter = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
  registers: [register],
});

// Business Metrics
const revenueGauge = new client.Gauge({
  name: 'revenue_total',
  help: 'Total revenue',
  labelNames: ['currency'],
  registers: [register],
});

/**
 * Middleware to track HTTP metrics
 */
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Track active connections
  activeConnections.inc();

  // On response finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    // Record duration
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );

    // Count requests
    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    // Decrement active connections
    activeConnections.dec();
  });

  next();
};

/**
 * Track database query
 */
const trackDbQuery = (operation, collection, duration) => {
  dbQueryDuration.observe(
    {
      operation,
      collection,
    },
    duration
  );

  dbQueryCounter.inc({
    operation,
    collection,
  });
};

/**
 * Track email sent
 */
const trackEmail = (template, status) => {
  emailCounter.inc({
    template: template || 'unknown',
    status: status || 'sent',
  });
};

/**
 * Track payment
 */
const trackPayment = (amount, currency, status, method) => {
  paymentCounter.inc({
    status: status || 'completed',
    method: method || 'unknown',
  });

  if (amount && currency) {
    paymentAmount.inc(
      {
        currency,
        status: status || 'completed',
      },
      amount
    );
  }
};

/**
 * Track booking
 */
const trackBooking = (status) => {
  bookingCounter.inc({
    status: status || 'confirmed',
  });
};

/**
 * Track quote
 */
const trackQuote = (status) => {
  quoteCounter.inc({
    status: status || 'sent',
  });
};

/**
 * Track lead
 */
const trackLead = (status, source) => {
  leadCounter.inc({
    status: status || 'new',
    source: source || 'unknown',
  });
};

/**
 * Track cache hit
 */
const trackCacheHit = (cacheName) => {
  cacheHitCounter.inc({
    cache_name: cacheName,
  });
};

/**
 * Track cache miss
 */
const trackCacheMiss = (cacheName) => {
  cacheMissCounter.inc({
    cache_name: cacheName,
  });
};

/**
 * Track error
 */
const trackError = (type, severity = 'error') => {
  errorCounter.inc({
    type,
    severity,
  });
};

/**
 * Update revenue
 */
const updateRevenue = (amount, currency = 'USD') => {
  revenueGauge.set({ currency }, amount);
};

/**
 * Get metrics in Prometheus format
 */
const getMetrics = async () => {
  return await register.metrics();
};

/**
 * Get metrics content type
 */
const getContentType = () => {
  return register.contentType;
};

/**
 * Initialize metrics collection
 */
const initMetrics = () => {
  logger.info('Prometheus metrics collection initialized');
};

module.exports = {
  register,
  initMetrics,
  getMetrics,
  getContentType,
  metricsMiddleware,
  trackDbQuery,
  trackEmail,
  trackPayment,
  trackBooking,
  trackQuote,
  trackLead,
  trackCacheHit,
  trackCacheMiss,
  trackError,
  updateRevenue,
};
