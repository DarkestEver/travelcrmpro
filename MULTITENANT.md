# Multi-Tenant Architecture Implementation

## Overview

The Travel CRM has been upgraded to support **multi-tenancy**, allowing multiple travel agencies to use the same platform with complete data isolation.

## Architecture Type

**Shared Database with Tenant Discrimination**
- Single database for all tenants
- Each record includes a `tenantId` field
- Query-level filtering ensures data isolation
- Cost-effective and easier to maintain

## Key Features

### 1. **Tenant Isolation**
- Complete data separation between tenants
- Users can only access their tenant's data
- Tenant-specific settings and branding

### 2. **Subdomain Support**
- Each tenant gets a unique subdomain (e.g., `acme.travelcrm.com`)
- Optional custom domain support (e.g., `booking.acmetravel.com`)

### 3. **Subscription Management**
- Multiple plans: Free, Starter, Professional, Enterprise
- Trial periods (14 days default)
- Usage limits per plan
- Automatic suspension for expired trials/subscriptions

### 4. **Usage Tracking**
- Monitor users, agents, customers, bookings per tenant
- Enforce limits based on subscription plan
- Usage statistics available via API

### 5. **Feature Flags**
- Enable/disable features per tenant
- Analytics, audit logs, notifications, white-label

## Database Schema Changes

### New Model: `Tenant`

```javascript
{
  name: String,
  subdomain: String (unique),
  customDomain: String (optional),
  settings: {
    branding: { logo, primaryColor, secondaryColor, companyName },
    features: { maxUsers, maxAgents, maxCustomers, maxBookings, enableAnalytics, etc. },
    contact: { email, phone, address, city, country }
  },
  subscription: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise',
    status: 'trial' | 'active' | 'suspended' | 'cancelled',
    trialEndsAt: Date,
    price: Number,
    billingCycle: 'monthly' | 'yearly'
  },
  ownerId: ObjectId (User),
  status: 'active' | 'inactive' | 'suspended',
  usage: { users, agents, customers, bookings, storage }
}
```

### Updated Models

All existing models now include:
```javascript
{
  tenantId: ObjectId (Tenant) // Required, indexed
}
```

**Models Updated:**
- User
- Agent
- Customer
- Supplier
- Itinerary
- Quote
- Booking
- AuditLog

### Index Changes

**User Model:**
- Composite unique index: `{ tenantId: 1, email: 1 }`
- Email is now unique **per tenant** (not globally)

## Middleware

### 1. `identifyTenant`

Identifies the tenant from:
1. `X-Tenant-ID` header (for API clients)
2. Subdomain (e.g., `acme.travelcrm.com`)
3. Custom domain
4. Default tenant ID (development only)

```javascript
// Usage
app.use(identifyTenant);
```

### 2. `requireTenant`

Ensures tenant context exists:
```javascript
router.get('/api/v1/customers', identifyTenant, requireTenant, protect, getAllCustomers);
```

### 3. `requireFeature(featureName)`

Checks if tenant has feature enabled:
```javascript
router.get('/api/v1/analytics', requireFeature('enableAnalytics'), getAnalytics);
```

### 4. `checkUsageLimit(resource)`

Enforces usage limits:
```javascript
router.post('/api/v1/customers', checkUsageLimit('customer'), createCustomer);
```

### 5. `updateTenantUsage(resource, increment)`

Updates usage counters:
```javascript
router.post('/api/v1/customers', 
  checkUsageLimit('customer'), 
  createCustomer, 
  updateTenantUsage('customers', 1)
);
```

## API Endpoints

### Tenant Management

```
POST   /api/v1/tenants              # Create new tenant (public registration)
GET    /api/v1/tenants              # Get all tenants (super admin)
GET    /api/v1/tenants/current      # Get current tenant from context
GET    /api/v1/tenants/:id          # Get tenant by ID
PATCH  /api/v1/tenants/:id          # Update tenant
DELETE /api/v1/tenants/:id          # Delete tenant (soft delete)

# Subscription management
PATCH  /api/v1/tenants/:id/subscription  # Update subscription (super admin)
PATCH  /api/v1/tenants/:id/suspend       # Suspend tenant (super admin)
PATCH  /api/v1/tenants/:id/activate      # Activate tenant (super admin)

# Statistics
GET    /api/v1/tenants/:id/stats    # Get tenant usage statistics
```

### Example: Create Tenant

```bash
POST /api/v1/tenants
Content-Type: application/json

{
  "name": "Acme Travel Agency",
  "subdomain": "acme",
  "ownerName": "John Doe",
  "ownerEmail": "john@acmetravel.com",
  "ownerPassword": "SecurePass123!",
  "ownerPhone": "+1234567890",
  "plan": "professional",
  "settings": {
    "branding": {
      "companyName": "Acme Travel",
      "primaryColor": "#FF6B6B"
    }
  },
  "metadata": {
    "industry": "travel",
    "country": "USA"
  }
}
```

## Controller Updates

All controllers now automatically filter by `tenantId`:

### Before (Single Tenant)
```javascript
const customers = await Customer.find({ agentId });
```

### After (Multi-Tenant)
```javascript
const customers = await Customer.find({ 
  tenantId: req.tenantId,  // Added automatically
  agentId 
});
```

## Authentication Flow

### 1. Tenant Identification
```
Request → identifyTenant middleware → Sets req.tenant & req.tenantId
```

### 2. User Authentication
```
Request → protect middleware → Verifies JWT → Checks user.tenantId matches req.tenantId
```

### 3. Authorization
```
Request → restrictTo middleware → Checks user.role
```

## Subscription Plans

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| Users | 5 | 10 | 25 | 100 |
| Agents | 10 | 25 | 50 | 200 |
| Customers | 100 | 500 | 2000 | 10000 |
| Bookings | 50 | 200 | 1000 | 5000 |
| Analytics | ✅ | ✅ | ✅ | ✅ |
| Audit Logs | ✅ | ✅ | ✅ | ✅ |
| White Label | ❌ | ❌ | ❌ | ✅ |
| Custom Domain | ❌ | ❌ | ✅ | ✅ |
| Price | $0 | $49/mo | $199/mo | $999/mo |

## Setup & Configuration

### 1. Environment Variables

Add to `.env`:
```env
# For local development (bypasses subdomain requirement)
DEFAULT_TENANT_ID=your_tenant_id_here
```

### 2. Seed Initial Tenants

```bash
cd backend
node src/scripts/seedTenants.js
```

This creates:
- **Demo Tenant**
  - Subdomain: `demo`
  - Email: `admin@demo.travelcrm.com`
  - Password: `Demo@123`
  - Plan: Professional

- **Test Tenant** (development only)
  - Subdomain: `test`
  - Email: `test@test.travelcrm.com`
  - Password: `Demo@123`
  - Plan: Free (Trial)

### 3. Update Existing Data

If you have existing data, you need to assign it to a tenant:

```javascript
// Migration script example
const defaultTenant = await Tenant.findOne({ subdomain: 'demo' });

// Update all users
await User.updateMany(
  { tenantId: { $exists: false } },
  { $set: { tenantId: defaultTenant._id } }
);

// Repeat for all models
await Agent.updateMany(...);
await Customer.updateMany(...);
await Booking.updateMany(...);
// etc.
```

## Frontend Integration

### 1. Detect Tenant from URL

```javascript
// In frontend
const subdomain = window.location.hostname.split('.')[0];
if (subdomain && subdomain !== 'www') {
  // Use subdomain as tenant identifier
  axios.defaults.headers.common['X-Tenant-ID'] = subdomain;
}
```

### 2. Pass Tenant in Requests

```javascript
// Option 1: Header
axios.get('/api/v1/customers', {
  headers: { 'X-Tenant-ID': tenantId }
});

// Option 2: Subdomain (automatic)
// Request to acme.travelcrm.com/api/v1/customers
// Backend automatically identifies tenant from subdomain
```

### 3. Tenant Branding

```javascript
// Fetch current tenant settings
const { data } = await axios.get('/api/v1/tenants/current');
const { branding } = data.tenant.settings;

// Apply branding
document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
document.title = branding.companyName;
```

## DNS Configuration

### For Subdomains

Add wildcard DNS record:
```
Type: A or CNAME
Name: *
Value: your-server-ip or domain.com
```

This enables:
- `acme.travelcrm.com`
- `test.travelcrm.com`
- `any-name.travelcrm.com`

### For Custom Domains

Each tenant with custom domain needs:
```
Type: CNAME
Name: booking (or www)
Value: travelcrm.com
```

## Security Considerations

### 1. Data Isolation

✅ **Implemented:**
- All queries filtered by `tenantId`
- Middleware ensures users can't access other tenants' data
- JWT tokens validated against tenant context

### 2. Subdomain Validation

✅ **Implemented:**
- Subdomain validation regex: `/^[a-z0-9-]+$/`
- Reserved subdomains: `www`, `api`, `admin`, `app`

### 3. Usage Limits

✅ **Implemented:**
- Checked before resource creation
- Enforced at middleware level
- Automatic tracking

## Testing Multi-Tenancy

### 1. Test Tenant Isolation

```bash
# Create two tenants
POST /api/v1/tenants
{
  "name": "Tenant A",
  "subdomain": "tenanta",
  ...
}

POST /api/v1/tenants
{
  "name": "Tenant B",
  "subdomain": "tenantb",
  ...
}

# Login as Tenant A user
POST /api/v1/auth/login
Host: tenanta.travelcrm.com
{ "email": "user@tenanta.com", "password": "..." }

# Try to access Tenant B's data (should fail)
GET /api/v1/customers
Host: tenantb.travelcrm.com
Authorization: Bearer <tenant-a-token>

# Expected: 403 Forbidden
```

### 2. Test Usage Limits

```bash
# Create free tier tenant (limit: 100 customers)
# Create 100 customers
# Try to create 101st customer

POST /api/v1/customers
# Expected: 403 - "You have reached the maximum customer limit for your plan"
```

### 3. Test Subscription Status

```bash
# Suspend a tenant
PATCH /api/v1/tenants/:id/suspend

# Try to login
POST /api/v1/auth/login
# Expected: 403 - "Tenant is suspended"
```

## Migration from Single-Tenant

If you have an existing single-tenant installation:

### Step 1: Backup Database
```bash
mongodump --uri="mongodb://localhost:27017/travelcrm" --out=./backup
```

### Step 2: Create Default Tenant
```bash
node src/scripts/seedTenants.js
```

### Step 3: Migrate Existing Data
```bash
node src/scripts/migrateTenantData.js
```

### Step 4: Update Frontend
- Add tenant detection logic
- Update API calls to include tenant context

## Monitoring & Analytics

### Tenant Metrics

```javascript
// Get tenant statistics
GET /api/v1/tenants/:id/stats

Response:
{
  "usage": {
    "users": 8,
    "agents": 15,
    "customers": 234,
    "bookings": 156
  },
  "limits": {
    "maxUsers": 25,
    "maxAgents": 50,
    "maxCustomers": 2000,
    "maxBookings": 1000
  },
  "utilizationPercentage": {
    "users": 32,
    "agents": 30,
    "customers": 11.7,
    "bookings": 15.6
  },
  "daysUntilTrialExpiry": 7
}
```

## Troubleshooting

### Issue: "Tenant not found"

**Cause:** Subdomain not matching any tenant or DEFAULT_TENANT_ID not set

**Solution:**
1. Check subdomain in URL
2. Set DEFAULT_TENANT_ID in .env for local development
3. Verify tenant exists: `db.tenants.find({ subdomain: 'your-subdomain' })`

### Issue: "User does not belong to this tenant"

**Cause:** JWT token from different tenant being used

**Solution:**
1. Login again with correct subdomain
2. Clear browser cache/cookies
3. Verify user.tenantId matches current tenant

### Issue: "Feature not enabled"

**Cause:** Tenant's subscription doesn't include feature

**Solution:**
1. Upgrade tenant's plan
2. Enable feature: `PATCH /api/v1/tenants/:id`
```json
{
  "settings": {
    "features": {
      "enableAnalytics": true
    }
  }
}
```

## Future Enhancements

### Phase 2: Database-per-Tenant
- Each tenant gets dedicated database
- Better performance for large tenants
- Complete isolation at database level

### Phase 3: Tenant Customization
- Custom email templates per tenant
- Custom workflows
- Tenant-specific integrations

### Phase 4: Marketplace
- Inter-tenant data sharing (opt-in)
- Supplier marketplace
- Agency network

## Support

For questions or issues:
- Documentation: `/docs/MULTITENANT.md`
- API Reference: `http://localhost:3000/api-docs`
- GitHub Issues: [Repository Issues](https://github.com/DarkestEver/travelcrmpro/issues)

---

**Version:** 1.0.0  
**Last Updated:** November 6, 2025  
**Status:** ✅ Production Ready
