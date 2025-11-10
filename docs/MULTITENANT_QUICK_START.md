# Multi-Tenant Setup - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies (if needed)
```bash
cd backend
npm install
```

### Step 2: Seed Initial Tenants
```bash
npm run seed:tenants
```

This creates:
- **Demo Tenant**: `demo.travelcrm.com` (Professional plan)
- **Test Tenant**: `test.travelcrm.com` (Free trial)

**Copy the tenant ID** from the output!

### Step 3: Update .env File

Add this line to `backend/.env`:
```env
DEFAULT_TENANT_ID=your_tenant_id_from_step_2
```

### Step 4: Migrate Existing Data (if you have data)
```bash
npm run migrate:tenants
```

### Step 5: Start the Server
```bash
npm run dev
```

## 🧪 Testing Multi-Tenancy

### Option 1: Use X-Tenant-ID Header

```bash
# Login as demo tenant
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: your_tenant_id" \
  -d '{
    "email": "admin@demo.travelcrm.com",
    "password": "Demo@123"
  }'
```

### Option 2: Use Subdomain (requires DNS/hosts setup)

**For local development, edit your hosts file:**

**Windows:** `C:\Windows\System32\drivers\etc\hosts`  
**Mac/Linux:** `/etc/hosts`

Add these lines:
```
127.0.0.1  demo.localhost
127.0.0.1  test.localhost
```

Then access:
- http://demo.localhost:3000
- http://test.localhost:3000

### Option 3: Test with Postman

1. Import the Postman collection: `backend/postman_collection.json`
2. Add header: `X-Tenant-ID: your_tenant_id`
3. Test endpoints

## 📋 Default Credentials

### Demo Tenant
- **Subdomain:** `demo`
- **URL:** `demo.travelcrm.com` (production) or `demo.localhost:3000` (local)
- **Email:** `admin@demo.travelcrm.com`
- **Password:** `Demo@123`
- **Plan:** Professional
- **Features:** All enabled

### Test Tenant
- **Subdomain:** `test`
- **URL:** `test.travelcrm.com` (production) or `test.localhost:3000` (local)
- **Email:** `test@test.travelcrm.com`
- **Password:** `Demo@123`
- **Plan:** Free (14-day trial)
- **Features:** Basic

## 🔧 Create New Tenant via API

```bash
curl -X POST http://localhost:3000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Travel Agency",
    "subdomain": "acme",
    "ownerName": "John Doe",
    "ownerEmail": "john@acmetravel.com",
    "ownerPassword": "SecurePass123!",
    "ownerPhone": "+1234567890",
    "plan": "starter",
    "metadata": {
      "industry": "travel",
      "country": "USA",
      "timezone": "America/New_York",
      "currency": "USD"
    }
  }'
```

## 🌐 Frontend Integration

### Update API Client

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
});

// Add tenant context from subdomain
const subdomain = window.location.hostname.split('.')[0];
if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
  api.defaults.headers.common['X-Tenant-ID'] = subdomain;
}

// Or from localStorage
const tenantId = localStorage.getItem('tenantId');
if (tenantId) {
  api.defaults.headers.common['X-Tenant-ID'] = tenantId;
}

export default api;
```

### Fetch Tenant Branding

```javascript
// In your App.jsx or layout component
useEffect(() => {
  const fetchTenantBranding = async () => {
    try {
      const { data } = await api.get('/tenants/current');
      const { branding } = data.tenant.settings;
      
      // Apply branding
      document.documentElement.style.setProperty(
        '--primary-color', 
        branding.primaryColor || '#4F46E5'
      );
      document.documentElement.style.setProperty(
        '--secondary-color', 
        branding.secondaryColor || '#06B6D4'
      );
      document.title = branding.companyName || 'Travel CRM';
      
      // Set logo if available
      if (branding.logo) {
        setLogoUrl(branding.logo);
      }
    } catch (error) {
      console.error('Failed to fetch tenant branding:', error);
    }
  };

  fetchTenantBranding();
}, []);
```

## 🔐 Important Security Notes

### 1. Tenant Isolation

All API requests are automatically filtered by tenant:
```javascript
// The middleware ensures users can ONLY access their tenant's data
GET /api/v1/customers
// Returns only customers belonging to current tenant
```

### 2. Cross-Tenant Access Prevention

```javascript
// User from Tenant A tries to access Tenant B's data
Headers: { 'X-Tenant-ID': 'tenant_b_id' }
Authorization: Bearer <tenant_a_jwt_token>

// Result: 403 Forbidden
// Message: "User does not belong to this tenant"
```

### 3. Usage Limits

```javascript
// Creating 101st customer when limit is 100
POST /api/v1/customers
// Result: 403 Forbidden
// Message: "You have reached the maximum customer limit for your plan"
```

## 📊 Monitor Tenant Usage

```bash
# Get tenant statistics
curl -X GET http://localhost:3000/api/v1/tenants/:tenantId/stats \
  -H "Authorization: Bearer <your_jwt_token>"

# Response:
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
  }
}
```

## 🐛 Troubleshooting

### Error: "Tenant not found"

**Solution:**
1. Check if DEFAULT_TENANT_ID is set in .env
2. Verify tenant exists: `db.tenants.find()`
3. For subdomain access, check your hosts file or DNS

### Error: "User does not belong to this tenant"

**Solution:**
1. Clear your auth token
2. Login again with the correct tenant
3. Verify user.tenantId matches the tenant you're trying to access

### Error: "You have reached the maximum limit"

**Solution:**
1. Upgrade the tenant's subscription plan
2. Or contact super admin to increase limits manually

## 🔄 Updating Subscription Plan

```bash
# Upgrade tenant to professional plan
curl -X PATCH http://localhost:3000/api/v1/tenants/:tenantId/subscription \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "professional",
    "status": "active"
  }'
```

## 📱 Production Deployment

### 1. DNS Configuration

Add wildcard DNS record:
```
Type: A
Name: *
Value: your-server-ip

or

Type: CNAME
Name: *
Value: your-domain.com
```

### 2. Environment Variables

```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
# DEFAULT_TENANT_ID is NOT needed in production
```

### 3. Remove Default Tenant Logic

In production, the system will ONLY identify tenants from:
1. Subdomain (e.g., `acme.travelcrm.com`)
2. Custom domain (if configured)
3. `X-Tenant-ID` header

DEFAULT_TENANT_ID is IGNORED in production mode.

## ✅ Verification Checklist

- [ ] Tenants seeded successfully
- [ ] DEFAULT_TENANT_ID added to .env
- [ ] Can login with demo credentials
- [ ] Can create customers (data isolated)
- [ ] Usage limits enforced
- [ ] Subscription status checked
- [ ] Frontend integrated with tenant context
- [ ] DNS configured (for production)

## 🆘 Need Help?

1. Check the full documentation: `MULTITENANT.md`
2. Review API docs: `http://localhost:3000/api-docs`
3. Open an issue on GitHub

---

**Ready to go multi-tenant! 🎉**

