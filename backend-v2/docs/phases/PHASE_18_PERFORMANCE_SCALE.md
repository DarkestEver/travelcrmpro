# Phase 18: Performance & Scale Optimization

**Status:** ❌ Not Started  
**Priority:** P2 (Medium - Ongoing)  
**Estimated Time:** Ongoing optimization  
**Dependencies:** Phase 16 (Observability)

## Overview

Performance optimization through 3-layer caching, database indexing, N+1 query detection, load testing, CDN integration, and horizontal scaling preparation.

## Current Performance Issues

### Identified Bottlenecks
- [ ] No caching layer (repeated DB queries)
- [ ] Missing database indexes (slow queries)
- [ ] N+1 queries in itinerary/booking endpoints
- [ ] Large JSON responses (no pagination on some endpoints)
- [ ] No CDN for static assets
- [ ] Synchronous email sending (blocking)
- [ ] No query result caching
- [ ] No rate list caching (seasonal pricing recalculated every time)

## Implementation Plan

### 1. Three-Layer Caching Strategy (2 days)

#### Layer 1: In-Memory Cache (Node.js)

```javascript
// src/services/cacheService.js
const NodeCache = require('node-cache');

class CacheService {
  constructor() {
    // Short-lived cache (60 seconds)
    this.memoryCache = new NodeCache({ stdTTL: 60 });
  }

  get(key) {
    return this.memoryCache.get(key);
  }

  set(key, value, ttl = 60) {
    return this.memoryCache.set(key, value, ttl);
  }

  del(key) {
    return this.memoryCache.del(key);
  }

  flush() {
    return this.memoryCache.flushAll();
  }

  // Cache wrapper for functions
  async wrap(key, fn, ttl = 60) {
    const cached = this.get(key);
    if (cached) return cached;

    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }
}

module.exports = new CacheService();
```

#### Layer 2: Redis Cache (Medium-lived, 5-30 minutes)

```javascript
// Update src/config/redis.js
const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

class RedisCache {
  async get(key) {
    const cached = await getAsync(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key, value, ttl = 300) {
    await setAsync(key, JSON.stringify(value), 'EX', ttl);
  }

  async del(key) {
    await delAsync(key);
  }

  async wrap(key, fn, ttl = 300) {
    const cached = await this.get(key);
    if (cached) return cached;

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
}

module.exports = new RedisCache();
```

#### Layer 3: MongoDB Query Result Cache

```javascript
// Mongoose plugin for query caching
const mongooseCache = require('mongoose-cache');
mongoose.plugin(mongooseCache, {
  cache: true,
  ttl: 300,
});

// Usage in queries
const suppliers = await Supplier.find({ tenant: tenantId })
  .cache(300, `suppliers:${tenantId}`);
```

### 2. Database Indexing Optimization (1 day)

```javascript
// Analyze slow queries
// Run in MongoDB shell
db.setProfilingLevel(2, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(10);

// Add missing indexes
// In models
leadSchema.index({ tenant: 1, status: 1, createdAt: -1 });
bookingSchema.index({ tenant: 1, customer: 1, createdAt: -1 });
itinerarySchema.index({ tenant: 1, status: 1, travelDates.from: 1 });
rateListSchema.index({ tenant: 1, supplier: 1, category: 1, validFrom: 1, validTo: 1 });
paymentSchema.index({ tenant: 1, booking: 1, status: 1 });

// Compound indexes for common queries
userSchema.index({ tenant: 1, role: 1, isActive: 1 });
emailLogSchema.index({ tenant: 1, status: 1, createdAt: -1 });
```

### 3. N+1 Query Detection & Fix (1 day)

#### Install N+1 Detector

```bash
npm install mongoose-query-profiler
```

#### Detect N+1 Queries

```javascript
// In development environment
if (process.env.NODE_ENV === 'development') {
  const queryProfiler = require('mongoose-query-profiler');
  queryProfiler(mongoose, {
    logger: console.log,
    highlight: true,
  });
}
```

#### Fix N+1 in Itinerary Endpoint

```javascript
// BEFORE (N+1 problem)
async getItinerary(req, res) {
  const itinerary = await Itinerary.findById(req.params.id);
  await itinerary.populate('days'); // Query 1
  
  for (const day of itinerary.days) {
    await day.populate('services.rateList'); // Query 2, 3, 4... (N+1)
  }
}

// AFTER (optimized)
async getItinerary(req, res) {
  const itinerary = await Itinerary.findById(req.params.id)
    .populate({
      path: 'days',
      populate: {
        path: 'services.rateList',
        model: 'RateList',
      },
    });
  // Single query with joins
}
```

### 4. Response Optimization (0.5 day)

```javascript
// Implement field selection
GET /bookings?fields=bookingNumber,customer,totalAmount,status

// Controller
async listBookings(req, res) {
  const { fields } = req.query;
  const select = fields ? fields.split(',').join(' ') : '';

  const bookings = await Booking.find({ tenant: req.tenant._id })
    .select(select)
    .limit(100);
}

// Implement compression
const compression = require('compression');
app.use(compression());

// Paginate large responses
const bookings = await Booking.find({ tenant: req.tenant._id })
  .limit(req.query.limit || 20)
  .skip((req.query.page - 1) * req.query.limit);
```

### 5. Rate List Caching (1 day)

```javascript
// Cache rate list pricing calculations
const redisCache = require('../services/redisCache');

async function calculatePrice(rateListId, params) {
  const cacheKey = `rateList:${rateListId}:${JSON.stringify(params)}`;
  
  return await redisCache.wrap(cacheKey, async () => {
    const rateList = await RateList.findById(rateListId);
    return rateList.calculatePrice(params);
  }, 1800); // Cache for 30 minutes
}

// Invalidate cache on rate list update
rateListSchema.post('save', function() {
  redisCache.del(`rateList:${this._id}:*`);
});
```

### 6. CDN Integration (0.5 day)

```javascript
// Serve static assets via CDN
// Update S3 uploads to set Cache-Control headers
const s3Params = {
  Bucket: process.env.S3_BUCKET,
  Key: filename,
  Body: fileBuffer,
  ACL: 'public-read',
  CacheControl: 'max-age=31536000', // 1 year
  ContentType: mimeType,
};

// Use CloudFront distribution
const cdnUrl = `https://cdn.travelcrm.com/${filename}`;
```

### 7. Background Job Optimization (0.5 day)

```javascript
// Move slow operations to background jobs
// Email sending
const { queueEmail } = require('../jobs/emailJob');

async sendQuote(req, res) {
  const quote = await Quote.create(req.body);
  
  // Queue email instead of sending synchronously
  await queueEmail({
    to: quote.customer.email,
    subject: 'Your Travel Quote',
    template: 'quote',
    data: quote,
  });

  // Respond immediately
  res.json({ success: true, data: quote });
}
```

### 8. Load Testing with K6 (1 day)

```javascript
// tests/load/booking-creation.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

export default function() {
  const payload = JSON.stringify({
    customer: 'user_123',
    itinerary: 'itin_456',
    travelers: [{ firstName: 'John', lastName: 'Doe' }],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_TOKEN}`,
    },
  };

  let res = http.post('http://localhost:5000/api/bookings/create', payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### 9. Database Connection Pooling (0.25 day)

```javascript
// Update mongoose connection
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50, // Increase pool size for high concurrency
  minPoolSize: 10,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
});
```

### 10. Horizontal Scaling Preparation (0.5 day)

```javascript
// Make app stateless (session in Redis, not memory)
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Use sticky sessions for WebSocket
// In load balancer config (nginx)
upstream backend {
  ip_hash; # Sticky sessions
  server backend1:5000;
  server backend2:5000;
  server backend3:5000;
}
```

## Performance Benchmarks

### Before Optimization
- Average response time: 800ms
- P95 response time: 2000ms
- Throughput: 50 req/sec
- Database queries per request: 15-20
- Cache hit rate: 0%

### After Optimization (Target)
- Average response time: <200ms
- P95 response time: <500ms
- Throughput: 500 req/sec
- Database queries per request: 2-5
- Cache hit rate: >70%

## Implementation Checklist

### Caching
- [ ] Implement in-memory cache (NodeCache)
- [ ] Implement Redis cache wrapper
- [ ] Cache rate list pricing
- [ ] Cache dashboard statistics
- [ ] Cache supplier data
- [ ] Cache frequently accessed queries
- [ ] Implement cache invalidation on updates

### Database Optimization
- [ ] Add missing indexes
- [ ] Analyze slow queries
- [ ] Optimize compound indexes
- [ ] Enable MongoDB query profiling
- [ ] Increase connection pool size

### N+1 Query Fixes
- [ ] Install query profiler
- [ ] Detect N+1 queries
- [ ] Fix itinerary endpoint
- [ ] Fix booking endpoint
- [ ] Fix reports endpoint
- [ ] Use `.populate()` efficiently

### Response Optimization
- [ ] Implement field selection
- [ ] Enable compression
- [ ] Paginate all list endpoints
- [ ] Reduce JSON response size

### Load Testing
- [ ] Write K6 load test scripts
- [ ] Test booking creation
- [ ] Test quote generation
- [ ] Test dashboard endpoints
- [ ] Test concurrent users (100, 200, 500)
- [ ] Identify bottlenecks

### CDN & Assets
- [ ] Configure CloudFront/CDN
- [ ] Set Cache-Control headers
- [ ] Serve images via CDN
- [ ] Optimize image sizes

### Background Jobs
- [ ] Move email sending to queue
- [ ] Move PDF generation to queue
- [ ] Move report generation to queue

## Acceptance Criteria

- [ ] Average response time < 200ms
- [ ] P95 response time < 500ms
- [ ] Throughput > 500 req/sec
- [ ] Cache hit rate > 70%
- [ ] No N+1 queries detected
- [ ] All list endpoints paginated
- [ ] Load tests passing
- [ ] CDN serving static assets
- [ ] App horizontally scalable

## Monitoring Metrics

```javascript
// Track performance metrics
const metricsService = require('../services/metricsService');

// Record cache hit/miss
metricsService.updateCacheHitRate('redis', hitRate);

// Record query duration
metricsService.recordDbQuery('find', 'Booking', duration);

// Record response time
metricsService.recordHttpRequest(method, route, statusCode, duration);
```

## Environment Variables

```env
CACHE_TTL_SHORT=60
CACHE_TTL_MEDIUM=300
CACHE_TTL_LONG=1800
MONGODB_POOL_SIZE=50
CDN_URL=https://cdn.travelcrm.com
ENABLE_QUERY_PROFILING=true
```

## Notes

- Performance optimization is **ongoing**, not one-time
- Monitor metrics continuously (Grafana dashboards)
- Run load tests before major releases
- Cache invalidation is critical (avoid stale data)
- Horizontal scaling requires stateless architecture
- Use CDN for all static assets (images, PDFs)
- Background jobs improve perceived performance
