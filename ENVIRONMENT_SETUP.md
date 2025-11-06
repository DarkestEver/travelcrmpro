# Travel CRM - Environment Configuration Guide

## Overview

This document provides detailed instructions for configuring the Travel CRM application using environment variables.

## Setup Instructions

### Backend Configuration

1. **Copy the example file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual configuration values.

3. **Generate secure secrets:**
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Frontend Configuration

1. **Copy the example file:**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Update the API URL** to match your backend server.

3. **Restart the development server** after making changes.

## Required Variables

### Backend (Minimum Required)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/travel-crm
JWT_SECRET=your-secure-random-string-here
FRONTEND_URL=http://localhost:3000
```

### Frontend (Minimum Required)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Travel CRM
```

## Configuration Sections

### 1. Database Configuration

#### MongoDB Setup

**Development (Local):**
```env
MONGO_URI=mongodb://localhost:27017/travel-crm
```

**Production (MongoDB Atlas):**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/travel-crm?retryWrites=true&w=majority
```

**Connection Options:**
- `DB_MAX_POOL_SIZE`: Maximum number of connections in the pool (default: 10)
- `DB_MIN_POOL_SIZE`: Minimum number of connections to maintain (default: 2)

#### Redis Setup

**Development:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Production:**
```env
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0
```

### 2. Authentication Configuration

#### JWT Settings

```env
# Generate a strong secret:
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Token expiration
JWT_EXPIRE=7d              # Access token (7 days)
JWT_REFRESH_EXPIRE=30d     # Refresh token (30 days)
```

#### Password Hashing

```env
BCRYPT_ROUNDS=10  # 10-12 recommended for production
```

#### CORS Configuration

```env
CORS_ORIGIN=http://localhost:3000  # Frontend URL
CORS_CREDENTIALS=true               # Allow credentials
```

### 3. Email Configuration

#### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Configure:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FROM_EMAIL=noreply@travelcrm.com
FROM_NAME=Travel CRM
```

#### Other SMTP Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

### 4. Payment Gateway Configuration

#### Stripe Setup

1. Sign up at https://stripe.com
2. Get API keys from Dashboard > Developers > API keys
3. Configure:

```env
# Test Mode
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Production Mode
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### PayPal Setup

1. Sign up at https://developer.paypal.com
2. Create an app to get credentials
3. Configure:

```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production
```

### 5. External API Configuration

#### Google Maps API

1. Go to https://console.cloud.google.com
2. Enable Maps JavaScript API and Places API
3. Create API key
4. Configure:

```env
GOOGLE_MAPS_API_KEY=AIza...
```

#### OpenWeatherMap API

1. Sign up at https://openweathermap.org
2. Get API key from Account > API keys
3. Configure:

```env
WEATHER_API_KEY=your_api_key
```

#### Twilio SMS

1. Sign up at https://www.twilio.com
2. Get credentials from Console
3. Configure:

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 6. Logging & Monitoring

#### File Logging

```env
LOG_LEVEL=info              # error, warn, info, http, verbose, debug, silly
LOG_DIR=./logs
ERROR_LOG_FILE=error.log
COMBINED_LOG_FILE=combined.log
```

#### Sentry (Error Tracking)

1. Sign up at https://sentry.io
2. Create a project
3. Get DSN from Project Settings
4. Configure:

```env
SENTRY_DSN=https://...@sentry.io/...
```

#### Google Analytics

```env
GA_TRACKING_ID=UA-XXXXXXXXX-X
```

### 7. Security Settings

#### Rate Limiting

```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
```

#### Security Headers

```env
HELMET_CSP_DIRECTIVES=default-src 'self'
HELMET_HSTS_MAX_AGE=31536000  # 1 year
```

### 8. Feature Flags

```env
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_2FA=true
ENABLE_ANALYTICS=true
ENABLE_DEBUG_MODE=false
ENABLE_SWAGGER=true
ENABLE_GRAPHQL_PLAYGROUND=true
```

### 9. Backup Configuration

```env
BACKUP_DIR=./backups
BACKUP_SCHEDULE=0 2 * * *       # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
```

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_DEBUG_MODE=true
ENABLE_SWAGGER=true
SEED_DATABASE=true
```

### Staging

```env
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_DEBUG_MODE=false
ENABLE_SWAGGER=true
SEED_DATABASE=false
```

### Production

```env
NODE_ENV=production
LOG_LEVEL=error
ENABLE_DEBUG_MODE=false
ENABLE_SWAGGER=false
SEED_DATABASE=false
```

## Validation

The application validates required environment variables on startup. Missing variables will cause the application to exit with an error message.

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for each environment
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use environment-specific files** (.env.development, .env.production)
5. **Restrict access** to production environment variables
6. **Use encrypted secrets** for sensitive values (AWS Secrets Manager, Azure Key Vault)
7. **Audit environment changes** and maintain change logs
8. **Use different credentials** for each environment

## Troubleshooting

### Common Issues

**MongoDB Connection Errors:**
- Verify MONGO_URI format
- Check MongoDB service is running
- Ensure network connectivity
- Verify credentials

**Redis Connection Errors:**
- Check Redis service is running
- Verify REDIS_HOST and REDIS_PORT
- Test connection: `redis-cli ping`

**Email Not Sending:**
- Verify SMTP credentials
- Check firewall settings
- Enable less secure apps (Gmail)
- Use app-specific passwords

**JWT Token Errors:**
- Ensure JWT_SECRET is set and consistent
- Check token expiration settings
- Verify frontend and backend use same secret

## Additional Resources

- MongoDB Documentation: https://docs.mongodb.com
- Redis Documentation: https://redis.io/documentation
- Stripe API Docs: https://stripe.com/docs/api
- Nodemailer Guide: https://nodemailer.com
- Sentry Setup: https://docs.sentry.io

## Support

For additional help, contact the development team or refer to the main README.md file.