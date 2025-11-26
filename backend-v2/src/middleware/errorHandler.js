const logger = require('../lib/logger');
const { AppError } = require('../lib/errors');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message, code, details } = err;
  
  // Handle MongoDB duplicate key error
  if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = ERROR_CODES.VALIDATION_ERROR;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}. This ${field} already exists.`;
    details = { field, value: err.keyValue?.[field] };
  }
  // Handle Mongoose validation errors (not our custom ValidationError)
  else if (err.name === 'ValidationError' && !err.statusCode) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
  }
  // Default to 500 server error if not set
  else if (!statusCode || statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    code = code || ERROR_CODES.INTERNAL_ERROR;
    
    // Don't leak error details in production for non-operational errors
    if (process.env.NODE_ENV === 'production' && !(err instanceof AppError)) {
      message = 'Internal server error';
      details = null;
    }
  }
  
  // Log error with full details
  logger.error('Request error', {
    requestId: req.id,
    error: {
      code,
      message,
      details,
      stack: err.stack,
    },
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
  });
  
  // Send error response using fail helper
  res.fail(statusCode, code, message, details, err.constructor.name);
};

module.exports = errorHandler;
