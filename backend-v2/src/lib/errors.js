const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = ERROR_CODES.INTERNAL_ERROR, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 */
class ValidationError extends AppError {
  constructor(message, code = ERROR_CODES.VALIDATION_ERROR, details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, code, details);
  }
}

/**
 * Unauthorized Error (401)
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = ERROR_CODES.UNAUTHORIZED, details = null) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code, details);
  }
}

/**
 * Forbidden Error (403)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = ERROR_CODES.FORBIDDEN, details = null) {
    super(message, HTTP_STATUS.FORBIDDEN, code, details);
  }
}

/**
 * Not Found Error (404)
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = ERROR_CODES.NOT_FOUND, details = null) {
    super(message, HTTP_STATUS.NOT_FOUND, code, details);
  }
}

/**
 * Conflict Error (409)
 */
class ConflictError extends AppError {
  constructor(message, code = ERROR_CODES.CONFLICT, details = null) {
    super(message, HTTP_STATUS.CONFLICT, code, details);
  }
}

/**
 * Service Unavailable Error (503)
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', details = null) {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, ERROR_CODES.SERVICE_UNAVAILABLE, details);
  }
}

/**
 * Too Many Requests Error (429)
 */
class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS');
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
  TooManyRequestsError,
};
