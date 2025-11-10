# 🤖 AI Email Automation System

## Overview

The AI Email Automation System is a comprehensive solution for automatically processing, categorizing, and responding to emails in a B2B travel CRM. It uses OpenAI GPT-4 to intelligently understand email content, extract structured data, match customer inquiries with supplier packages, and generate professional responses.

## ✨ Key Features

### 1. **Intelligent Email Categorization**
- Automatically categorizes emails into:
  - 📧 **CUSTOMER** - Booking inquiries, travel requests, questions
  - 📦 **SUPPLIER** - Package updates, pricing, availability
  - 👥 **AGENT** - Commission queries, booking status
  - 💰 **FINANCE** - Payment confirmations, invoices
  - 🗑️ **SPAM** - Marketing, unrelated content
  - ❓ **OTHER** - Uncategorized content
- Provides confidence scores (0-100%)
- Detects sentiment and urgency

### 2. **Data Extraction**
- **Customer Inquiries**: Extracts destination, dates, travelers, budget, preferences
- **Supplier Packages**: Extracts package details, pricing, hotels, activities
- Identifies missing information
- Validates extracted data

### 3. **Smart Package Matching**
- 100-point scoring algorithm
- Matches customer inquiries with supplier packages
- Provides detailed match reasoning
- Identifies gaps and mismatches

### 4. **AI Response Generation**
- Generates professional, contextual email responses
- Multiple templates (Package Found, Package Not Found, etc.)
- Warm, professional tone
- HTML and plain text versions

### 5. **Manual Review Queue**
- Low confidence categorizations
- High-value customers (>$5000 budget)
- SLA tracking with breach alerts
- Assignment workflow
- Team collaboration with comments

### 6. **Cost Monitoring**
- Per-email cost tracking
- Monthly budget management
- Token usage analytics
- Cost optimization alerts

## 🏗️ Architecture

```
┌─────────────────┐
│  Email Webhook  │ ← Incoming emails
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Email Parser  │
│  (mailparser)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   EmailLog DB   │ ← Store email
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Bull Queue    │ ← Background processing
│   (Redis)       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│          AI Processing Pipeline          │
├─────────────────────────────────────────┤
│ 1. Categorization (OpenAI GPT-4)        │
│ 2. Data Extraction (OpenAI GPT-4)       │
│ 3. Package Matching (Algorithm)         │
│ 4. Response Generation (OpenAI GPT-4)   │
└────────┬────────────────────────────────┘
         │
         ├──────────┐
         │          │
         ▼          ▼
┌───────────┐  ┌──────────────┐
│ Processed │  │ Review Queue │
└───────────┘  └──────────────┘
```

## 📁 File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── EmailLog.js                 (242 lines) - Core email storage
│   │   ├── AIProcessingLog.js          (159 lines) - AI operation tracking
│   │   ├── SupplierPackageCache.js     (244 lines) - Package inventory
│   │   ├── ResponseTemplate.js         (197 lines) - Email templates
│   │   ├── EmailCategory.js            (183 lines) - Category rules
│   │   └── ManualReviewQueue.js        (276 lines) - Review workflow
│   │
│   ├── services/
│   │   ├── openaiService.js            (388 lines) - OpenAI integration
│   │   ├── matchingEngine.js           (332 lines) - Package matching
│   │   └── emailProcessingQueue.js     (267 lines) - Queue management
│   │
│   ├── controllers/
│   │   ├── emailController.js          (524 lines) - Email API
│   │   └── reviewQueueController.js    (200 lines) - Review queue API
│   │
│   └── routes/
│       ├── emailRoutes.js              (23 lines) - Email routes
│       └── reviewQueueRoutes.js        (24 lines) - Review routes
│
frontend/
└── src/
    ├── pages/
    │   └── emails/
    │       ├── EmailDashboard.jsx      (433 lines) - Main dashboard
    │       └── EmailDetail.jsx         (600+ lines) - Detail view
    │
    └── services/
        ├── emailAPI.js                 (60 lines) - Email API client
        └── reviewQueueAPI.js           (73 lines) - Review queue API client

test-email-automation.js                (250 lines) - Test script
```

**Total Code: 4,200+ lines**

## 🚀 Quick Start

### Prerequisites

1. **Node.js** 16+ installed
2. **MongoDB** running
3. **Redis** installed and running (required for queue)
4. **OpenAI API Key** from https://platform.openai.com/api-keys

### Installation

```bash
# 1. Install Redis
# Windows (Chocolatey)
choco install redis-64

# macOS
brew install redis

# Linux
sudo apt-get install redis-server

# 2. Start Redis
redis-server

# 3. Install backend dependencies
cd backend
npm install bull mailparser openai

# 4. Configure environment
# Edit backend/.env and add:
OPENAI_API_KEY=sk-...your-key-here
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 5. Start backend
npm run dev

# 6. Start frontend (new terminal)
cd frontend
npm run dev
```

### First Email Test

```bash
# Run the test script
node test-email-automation.js
```

This will send 4 test emails:
1. Dubai Honeymoon Inquiry (Customer)
2. Bali Family Trip (Customer)
3. Maldives Packages (Supplier)
4. European Tour (Customer)

Then visit: http://localhost:5174/emails

## 📚 API Documentation

### Email Endpoints

#### 1. Receive Email (Webhook)
```http
POST /api/v1/emails/webhook
Content-Type: application/json

{
  "from": "customer@example.com",
  "to": "travel@yourcompany.com",
  "subject": "Dubai Inquiry",
  "text": "Email body...",
  "tenantId": "your-tenant-id"
}

Response: {
  "success": true,
  "message": "Email received and queued",
  "emailId": "676d..."
}
```

#### 2. Get All Emails
```http
GET /api/v1/emails?page=1&limit=20&category=CUSTOMER&status=processed
Authorization: Bearer {token}

Response: {
  "success": true,
  "data": [...emails],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### 3. Get Email Details
```http
GET /api/v1/emails/{emailId}
Authorization: Bearer {token}

Response: {
  "success": true,
  "data": {
    "_id": "676d...",
    "from": {...},
    "subject": "...",
    "category": "CUSTOMER",
    "categoryConfidence": 95,
    "extractedData": {...},
    "matchingResults": [...],
    "generatedResponse": {...}
  }
}
```

#### 4. Get Statistics
```http
GET /api/v1/emails/stats
Authorization: Bearer {token}

Response: {
  "success": true,
  "data": {
    "categories": [
      { "_id": "CUSTOMER", "count": 25, "avgConfidence": 88 }
    ],
    "costs": {
      "totalCost": 2.45,
      "totalTokens": 150000,
      "avgCostPerEmail": 0.049
    },
    "queue": {
      "waiting": 3,
      "active": 2,
      "completed": 45
    }
  }
}
```

#### 5. Manual Actions
```http
# Categorize
POST /api/v1/emails/{emailId}/categorize
Response: { "category": "CUSTOMER", "confidence": 95 }

# Extract Data
POST /api/v1/emails/{emailId}/extract
Body: { "type": "customer" }
Response: { "destination": "Dubai", "dates": {...}, ... }

# Match Packages
POST /api/v1/emails/{emailId}/match
Response: [{ "package": {...}, "score": 85, "matchReasons": [...] }]

# Generate Response
POST /api/v1/emails/{emailId}/respond
Body: { "templateType": "PACKAGE_FOUND" }
Response: { "subject": "...", "body": "...", "plainText": "..." }
```

### Review Queue Endpoints

```http
# Get Review Queue
GET /api/v1/review-queue?status=pending&priority=high

# Get My Assigned Reviews
GET /api/v1/review-queue/my-queue

# Complete Review
POST /api/v1/review-queue/{reviewId}/complete
Body: {
  "decision": {
    "action": "approve_ai",
    "categoryOverride": null
  },
  "notes": "Looks good"
}

# Escalate Review
POST /api/v1/review-queue/{reviewId}/escalate
Body: { "reason": "Needs manager approval" }
```

## 💰 Cost Structure

### OpenAI API Pricing (GPT-4 Turbo)
- **Input tokens**: $0.01 per 1,000 tokens
- **Output tokens**: $0.03 per 1,000 tokens

### Estimated Costs Per Email
| Operation | Tokens | Cost |
|-----------|--------|------|
| Categorization | 300-500 | $0.005-0.01 |
| Extraction | 500-800 | $0.01-0.02 |
| Matching | 0 (Algorithm) | $0 |
| Response Generation | 700-1000 | $0.02-0.03 |
| **TOTAL** | **1500-2300** | **$0.035-0.06** |

### Monthly Budget Examples
- **1,000 emails/month**: $35-60
- **3,000 emails/month**: $105-180
- **5,000 emails/month**: $175-300

### Cost Optimization Tips
1. ✅ Use batch processing for non-urgent emails
2. ✅ Cache common queries
3. ✅ Adjust confidence thresholds to reduce re-processing
4. ✅ Use GPT-3.5 Turbo for simpler tasks (10x cheaper)
5. ✅ Set monthly budget alerts

## 📊 Performance Metrics

### Target KPIs
- **Categorization Accuracy**: >90%
- **Data Extraction Accuracy**: >85%
- **Package Match Rate**: >75%
- **Response Quality**: >80% approval rate
- **Processing Speed**: <30 seconds per email
- **Manual Review Rate**: <10% of emails
- **Cost Per Email**: <$0.10

### Current Capabilities
- ✅ **Concurrent Processing**: 3 emails at once
- ✅ **Retry Logic**: 3 attempts with exponential backoff
- ✅ **Error Rate**: <2% target
- ✅ **Uptime**: 99.5% target

## 🔧 Configuration

### Environment Variables

```bash
# OpenAI API
OPENAI_API_KEY=sk-...your-key-here

# Redis (Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Webhook Security (optional)
EMAIL_WEBHOOK_SECRET=your-secret-token

# Processing Settings
EMAIL_CONCURRENT_PROCESSING=3
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=5000

# AI Settings
OPENAI_CATEGORIZATION_MODEL=gpt-4-turbo-preview
OPENAI_EXTRACTION_MODEL=gpt-4-turbo-preview
OPENAI_RESPONSE_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.3

# Review Queue Settings
REVIEW_CONFIDENCE_THRESHOLD=70
REVIEW_HIGH_VALUE_AMOUNT=5000
REVIEW_SLA_URGENT=30
REVIEW_SLA_HIGH=120
REVIEW_SLA_NORMAL=480
```

### Category Configuration

Edit `backend/src/models/EmailCategory.js` to add custom categories:

```javascript
const customCategory = await EmailCategory.create({
  name: 'VIP_CUSTOMER',
  displayName: 'VIP Customer',
  description: 'High-value repeat customers',
  color: '#FFD700',
  icon: 'star',
  categorizationPrompt: 'Check if this is from a VIP customer...',
  keywords: ['vip', 'premium', 'luxury'],
  priority: 100,
  autoRespond: false,
  requiresReview: true,
  assignTo: { role: 'manager' },
  tenantId: 'your-tenant-id'
});
```

## 🎯 Workflow Examples

### Example 1: Customer Inquiry Processing

```
1. Email Received
   From: john@example.com
   Subject: "Dubai Honeymoon Package"
   Body: "Looking for 7 days, luxury hotel, budget $6000"

2. AI Categorization
   ✅ Category: CUSTOMER
   ✅ Confidence: 95%
   ✅ Sentiment: Positive
   ✅ Urgency: Normal

3. Data Extraction
   ✅ Destination: Dubai
   ✅ Duration: 7 nights
   ✅ Travelers: 2 adults
   ✅ Budget: $6000
   ✅ Package Type: Honeymoon
   ✅ Accommodation: 5-star

4. Package Matching
   ✅ Found 3 matches
   Top Match: "Dubai Luxury Honeymoon" (Score: 87/100)
   - Perfect destination match
   - Dates available
   - Within budget (+5%)
   - Includes requested features

5. Response Generation
   ✅ Subject: "Perfect Dubai Honeymoon Packages for You!"
   ✅ Body: Professional response with 3 package options
   ✅ Tone: Warm, enthusiastic
   ✅ Ready to send

6. Status: PROCESSED ✅
   Total Time: 18 seconds
   AI Cost: $0.048
```

### Example 2: Low Confidence Review

```
1. Email Received
   From: sales@company.com
   Subject: "Partnership Opportunity"
   Body: Mixed content about partnership and travel

2. AI Categorization
   ⚠️ Category: AGENT (tentative)
   ⚠️ Confidence: 62%  ← LOW!
   
3. Auto-Sent to Review Queue
   Reason: LOW_CONFIDENCE
   Priority: Normal
   SLA Target: 8 hours

4. Human Review
   Reviewer: Sarah (Operations Manager)
   Action: Override to "OTHER"
   Notes: "Marketing email, not travel-related"
   Time: 2 minutes

5. Status: REVIEWED ✅
```

## 🧪 Testing

### Manual Testing

```bash
# 1. Send test email
curl -X POST http://localhost:5000/api/v1/emails/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "travel@yourcompany.com",
    "subject": "Test Email",
    "text": "Looking for Paris package for 2 adults, 5 nights, budget $3000",
    "tenantId": "your-tenant-id"
  }'

# 2. Check processing status
curl http://localhost:5000/api/v1/emails/{emailId} \
  -H "Authorization: Bearer your-token"

# 3. View in dashboard
# Open http://localhost:5174/emails
```

### Automated Testing

```bash
# Run comprehensive test suite
node test-email-automation.js

# Tests include:
# - Customer inquiry (Dubai honeymoon)
# - Customer inquiry (Bali family trip)
# - Supplier package (Maldives)
# - Multi-destination (Europe tour)
```

### Performance Testing

```bash
# Load test with 100 concurrent emails
npm run test:load

# Monitor Redis queue
redis-cli
> KEYS bull:email-processing:*
> LLEN bull:email-processing:waiting
```

## 🐛 Troubleshooting

### Redis Connection Issues
```
Error: Redis connection failed
```
**Solution**:
1. Check Redis is running: `redis-cli ping` (should return "PONG")
2. Verify `REDIS_HOST` and `REDIS_PORT` in `.env`
3. Restart Redis: `redis-server`

### OpenAI API Errors
```
Error: OpenAI API key invalid
```
**Solution**:
1. Verify `OPENAI_API_KEY` in `.env`
2. Check API key is active at https://platform.openai.com/api-keys
3. Ensure account has credits

### Queue Not Processing
```
Emails stuck in "pending" status
```
**Solution**:
1. Check backend logs for errors
2. Verify Redis connection
3. Restart queue: `npm run dev` (backend)
4. Check queue stats: GET `/api/v1/emails/stats`

### High Costs
```
OpenAI costs exceeding budget
```
**Solution**:
1. Check `openaiCost` field in EmailLog
2. Lower `OPENAI_TEMPERATURE` for deterministic responses
3. Increase `REVIEW_CONFIDENCE_THRESHOLD` to reduce re-processing
4. Use GPT-3.5 for non-critical operations
5. Implement caching for common queries

## 📈 Monitoring

### Dashboard Metrics

Visit `/emails` dashboard to monitor:
- 📧 Total emails processed
- ⏱️ Average processing time
- 💰 Total AI costs
- ⚠️ Emails needing review
- 📊 Category distribution
- 🎯 Confidence scores

### Logs

```bash
# Backend logs
tail -f backend/logs/error.log
tail -f backend/logs/combined.log

# Redis queue logs
redis-cli
> MONITOR
```

### Alerts

Set up alerts for:
- Monthly cost exceeds $100
- Queue backlog > 50 emails
- Error rate > 5%
- SLA breach > 10 items

## 🔒 Security

### Webhook Security

```javascript
// Add webhook secret verification
const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET;

app.post('/api/v1/emails/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  // Verify signature
  if (!verifyWebhookSignature(req.body, signature, webhookSecret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process email...
});
```

### Data Privacy

- ✅ All emails stored with tenant isolation
- ✅ No PII shared with OpenAI (emails are anonymized)
- ✅ GDPR compliant data retention policies
- ✅ Encrypted email content at rest

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production Redis URL
- [ ] Add OpenAI API key to secure vault
- [ ] Set up rate limiting for webhook
- [ ] Configure email retention policy
- [ ] Set up monitoring and alerts
- [ ] Enable HTTPS for webhook endpoint
- [ ] Configure backup strategy for EmailLog collection
- [ ] Test failover scenarios
- [ ] Document runbook for operations team

### Scaling

For high-volume deployments:

1. **Horizontal Scaling**: Add more worker processes
   ```bash
   # Start 3 worker processes
   pm2 start src/server.js -i 3 --name email-worker
   ```

2. **Redis Cluster**: Use Redis Cluster for high availability

3. **Queue Optimization**: Adjust concurrent processing
   ```javascript
   this.queue.process(10, this.processEmail.bind(this));
   ```

4. **Caching**: Implement response caching for common queries

## 📞 Support

For issues or questions:
- 📧 Email: support@yourcompany.com
- 📚 Documentation: https://docs.yourcompany.com/email-automation
- 💬 Slack: #email-automation channel
- 🐛 Issues: https://github.com/yourcompany/travel-crm/issues

## 📝 License

Copyright © 2024 Your Company. All rights reserved.

---

**Generated**: ${new Date().toISOString()}

**Version**: 1.0.0

**Last Updated**: Phase 1 & 2 Complete
