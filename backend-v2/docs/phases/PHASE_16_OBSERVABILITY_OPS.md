# Phase 16: Observability & Operations (DevOps)

**Status:** ❌ Not Started  
**Priority:** P0 (Critical - MUST before Production)  
**Estimated Time:** 4-5 days  
**Dependencies:** All previous phases

## Overview

Production monitoring, metrics, logging, error tracking, alerting, and CI/CD hardening. This phase is **critical** for production readiness.

## Current Implementation Status

### ✅ Implemented (Partial)
- [x] Winston logging (basic setup)
- [x] Morgan HTTP logging
- [x] Docker deployment (basic)

### ❌ Missing (90%)
- [ ] **Prometheus** metrics collection
- [ ] **Grafana** dashboards
- [ ] **Sentry** error tracking
- [ ] **Structured logging** (JSON format)
- [ ] **Trace IDs** and correlation
- [ ] **Health checks** (readiness, liveness)
- [ ] **Alerting** (Slack, email, PagerDuty)
- [ ] **Performance APM** (application performance monitoring)
- [ ] **CI/CD hardening** (automated tests, security scans)
- [ ] **Backup automation**
- [ ] **Log aggregation** (ELK or CloudWatch)

## Implementation Breakdown

## 1. Metrics Collection with Prometheus

### Install Dependencies
```bash
npm install prom-client
```

### Metrics Service (NEW - To Implement)

```javascript
// src/services/metricsService.js
const promClient = require('prom-client');

class MetricsService {
  constructor() {
    // Enable default metrics (CPU, memory, event loop, etc.)
    promClient.collectDefaultMetrics({
      timeout: 5000,
      prefix: 'travel_crm_',
    });

    // Custom metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'travel_crm_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'travel_crm_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.activeConnections = new promClient.Gauge({
      name: 'travel_crm_active_connections',
      help: 'Number of active connections',
    });

    this.dbQueryDuration = new promClient.Histogram({
      name: 'travel_crm_db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'collection'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    this.emailsSent = new promClient.Counter({
      name: 'travel_crm_emails_sent_total',
      help: 'Total number of emails sent',
      labelNames: ['status', 'type'],
    });

    this.bookingsCreated = new promClient.Counter({
      name: 'travel_crm_bookings_created_total',
      help: 'Total number of bookings created',
      labelNames: ['status'],
    });

    this.paymentsProcessed = new promClient.Counter({
      name: 'travel_crm_payments_processed_total',
      help: 'Total number of payments processed',
      labelNames: ['gateway', 'status'],
    });

    this.cacheHitRate = new promClient.Gauge({
      name: 'travel_crm_cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['cache_type'],
    });

    this.jobQueueSize = new promClient.Gauge({
      name: 'travel_crm_job_queue_size',
      help: 'Number of jobs in queue',
      labelNames: ['queue_name', 'status'],
    });

    this.slaBreach = new promClient.Counter({
      name: 'travel_crm_sla_breaches_total',
      help: 'Total number of SLA breaches',
      labelNames: ['severity'],
    });
  }

  // Record HTTP request
  recordHttpRequest(method, route, statusCode, duration) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  }

  // Record DB query
  recordDbQuery(operation, collection, duration) {
    this.dbQueryDuration.observe({ operation, collection }, duration);
  }

  // Record email sent
  recordEmailSent(status, type = 'transactional') {
    this.emailsSent.inc({ status, type });
  }

  // Record booking created
  recordBookingCreated(status) {
    this.bookingsCreated.inc({ status });
  }

  // Record payment processed
  recordPaymentProcessed(gateway, status) {
    this.paymentsProcessed.inc({ gateway, status });
  }

  // Update cache hit rate
  updateCacheHitRate(cacheType, hitRate) {
    this.cacheHitRate.set({ cache_type: cacheType }, hitRate);
  }

  // Update job queue size
  updateJobQueueSize(queueName, status, size) {
    this.jobQueueSize.set({ queue_name: queueName, status }, size);
  }

  // Record SLA breach
  recordSlaBreach(severity) {
    this.slaBreach.inc({ severity });
  }

  // Get metrics for Prometheus scraping
  getMetrics() {
    return promClient.register.metrics();
  }

  // Reset all metrics (for testing)
  reset() {
    promClient.register.clear();
  }
}

module.exports = new MetricsService();
```

### Metrics Middleware

```javascript
// src/middleware/metricsMiddleware.js
const metricsService = require('../services/metricsService');

module.exports = (req, res, next) => {
  const start = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  res.end = function(...args) {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    metricsService.recordHttpRequest(
      req.method,
      route,
      res.statusCode,
      duration
    );

    originalEnd.apply(res, args);
  };

  next();
};
```

### Metrics Endpoint

```javascript
// src/routes/metricsRoutes.js
const express = require('express');
const router = express.Router();
const metricsService = require('../services/metricsService');

// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await metricsService.getMetrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

module.exports = router;
```

## 2. Sentry Error Tracking

### Install Dependencies
```bash
npm install @sentry/node @sentry/profiling-node
```

### Sentry Setup

```javascript
// src/config/sentry.js
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

const initSentry = (app) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) || 0.1,
    environment: process.env.NODE_ENV,
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      return event;
    },
  });

  // Request handler must be first
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  return Sentry;
};

module.exports = { initSentry, Sentry };
```

### Sentry Error Handler

```javascript
// src/middleware/errorHandler.js (UPDATE)
const { Sentry } = require('../config/sentry');

module.exports = (err, req, res, next) => {
  // Log to Sentry
  Sentry.captureException(err, {
    user: req.user ? { id: req.user._id, email: req.user.email } : undefined,
    tags: {
      tenant: req.tenant?._id,
      route: req.route?.path,
    },
    extra: {
      body: req.body,
      query: req.query,
      params: req.params,
    },
  });

  // Log to Winston
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    userId: req.user?._id,
    tenantId: req.tenant?._id,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

## 3. Structured Logging with Trace IDs

### Enhanced Logger

```javascript
// src/utils/logger.js (UPDATE)
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json() // JSON format for structured logging
  ),
  defaultMeta: {
    service: 'travel-crm-api',
    version: process.env.npm_package_version,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Add trace ID to all logs
logger.addTraceId = (traceId) => {
  return logger.child({ traceId });
};

module.exports = logger;
```

### Trace ID Middleware

```javascript
// src/middleware/traceIdMiddleware.js
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  // Generate or extract trace ID
  const traceId = req.headers['x-trace-id'] || uuidv4();
  
  // Attach to request
  req.traceId = traceId;
  
  // Attach logger with trace ID
  req.logger = logger.child({ traceId });
  
  // Add to response headers
  res.setHeader('X-Trace-ID', traceId);
  
  next();
};
```

## 4. Health Checks

### Health Check Endpoints

```javascript
// src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redisClient = require('../config/redis');

// Liveness probe (is app running?)
router.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe (is app ready to serve traffic?)
router.get('/health/ready', async (req, res) => {
  const checks = {
    mongodb: 'unknown',
    redis: 'unknown',
  };

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      checks.mongodb = 'ok';
    } else {
      checks.mongodb = 'down';
    }

    // Check Redis
    try {
      await redisClient.ping();
      checks.redis = 'ok';
    } catch (err) {
      checks.redis = 'down';
    }

    const allOk = Object.values(checks).every(status => status === 'ok');

    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      checks,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Startup probe (has app finished starting?)
router.get('/health/startup', (req, res) => {
  res.status(200).json({
    status: 'started',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
```

## 5. Alerting

### Alert Service

```javascript
// src/services/alertService.js
const axios = require('axios');
const logger = require('../utils/logger');

class AlertService {
  async sendSlackAlert(message, severity = 'warning') {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const color = {
      critical: '#FF0000',
      warning: '#FFA500',
      info: '#0000FF',
    }[severity] || '#808080';

    try {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        attachments: [{
          color,
          title: `🚨 Travel CRM Alert - ${severity.toUpperCase()}`,
          text: message,
          footer: 'Travel CRM Monitoring',
          ts: Math.floor(Date.now() / 1000),
        }],
      });
    } catch (err) {
      logger.error('Failed to send Slack alert', { error: err.message });
    }
  }

  async sendEmailAlert(to, subject, message) {
    // Use existing email service
    const emailService = require('./emailService');
    
    try {
      await emailService.sendEmail({
        to,
        subject: `🚨 ${subject}`,
        html: `
          <h2>Alert Notification</h2>
          <p>${message}</p>
          <hr>
          <small>Sent at ${new Date().toISOString()}</small>
        `,
      });
    } catch (err) {
      logger.error('Failed to send email alert', { error: err.message });
    }
  }

  async alertHighErrorRate(errorRate) {
    const message = `High error rate detected: ${errorRate}% (threshold: 5%)`;
    await this.sendSlackAlert(message, 'critical');
  }

  async alertSlaBreach(queryId, level) {
    const message = `SLA breach - Query ${queryId} escalated to level ${level}`;
    await this.sendSlackAlert(message, 'warning');
  }

  async alertDatabaseDown() {
    const message = 'Database connection lost! Immediate action required.';
    await this.sendSlackAlert(message, 'critical');
    await this.sendEmailAlert(
      process.env.ADMIN_EMAIL,
      'Database Down',
      message
    );
  }

  async alertHighMemoryUsage(usage) {
    const message = `High memory usage: ${usage}% (threshold: 85%)`;
    await this.sendSlackAlert(message, 'warning');
  }
}

module.exports = new AlertService();
```

## 6. CI/CD Hardening

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/travel_crm_test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run OWASP dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          path: '.'
          format: 'HTML'

  build:
    runs-on: ubuntu-latest
    needs: [test, security]

    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t travel-crm-api:${{ github.sha }} .

      - name: Push to registry (production only)
        if: github.ref == 'refs/heads/main'
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag travel-crm-api:${{ github.sha }} ${{ secrets.DOCKER_USERNAME }}/travel-crm-api:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/travel-crm-api:latest
```

## Implementation Checklist

### Metrics & Monitoring
- [ ] Install prom-client
- [ ] Create metricsService.js
- [ ] Add metricsMiddleware.js
- [ ] Create /metrics endpoint
- [ ] Set up Prometheus server
- [ ] Create Grafana dashboards

### Error Tracking
- [ ] Install @sentry/node
- [ ] Configure Sentry
- [ ] Add Sentry error handler
- [ ] Test error reporting

### Logging
- [ ] Update Winston to JSON format
- [ ] Add trace ID middleware
- [ ] Implement structured logging
- [ ] Set up log rotation

### Health Checks
- [ ] Create /health/live endpoint
- [ ] Create /health/ready endpoint
- [ ] Create /health/startup endpoint
- [ ] Configure Kubernetes probes

### Alerting
- [ ] Create alertService.js
- [ ] Slack integration
- [ ] Email alerts
- [ ] Define alert thresholds

### CI/CD
- [ ] Create GitHub Actions workflow
- [ ] Add linting step
- [ ] Add testing step
- [ ] Add security scanning
- [ ] Add Docker build
- [ ] Set up automated deployment

## Acceptance Criteria

- [ ] Prometheus collects metrics from /metrics endpoint
- [ ] Grafana dashboards visualize key metrics
- [ ] Sentry captures and reports errors
- [ ] Logs include trace IDs
- [ ] Health checks return correct status
- [ ] Alerts sent to Slack for critical events
- [ ] CI pipeline runs on every PR
- [ ] Security scans fail pipeline on critical vulnerabilities
- [ ] Docker images built and pushed automatically

## Environment Variables

```env
# Sentry
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
ADMIN_EMAIL=admin@example.com
ALERT_ERROR_RATE_THRESHOLD=5
ALERT_MEMORY_THRESHOLD=85

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
```

## Production Readiness Checklist

- [ ] All metrics tracked
- [ ] Dashboards created
- [ ] Error tracking configured
- [ ] Logs structured and searchable
- [ ] Health checks working
- [ ] Alerts configured
- [ ] CI/CD pipeline tested
- [ ] Security scans passing
- [ ] Backup automation in place
- [ ] Documentation complete
