const dotenv = require('dotenv');
const path = require('path');
const envSchema = require('./schema');

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true,
});

if (error) {
  const errors = error.details.map(detail => detail.message).join(', ');
  throw new Error(`Config validation error: ${errors}`);
}

/**
 * Application configuration
 */
const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  apiVersion: envVars.API_VERSION,
  
  logging: {
    level: envVars.LOG_LEVEL,
    format: envVars.LOG_FORMAT,
  },
  
  request: {
    idHeader: envVars.REQUEST_ID_HEADER,
    includeTraceId: envVars.INCLUDE_TRACE_ID,
  },
  
  security: {
    corsOrigin: envVars.CORS_ORIGIN,
    rateLimit: {
      windowMs: envVars.RATE_LIMIT_WINDOW_MS,
      max: envVars.RATE_LIMIT_MAX_REQUESTS,
    },
  },
  
  database: {
    uri: envVars.MONGODB_URI || 'mongodb://localhost:27017/travel-crm',
    poolSize: 10,
    connectTimeout: 10000,
    socketTimeout: 45000,
    maxRetries: 5,
    retryDelay: 5000,
  },
  
  redis: {
    url: envVars.REDIS_URL || 'redis://localhost:6379',
    maxRetries: 5,
    retryDelay: 5000,
  },
  
  auth: {
    jwtSecret: envVars.JWT_SECRET,
    jwtRefreshSecret: envVars.JWT_REFRESH_SECRET || envVars.JWT_SECRET,
    jwtAccessExpiry: envVars.JWT_ACCESS_TOKEN_EXPIRY,
    jwtRefreshExpiry: envVars.JWT_REFRESH_TOKEN_EXPIRY,
  },
  
  app: {
    name: 'travel-crm-backend-v2',
    frontendUrl: envVars.FRONTEND_URL || 'http://localhost:3000',
  },
  
  email: {
    provider: envVars.EMAIL_PROVIDER || 'smtp',
    from: envVars.EMAIL_FROM || 'noreply@travelcrm.com',
    fromName: envVars.EMAIL_FROM_NAME || 'Travel CRM',
    // SendGrid
    sendgridApiKey: envVars.SENDGRID_API_KEY,
    // AWS SES
    aws: {
      region: envVars.AWS_REGION,
      accessKeyId: envVars.AWS_ACCESS_KEY_ID,
      secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    },
    // SMTP
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT ? parseInt(envVars.SMTP_PORT) : 587,
      secure: envVars.SMTP_SECURE === 'true',
      user: envVars.SMTP_USER,
      password: envVars.SMTP_PASSWORD,
    },
  },
  
  storage: {
    type: envVars.STORAGE_TYPE,
    s3: {
      bucket: envVars.AWS_S3_BUCKET,
      region: envVars.AWS_S3_REGION,
    },
    minio: {
      endpoint: envVars.MINIO_ENDPOINT,
      accessKey: envVars.MINIO_ACCESS_KEY,
      secretKey: envVars.MINIO_SECRET_KEY,
      bucket: envVars.MINIO_BUCKET,
    },
  },
  
  payments: {
    provider: envVars.PAYMENTS_PROVIDER,
    stripe: {
      apiKey: envVars.STRIPE_API_KEY,
      webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
    },
    razorpay: {
      keyId: envVars.RAZORPAY_KEY_ID,
      keySecret: envVars.RAZORPAY_KEY_SECRET,
    },
    paypal: {
      clientId: envVars.PAYPAL_CLIENT_ID,
      clientSecret: envVars.PAYPAL_CLIENT_SECRET,
    },
  },
  
  webhooks: {
    signingSecret: envVars.WEBHOOK_SIGNING_SECRET,
    maxRetries: envVars.WEBHOOK_MAX_RETRIES,
    retryBackoffMs: envVars.WEBHOOK_RETRY_BACKOFF_MS,
  },
  
  currency: {
    default: envVars.DEFAULT_CURRENCY,
    supported: envVars.SUPPORTED_CURRENCIES.split(','),
    fx: {
      provider: envVars.FX_PROVIDER,
      apiKey: envVars.FX_API_KEY,
      cacheTtl: envVars.FX_RATE_CACHE_TTL,
    },
  },
  
  locale: {
    default: envVars.DEFAULT_LOCALE,
    supported: envVars.SUPPORTED_LOCALES.split(','),
    timezone: envVars.DEFAULT_TIMEZONE,
    businessHoursTz: envVars.BUSINESS_HOURS_TZ,
  },
  
  tax: {
    region: envVars.TAX_ENGINE_REGION,
    roundingMode: envVars.TAX_ROUNDING_MODE,
  },
  
  bull: {
    redisUrl: envVars.BULL_REDIS_URL || envVars.REDIS_URL,
  },
  
  pdf: {
    puppeteerExecutablePath: envVars.PUPPETEER_EXECUTABLE_PATH,
  },
  
  stripe: {
    secretKey: envVars.STRIPE_SECRET_KEY,
    publicKey: envVars.STRIPE_PUBLIC_KEY,
    webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
  },
  
  sentry: {
    dsn: envVars.SENTRY_DSN,
    environment: envVars.SENTRY_ENVIRONMENT || envVars.NODE_ENV,
    tracesSampleRate: parseFloat(envVars.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
  },
  
  observability: {
    sentry: {
      dsn: envVars.SENTRY_DSN,
      environment: envVars.SENTRY_ENVIRONMENT,
      tracesSampleRate: envVars.SENTRY_TRACES_SAMPLE_RATE,
    },
  },
  
  features: {
    emailVerification: envVars.ENABLE_EMAIL_VERIFICATION,
    twoFactorAuth: envVars.ENABLE_TWO_FACTOR_AUTH,
    oauth: envVars.ENABLE_OAUTH,
  },
};

module.exports = config;
