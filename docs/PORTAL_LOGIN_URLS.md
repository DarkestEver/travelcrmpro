# 🔐 Travel CRM - Portal Login URLs

**Date:** November 9, 2025  
**System:** Travel CRM Multi-Portal System

---

## 📋 All Portal Login URLs

### Development Environment (Default)
**Base URL:** `http://localhost:5173`

---

## 🔑 Portal Login URLs

### 1. 👑 Super Admin Portal
**Login URL:** `http://localhost:5173/login`

**Who Uses This:**
- Super Admins (system-wide access)
- Operators (tenant management)

**User Roles:**
- `super_admin` - Full system access
- `operator` - Tenant operations access

**After Login Redirects To:**
- Super Admin → `/dashboard`
- Operator → `/dashboard`

**Features Access:**
- Dashboard
- Agents Management
- Customers Management
- Suppliers Management
- Itineraries
- Quotes
- Bookings
- Analytics
- Tenant Management (Super Admin only)
- Audit Logs (Super Admin only)
- Tenant Settings

---

### 2. 💼 Operator Portal
**Login URL:** `http://localhost:5173/login`

**Who Uses This:**
- Operators (same as Super Admin portal, different permissions)

**User Role:**
- `operator` - Operations management

**After Login Redirects To:**
- `/dashboard`

**Features Access:**
- Dashboard
- Agents Management
- Customers Management
- Suppliers Management
- Itineraries
- Itinerary Builder
- Quotes
- Bookings
- Analytics
- Tenant Settings

**Note:** Operators use the same login page as Super Admin but have restricted access (no Tenant Management or Audit Logs).

---

### 3. 🎯 Agent Portal
**Login URL:** `http://localhost:5173/login`

**Who Uses This:**
- Travel Agents (customer-facing operations)

**User Role:**
- `agent` - Agent operations

**After Login Redirects To:**
- `/agent/dashboard`

**Features Access:**
- Dashboard (agent-specific)
- My Customers
- Quote Requests
- Bookings
- Commissions
- Payments
- Invoices
- Reports
- Sub-Users
- Notifications

**Portal Base Path:** `/agent/*`

---

### 4. 👥 Customer Portal
**Login URL:** `http://localhost:5173/customer/login`

**Who Uses This:**
- End customers (travelers)
- Booking clients

**User Role:**
- `customer` - Customer access

**After Login Redirects To:**
- `/customer/dashboard`

**Features Access:**
- Dashboard
- My Bookings
- Booking Details
- Invoices
- Request Quote
- Profile
- Notifications

**Portal Base Path:** `/customer/*`

**Special Notes:**
- Has separate authentication system (`useCustomerAuthStore`)
- Separate registration page: `http://localhost:5173/customer/register`
- Independent from main portal authentication

---

### 5. 🏢 Supplier Portal
**Login URL:** `http://localhost:5173/login`

**Who Uses This:**
- Suppliers (hotels, tour operators, service providers)

**User Role:**
- `supplier` - Supplier access

**After Login Redirects To:**
- `/supplier/dashboard`

**Features Access:**
- Dashboard (supplier-specific)
- Bookings (incoming bookings)
- Inventory (services/products)
- Payments
- Profile

**Portal Base Path:** `/supplier/*`

---

## 📊 Login URL Summary Table

| Portal | Login URL | User Role | After Login | Separate Auth |
|--------|-----------|-----------|-------------|---------------|
| **Super Admin** | `/login` | `super_admin` | `/dashboard` | ❌ Shared |
| **Operator** | `/login` | `operator` | `/dashboard` | ❌ Shared |
| **Agent** | `/login` | `agent` | `/agent/dashboard` | ❌ Shared |
| **Supplier** | `/login` | `supplier` | `/supplier/dashboard` | ❌ Shared |
| **Customer** | `/customer/login` | `customer` | `/customer/dashboard` | ✅ Separate |

---

## 🔐 Authentication Systems

### Main Portal Authentication (4 Portals)
**Used By:** Super Admin, Operator, Agent, Supplier

**Login URL:** `/login`  
**Store:** `useAuthStore`  
**Token Storage:** localStorage  
**API Endpoint:** `/api/v1/auth/login`

**Shared Features:**
- JWT token-based authentication
- Role-based access control
- Single login page with role-based redirect
- Shared session management

### Customer Portal Authentication (1 Portal)
**Used By:** Customer

**Login URL:** `/customer/login`  
**Store:** `useCustomerAuthStore`  
**Token Storage:** localStorage (separate key)  
**API Endpoint:** `/api/v1/customers/login`

**Special Features:**
- Independent authentication system
- Separate user database
- Customer-specific features
- Separate registration flow

---

## 🌐 Production URLs (After Deployment)

When deployed to production, replace `localhost:5173` with your domain:

### Example with Custom Domain

**Domain:** `https://travelcrm.com`

| Portal | Production Login URL |
|--------|---------------------|
| Super Admin | `https://travelcrm.com/login` |
| Operator | `https://travelcrm.com/login` |
| Agent | `https://travelcrm.com/login` |
| Supplier | `https://travelcrm.com/login` |
| Customer | `https://travelcrm.com/customer/login` |

### Example with Subdomain Structure

**Main Domain:** `travelcrm.com`

| Portal | Subdomain URL |
|--------|--------------|
| Super Admin | `https://admin.travelcrm.com/login` |
| Operator | `https://ops.travelcrm.com/login` |
| Agent | `https://agent.travelcrm.com/login` |
| Supplier | `https://supplier.travelcrm.com/login` |
| Customer | `https://customer.travelcrm.com/login` |

**Note:** Subdomain routing requires additional configuration in your web server and DNS.

---

## 🔄 Smart Login Flow

### How It Works

1. **User visits any login page**
   - `/login` (main portal)
   - `/customer/login` (customer portal)

2. **User enters credentials**
   - Email/username
   - Password

3. **System authenticates and identifies role**
   - Backend returns user object with role

4. **Automatic redirect based on role:**
   ```javascript
   switch (user.role) {
     case 'super_admin':
       redirect to '/dashboard'
     case 'operator':
       redirect to '/dashboard'
     case 'agent':
       redirect to '/agent/dashboard'
     case 'supplier':
       redirect to '/supplier/dashboard'
     case 'customer':
       redirect to '/customer/dashboard'
   }
   ```

---

## 👤 Test User Credentials (Development)

### Super Admin
```
Email: admin@system.com
Password: Admin@123
Login URL: http://localhost:5173/login
```

### Operator
```
Email: operator@company.com
Password: Operator@123
Login URL: http://localhost:5173/login
```

### Agent
```
Email: agent@company.com
Password: Agent@123
Login URL: http://localhost:5173/login
```

### Supplier
```
Email: supplier@hotel.com
Password: Supplier@123
Login URL: http://localhost:5173/login
```

### Customer
```
Email: customer@email.com
Password: Customer@123
Login URL: http://localhost:5173/customer/login
```

**Note:** Replace these with your actual test credentials.

---

## 🚀 Quick Access Links (Development)

Click these links when running locally:

- **Super Admin/Operator:** http://localhost:5173/login
- **Agent:** http://localhost:5173/login
- **Supplier:** http://localhost:5173/login
- **Customer:** http://localhost:5173/customer/login
- **Customer Register:** http://localhost:5173/customer/register

---

## 📱 Registration Pages

### Main Portal Registration
**URL:** `http://localhost:5173/register`

**Who Can Register:**
- New agents (pending approval)
- New suppliers (pending approval)

**After Registration:**
- Account created with `pending` status
- Requires admin approval
- Email verification (optional)

### Customer Portal Registration
**URL:** `http://localhost:5173/customer/register`

**Who Can Register:**
- New customers (instant access)

**After Registration:**
- Account created and active immediately
- Can login right away
- No approval required

---

## 🔒 Security Features

### All Portals Include:
- ✅ JWT token authentication
- ✅ Token expiration (15 minutes)
- ✅ Refresh token mechanism
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ Route protection
- ✅ Automatic logout on token expiry
- ✅ Session management

### Customer Portal Additional Security:
- ✅ Separate authentication system
- ✅ Independent token storage
- ✅ Isolated from main portal users
- ✅ Customer-specific session management

---

## 🛡️ Protected Routes

### After Login, Users Can Only Access Their Authorized Routes:

**Super Admin** → Full system access  
**Operator** → Limited admin features  
**Agent** → `/agent/*` routes only  
**Supplier** → `/supplier/*` routes only  
**Customer** → `/customer/*` routes only  

**Unauthorized Access:**
- Redirects to `/unauthorized` page
- Prevents access to other portal routes
- Maintains security boundaries

---

## 📝 Implementation Details

### Login Page Components

**Main Portal:** `frontend/src/pages/auth/Login.jsx`
```
Location: /login
Component: Login
Layout: AuthLayout
Auth Store: useAuthStore
```

**Customer Portal:** `frontend/src/pages/customer/Login.jsx`
```
Location: /customer/login
Component: CustomerLogin
Auth Store: useCustomerAuthStore
```

### Route Configuration

**File:** `frontend/src/App.jsx`

```javascript
// Main portal login (Super Admin, Operator, Agent, Supplier)
<Route path="/login" element={
  <PublicRoute>
    <AuthLayout>
      <Login />
    </AuthLayout>
  </PublicRoute>
} />

// Customer portal login
<Route path="/customer/login" element={
  <CustomerPublicRoute>
    <CustomerLogin />
  </CustomerPublicRoute>
} />
```

---

## 🎯 Quick Reference

### Need to Login As:

**Super Admin/Operator?**
→ Go to: `http://localhost:5173/login`

**Agent?**
→ Go to: `http://localhost:5173/login`

**Supplier?**
→ Go to: `http://localhost:5173/login`

**Customer?**
→ Go to: `http://localhost:5173/customer/login`

### After Login, You'll Be Automatically Redirected To:

- Super Admin → Dashboard (`/dashboard`)
- Operator → Dashboard (`/dashboard`)
- Agent → Agent Dashboard (`/agent/dashboard`)
- Supplier → Supplier Dashboard (`/supplier/dashboard`)
- Customer → Customer Dashboard (`/customer/dashboard`)

---

## ✅ Summary

### Key Points:

1. **4 Portals Share 1 Login URL:**
   - Super Admin, Operator, Agent, Supplier all use `/login`
   - Smart redirect based on user role after authentication

2. **1 Portal Has Separate Login:**
   - Customer portal uses `/customer/login`
   - Independent authentication system

3. **Total Login URLs:**
   - Main Portal: `http://localhost:5173/login`
   - Customer Portal: `http://localhost:5173/customer/login`

4. **All Portals Are Operational:**
   - ✅ 100% integrated
   - ✅ Role-based routing working
   - ✅ Automatic redirects configured
   - ✅ Security implemented

---

**Document Version:** 1.0.0  
**Last Updated:** November 9, 2025  
**Status:** ✅ **All Portals Operational**
