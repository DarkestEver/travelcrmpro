# Technical Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │   Web App    │  │  Mobile App  │  │   Customer PWA      │  │
│  │ (React+Vite) │  │(React Native)│  │  (Phase D)          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘  │
│         │                  │                      │              │
│         └──────────────────┴──────────────────────┘              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   CDN / Nginx   │
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              NestJS API Gateway                           │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐   │  │
│  │  │  Auth   │ │ Agents  │ │Itinerary│ │   Payments   │   │  │
│  │  │ Module  │ │ Module  │ │ Module  │ │   Module     │   │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────────┘   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐   │  │
│  │  │ Quotes  │ │Bookings │ │Suppliers│ │   Reports    │   │  │
│  │  │ Module  │ │ Module  │ │ Module  │ │   Module     │   │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Background Job Processors (BullMQ)              │  │
│  │  • PDF Generation  • Email Sending  • Data Import        │  │
│  │  • Notifications   • Scheduled Jobs  • Report Generation │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  MongoDB       │  │  Redis Cache    │  │ Elasticsearch  │
│  (Primary DB)  │  │  + Queue        │  │  (Search)      │
│                │  │                 │  │                │
│  • Agents      │  │  • Sessions     │  │  • Sites       │
│  • Customers   │  │  • API Cache    │  │  • Itineraries │
│  • Itineraries │  │  • Job Queue    │  │  • Suppliers   │
│  • Quotes      │  │  • Rate Limit   │  │                │
│  • Bookings    │  │                 │  │                │
└────────────────┘  └─────────────────┘  └────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  PostgreSQL    │  │   AWS S3 /      │  │  External APIs │
│  (Optional)    │  │   MinIO         │  │                │
│                │  │  (File Storage) │  │  • OpenAI      │
│  • Financial   │  │                 │  │  • Stripe      │
│  • Ledgers     │  │  • Documents    │  │  • SendGrid    │
│  • Accounting  │  │  • PDFs         │  │  • Twilio      │
│                │  │  • Images       │  │  • Google Maps │
└────────────────┘  └─────────────────┘  └────────────────┘
```

---

## Technology Decisions & Rationale

### Frontend: React + Vite (instead of Next.js)

**Why Vite over Next.js?**
- ⚡ **Faster Development**: Hot Module Replacement (HMR) is significantly faster
- 🎯 **Simpler**: We don't need SSR for most of the app (it's a B2B CRM, not public-facing)
- 📦 **Smaller Bundle**: Better tree-shaking and code splitting
- 🔧 **Flexibility**: Easier to integrate with custom backends
- 💰 **No Vendor Lock-in**: Not tied to Vercel infrastructure

**When Next.js might be reconsidered:**
- If we need public marketing pages with SEO
- If we want API routes in the frontend repo
- For customer-facing booking portals (Phase D)

### State Management: Zustand

**Why Zustand over Redux?**
- ✅ Simpler API, less boilerplate
- ✅ Better TypeScript support
- ✅ No providers needed (less wrapper hell)
- ✅ Smaller bundle size
- ✅ Built-in middleware (persist, devtools)

### Backend: NestJS

**Why NestJS over Express?**
- 🏗️ **Structure**: Opinionated architecture scales better
- 📦 **Modules**: Built-in dependency injection
- 🔒 **Decorators**: Clean authentication/authorization
- 📄 **OpenAPI**: Auto-generated API docs
- 🧪 **Testing**: Built-in testing utilities
- 🔧 **TypeScript**: First-class TypeScript support

### Database: MongoDB Primary

**Why MongoDB?**
- 📋 **Flexibility**: Itineraries have dynamic structure (perfect for documents)
- 🚀 **Fast Development**: Schema changes are easier
- 📊 **Scalability**: Horizontal scaling with sharding
- 🔍 **Aggregation**: Powerful aggregation pipeline for reports

**Why PostgreSQL as optional?**
- 💰 For financial data requiring ACID guarantees
- 📊 For complex relational queries (reports)
- 🔒 For strict data integrity

**Hybrid Approach**: Use both where it makes sense

---

## Security Architecture

### Authentication Flow

```
┌─────────┐                  ┌──────────────┐
│ Client  │                  │   Backend    │
└────┬────┘                  └──────┬───────┘
     │                              │
     │  1. POST /auth/login         │
     │  { email, password }         │
     ├─────────────────────────────>│
     │                              │ 2. Validate credentials
     │                              │    (bcrypt compare)
     │                              │
     │                              │ 3. Generate JWT tokens
     │  4. Return tokens            │    (access + refresh)
     │  { access_token,             │
     │    refresh_token }           │
     │<─────────────────────────────┤
     │                              │
     │  5. Store tokens             │
     │     (localStorage/cookie)    │
     │                              │
     │  6. API Request              │
     │  Authorization: Bearer <JWT> │
     ├─────────────────────────────>│
     │                              │ 7. Verify JWT
     │                              │    Check expiry
     │                              │    Verify signature
     │                              │
     │                              │ 8. Check permissions (RBAC)
     │  9. Return data              │    Extract user role
     │<─────────────────────────────┤    Check resource access
     │                              │
```

### SSO (OAuth2/SAML) Flow

```
┌─────────┐     ┌──────────────┐     ┌────────────────┐
│ Client  │     │   Backend    │     │  SSO Provider  │
│         │     │    (SP)      │     │  (Google/MS)   │
└────┬────┘     └──────┬───────┘     └───────┬────────┘
     │                 │                     │
     │ 1. Click        │                     │
     │   "Login SSO"   │                     │
     ├────────────────>│                     │
     │                 │ 2. Redirect to IdP  │
     │                 │    with callback    │
     │<────────────────┤                     │
     │                 │                     │
     │ 3. Redirect to SSO login             │
     ├─────────────────────────────────────>│
     │                 │                     │ 4. User authenticates
     │                 │                     │
     │ 5. Redirect with auth code           │
     │<─────────────────────────────────────┤
     │                 │                     │
     │ 6. Send code    │                     │
     ├────────────────>│ 7. Exchange code   │
     │                 │    for token        │
     │                 ├────────────────────>│
     │                 │                     │
     │                 │ 8. Return user info │
     │                 │<────────────────────┤
     │                 │                     │
     │                 │ 9. Create/update user
     │                 │    Generate JWT     │
     │ 10. Return JWT  │                     │
     │<────────────────┤                     │
```

### RBAC Model

```
User
 ├─ Role(s)
 │   ├─ SuperAdmin
 │   │   └─ Permissions: [*] (all)
 │   │
 │   ├─ Operator
 │   │   └─ Permissions:
 │   │       • itineraries:* (CRUD)
 │   │       • quotes:* (CRUD)
 │   │       • bookings:* (CRUD)
 │   │       • agents:read
 │   │       • suppliers:read
 │   │
 │   ├─ Agent
 │   │   └─ Permissions:
 │   │       • customers:* (own only)
 │   │       • quotes:read (own only)
 │   │       • bookings:read (own only)
 │   │       • quote-requests:*
 │   │
 │   ├─ Supplier
 │   │   └─ Permissions:
 │   │       • rate-sheets:* (own only)
 │   │       • requests:read,update
 │   │       • bookings:read (related)
 │   │
 │   └─ Auditor
 │       └─ Permissions:
 │           • *:read (all resources)
 │           • audit-logs:read
 │           • reports:read
 │
 └─ Resource Ownership
     • Agents see only their customers
     • Suppliers see only their data
     • Operators see all
```

---

## Data Flow Examples

### Creating a Booking (End-to-End)

```
Agent → Quote Request → Operator Creates Itinerary → Generate Quote
         ↓                                               ↓
    PDF Generated ← Email Sent ← Quote Saved          Pricing
         ↓                                           Calculated
    Agent Accepts → Create Booking → Payment Link
                         ↓              ↓
                  Stripe Webhook → Update Status
                         ↓
                  Generate Voucher → Email Customer
                         ↓
                  Notify Suppliers → Confirm Booking
```

### Quote Generation Flow

```
1. Operator selects itinerary
2. Pricing engine calculates:
   └─> Base cost (sum of all components)
   └─> Apply markup rules (%)
   └─> Apply agent discount
   └─> Calculate taxes
   └─> Total price
3. Create Quote document in DB
4. Queue PDF generation job
   └─> BullMQ picks up job
   └─> Puppeteer renders PDF
   └─> Upload to S3
   └─> Update quote with PDF URL
5. Queue email job
   └─> SendGrid sends email with PDF
6. Update quote status to "sent"
7. Create audit log entry
```

---

## Caching Strategy

### Multi-Layer Caching

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Browser Cache (Service Worker)                 │
│  • Static assets (JS, CSS, images)                      │
│  • TTL: 7 days                                           │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│ Layer 2: CDN Cache (CloudFlare/CloudFront)              │
│  • Static files, fonts, images                          │
│  • TTL: 30 days                                          │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Redis Application Cache                        │
│  • User sessions: TTL 24 hours                           │
│  • API responses (GET): TTL 5 minutes                    │
│  • Search results: TTL 10 minutes                        │
│  • Pricing calculations: TTL 1 hour                      │
│  • Dashboard KPIs: TTL 15 minutes                        │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Database Query Cache                           │
│  • MongoDB query result caching                          │
│  • Aggregation pipeline results                          │
└─────────────────────────────────────────────────────────┘
```

### Cache Invalidation

**Strategies**:
- **TTL (Time-To-Live)**: Automatic expiration
- **Event-based**: Invalidate on create/update/delete
- **Manual**: Admin can clear cache

**Example**: When a quote is updated:
```typescript
// Invalidate related caches
cache.del(`quote:${quoteId}`);
cache.del(`agent:${agentId}:quotes`);
cache.del(`dashboard:agent:${agentId}`);
```

---

## Scalability Considerations

### Horizontal Scaling

```
                    ┌─────────────┐
                    │Load Balancer│
                    └──────┬──────┘
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────▼─────┐    ┌─────▼────┐    ┌─────▼────┐
     │ API Pod 1│    │ API Pod 2│    │ API Pod 3│
     └──────────┘    └──────────┘    └──────────┘
     (Stateless)     (Stateless)     (Stateless)
```

**Stateless Design**: No session data stored in app servers
**Session Storage**: Redis for shared session state
**File Storage**: S3 (not local filesystem)

### Database Scaling

**MongoDB**:
- **Vertical**: Increase server resources
- **Horizontal**: Sharding by `agent_id` or `country`
- **Read Replicas**: For reporting queries

**Redis**:
- **Clustering**: Redis Cluster for horizontal scaling
- **Sentinel**: High availability with automatic failover

### Job Queue Scaling

```
┌──────────────────────────────────────────────┐
│        BullMQ Job Queue (Redis)              │
└─────┬────────────┬────────────┬──────────────┘
      │            │            │
┌─────▼────┐  ┌────▼─────┐  ┌──▼──────────┐
│ Worker 1 │  │ Worker 2 │  │  Worker 3   │
│ (PDF Gen)│  │ (Email)  │  │(Data Import)│
└──────────┘  └──────────┘  └─────────────┘
```

**Worker Scaling**: Add more workers for high load
**Priority Queues**: Critical jobs (payments) prioritized

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p50) | <100ms | Prometheus |
| API Response Time (p95) | <200ms | Prometheus |
| API Response Time (p99) | <500ms | Prometheus |
| Frontend Initial Load | <2s | Lighthouse |
| Frontend Lighthouse Score | >90 | Lighthouse |
| Search Query Time | <100ms | Elasticsearch |
| PDF Generation Time | <5s | BullMQ metrics |
| Email Delivery Time | <10s | SendGrid API |
| Database Query Time (p95) | <50ms | MongoDB Atlas |
| Cache Hit Rate | >80% | Redis INFO |
| Uptime | >99.9% | UptimeRobot |

---

## Monitoring & Observability

### Metrics (Prometheus)

```
# API Metrics
http_requests_total{method, endpoint, status}
http_request_duration_seconds{method, endpoint}
http_requests_in_flight{endpoint}

# Database Metrics
mongodb_connections_current
mongodb_operations_total{operation}
mongodb_query_duration_seconds

# Queue Metrics
bullmq_jobs_total{queue, status}
bullmq_job_duration_seconds{queue}
bullmq_queue_depth{queue}

# Business Metrics
bookings_created_total
quotes_generated_total
revenue_total{currency}
active_users_total
```

### Logging (Winston/Pino)

**Log Levels**:
- **ERROR**: System errors, exceptions
- **WARN**: Warnings, deprecated features
- **INFO**: Important business events
- **DEBUG**: Detailed debugging (dev only)

**Structured Logging**:
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "info",
  "message": "Quote generated",
  "context": {
    "quoteId": "q_123456",
    "agentId": "a_789",
    "itineraryId": "i_456",
    "amount": 5000,
    "currency": "USD"
  },
  "userId": "u_999",
  "requestId": "req_abc123"
}
```

### Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | >1% error rate for 5 min | Critical | Page on-call |
| Slow API | p95 >500ms for 5 min | Warning | Notify team |
| Database Down | No connection for 1 min | Critical | Page on-call |
| Queue Backup | >1000 pending jobs | Warning | Scale workers |
| High Memory | >90% memory for 5 min | Warning | Check for leaks |
| SSL Expiring | <7 days until expiry | Warning | Renew certificate |

---

## Deployment Architecture

### Environments

```
┌──────────────────────────────────────────────────────┐
│ Development                                          │
│  • Local Docker Compose                              │
│  • Hot reload enabled                                │
│  • Debug mode on                                     │
└──────────────────────────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────┐
│ Staging                                              │
│  • Auto-deploy on merge to 'develop'                 │
│  • Production-like environment                       │
│  • Smoke tests after deploy                          │
└──────────────────────────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────┐
│ Production                                           │
│  • Manual approval required                          │
│  • Blue-green deployment                             │
│  • Rollback capability                               │
└──────────────────────────────────────────────────────┘
```

### CI/CD Pipeline (GitHub Actions)

```yaml
Trigger: Push to branch
  │
  ├─> Run Linter (ESLint)
  │
  ├─> Run Unit Tests
  │
  ├─> Run Integration Tests
  │
  ├─> Build Docker Image
  │
  ├─> Push to Container Registry
  │
  ├─> [If develop branch]
  │   └─> Deploy to Staging
  │       └─> Run E2E Tests
  │
  └─> [If main branch]
      └─> Manual Approval
          └─> Deploy to Production
              └─> Health Check
              └─> Success → Done
              └─> Failure → Auto Rollback
```

---

## Disaster Recovery

### Backup Strategy

**Databases**:
- **MongoDB**: Daily automated snapshots (retain 30 days)
- **Redis**: AOF (Append-Only File) + RDB snapshots
- **PostgreSQL**: Daily pg_dump + WAL archiving

**Files (S3)**:
- **Versioning**: Enabled on all buckets
- **Cross-region replication**: For critical files
- **Lifecycle policies**: Archive to Glacier after 90 days

### Recovery Procedures

**RTO (Recovery Time Objective)**: < 4 hours  
**RPO (Recovery Point Objective)**: < 1 hour

**Scenario: Database Failure**
1. Detect failure (monitoring alert)
2. Promote replica to primary (MongoDB)
3. Update DNS/connection string
4. Verify data integrity
5. Resume operations
6. Post-mortem analysis

**Scenario: Complete Region Failure**
1. Activate DR site in different region
2. Restore latest database snapshot
3. Point DNS to DR site
4. Verify all services operational
5. Communicate with users

---

## Future Considerations

### Phase E+ (Beyond Current Roadmap)

**Blockchain Integration**
- Smart contracts for supplier agreements
- Immutable booking records
- Transparent commission tracking

**IoT Integration**
- Real-time flight tracking
- Hotel check-in automation
- Luggage tracking

**AR/VR Experiences**
- Virtual destination previews
- 360° hotel tours
- AR-powered city guides

**GraphQL API** (Alternative to REST)
- More flexible querying
- Reduce over-fetching
- Better for mobile apps

**Microservices Architecture**
- If system becomes very large
- Independent scaling of services
- Polyglot persistence

---

**Last Updated**: November 6, 2025  
**Next Review**: Start of Phase A development
