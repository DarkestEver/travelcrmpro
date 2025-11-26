# Phase 15: Webhooks & Integrations

**Status:** ❌ Not Started  
**Priority:** P2 (Medium - Extensibility)  
**Estimated Time:** 4-5 days  
**Dependencies:** Phase 7 (Payments), Phase 13 (Automation)

## Overview

Outbound webhook system for real-time event notifications to external systems, webhook endpoint management, HMAC signature generation, retry logic with exponential backoff, and delivery logs.

## Database Models

### Webhook Schema (NEW - To Implement)

```javascript
// src/models/Webhook.js
const webhookSchema = new mongoose.Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Webhook configuration
  url: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^https?:\/\/.+/.test(v),
      message: 'Invalid URL format',
    },
  },

  // Events to subscribe to
  events: [{
    type: String,
    enum: [
      'booking.created',
      'booking.confirmed',
      'booking.cancelled',
      'booking.completed',
      'payment.received',
      'payment.failed',
      'payment.refunded',
      'lead.created',
      'lead.converted',
      'quote.sent',
      'quote.approved',
      'query.created',
      'query.assigned',
      'document.uploaded',
      'document.verified',
      'review.submitted',
      'user.created',
      'user.deleted',
    ],
    required: true,
  }],

  // Authentication
  secret: {
    type: String,
    required: true,
  },

  // Headers to send
  headers: {
    type: Map,
    of: String,
  },

  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

  // Retry configuration
  retryConfig: {
    maxRetries: {
      type: Number,
      default: 3,
    },
    retryDelay: {
      type: Number,
      default: 60, // seconds
    },
    backoffMultiplier: {
      type: Number,
      default: 2,
    },
  },

  // Failure handling
  failureCount: {
    type: Number,
    default: 0,
  },

  lastFailureAt: Date,

  lastFailureReason: String,

  // Auto-disable after consecutive failures
  consecutiveFailures: {
    type: Number,
    default: 0,
  },

  disabledAt: Date,

  // Success tracking
  successCount: {
    type: Number,
    default: 0,
  },

  lastSuccessAt: Date,

  // Description
  description: String,

  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Method: Generate HMAC signature
webhookSchema.methods.generateSignature = function(payload) {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', this.secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};

// Method: Record delivery success
webhookSchema.methods.recordSuccess = function() {
  this.successCount += 1;
  this.lastSuccessAt = new Date();
  this.consecutiveFailures = 0;
  return this.save();
};

// Method: Record delivery failure
webhookSchema.methods.recordFailure = function(reason) {
  this.failureCount += 1;
  this.consecutiveFailures += 1;
  this.lastFailureAt = new Date();
  this.lastFailureReason = reason;

  // Auto-disable after 10 consecutive failures
  if (this.consecutiveFailures >= 10) {
    this.isActive = false;
    this.disabledAt = new Date();
  }

  return this.save();
};
```

### WebhookDelivery Schema (NEW - To Implement)

```javascript
// src/models/WebhookDelivery.js
const webhookDeliverySchema = new mongoose.Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  webhook: {
    type: Schema.Types.ObjectId,
    ref: 'Webhook',
    required: true,
    index: true,
  },

  // Event details
  event: {
    type: String,
    required: true,
    index: true,
  },

  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },

  // Delivery attempt
  url: String,

  method: {
    type: String,
    default: 'POST',
  },

  headers: Schema.Types.Mixed,

  signature: String,

  // Response
  status: {
    type: String,
    enum: ['pending', 'delivered', 'failed', 'retrying'],
    default: 'pending',
    index: true,
  },

  statusCode: Number,

  responseBody: String,

  responseHeaders: Schema.Types.Mixed,

  // Timing
  sentAt: Date,

  deliveredAt: Date,

  duration: Number, // milliseconds

  // Retry tracking
  attemptCount: {
    type: Number,
    default: 0,
  },

  nextRetryAt: Date,

  errorMessage: String,

  // Idempotency
  idempotencyKey: {
    type: String,
    unique: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes
webhookDeliverySchema.index({ tenant: 1, createdAt: -1 });
webhookDeliverySchema.index({ webhook: 1, status: 1 });
webhookDeliverySchema.index({ nextRetryAt: 1, status: 1 });

// TTL index (auto-delete after 90 days)
webhookDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

## API Endpoints

```javascript
// ========== Webhook Management ==========

// Create webhook
POST /webhooks/create
Body: {
  url,
  events: ['booking.created', 'payment.received'],
  description,
  headers: { 'X-Custom-Header': 'value' }
}

// List webhooks
GET /webhooks
Query params: isActive, page, limit

// Get webhook
GET /webhooks/:id

// Update webhook
PATCH /webhooks/:id
Body: { url, events, isActive, headers }

// Delete webhook
DELETE /webhooks/:id

// Test webhook
POST /webhooks/:id/test
Body: { event: 'booking.created' }

// Rotate webhook secret
POST /webhooks/:id/rotate-secret

// Enable webhook
POST /webhooks/:id/enable

// Disable webhook
POST /webhooks/:id/disable

// ========== Webhook Deliveries ==========

// List deliveries
GET /webhooks/:id/deliveries
Query params: status, event, page, limit

// Get delivery
GET /webhook-deliveries/:id

// Retry failed delivery
POST /webhook-deliveries/:id/retry

// Bulk retry failed deliveries
POST /webhooks/:id/retry-failed
Query params: event, dateFrom, dateTo

// ========== Statistics ==========

// Webhook statistics
GET /webhooks/:id/stats
Returns: {
  totalDeliveries,
  successCount,
  failureCount,
  successRate,
  avgResponseTime,
  recentDeliveries: []
}

// Delivery timeline
GET /webhooks/:id/timeline
Returns: [{ date, delivered, failed }]
```

## Implementation Steps

### Step 1: Create Models (0.5 day)
- [ ] Create Webhook model
- [ ] Create WebhookDelivery model
- [ ] Add indexes
- [ ] Implement signature generation

### Step 2: Webhook Management (1 day)
- [ ] Create webhookController.js
- [ ] Implement webhook CRUD
- [ ] Auto-generate secret on creation
- [ ] Implement secret rotation
- [ ] Implement enable/disable
- [ ] Validate webhook URL (must be HTTPS in production)

### Step 3: Event Emission (1 day)
- [ ] Create webhookService.js
- [ ] Implement event emitter
- [ ] Hook into existing models (Booking, Payment, Lead, etc.)
- [ ] Emit events on create/update/delete
- [ ] Queue webhook deliveries

### Step 4: Webhook Delivery Job (1.5 days)
- [ ] Create webhookDeliveryJob.js
- [ ] Implement HTTP POST to webhook URL
- [ ] Add HMAC signature to headers
- [ ] Handle timeouts (30 seconds)
- [ ] Implement retry logic with exponential backoff
  - [ ] Retry 1: After 1 minute
  - [ ] Retry 2: After 5 minutes
  - [ ] Retry 3: After 15 minutes
- [ ] Record delivery success/failure
- [ ] Auto-disable webhook after 10 consecutive failures

### Step 5: Delivery Logs & Replay (0.5 day)
- [ ] Store all delivery attempts
- [ ] Store request/response details
- [ ] Implement manual retry
- [ ] Implement bulk retry
- [ ] TTL for old delivery logs (90 days)

### Step 6: Testing Endpoint (0.25 day)
- [ ] Implement test webhook endpoint
- [ ] Send sample event payload
- [ ] Validate webhook URL is reachable
- [ ] Return delivery result

### Step 7: Validation & Routes (0.25 day)
- [ ] Create validation schemas
- [ ] Create routes
- [ ] Apply RBAC (admin/manager only)
- [ ] Mount routes

### Step 8: Testing (0.5 day)
- [ ] Test webhook creation
- [ ] Test event emission
- [ ] Test delivery with valid webhook
- [ ] Test retry logic
- [ ] Test signature generation
- [ ] Test auto-disable after failures

## Webhook Payload Format

### Standard Payload Structure

```json
{
  "id": "wh_evt_123456",
  "event": "booking.created",
  "timestamp": "2025-11-24T10:30:00Z",
  "tenant": {
    "id": "tenant_123",
    "name": "Travel Agency XYZ"
  },
  "data": {
    "bookingNumber": "BK-000123",
    "customer": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "totalAmount": 2500.00,
    "currency": "USD",
    "status": "confirmed",
    "travelDates": {
      "from": "2025-12-01",
      "to": "2025-12-10"
    }
  }
}
```

### Signature Verification (For webhook consumers)

```javascript
// Example: Verifying webhook signature
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === expectedSignature;
}

// In your webhook receiver
app.post('/webhook/receiver', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;

  if (!verifyWebhookSignature(payload, signature, YOUR_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  console.log('Received event:', payload.event);
  res.status(200).send('OK');
});
```

## Webhook Service

```javascript
// src/services/webhookService.js
const Webhook = require('../models/Webhook');
const WebhookDelivery = require('../models/WebhookDelivery');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class WebhookService {
  async emit(tenantId, event, data) {
    // Find all active webhooks subscribed to this event
    const webhooks = await Webhook.find({
      tenant: tenantId,
      isActive: true,
      events: event,
    });

    if (webhooks.length === 0) return;

    // Queue deliveries for each webhook
    for (const webhook of webhooks) {
      await this.queueDelivery(webhook, event, data);
    }
  }

  async queueDelivery(webhook, event, data) {
    const payload = {
      id: `wh_evt_${uuidv4()}`,
      event,
      timestamp: new Date().toISOString(),
      tenant: {
        id: webhook.tenant,
      },
      data,
    };

    const signature = webhook.generateSignature(payload);

    // Create delivery record
    const delivery = await WebhookDelivery.create({
      tenant: webhook.tenant,
      webhook: webhook._id,
      event,
      payload,
      url: webhook.url,
      headers: Object.fromEntries(webhook.headers || []),
      signature,
      status: 'pending',
      idempotencyKey: `${webhook._id}_${event}_${Date.now()}`,
    });

    // Queue for immediate delivery (or schedule with Bull)
    await this.deliverWebhook(delivery._id);
  }

  async deliverWebhook(deliveryId) {
    const delivery = await WebhookDelivery.findById(deliveryId).populate('webhook');
    
    if (!delivery || delivery.status === 'delivered') return;

    const webhook = delivery.webhook;
    const startTime = Date.now();

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': delivery.signature,
        'X-Webhook-Event': delivery.event,
        'X-Webhook-ID': delivery.idempotencyKey,
        ...delivery.headers,
      };

      const response = await axios.post(delivery.url, delivery.payload, {
        headers,
        timeout: 30000, // 30 seconds
      });

      // Success
      delivery.status = 'delivered';
      delivery.deliveredAt = new Date();
      delivery.sentAt = new Date();
      delivery.statusCode = response.status;
      delivery.responseBody = JSON.stringify(response.data).substring(0, 1000);
      delivery.responseHeaders = response.headers;
      delivery.duration = Date.now() - startTime;
      await delivery.save();

      await webhook.recordSuccess();

    } catch (error) {
      delivery.attemptCount += 1;
      delivery.status = 'failed';
      delivery.sentAt = new Date();
      delivery.statusCode = error.response?.status;
      delivery.errorMessage = error.message;
      delivery.duration = Date.now() - startTime;

      // Schedule retry
      if (delivery.attemptCount < webhook.retryConfig.maxRetries) {
        const retryDelay = webhook.retryConfig.retryDelay * 
                          Math.pow(webhook.retryConfig.backoffMultiplier, delivery.attemptCount - 1);
        
        delivery.nextRetryAt = new Date(Date.now() + retryDelay * 1000);
        delivery.status = 'retrying';
      }

      await delivery.save();
      await webhook.recordFailure(error.message);
    }
  }
}

module.exports = new WebhookService();
```

## Event Emission Examples

```javascript
// In bookingController.js
const webhookService = require('../services/webhookService');

async createBooking(req, res) {
  const booking = await Booking.create(req.body);

  // Emit webhook event
  await webhookService.emit(req.tenant._id, 'booking.created', {
    bookingNumber: booking.bookingNumber,
    customer: {
      id: booking.customer._id,
      name: booking.customer.name,
      email: booking.customer.email,
    },
    totalAmount: booking.pricing.total,
    currency: booking.pricing.currency,
    status: booking.status,
  });

  res.json({ success: true, data: booking });
}
```

## Testing Strategy

### Unit Tests
- [ ] Test signature generation
- [ ] Test retry delay calculation
- [ ] Test auto-disable logic

### Integration Tests
- [ ] Test webhook creation
- [ ] Test event emission
- [ ] Test successful delivery
- [ ] Test failed delivery with retry
- [ ] Test signature verification
- [ ] Test manual retry

## Acceptance Criteria

- [ ] Webhooks created with valid URL
- [ ] Events emitted on booking/payment/lead changes
- [ ] Deliveries sent with HMAC signature
- [ ] Retry logic works with exponential backoff
- [ ] Failed deliveries logged
- [ ] Webhooks auto-disabled after 10 failures
- [ ] Manual retry working
- [ ] Delivery logs stored (90-day TTL)
- [ ] All tests passing (>75% coverage)

## Environment Variables

```env
WEBHOOK_TIMEOUT=30000
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY=60
WEBHOOK_BACKOFF_MULTIPLIER=2
WEBHOOK_AUTO_DISABLE_THRESHOLD=10
```

## Notes

- Webhooks enable real-time integrations with external systems
- HMAC signatures ensure authenticity
- Retry logic prevents data loss
- Delivery logs help debugging integration issues
- Consider implementing webhook verification endpoint (challenge-response)
- Document webhook events and payload formats for developers
