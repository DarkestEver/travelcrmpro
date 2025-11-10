# 🔐 Role-Based Access Control (RBAC) Audit Report

**Date**: November 9, 2025  
**Status**: ⚠️ ISSUES FOUND - REQUIRES ATTENTION

---

## 📊 Executive Summary

### Current State
✅ **Authentication Works**: Single login endpoint supports all user roles  
✅ **Sidebar Menu Filtering**: Menu items are filtered based on user role  
⚠️ **Missing Supplier Portal**: No dedicated portal/dashboard for suppliers  
⚠️ **Missing Operator-Specific Features**: Operators share same dashboard as super_admin  
⚠️ **No Route-Level Protection**: Routes don't verify user has permission to access them  
❌ **Unauthorized Access Possible**: Users can manually navigate to restricted routes

---

## 👥 Supported User Roles

### Backend (User Model)
```javascript
role: {
  type: String,
  enum: ['super_admin', 'operator', 'agent', 'supplier', 'customer', 'auditor'],
  default: 'agent'
}
```

### Frontend Recognition
✅ **super_admin** - Full access  
✅ **operator** - Admin-level access  
✅ **agent** - Agent portal access  
✅ **customer** - Customer portal access  
⚠️ **supplier** - Recognized but no dedicated portal  
❌ **auditor** - Recognized but no implementation

---

## 🔑 Current Authentication System

### Login Flow
```
1. User enters email/password at /login
2. POST /api/v1/auth/login (single endpoint for all roles)
3. Backend validates credentials and returns:
   - accessToken
   - refreshToken
   - user object (includes role)
4. Frontend stores tokens and user in authStore
5. User redirected based on role:
   - agent → /agent/dashboard
   - all others → /dashboard
```

### ✅ WORKING
- ✅ Single login endpoint serves all roles
- ✅ Token-based authentication
- ✅ Role information included in user object
- ✅ Basic role-based routing on login

### ⚠️ ISSUES
- ⚠️ No supplier-specific login/portal
- ⚠️ No auditor-specific login/portal
- ⚠️ Customer portal separate (good) but not integrated with main login

---

## 🗺️ Current Route Structure

### Main App Routes (Admin/Operator/Supplier)
```jsx
<ProtectedRoute>
  <AppLayout /> {/* Has Sidebar */}
    /dashboard          → Dashboard.jsx
    /agents             → Agents.jsx
    /customers          → Customers.jsx
    /suppliers          → Suppliers.jsx
    /itineraries        → Itineraries.jsx
    /quotes             → Quotes.jsx
    /bookings           → Bookings.jsx
    /analytics          → Analytics.jsx
    /audit-logs         → AuditLogs.jsx
    /profile            → Profile.jsx
    /settings           → TenantSettings.jsx
    /tenants            → TenantList.jsx (super_admin only)
    /tenants/create     → CreateTenant.jsx
    /tenants/:id        → TenantDetail.jsx
</ProtectedRoute>
```

### Agent Portal Routes
```jsx
<ProtectedRoute>
  <AgentLayout />
    /agent/dashboard     → AgentDashboard.jsx
    /agent/customers     → AgentCustomers.jsx
    /agent/quotes        → AgentQuoteRequests.jsx
    /agent/quotes/new    → RequestQuote.jsx
    /agent/bookings      → AgentBookings.jsx
    /agent/commissions   → AgentCommissions.jsx
    /agent/payments      → AgentPayments.jsx
    /agent/reports       → AgentReports.jsx
    /agent/invoices      → AgentInvoices.jsx
    /agent/invoices/new  → CreateInvoice.jsx
    /agent/notifications → Notifications.jsx
    /agent/sub-users     → AgentSubUsers.jsx
</ProtectedRoute>
```

### Customer Portal Routes
```jsx
<CustomerProtectedRoute>
  <CustomerLayout />
    /customer/dashboard      → CustomerDashboard.jsx
    /customer/bookings       → CustomerBookings.jsx
    /customer/bookings/:id   → BookingDetails.jsx
    /customer/invoices       → CustomerInvoices.jsx
    /customer/request-quote  → CustomerRequestQuote.jsx
    /customer/profile        → CustomerProfile.jsx
    /customer/notifications  → CustomerNotifications.jsx
</CustomerProtectedRoute>
```

---

## 🚨 CRITICAL ISSUES FOUND

### 1. ❌ NO SUPPLIER PORTAL
**Problem**: Suppliers are recognized as a role but have no dedicated portal/dashboard.

**Current Behavior**:
- Supplier logs in → Redirected to /dashboard
- Supplier sees Sidebar with filtered menu items
- Supplier menu shows: Dashboard, Customers, Suppliers, Itineraries, Quotes, Bookings

**Issues**:
- Suppliers shouldn't see "Suppliers" menu (manage other suppliers)
- Suppliers shouldn't see "Customers" (not their responsibility)
- No supplier-specific features (inventory, bookings they need to fulfill)
- Using admin dashboard instead of supplier-focused view

**Recommendation**: Create dedicated supplier portal like agent/customer portals

---

### 2. ⚠️ NO ROUTE-LEVEL PROTECTION
**Problem**: Routes don't verify user has permission to access them.

**Current Implementation**:
```jsx
// Only checks if user is authenticated
<ProtectedRoute>
  <Route path="analytics" element={<Analytics />} />
</ProtectedRoute>
```

**Issue**: An agent could manually navigate to `/analytics` even though it's not in their sidebar menu.

**Test**:
1. Login as agent → Redirected to /agent/dashboard
2. Manually type in browser: `http://localhost:5173/analytics`
3. **Result**: Page likely loads (unauthorized access!)

**Recommendation**: Add role verification to ProtectedRoute

---

### 3. ⚠️ SIDEBAR FILTERING VS ROUTE PROTECTION
**Problem**: Sidebar hides menu items but doesn't prevent direct URL access.

**Current Sidebar Logic**:
```jsx
const navItems = [
  { name: 'Dashboard', path: '/dashboard', roles: ['super_admin', 'operator', 'agent', 'supplier'] },
  { name: 'Agents', path: '/agents', roles: ['super_admin', 'operator'] },
  { name: 'Analytics', path: '/analytics', roles: ['super_admin', 'operator'] },
  // ...
]

const filteredNavItems = navItems.filter((item) =>
  item.roles.includes(user?.role)
)
```

**Good**: Menu items are filtered ✅  
**Bad**: Routes are not protected ❌

---

### 4. ❌ MISSING AUDITOR IMPLEMENTATION
**Problem**: 'auditor' role exists in User model but has no implementation.

**Backend**: Role defined in enum  
**Frontend**: No routes, no portal, no UI

**Recommendation**: Either implement or remove from User model

---

## 📋 Current Access Matrix

### Super Admin (`super_admin`)
| Feature | Access | Notes |
|---------|--------|-------|
| Login | ✅ Yes | /login |
| Dashboard | ✅ Yes | Full dashboard with all stats |
| Agents | ✅ Yes | Manage agents |
| Customers | ✅ Yes | View all customers |
| Suppliers | ✅ Yes | Manage suppliers |
| Itineraries | ✅ Yes | View/Edit all |
| Quotes | ✅ Yes | View/Edit all |
| Bookings | ✅ Yes | View/Edit all |
| Analytics | ✅ Yes | Full analytics |
| Audit Logs | ✅ Yes | View all audit logs |
| Tenant Settings | ✅ Yes | Configure tenant |
| Tenant Management | ✅ Yes | Manage all tenants |
| Sidebar Shows Logo | ✅ Yes | Tenant branding applied |

**✅ COMPLETE** - All features working

---

### Operator (`operator`)
| Feature | Access | Notes |
|---------|--------|-------|
| Login | ✅ Yes | /login |
| Dashboard | ✅ Yes | Same as super_admin |
| Agents | ✅ Yes | Manage agents |
| Customers | ✅ Yes | View all customers |
| Suppliers | ✅ Yes | Manage suppliers |
| Itineraries | ✅ Yes | View/Edit all |
| Quotes | ✅ Yes | View/Edit all |
| Bookings | ✅ Yes | View/Edit all |
| Analytics | ✅ Yes | Full analytics |
| Audit Logs | ❌ No | Hidden in sidebar |
| Tenant Settings | ✅ Yes | Configure tenant |
| Tenant Management | ❌ No | Hidden in sidebar |
| Sidebar Shows Logo | ✅ Yes | Tenant branding applied |

**✅ MOSTLY COMPLETE** - Good access control

---

### Agent (`agent`)
| Feature | Access | Notes |
|---------|--------|-------|
| Login | ✅ Yes | /login → Redirects to /agent/dashboard |
| Dashboard | ✅ Yes | Agent-specific dashboard |
| My Customers | ✅ Yes | /agent/customers |
| Quote Requests | ✅ Yes | /agent/quotes |
| My Bookings | ✅ Yes | /agent/bookings |
| Commissions | ✅ Yes | /agent/commissions |
| Payments | ✅ Yes | /agent/payments |
| Reports | ✅ Yes | /agent/reports |
| Invoices | ✅ Yes | /agent/invoices |
| Notifications | ✅ Yes | /agent/notifications |
| Sub-Users | ✅ Yes | /agent/sub-users |
| Sidebar Shows Logo | ⚠️ UNKNOWN | Uses AgentLayout (needs verification) |

**⚠️ ISSUES**:
- Agent can potentially access /dashboard if typed manually
- Agent layout may not have tenant branding
- No route-level protection

---

### Customer (`customer`)
| Feature | Access | Notes |
|---------|--------|-------|
| Login | ✅ Yes | /customer/login (SEPARATE) |
| Dashboard | ✅ Yes | Customer-specific dashboard |
| My Bookings | ✅ Yes | /customer/bookings |
| Booking Details | ✅ Yes | /customer/bookings/:id |
| Invoices | ✅ Yes | /customer/invoices |
| Request Quote | ✅ Yes | /customer/request-quote |
| Profile | ✅ Yes | /customer/profile |
| Notifications | ✅ Yes | /customer/notifications |
| Sidebar Shows Logo | ⚠️ UNKNOWN | Uses CustomerLayout (needs verification) |

**✅ COMPLETE** - Has dedicated portal with separate auth store

---

### Supplier (`supplier`)
| Feature | Access | Notes |
|---------|--------|-------|
| Login | ⚠️ YES | /login (uses main login) |
| Dashboard | ⚠️ YES | WRONG - Uses admin dashboard |
| Agents | ❌ No | Hidden in sidebar |
| Customers | ⚠️ YES | Visible but shouldn't be |
| Suppliers | ⚠️ YES | Visible but shouldn't be |
| Itineraries | ⚠️ YES | Visible but wrong context |
| Quotes | ⚠️ YES | Should only see their quotes |
| Bookings | ⚠️ YES | Should only see bookings they fulfill |
| Analytics | ❌ No | Hidden in sidebar |
| Sidebar Shows Logo | ✅ Yes | Tenant branding applied |

**❌ MAJOR ISSUES**:
- No dedicated supplier portal
- Using admin dashboard (wrong view)
- Can see all bookings (should only see theirs)
- Can see all suppliers (shouldn't manage competitors)
- No supplier-specific features:
  - Inventory management
  - Booking fulfillment
  - Payment tracking
  - Availability calendar

---

### Auditor (`auditor`)
| Feature | Access | Notes |
|---------|--------|-------|
| Login | ❓ UNKNOWN | Backend supports, frontend doesn't |
| Dashboard | ❌ NO | No implementation |
| Any Features | ❌ NO | Role exists but no UI |

**❌ NOT IMPLEMENTED**

---

## 🔧 Current Sidebar Menu Logic

### Code Implementation
```jsx
const navItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: FiHome,
    roles: ['super_admin', 'operator', 'agent', 'supplier'],
  },
  {
    name: 'Agents',
    path: '/agents',
    icon: FiUserCheck,
    roles: ['super_admin', 'operator'],
  },
  {
    name: 'Customers',
    path: '/customers',
    icon: FiUsers,
    roles: ['super_admin', 'operator', 'agent'],
  },
  {
    name: 'Suppliers',
    path: '/suppliers',
    icon: FiTruck,
    roles: ['super_admin', 'operator', 'agent'],
  },
  // ... more items
]

const filteredNavItems = navItems.filter((item) =>
  item.roles.includes(user?.role)
)
```

### ✅ WORKING
- Menu items are filtered correctly
- Users only see links they should have access to
- Logo and branding applied to sidebar

### ❌ NOT WORKING
- Routes themselves are not protected
- Supplier seeing wrong menu items
- No enforcement at component level

---

## 🎯 Recommendations

### 🚨 CRITICAL (Fix Immediately)

#### 1. Add Route-Level Protection
Create a `RoleBasedRoute` component:

```jsx
const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { user, accessToken } = useAuthStore()

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard or show 403
    const redirectPath = user.role === 'agent' 
      ? '/agent/dashboard' 
      : user.role === 'customer'
      ? '/customer/dashboard'
      : '/dashboard'
    return <Navigate to={redirectPath} replace />
  }

  return children
}
```

**Usage**:
```jsx
<Route 
  path="analytics" 
  element={
    <RoleBasedRoute allowedRoles={['super_admin', 'operator']}>
      <Analytics />
    </RoleBasedRoute>
  } 
/>
```

---

#### 2. Create Supplier Portal
Create dedicated supplier portal like agent/customer:

**Files Needed**:
- `frontend/src/layouts/SupplierLayout.jsx`
- `frontend/src/pages/supplier/Dashboard.jsx`
- `frontend/src/pages/supplier/Bookings.jsx` (bookings they need to fulfill)
- `frontend/src/pages/supplier/Inventory.jsx`
- `frontend/src/pages/supplier/Payments.jsx`
- `frontend/src/pages/supplier/Profile.jsx`

**Routes**:
```jsx
<Route path="/supplier" element={
  <ProtectedRoute>
    <SupplierLayout />
  </ProtectedRoute>
}>
  <Route index element={<Navigate to="/supplier/dashboard" replace />} />
  <Route path="dashboard" element={<SupplierDashboard />} />
  <Route path="bookings" element={<SupplierBookings />} />
  <Route path="inventory" element={<SupplierInventory />} />
  <Route path="payments" element={<SupplierPayments />} />
  <Route path="profile" element={<SupplierProfile />} />
</Route>
```

---

#### 3. Fix Supplier Sidebar Menu
Update navItems to correct supplier access:

```jsx
const navItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    roles: ['super_admin', 'operator'], // REMOVE supplier
  },
  {
    name: 'Customers',
    path: '/customers',
    roles: ['super_admin', 'operator', 'agent'], // REMOVE supplier
  },
  {
    name: 'Suppliers',
    path: '/suppliers',
    roles: ['super_admin', 'operator', 'agent'], // REMOVE supplier
  },
]
```

---

### ⚠️ IMPORTANT (Fix Soon)

#### 4. Add Tenant Branding to Agent Layout
Verify `AgentLayout.jsx` includes tenant branding:

```jsx
import { useTenantBranding } from '../contexts/TenantBrandingContext'

const AgentLayout = () => {
  const { logo, companyName, primaryColor } = useTenantBranding()
  // Use in agent sidebar/header
}
```

---

#### 5. Add Tenant Branding to Customer Layout
Verify `CustomerLayout.jsx` includes tenant branding:

```jsx
import { useTenantBranding } from '../contexts/TenantBrandingContext'

const CustomerLayout = () => {
  const { logo, companyName, primaryColor } = useTenantBranding()
  // Use in customer sidebar/header
}
```

---

#### 6. Decide on Auditor Role
Either:
- **Option A**: Implement auditor portal (read-only access to all data)
- **Option B**: Remove from User model enum

---

### 💡 NICE TO HAVE (Future Enhancement)

#### 7. Unified Access Control System
Create centralized permission system:

```javascript
// utils/permissions.js
export const PERMISSIONS = {
  'dashboard.view': ['super_admin', 'operator'],
  'agents.manage': ['super_admin', 'operator'],
  'customers.view': ['super_admin', 'operator', 'agent'],
  'suppliers.manage': ['super_admin', 'operator'],
  'analytics.view': ['super_admin', 'operator'],
  'tenant.manage': ['super_admin'],
  // ...
}

export const hasPermission = (user, permission) => {
  return PERMISSIONS[permission]?.includes(user.role) || false
}
```

---

#### 8. Role-Based Component Rendering
Create utility for conditional rendering:

```jsx
import { useAuthStore } from '../stores/authStore'
import { hasPermission } from '../utils/permissions'

export const Can = ({ permission, children, fallback = null }) => {
  const { user } = useAuthStore()
  
  if (hasPermission(user, permission)) {
    return children
  }
  
  return fallback
}

// Usage
<Can permission="analytics.view">
  <AnalyticsChart />
</Can>
```

---

## 📊 Access Control Matrix (Should Be)

| Feature | Super Admin | Operator | Agent | Supplier | Customer | Auditor |
|---------|-------------|----------|-------|----------|----------|---------|
| **Dashboard** | ✅ Admin | ✅ Admin | ✅ Agent | ✅ Supplier | ✅ Customer | ✅ Audit |
| **Agents** | ✅ Manage | ✅ Manage | ❌ No | ❌ No | ❌ No | 👁️ View |
| **Customers** | ✅ View All | ✅ View All | ✅ My Customers | ❌ No | ❌ No | 👁️ View |
| **Suppliers** | ✅ Manage | ✅ Manage | ✅ View | ❌ No | ❌ No | 👁️ View |
| **Itineraries** | ✅ All | ✅ All | ✅ My Itineraries | 👁️ Assigned | 👁️ My Bookings | 👁️ View |
| **Quotes** | ✅ All | ✅ All | ✅ My Quotes | 👁️ For My Services | ✅ My Quotes | 👁️ View |
| **Bookings** | ✅ All | ✅ All | ✅ My Bookings | ✅ To Fulfill | ✅ My Bookings | 👁️ View |
| **Analytics** | ✅ Full | ✅ Full | ✅ My Stats | ✅ My Stats | ❌ No | 👁️ View |
| **Audit Logs** | ✅ All | ❌ No | ❌ No | ❌ No | ❌ No | ✅ All |
| **Tenant Settings** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Tenant Mgmt** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Branding** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

Legend:
- ✅ Full Access
- 👁️ View Only / Limited Access
- ❌ No Access

---

## ✅ What's Working Well

1. ✅ **Sidebar Menu Filtering** - Users only see relevant menu items
2. ✅ **Tenant Branding** - Logo and colors applied correctly
3. ✅ **Agent Portal** - Fully functional dedicated portal
4. ✅ **Customer Portal** - Fully functional with separate auth
5. ✅ **Login System** - Single endpoint supports all roles
6. ✅ **Token Authentication** - Secure token-based auth
7. ✅ **Role Information** - User role properly stored and accessible

---

## ❌ What Needs Fixing

1. ❌ **No Route-Level Protection** - Users can manually access unauthorized routes
2. ❌ **No Supplier Portal** - Suppliers use admin dashboard (wrong)
3. ❌ **Supplier Menu Wrong** - Seeing items they shouldn't
4. ❌ **No Auditor Implementation** - Role exists but no UI
5. ⚠️ **Agent Layout Branding** - May not have tenant branding
6. ⚠️ **Customer Layout Branding** - May not have tenant branding

---

## 🧪 Testing Checklist

### Manual Tests Needed

#### Test 1: Super Admin Access
- [ ] Login as super_admin
- [ ] Verify can access /dashboard
- [ ] Verify can access /agents
- [ ] Verify can access /analytics
- [ ] Verify can access /audit-logs
- [ ] Verify can access /tenants
- [ ] Verify sidebar shows all items
- [ ] Verify tenant logo appears

#### Test 2: Operator Access
- [ ] Login as operator
- [ ] Verify can access /dashboard
- [ ] Verify can access /agents
- [ ] Verify can access /analytics
- [ ] Verify CANNOT see /audit-logs in sidebar
- [ ] Verify CANNOT see /tenants in sidebar
- [ ] Try manually accessing /audit-logs → Should redirect or 403
- [ ] Try manually accessing /tenants → Should redirect or 403
- [ ] Verify tenant logo appears

#### Test 3: Agent Access
- [ ] Login as agent
- [ ] Verify redirected to /agent/dashboard
- [ ] Verify sidebar shows agent menu items
- [ ] Try manually accessing /dashboard → Should redirect or 403
- [ ] Try manually accessing /analytics → Should redirect or 403
- [ ] Verify agent layout has tenant branding

#### Test 4: Supplier Access (CRITICAL)
- [ ] Login as supplier
- [ ] Check where redirected (currently /dashboard - WRONG)
- [ ] Check sidebar items (should NOT see Customers, Suppliers)
- [ ] Try accessing /suppliers → Should be blocked
- [ ] Verify no dedicated supplier portal exists

#### Test 5: Customer Access
- [ ] Login at /customer/login
- [ ] Verify redirected to /customer/dashboard
- [ ] Verify customer sidebar appears
- [ ] Try accessing /dashboard → Should redirect or 403
- [ ] Verify customer layout has tenant branding

---

## 📝 Implementation Priority

### Phase 1: Critical Security (IMMEDIATE)
1. Add RoleBasedRoute component
2. Protect all routes with role checks
3. Test unauthorized access prevention

### Phase 2: Supplier Portal (HIGH PRIORITY)
1. Create SupplierLayout
2. Create Supplier Dashboard
3. Add supplier-specific features
4. Update login redirect logic
5. Fix sidebar menu for suppliers

### Phase 3: Branding Verification (MEDIUM)
1. Add branding to AgentLayout
2. Add branding to CustomerLayout
3. Test branding across all user types

### Phase 4: Auditor Implementation (LOW)
1. Decide: Implement or remove?
2. If implement: Create auditor portal
3. If remove: Remove from User model enum

---

## 🎯 Success Criteria

✅ **Security**:
- Users cannot access unauthorized routes via manual URL entry
- Each role has appropriate access restrictions enforced at route level

✅ **User Experience**:
- Each user type has appropriate dashboard/portal
- Sidebar shows only relevant menu items
- All portals display tenant branding (logo, colors, company name)

✅ **Functionality**:
- Super Admin: Full system access
- Operator: Admin access minus tenant management
- Agent: Dedicated portal with agent features
- Supplier: Dedicated portal with supplier features
- Customer: Dedicated portal with customer features
- Auditor: Read-only access to audit logs (if implemented)

---

**Next Step**: Should I implement the critical fixes (Route-Level Protection and Supplier Portal)?
