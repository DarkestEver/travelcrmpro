const Joi = require('joi');

/**
 * Environment variables validation schema
 */
const envSchema = Joi.object({
  // App Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5000),
  API_VERSION: Joi.string().default('v2'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_FORMAT: Joi.string()
    .valid('json', 'simple')
    .default('json'),
  
  // Request Configuration
  REQUEST_ID_HEADER: Joi.string().default('X-Request-Id'),
  INCLUDE_TRACE_ID: Joi.boolean().default(true),
  
  // Security
  CORS_ORIGIN: Joi.string().default('*'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(process.env.NODE_ENV === 'test' ? 10000 : 100),
  
  // Database (MongoDB) - Optional for Phase 0, required later
  MONGODB_URI: Joi.string().optional(),
  
  // Cache (Redis) - Optional for Phase 0, required later
  REDIS_URL: Joi.string().optional(),
  
  // JWT Authentication - Required for auth functionality
  JWT_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRY: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().optional(), // Will default to JWT_SECRET if not provided
  
  // Email Service - Optional for Phase 0, required in Phase 1
  EMAIL_SERVICE: Joi.string().valid('sendgrid', 'ses', 'smtp').optional(),
  EMAIL_FROM: Joi.string().email().optional(),
  EMAIL_FROM_NAME: Joi.string().optional(),
  SENDGRID_API_KEY: Joi.string().optional(),
  AWS_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_SECURE: Joi.boolean().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  
  // File Storage - Optional for Phase 0, required in Phase 1
  STORAGE_TYPE: Joi.string().valid('s3', 'minio', 'local').optional(),
  AWS_S3_BUCKET: Joi.string().optional(),
  AWS_S3_REGION: Joi.string().optional(),
  MINIO_ENDPOINT: Joi.string().optional(),
  MINIO_ACCESS_KEY: Joi.string().optional(),
  MINIO_SECRET_KEY: Joi.string().optional(),
  MINIO_BUCKET: Joi.string().optional(),
  
  // Payment Providers - Optional for Phase 0, required in Phase 7
  PAYMENTS_PROVIDER: Joi.string().valid('stripe', 'razorpay', 'paypal').optional(),
  STRIPE_API_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional(),
  PAYPAL_CLIENT_ID: Joi.string().optional(),
  PAYPAL_CLIENT_SECRET: Joi.string().optional(),
  
  // Webhooks - Optional for Phase 0, required in Phase 11
  WEBHOOK_SIGNING_SECRET: Joi.string().optional(),
  WEBHOOK_MAX_RETRIES: Joi.number().default(6),
  WEBHOOK_RETRY_BACKOFF_MS: Joi.number().default(1000),
  
  // Currency & FX - Optional for Phase 0, required in Phase 7
  DEFAULT_CURRENCY: Joi.string().default('INR'),
  SUPPORTED_CURRENCIES: Joi.string().default('INR,USD,EUR,GBP'),
  FX_PROVIDER: Joi.string().optional(),
  FX_API_KEY: Joi.string().optional(),
  FX_RATE_CACHE_TTL: Joi.number().default(3600),
  
  // Internationalization - Optional for Phase 0, required in Phase 15
  DEFAULT_LOCALE: Joi.string().default('en-IN'),
  SUPPORTED_LOCALES: Joi.string().default('en-IN,en-US'),
  DEFAULT_TIMEZONE: Joi.string().default('Asia/Kolkata'),
  BUSINESS_HOURS_TZ: Joi.string().default('Asia/Kolkata'),
  
  // Tax Configuration - Optional for Phase 0, required in Phase 7
  TAX_ENGINE_REGION: Joi.string().optional(),
  TAX_ROUNDING_MODE: Joi.string().valid('up', 'down', 'half_up', 'half_down').optional(),
  
  // Bull Queue - Optional for Phase 0, required in Phase 6
  BULL_REDIS_URL: Joi.string().optional(),
  
  // PDF Generation - Optional for Phase 0, required in Phase 6
  PUPPETEER_EXECUTABLE_PATH: Joi.string().optional().allow(''),
  
  // Observability - Optional for Phase 0, required in Phase 12
  SENTRY_DSN: Joi.string().optional().allow(''),
  SENTRY_ENVIRONMENT: Joi.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).optional(),
  
  // Feature Flags - Optional
  ENABLE_EMAIL_VERIFICATION: Joi.boolean().default(true),
  ENABLE_TWO_FACTOR_AUTH: Joi.boolean().default(false),
  ENABLE_OAUTH: Joi.boolean().default(false),
}).unknown(true); // Allow unknown variables for flexibility

module.exports = envSchema;
