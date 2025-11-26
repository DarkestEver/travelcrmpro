/**
 * Application constants
 */

// User Roles
const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  TENANT: 'tenant',
  OPERATOR: 'operator',
  AGENT: 'agent',
  AGENT_CUSTOMER: 'agent_customer',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
};

// User Status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

// Tenant Status
const TENANT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

// Query Status
const QUERY_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  QUOTED: 'quoted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// Quote Status
const QUOTE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CONVERTED: 'converted',
};

// Booking Status
const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
};

// Service Types
const SERVICE_TYPES = {
  HOTEL: 'hotel',
  TRANSPORT: 'transport',
  ACTIVITY: 'activity',
  MEAL: 'meal',
  GUIDE: 'guide',
  VISA: 'visa',
  INSURANCE: 'insurance',
};

// Package Visibility
const PACKAGE_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  AGENT_ONLY: 'agent_only',
};

// Travel Styles
const TRAVEL_STYLES = {
  BUDGET: 'Budget',
  STANDARD: 'Standard',
  LUXURY: 'Luxury',
  PREMIUM: 'Premium',
};

// Error Codes
const ERROR_CODES = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Authorization
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  
  // Conflicts
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Business Logic
  INVALID_STATE: 'INVALID_STATE',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // Payment
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Cache TTLs (in seconds)
const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// File Upload Limits
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,  // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
};

// Email Templates
const EMAIL_TEMPLATES = {
  VERIFY_EMAIL: 'verify-email',
  RESET_PASSWORD: 'reset-password',
  QUOTE_SENT: 'quote-sent',
  BOOKING_CONFIRMED: 'booking-confirmed',
  PAYMENT_RECEIVED: 'payment-received',
};

// Webhook Events
const WEBHOOK_EVENTS = {
  QUERY_CREATED: 'query.created',
  QUERY_ASSIGNED: 'query.assigned',
  QUOTE_SENT: 'quote.sent',
  QUOTE_APPROVED: 'quote.approved',
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  TENANT_STATUS,
  QUERY_STATUS,
  QUOTE_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SERVICE_TYPES,
  PACKAGE_VISIBILITY,
  TRAVEL_STYLES,
  ERROR_CODES,
  HTTP_STATUS,
  PAGINATION,
  CACHE_TTL,
  UPLOAD_LIMITS,
  EMAIL_TEMPLATES,
  WEBHOOK_EVENTS,
};
