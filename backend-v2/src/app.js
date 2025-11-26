const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const logger = require('./lib/logger');
const sentry = require('./lib/sentry');
const metrics = require('./lib/metrics');
const attachResponseHelpers = require('./middleware/response');
const loggingMiddleware = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenant');
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const supplierRoutes = require('./routes/supplier');
const leadRoutes = require('./routes/lead');
const itineraryRoutes = require('./routes/itinerary');
const bookingRoutes = require('./routes/booking');
const paymentRoutes = require('./routes/payment');
const emailRoutes = require('./routes/email');
const reportRoutes = require('./routes/report');
const rateListRoutes = require('./routes/rateList');
const quoteRoutes = require('./routes/quote');
const packageRoutes = require('./routes/package');
const queryRoutes = require('./routes/query');
const customerPortalRoutes = require('./routes/customerPortal');
const documentRoutes = require('./routes/document');
const automationRoutes = require('./routes/automation');
const metricsRoutes = require('./routes/metrics');
const reviewRoutes = require('./routes/reviewRoutes');
const { NotFoundError } = require('./lib/errors');

const app = express();

// Sentry request handler (must be first)
app.use(sentry.requestHandler());
app.use(sentry.tracingHandler());

// Prometheus metrics middleware
app.use(metrics.metricsMiddleware);

// Trust proxy (for X-Forwarded-* headers)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Request ID for tracing (simple implementation)
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader(config.request.idHeader, req.id);
  next();
});

// Response helpers middleware
app.use(attachResponseHelpers);

// Logging middleware
app.use(loggingMiddleware);

// Rate limiting (disabled in test environment)
if (config.env !== 'test') {
  const limiter = rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later',
        type: 'TooManyRequestsError',
      },
    },
    standardHeaders: true,  // Return rate limit info in headers
    legacyHeaders: false,   // Disable X-RateLimit-* headers
    handler: (req, res) => {
      res.fail(429, 'TOO_MANY_REQUESTS', 'Too many requests from this IP, please try again later');
    },
  });

  app.use(limiter);
}

// Health check routes (no prefix)
app.use('/', healthRoutes);

// API routes
app.use('/auth', authRoutes);
app.use('/tenants', tenantRoutes);
app.use('/users', userRoutes);
app.use('/profile', profileRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/leads', leadRoutes);
app.use('/itineraries', itineraryRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);
app.use('/emails', emailRoutes);
app.use('/reports', reportRoutes);
app.use('/rate-lists', rateListRoutes);
app.use('/quotes', quoteRoutes);
app.use('/packages', packageRoutes);
app.use('/queries', queryRoutes);
app.use('/customer', customerPortalRoutes);
app.use('/documents', documentRoutes);
app.use('/automation', automationRoutes);
app.use('/metrics', metricsRoutes);
app.use('/', reviewRoutes);  // Includes both /reviews and /public/reviews paths

// All phases complete!

// 404 handler for unknown routes
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.url} not found`, 'ROUTE_NOT_FOUND'));
});

// Sentry error handler (must be before other error handlers)
app.use(sentry.errorHandler());

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
