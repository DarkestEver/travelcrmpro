const Sentry = require('@sentry/node');
const config = require('../config');
const logger = require('../lib/logger');

let sentryInitialized = false;

/**
 * Initialize Sentry for error tracking
 */
const initSentry = (app) => {
  if (!config.sentry?.dsn) {
    logger.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    release: config.app?.version || 'unknown',
    
    // Performance Monitoring
    tracesSampleRate: config.sentry.tracesSampleRate || 0.1,
    
    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in test environment
      if (config.env === 'test') {
        return null;
      }

      // Filter out specific errors
      const error = hint.originalException;
      if (error && error.message) {
        // Don't track validation errors
        if (error.message.includes('ValidationError')) {
          return null;
        }
        // Don't track auth errors (too noisy)
        if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
          return null;
        }
      }

      return event;
    },

    // Integrations
    integrations: [
      // Express integration
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      // MongoDB integration
      new Sentry.Integrations.Mongo(),
    ],
  });

  sentryInitialized = true;
  logger.info('Sentry error tracking initialized', {
    environment: config.env,
    tracesSampleRate: config.sentry.tracesSampleRate || 0.1,
  });
};

/**
 * Sentry request handler middleware
 */
const requestHandler = () => {
  if (!sentryInitialized) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
};

/**
 * Sentry tracing handler middleware
 */
const tracingHandler = () => {
  if (!sentryInitialized) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
};

/**
 * Sentry error handler middleware
 */
const errorHandler = () => {
  if (!sentryInitialized) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture 4xx and 5xx errors
      if (error.status >= 400) {
        return true;
      }
      return false;
    },
  });
};

/**
 * Capture exception manually
 */
const captureException = (error, context = {}) => {
  if (!sentryInitialized) return;
  Sentry.captureException(error, {
    tags: context.tags,
    extra: context.extra,
    user: context.user,
    level: context.level || 'error',
  });
};

/**
 * Capture message manually
 */
const captureMessage = (message, level = 'info', context = {}) => {
  if (!sentryInitialized) return;
  Sentry.captureMessage(message, {
    level,
    tags: context.tags,
    extra: context.extra,
    user: context.user,
  });
};

/**
 * Set user context for error tracking
 */
const setUser = (user) => {
  if (!sentryInitialized) return;
  if (user) {
    Sentry.setUser({
      id: user._id || user.id,
      email: user.email,
      username: user.username || `${user.firstName} ${user.lastName}`,
      tenant: user.tenant,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Set tag for filtering errors
 */
const setTag = (key, value) => {
  if (!sentryInitialized) return;
  Sentry.setTag(key, value);
};

/**
 * Create a transaction for performance monitoring
 */
const startTransaction = (name, op) => {
  if (!sentryInitialized) return null;
  return Sentry.startTransaction({
    name,
    op,
  });
};

module.exports = {
  initSentry,
  requestHandler,
  tracingHandler,
  errorHandler,
  captureException,
  captureMessage,
  setUser,
  setTag,
  startTransaction,
};
