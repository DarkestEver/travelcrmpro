# Phase 1: Authentication & Multi-Tenant

**Duration:** 1-1.5 weeks  
**Start:** Week 1-2  
**Dependencies:** Phase 0 (Foundations)  
**Status:** Not Started

---

## 🎯 Goals

1. Implement tenant resolution middleware (subdomain/path/custom domain)
2. Set up MongoDB and Redis connections
3. Implement user registration with email verification
4. Implement JWT-based authentication (access + refresh tokens)
5. Implement password reset flow
6. Implement role-based access control (RBAC)
7. Implement user profile management
8. Implement session management

---

## 📦 Deliverables

- Tenant middleware with multi-strategy resolution
- MongoDB models: Tenant, User
- User registration with email verification
- Login/logout with JWT tokens
- Password reset flow
- RBAC middleware with permissions matrix
- Profile CRUD endpoints
- Avatar upload with image optimization
- Active session management
- Rate limiting on auth endpoints
- Comprehensive test coverage

---

## 🏗️ Architecture

### Database Models

#### Tenant Model
```javascript
{
  _id: ObjectId,
  name: String,              // "ABC Travel Agency"
  slug: String,              // "abc-travel" (unique)
  domain: String,            // "abc.travelcrm.com" or custom
  customDomain: String,      // "www.abctravels.com" (optional)
  
  branding: {
    logo: String,            // S3/MinIO URL
    favicon: String,
    primaryColor: String,    // "#FF5733"
    secondaryColor: String,
    fontFamily: String,
  },
  
  contact: {
    email: String,
    phone: String,
    address: Object,
    website: String,
  },
  
  settings: {
    timezone: String,        // "Asia/Kolkata"
    currency: String,        // "INR"
    language: String,        // "en-IN"
    dateFormat: String,
    timeFormat: String,
  },
  
  subscription: {
    plan: String,            // "basic", "pro", "enterprise"
    status: String,          // "active", "suspended", "cancelled"
    expiresAt: Date,
    features: [String],
  },
  
  limits: {
    maxUsers: Number,
    maxSuppliers: Number,
    maxQueries: Number,
  },
  
  status: String,            // "active", "inactive", "suspended"
  createdAt: Date,
  updatedAt: Date,
}
```

#### User Model
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,        // Reference to Tenant
  
  email: String,             // Unique per tenant
  password: String,          // Bcrypt hashed
  
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String,          // S3/MinIO URL
    dateOfBirth: Date,
    gender: String,
  },
  
  role: String,              // "tenant", "operator", "agent", "customer", etc.
  permissions: [String],     // Additional custom permissions
  
  emailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  loginAttempts: Number,
  lockUntil: Date,
  
  refreshTokens: [{
    token: String,
    deviceInfo: String,
    ipAddress: String,
    createdAt: Date,
    expiresAt: Date,
  }],
  
  lastLoginAt: Date,
  lastLoginIp: String,
  
  status: String,            // "active", "inactive", "suspended"
  createdAt: Date,
  updatedAt: Date,
}
```

---

## 🔌 APIs

### Authentication Endpoints

#### 1. POST /auth/register
**Purpose:** Register new user with email verification  
**Auth:** None  
**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210",
  "role": "agent"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful. Please check your email to verify your account.",
    "userId": "507f1f77bcf86cd799439011"
  },
  "traceId": "req_abc123"
}
```

**Validation Errors (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email is already registered",
      "password": "Password must be at least 8 characters"
    },
    "type": "ValidationError"
  },
  "traceId": "req_abc123"
}
```

#### 2. POST /auth/verify-email
**Purpose:** Verify email with token  
**Auth:** None  
**Request:**
```json
{
  "token": "abc123xyz789"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully. You can now log in."
  },
  "traceId": "req_abc123"
}
```

#### 3. POST /auth/login
**Purpose:** Login with email and password  
**Auth:** None  
**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "deviceInfo": "Chrome on Windows"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "agent",
      "avatar": "https://cdn.example.com/avatars/john.jpg"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  },
  "traceId": "req_abc123"
}
```

**Error Responses:**
- **401:** Invalid credentials
- **403:** Email not verified
- **423:** Account locked (too many failed attempts)

#### 4. POST /auth/refresh-token
**Purpose:** Refresh access token  
**Auth:** None (refresh token in body)  
**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "traceId": "req_abc123"
}
```

#### 5. POST /auth/logout
**Purpose:** Logout (invalidate refresh token)  
**Auth:** Bearer token  
**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "traceId": "req_abc123"
}
```

#### 6. POST /auth/forgot-password
**Purpose:** Request password reset  
**Auth:** None  
**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset instructions sent to your email"
  },
  "traceId": "req_abc123"
}
```

#### 7. POST /auth/reset-password
**Purpose:** Reset password with token  
**Auth:** None  
**Request:**
```json
{
  "token": "abc123xyz789",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successful. You can now log in with your new password."
  },
  "traceId": "req_abc123"
}
```

---

### Tenant Endpoints

#### 8. GET /tenant/profile
**Purpose:** Get tenant profile  
**Auth:** Bearer token (tenant role)  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "ABC Travel Agency",
    "slug": "abc-travel",
    "domain": "abc.travelcrm.com",
    "branding": {
      "logo": "https://cdn.example.com/logos/abc.png",
      "primaryColor": "#FF5733"
    },
    "contact": {
      "email": "info@abctravels.com",
      "phone": "+919876543210"
    },
    "settings": {
      "timezone": "Asia/Kolkata",
      "currency": "INR",
      "language": "en-IN"
    }
  },
  "traceId": "req_abc123"
}
```

#### 9. PATCH /tenant/profile
**Purpose:** Update tenant profile  
**Auth:** Bearer token (tenant role)  
**Request:**
```json
{
  "name": "ABC Travel Agency Updated",
  "contact": {
    "phone": "+919999999999"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Tenant profile updated successfully"
  },
  "traceId": "req_abc123"
}
```

#### 10. PATCH /tenant/branding
**Purpose:** Update tenant branding  
**Auth:** Bearer token (tenant role)  
**Request:**
```json
{
  "primaryColor": "#0066CC",
  "secondaryColor": "#FF9900"
}
```

#### 11. GET /tenant/settings
**Purpose:** Get tenant settings  
**Auth:** Bearer token (tenant role)

#### 12. PATCH /tenant/settings
**Purpose:** Update tenant settings  
**Auth:** Bearer token (tenant role)

---

### Profile Endpoints

#### 13. GET /profile
**Purpose:** Get current user profile  
**Auth:** Bearer token  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "avatar": "https://cdn.example.com/avatars/john.jpg"
    },
    "role": "agent",
    "emailVerified": true,
    "lastLoginAt": "2025-11-23T10:30:00Z"
  },
  "traceId": "req_abc123"
}
```

#### 14. PATCH /profile
**Purpose:** Update user profile  
**Auth:** Bearer token  
**Request:**
```json
{
  "firstName": "John Updated",
  "phone": "+919999999999"
}
```

#### 15. POST /profile/avatar
**Purpose:** Upload user avatar  
**Auth:** Bearer token  
**Content-Type:** multipart/form-data  
**Request:**
```
avatar: [File]
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.example.com/avatars/john.jpg"
  },
  "traceId": "req_abc123"
}
```

#### 16. PATCH /profile/password
**Purpose:** Change password (authenticated user)  
**Auth:** Bearer token  
**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

#### 17. GET /profile/sessions
**Purpose:** List active sessions  
**Auth:** Bearer token  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "507f1f77bcf86cd799439011",
        "deviceInfo": "Chrome on Windows",
        "ipAddress": "192.168.1.1",
        "createdAt": "2025-11-23T10:30:00Z",
        "current": true
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "deviceInfo": "Safari on iPhone",
        "ipAddress": "192.168.1.2",
        "createdAt": "2025-11-22T08:15:00Z",
        "current": false
      }
    ]
  },
  "traceId": "req_abc123"
}
```

#### 18. DELETE /profile/sessions/:sessionId
**Purpose:** Logout from specific session  
**Auth:** Bearer token  
**Response (204):** No content

---

## 📝 Implementation Details

### 1. Database Connection

**File:** `src/lib/database.js`

```javascript
const mongoose = require('mongoose');
const logger = require('./logger');
const config = require('../config');

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }
  
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(config.database.mongoUri, options);
    
    isConnected = true;
    logger.info('MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
};

const disconnectDatabase = async () => {
  if (!isConnected) {
    return;
  }
  
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected');
};

const getConnectionStatus = () => {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getConnectionStatus,
};
```

### 2. Redis Connection

**File:** `src/lib/redis.js`

```javascript
const Redis = require('ioredis');
const logger = require('./logger');
const config = require('../config');

let redisClient = null;

const connectRedis = () => {
  if (redisClient) {
    return redisClient;
  }
  
  redisClient = new Redis(config.database.redisUrl, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });
  
  redisClient.on('connect', () => {
    logger.info('Redis connected successfully');
  });
  
  redisClient.on('error', (err) => {
    logger.error('Redis connection error', { error: err });
  });
  
  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });
  
  return redisClient;
};

const getRedisStatus = async () => {
  try {
    if (!redisClient) {
      return 'disconnected';
    }
    await redisClient.ping();
    return 'connected';
  } catch (error) {
    return 'disconnected';
  }
};

const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
};

module.exports = {
  connectRedis,
  getRedisStatus,
  disconnectRedis,
  get client() {
    if (!redisClient) {
      throw new Error('Redis client not initialized');
    }
    return redisClient;
  },
};
```

### 3. Tenant Middleware

**File:** `src/middleware/tenant.js`

```javascript
const Tenant = require('../models/Tenant');
const { UnauthorizedError } = require('../lib/errors');
const logger = require('../lib/logger');

/**
 * Resolve tenant from request
 * Supports: subdomain, path, custom domain
 */
const resolveTenant = async (req, res, next) => {
  try {
    let tenant = null;
    const host = req.get('host');
    const path = req.path;
    
    // Strategy 1: Subdomain (tenant-name.travelcrm.com)
    if (host.includes('.travelcrm.com')) {
      const subdomain = host.split('.')[0];
      if (subdomain !== 'www' && subdomain !== 'travelcrm') {
        tenant = await Tenant.findOne({ slug: subdomain, status: 'active' });
      }
    }
    
    // Strategy 2: Path-based (/tenant-name/...)
    if (!tenant && path.startsWith('/t/')) {
      const slug = path.split('/')[2];
      tenant = await Tenant.findOne({ slug, status: 'active' });
    }
    
    // Strategy 3: Custom domain
    if (!tenant) {
      tenant = await Tenant.findOne({ customDomain: host, status: 'active' });
    }
    
    if (!tenant) {
      throw new UnauthorizedError('Tenant not found or inactive');
    }
    
    // Attach tenant to request
    req.tenant = tenant;
    req.tenantId = tenant._id;
    
    logger.debug('Tenant resolved', {
      requestId: req.id,
      tenantId: tenant._id,
      tenantName: tenant.name,
    });
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional tenant resolution (doesn't fail if not found)
 */
const resolveOptionalTenant = async (req, res, next) => {
  try {
    await resolveTenant(req, res, () => {});
  } catch (error) {
    // Ignore errors, continue without tenant
  }
  next();
};

module.exports = {
  resolveTenant,
  resolveOptionalTenant,
};
```

### 4. Authentication Middleware

**File:** `src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError, ForbiddenError } = require('../lib/errors');
const config = require('../config');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('Invalid token');
    }
    
    // Verify tenant match
    if (req.tenantId && user.tenantId.toString() !== req.tenantId.toString()) {
      throw new UnauthorizedError('Tenant mismatch');
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication (doesn't fail if not authenticated)
 */
const optionalAuth = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {});
  } catch (error) {
    // Ignore errors, continue without user
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
};
```

### 5. RBAC Middleware

**File:** `src/middleware/rbac.js`

```javascript
const { ForbiddenError } = require('../lib/errors');

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  super_admin: 100,
  tenant: 80,
  operator: 60,
  agent: 40,
  agent_customer: 30,
  customer: 20,
  supplier: 50,
};

// Permissions matrix
const PERMISSIONS = {
  // Tenant management
  'tenant:read': ['super_admin', 'tenant'],
  'tenant:update': ['super_admin', 'tenant'],
  
  // User management
  'users:create': ['super_admin', 'tenant', 'operator'],
  'users:read': ['super_admin', 'tenant', 'operator', 'agent'],
  'users:update': ['super_admin', 'tenant', 'operator'],
  'users:delete': ['super_admin', 'tenant'],
  
  // Supplier management
  'suppliers:create': ['super_admin', 'tenant', 'operator'],
  'suppliers:read': ['super_admin', 'tenant', 'operator', 'agent'],
  'suppliers:update': ['super_admin', 'tenant', 'operator'],
  'suppliers:delete': ['super_admin', 'tenant'],
  
  // ... more permissions
};

/**
 * Check if user has required role
 */
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires one of: ${roles.join(', ')}`));
    }
    
    next();
  };
};

/**
 * Check if user has required permission
 */
const hasPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }
    
    const userRole = req.user.role;
    const userPermissions = req.user.permissions || [];
    
    const hasRequiredPermission = permissions.some((permission) => {
      // Check role-based permissions
      const allowedRoles = PERMISSIONS[permission] || [];
      if (allowedRoles.includes(userRole)) {
        return true;
      }
      
      // Check custom user permissions
      return userPermissions.includes(permission);
    });
    
    if (!hasRequiredPermission) {
      return next(new ForbiddenError(`Missing permission: ${permissions.join(' or ')}`));
    }
    
    next();
  };
};

/**
 * Check if user has higher or equal role level
 */
const hasMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }
    
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const minLevel = ROLE_HIERARCHY[minRole] || 0;
    
    if (userLevel < minLevel) {
      return next(new ForbiddenError(`Requires minimum role: ${minRole}`));
    }
    
    next();
  };
};

module.exports = {
  hasRole,
  hasPermission,
  hasMinRole,
  PERMISSIONS,
};
```

---

## 🧪 Testing

### Integration Tests

**File:** `tests/integration/auth.test.js`

```javascript
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const { connectDatabase, disconnectDatabase } = require('../../src/lib/database');

describe('Authentication Flow', () => {
  let tenant;
  
  beforeAll(async () => {
    await connectDatabase();
    
    // Create test tenant
    tenant = await Tenant.create({
      name: 'Test Agency',
      slug: 'test-agency',
      domain: 'test-agency.travelcrm.com',
      status: 'active',
    });
  });
  
  afterAll(async () => {
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await disconnectDatabase();
  });
  
  describe('POST /auth/register', () => {
    test('should register new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('Host', 'test-agency.travelcrm.com')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'agent',
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBeDefined();
    });
    
    test('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('Host', 'test-agency.travelcrm.com')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'agent',
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
  
  // More tests...
});
```

---

## ✅ Acceptance Criteria

- [ ] Tenant auto-resolved from subdomain, path, or custom domain
- [ ] Email verification required before login
- [ ] JWT tokens expire and refresh correctly (access: 1h, refresh: 30d)
- [ ] RBAC middleware blocks unauthorized access
- [ ] Avatar upload resizes to 200x200 and uploads to S3/MinIO
- [ ] Password reset tokens expire after 1 hour
- [ ] Account locked after 5 failed login attempts (15 min lockout)
- [ ] Rate limiting: 5 login attempts per 15 min per IP
- [ ] Active sessions listed and can be remotely logged out
- [ ] All passwords hashed with bcrypt (10 rounds)
- [ ] Test coverage > 80% for auth flows

---

## 📋 TODO Checklist

### Database Setup
- [ ] Install dependencies: `mongoose`, `ioredis`, `bcryptjs`, `jsonwebtoken`
- [ ] Create `src/lib/database.js` for MongoDB connection
- [ ] Create `src/lib/redis.js` for Redis connection
- [ ] Update health check to verify DB + Redis connectivity
- [ ] Test database connections

### Models
- [ ] Create `src/models/Tenant.js`
- [ ] Create `src/models/User.js`
- [ ] Add indexes: `email` (unique per tenant), `tenantId + email`
- [ ] Test model validation

### Middleware
- [ ] Create `src/middleware/tenant.js` with resolution logic
- [ ] Create `src/middleware/auth.js` with JWT verification
- [ ] Create `src/middleware/rbac.js` with permission checks
- [ ] Test middleware with unit tests

### Services
- [ ] Create `src/services/authService.js` (register, login, verify email, reset password)
- [ ] Create `src/services/emailService.js` (send verification, reset emails)
- [ ] Create `src/services/tokenService.js` (generate JWT, refresh tokens)
- [ ] Create `src/services/uploadService.js` (S3/MinIO avatar upload)
- [ ] Test services with unit tests

### Controllers
- [ ] Create `src/controllers/authController.js`
- [ ] Create `src/controllers/tenantController.js`
- [ ] Create `src/controllers/profileController.js`
- [ ] Test controllers with integration tests

### Routes
- [ ] Create `src/routes/auth.js`
- [ ] Create `src/routes/tenant.js`
- [ ] Create `src/routes/profile.js`
- [ ] Wire up routes in `src/app.js`

### Security
- [ ] Add rate limiting on auth endpoints (express-rate-limit)
- [ ] Add account lockout after failed attempts
- [ ] Bcrypt password hashing (10 rounds)
- [ ] JWT secret in environment variables
- [ ] Refresh token rotation
- [ ] Test security measures

### Testing
- [ ] Integration tests for registration flow
- [ ] Integration tests for login flow
- [ ] Integration tests for email verification
- [ ] Integration tests for password reset
- [ ] Integration tests for profile management
- [ ] Integration tests for RBAC
- [ ] Coverage > 80%

### Documentation
- [ ] Update OpenAPI spec with auth endpoints
- [ ] Document RBAC permissions matrix
- [ ] Update README with auth setup

---

## 🔗 Next Phase Dependencies

Phase 2 (Suppliers & Rate Lists) will use:
- Tenant context from this phase
- User authentication
- RBAC for supplier management permissions
