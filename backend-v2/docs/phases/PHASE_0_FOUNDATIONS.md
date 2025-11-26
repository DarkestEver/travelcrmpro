# Phase 0: Foundations

**Duration:** 1 week  
**Start:** Week 1  
**Status:** Not Started

---

## 🎯 Goals

1. Set up project structure with best practices
2. Implement environment configuration with validation
3. Create standardized response middleware
4. Set up structured logging with request tracing
5. Implement health and readiness endpoints
6. Establish error handling patterns

---

## 📦 Deliverables

- Project scaffolding with organized folder structure
- Environment configuration loader with Joi validation
- Central response service middleware
- Request ID correlation middleware
- Structured logging setup (Winston/Pino)
- Health endpoints (`/health`, `/ready`, `/version`)
- Base error handling middleware
- Initial test setup and CI configuration

---

## 🏗️ Architecture

### Folder Structure
```
backend-v2/
├── src/
│   ├── config/
│   │   ├── index.js              # Config loader
│   │   ├── schema.js             # Joi validation schema
│   │   └── constants.js          # App constants
│   ├── middleware/
│   │   ├── requestId.js          # Request ID middleware
│   │   ├── response.js           # Response helpers
│   │   ├── errorHandler.js       # Global error handler
│   │   └── logger.js             # Logging middleware
│   ├── lib/
│   │   ├── logger.js             # Logger instance
│   │   └── errors.js             # Custom error classes
│   ├── routes/
│   │   └── health.js             # Health check routes
│   ├── controllers/
│   │   └── healthController.js   # Health check logic
│   ├── app.js                    # Express app setup
│   └── server.js                 # Server entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.js
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── package.json
└── README.md
```

---

## 🔌 APIs

### Health Endpoints

#### 1. GET /health
**Purpose:** Basic health check  
**Auth:** None  
**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-23T10:30:00.000Z",
    "uptime": 3600,
    "version": "2.0.0"
  },
  "traceId": "req_abc123xyz"
}
```

#### 2. GET /ready
**Purpose:** Readiness check (DB + Redis connectivity)  
**Auth:** None  
**Response (Ready):**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "checks": {
      "database": "connected",
      "redis": "connected"
    },
    "timestamp": "2025-11-23T10:30:00.000Z"
  },
  "traceId": "req_abc123xyz"
}
```

**Response (Not Ready):**
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service not ready",
    "details": {
      "database": "connected",
      "redis": "disconnected"
    },
    "type": "ServiceUnavailableError"
  },
  "traceId": "req_abc123xyz"
}
```

#### 3. GET /version
**Purpose:** API version information  
**Auth:** None  
**Response:**
```json
{
  "success": true,
  "data": {
    "version": "2.0.0",
    "apiVersion": "v2",
    "nodeVersion": "18.17.0",
    "environment": "development"
  },
  "traceId": "req_abc123xyz"
}
```

---

## 📝 Implementation Details

### 1. Package.json Setup

```json
{
  "name": "travel-crm-backend-v2",
  "version": "2.0.0",
  "description": "Multi-tenant Travel CRM Platform",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:integration": "jest --testPathPattern=integration",
    "lint": "eslint src/ --fix",
    "format": "prettier --write \"src/**/*.js\"",
    "validate": "npm run lint && npm test"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-request-id": "^3.0.0",
    "dotenv": "^16.3.1",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 2. Environment Configuration

**File:** `src/config/schema.js`

```javascript
const Joi = require('joi');

const envSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(5000),
  API_VERSION: Joi.string().default('v2'),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_FORMAT: Joi.string()
    .valid('json', 'simple')
    .default('json'),
  
  // Request
  REQUEST_ID_HEADER: Joi.string().default('X-Request-Id'),
  INCLUDE_TRACE_ID: Joi.boolean().default(true),
  
  // Security
  CORS_ORIGIN: Joi.string().default('*'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 min
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // Database (placeholder for future phases)
  MONGODB_URI: Joi.string().optional(),
  REDIS_URL: Joi.string().optional(),
}).unknown(true);

module.exports = envSchema;
```

**File:** `src/config/index.js`

```javascript
const dotenv = require('dotenv');
const envSchema = require('./schema');

// Load .env file
dotenv.config();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

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
  
  // Placeholder for future phases
  database: {
    mongoUri: envVars.MONGODB_URI,
    redisUrl: envVars.REDIS_URL,
  },
};

module.exports = config;
```

### 3. Structured Logging

**File:** `src/lib/logger.js`

```javascript
const winston = require('winston');
const config = require('../config');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Format for JSON logs
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Format for simple console logs
const simpleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: config.logging.format === 'json' ? jsonFormat : simpleFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

module.exports = logger;
```

**File:** `src/middleware/logger.js`

```javascript
const logger = require('../lib/logger');

/**
 * Logging middleware - adds request correlation
 */
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logLevel]('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
};

module.exports = loggingMiddleware;
```

### 4. Response Middleware

**File:** `src/middleware/response.js`

```javascript
const config = require('../config');

/**
 * Attach response helper methods to res object
 */
const attachResponseHelpers = (req, res, next) => {
  /**
   * Success response
   * @param {*} data - Response data
   * @param {Object} meta - Optional metadata (pagination, etc.)
   * @param {Number} status - HTTP status code (default: 200)
   */
  res.ok = (data, meta = null, status = 200) => {
    const response = {
      success: true,
      data,
    };
    
    if (meta) {
      response.meta = meta;
    }
    
    if (config.request.includeTraceId) {
      response.traceId = req.id;
    }
    
    return res.status(status).json(response);
  };
  
  /**
   * Created response (201)
   * @param {*} data - Created resource data
   * @param {Object} meta - Optional metadata
   */
  res.created = (data, meta = null) => {
    return res.ok(data, meta, 201);
  };
  
  /**
   * No content response (204)
   */
  res.noContent = () => {
    return res.status(204).send();
  };
  
  /**
   * Error response
   * @param {Number} status - HTTP status code
   * @param {String} code - Error code
   * @param {String} message - Error message
   * @param {*} details - Optional error details
   * @param {String} type - Error type
   */
  res.fail = (status, code, message, details = null, type = 'Error') => {
    const response = {
      success: false,
      error: {
        code,
        message,
        type,
      },
    };
    
    if (details) {
      response.error.details = details;
    }
    
    if (config.request.includeTraceId) {
      response.traceId = req.id;
    }
    
    return res.status(status).json(response);
  };
  
  next();
};

module.exports = attachResponseHelpers;
```

### 5. Custom Error Classes

**File:** `src/lib/errors.js`

```javascript
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', details = null) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
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
};
```

### 6. Error Handler Middleware

**File:** `src/middleware/errorHandler.js`

```javascript
const logger = require('../lib/logger');
const { AppError } = require('../lib/errors');

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message, code, details } = err;
  
  // Default to 500 server error
  if (!statusCode || statusCode === 500) {
    statusCode = 500;
    code = 'INTERNAL_ERROR';
    
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production' && !(err instanceof AppError)) {
      message = 'Internal server error';
      details = null;
    }
  }
  
  // Log error
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
  });
  
  // Send error response
  res.fail(statusCode, code, message, details, err.constructor.name);
};

module.exports = errorHandler;
```

### 7. Health Check Controller

**File:** `src/controllers/healthController.js`

```javascript
const { ServiceUnavailableError } = require('../lib/errors');
const packageJson = require('../../package.json');

/**
 * Basic health check
 */
exports.health = (req, res) => {
  res.ok({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: packageJson.version,
  });
};

/**
 * Readiness check - verify dependencies
 */
exports.ready = async (req, res, next) => {
  try {
    const checks = {
      database: 'not_configured', // Will be implemented in Phase 1
      redis: 'not_configured',     // Will be implemented in Phase 1
    };
    
    // For Phase 0, we're ready if the app is running
    const isReady = true;
    
    if (!isReady) {
      throw new ServiceUnavailableError('Service not ready', checks);
    }
    
    res.ok({
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Version information
 */
exports.version = (req, res) => {
  res.ok({
    version: packageJson.version,
    apiVersion: process.env.API_VERSION || 'v2',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
};
```

### 8. Health Routes

**File:** `src/routes/health.js`

```javascript
const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/health', healthController.health);
router.get('/ready', healthController.ready);
router.get('/version', healthController.version);

module.exports = router;
```

### 9. Express App Setup

**File:** `src/app.js`

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const addRequestId = require('express-request-id');

const config = require('./config');
const logger = require('./lib/logger');
const attachResponseHelpers = require('./middleware/response');
const loggingMiddleware = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');
const { NotFoundError } = require('./lib/errors');

const app = express();

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

// Request ID
app.use(addRequestId({ setHeader: true, headerName: config.request.idHeader }));

// Response helpers
app.use(attachResponseHelpers);

// Logging
app.use(loggingMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/', healthRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.url} not found`));
});

// Error handler
app.use(errorHandler);

module.exports = app;
```

### 10. Server Entry Point

**File:** `src/server.js`

```javascript
const app = require('./app');
const config = require('./config');
const logger = require('./lib/logger');

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server started`, {
    port: PORT,
    environment: config.env,
    nodeVersion: process.version,
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err });
  process.exit(1);
});

module.exports = server;
```

---

## 🧪 Testing

### Test Setup

**File:** `tests/setup.js`

```javascript
// Global test setup
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests
```

### Unit Tests

**File:** `tests/unit/middleware/response.test.js`

```javascript
const attachResponseHelpers = require('../../../src/middleware/response');

describe('Response Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = { id: 'test-123' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });
  
  test('should attach response helpers', () => {
    attachResponseHelpers(req, res, next);
    
    expect(res.ok).toBeDefined();
    expect(res.created).toBeDefined();
    expect(res.noContent).toBeDefined();
    expect(res.fail).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
  
  test('res.ok should return success response', () => {
    attachResponseHelpers(req, res, next);
    
    res.ok({ user: 'John' });
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { user: 'John' },
      traceId: 'test-123',
    });
  });
  
  test('res.created should return 201', () => {
    attachResponseHelpers(req, res, next);
    
    res.created({ id: 1 });
    
    expect(res.status).toHaveBeenCalledWith(201);
  });
  
  test('res.fail should return error response', () => {
    attachResponseHelpers(req, res, next);
    
    res.fail(400, 'VALIDATION_ERROR', 'Invalid input', { field: 'email' });
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { field: 'email' },
        type: 'Error',
      },
      traceId: 'test-123',
    });
  });
});
```

### Integration Tests

**File:** `tests/integration/health.test.js`

```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    test('should return 200 with health status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.version).toBeDefined();
      expect(res.body.traceId).toBeDefined();
    });
  });
  
  describe('GET /ready', () => {
    test('should return 200 when ready', async () => {
      const res = await request(app).get('/ready');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ready');
    });
  });
  
  describe('GET /version', () => {
    test('should return version info', async () => {
      const res = await request(app).get('/version');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBeDefined();
      expect(res.body.data.apiVersion).toBe('v2');
    });
  });
  
  describe('404 Handler', () => {
    test('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown-route');
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
```

---

## ✅ Acceptance Criteria

- [ ] Environment variables validated on startup (fails if invalid)
- [ ] Health endpoints return standardized envelope with `traceId`
- [ ] Logs include `requestId` for request correlation
- [ ] Response middleware works on all routes
- [ ] Error handler catches and formats all errors
- [ ] Request ID propagated in response headers
- [ ] Unit test coverage > 80%
- [ ] Integration tests pass for all health endpoints
- [ ] 404 handler works for unknown routes
- [ ] Graceful shutdown implemented

---

## 📋 TODO Checklist

### Setup
- [ ] Initialize npm project: `npm init -y`
- [ ] Install dependencies from package.json
- [ ] Create folder structure
- [ ] Set up `.env.example` file
- [ ] Configure ESLint and Prettier
- [ ] Set up `.gitignore`

### Configuration
- [ ] Create `src/config/schema.js` with Joi validation
- [ ] Create `src/config/index.js` with config loader
- [ ] Create `src/config/constants.js` for app constants
- [ ] Test config validation with invalid env vars

### Logging
- [ ] Create `src/lib/logger.js` with Winston
- [ ] Create `src/middleware/logger.js` for request logging
- [ ] Test log output in JSON and simple formats
- [ ] Verify log files created in `logs/` directory

### Middleware
- [ ] Install `express-request-id` package
- [ ] Create `src/middleware/response.js` with helpers
- [ ] Create `src/middleware/errorHandler.js`
- [ ] Test middleware with unit tests

### Error Classes
- [ ] Create `src/lib/errors.js` with custom error classes
- [ ] Test error instantiation and properties

### Health Endpoints
- [ ] Create `src/controllers/healthController.js`
- [ ] Create `src/routes/health.js`
- [ ] Wire up routes in `src/app.js`
- [ ] Test endpoints with integration tests

### App Setup
- [ ] Create `src/app.js` with Express setup
- [ ] Add security middleware (Helmet)
- [ ] Add CORS configuration
- [ ] Add compression
- [ ] Add rate limiting
- [ ] Add 404 handler
- [ ] Add error handler

### Server
- [ ] Create `src/server.js` as entry point
- [ ] Implement graceful shutdown
- [ ] Test server startup
- [ ] Test graceful shutdown

### Testing
- [ ] Set up Jest configuration
- [ ] Create `tests/setup.js`
- [ ] Write unit tests for middleware
- [ ] Write unit tests for error classes
- [ ] Write integration tests for health endpoints
- [ ] Verify coverage > 80%

### Documentation
- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Add API documentation for health endpoints
- [ ] Create CONTRIBUTING.md (optional)

### CI/CD (Optional for Phase 0)
- [ ] Set up GitHub Actions / GitLab CI
- [ ] Add lint job
- [ ] Add test job
- [ ] Add coverage reporting

---

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Integration tests only
npm run test:integration
```

### Linting
```bash
npm run lint
```

---

## 📊 Success Metrics

- ✅ Server starts without errors
- ✅ All health endpoints respond correctly
- ✅ Request tracing works (traceId in logs and responses)
- ✅ Error handling works (custom errors formatted correctly)
- ✅ Test coverage > 80%
- ✅ No ESLint errors
- ✅ Graceful shutdown works

---

## 🔗 Dependencies for Next Phase

Phase 1 (Auth & Multi-Tenant) will require:
- MongoDB connection (add to config and readiness check)
- Redis connection (add to config and readiness check)
- Tenant middleware
- Auth middleware

This phase establishes the foundation for all future development.
