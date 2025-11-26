const {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
} = require('../../../src/lib/errors');
const { HTTP_STATUS, ERROR_CODES } = require('../../../src/config/constants');

describe('Error Classes', () => {
  describe('AppError', () => {
    test('should create error with default values', () => {
      const error = new AppError('Something went wrong');
      
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(error.details).toBeNull();
      expect(error.isOperational).toBe(true);
    });
    
    test('should create error with custom values', () => {
      const error = new AppError('Custom error', 418, 'CUSTOM_CODE', { foo: 'bar' });
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(418);
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.details).toEqual({ foo: 'bar' });
    });
  });
  
  describe('ValidationError', () => {
    test('should create validation error with 400 status', () => {
      const error = new ValidationError('Validation failed', ERROR_CODES.VALIDATION_ERROR, { field: 'email' });
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.details).toEqual({ field: 'email' });
    });
  });
  
  describe('UnauthorizedError', () => {
    test('should create unauthorized error with 401 status', () => {
      const error = new UnauthorizedError();
      
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
    
    test('should accept custom message and code', () => {
      const error = new UnauthorizedError('Token expired', ERROR_CODES.TOKEN_EXPIRED);
      
      expect(error.message).toBe('Token expired');
      expect(error.code).toBe(ERROR_CODES.TOKEN_EXPIRED);
    });
  });
  
  describe('ForbiddenError', () => {
    test('should create forbidden error with 403 status', () => {
      const error = new ForbiddenError();
      
      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });
  
  describe('NotFoundError', () => {
    test('should create not found error with 404 status', () => {
      const error = new NotFoundError('User not found');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });
  
  describe('ConflictError', () => {
    test('should create conflict error with 409 status', () => {
      const error = new ConflictError('Email already exists');
      
      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(error.code).toBe(ERROR_CODES.CONFLICT);
    });
  });
  
  describe('ServiceUnavailableError', () => {
    test('should create service unavailable error with 503 status', () => {
      const error = new ServiceUnavailableError('Database connection failed');
      
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
    });
  });
});
