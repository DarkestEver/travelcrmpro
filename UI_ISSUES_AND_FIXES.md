# UI Issues and Fixes

**Date**: November 15, 2025  
**Status**: In Progress  
**Priority**: High

---

## Issues Identified

### 1. ✅ **FIXED: Duplicate Menu Items**

**Issue**: Duplicate "Suppliers" menu item in navigation sidebar
- **Location 1**: Line 87-91 - Standalone "Suppliers" menu item
- **Location 2**: Line 133-157 - "Supplier Management" submenu with "Suppliers" child

**Fix Applied**:
- ✅ Removed duplicate standalone "Suppliers" menu item
- ✅ Kept "Supplier Management" parent menu with full submenu structure
- **File**: `frontend/src/components/Sidebar.jsx`

**Affected Users**: All roles (super_admin, operator, agent)

---

### 2. ⏳ **API Not Found Errors**

**Issue**: Frontend making API calls to endpoints that don't exist or have incorrect paths

**Common Causes**:
1. **API path mismatches** - Frontend uses different endpoint than backend
2. **Missing route registrations** - Backend route not registered in `routes/index.js`
3. **Incorrect HTTP methods** - Using GET instead of POST, etc.
4. **Missing API base URL** - Environment variable not set

**Investigation Needed**:
To identify specific 404 errors, check browser console for:
```
Failed to load resource: the server responded with a status of 404
POST http://localhost:5000/api/v1/some-endpoint 404 (Not Found)
```

**Backend API Routes Available** (from `backend/src/routes/index.js`):
```
✅ /api/v1/health
✅ /api/v1/performance
✅ /api/v1/auth
✅ /api/v1/tenants
✅ /api/v1/agents
✅ /api/v1/agent-portal
✅ /api/v1/agent-payments
✅ /api/v1/customers
✅ /api/v1/suppliers
✅ /api/v1/supplier-inventory
✅ /api/v1/rate-sheets
✅ /api/v1/itineraries
✅ /api/v1/quotes
✅ /api/v1/bookings
✅ /api/v1/notifications
✅ /api/v1/analytics
✅ /api/v1/audit-logs
✅ /api/v1/upload
✅ /api/v1/finance
✅ /api/v1/adjustments
✅ /api/v1/email-accounts
✅ /api/v1/emails
✅ /api/v1/review-queue
✅ /api/v1/share
✅ /api/v1/assignments
✅ /api/v1/expenses
✅ /api/v1/reports
✅ /api/v1/bank-reconciliation
✅ /api/v1/currency
✅ /api/v1/demand-forecasting
✅ /api/v1/inventory-sync
```

**Frontend API Service Files**:
Check these files for potential mismatches:
- `frontend/src/services/api/*.js`

**Action Items**:
1. ⏳ Test each page and note 404 errors in browser console
2. ⏳ Compare frontend API calls with backend route definitions
3. ⏳ Fix path mismatches
4. ⏳ Document missing backend endpoints (if any)

---

### 3. ⏳ **Permission Denied for Super Admin**

**Issue**: Super admin user getting "Permission Denied" or being redirected from pages

**Potential Causes**:

#### A. Role Check Issues
```javascript
// Check: frontend/src/components/RoleBasedRoute.jsx
const isAuthorized = allowedRoles.includes(user.role)
```

**Current Implementation**:
- ✅ RoleBasedRoute component exists
- ✅ Checks `allowedRoles.includes(user.role)`
- ✅ Redirects unauthorized users

**Possible Issues**:
1. **Route doesn't include 'super_admin'** in allowedRoles array
2. **User role stored as** `'superadmin'` but checked as `'super_admin'`
3. **Token doesn't contain role** - JWT payload missing role claim

#### B. Pages Missing Role Definitions

**Check These Routes** (in `App.jsx` or route config):
```javascript
// Example of correct implementation:
<RoleBasedRoute allowedRoles={['super_admin', 'operator']}>
  <SomeProtectedPage />
</RoleBasedRoute>
```

**Action Items**:
1. ⏳ Check browser console for role value: `console.log(user.role)`
2. ⏳ Verify JWT token contains role claim
3. ⏳ Grep search for all `RoleBasedRoute` usages and ensure 'super_admin' is included
4. ⏳ Check if role is stored consistently (snake_case vs camelCase)

---

### 4. ⏳ **MongoDB _id vs id Issues**

**Issue**: Inconsistency between MongoDB's `_id` field and API responses using `id`

**Common Scenarios**:

#### A. Backend Returns `_id`, Frontend Expects `id`
```javascript
// Backend response:
{ _id: "507f1f77bcf86cd799439011", name: "John" }

// Frontend tries to access:
item.id // undefined ❌
item._id // works ✓
```

#### B. Frontend Sends `id`, Backend Expects `_id`
```javascript
// Frontend API call:
api.put(`/suppliers/${item.id}`, data)  // ❌ if item.id is undefined

// Should be:
api.put(`/suppliers/${item._id || item.id}`, data)  // ✓ handles both
```

#### C. API Path Parameters
```javascript
// Common pattern - both should work:
/api/v1/suppliers/:id         // ✓ Backend route param
/api/v1/suppliers/507f1f77... // ✓ Actual call with MongoDB ObjectId
```

**Backend Serialization**:
Check if backend transforms `_id` to `id`:
```javascript
// In backend models or controllers:
schema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;    // Add id field
    delete ret._id;      // Remove _id
    delete ret.__v;      // Remove version key
    return ret;
  }
});
```

**Frontend Handling**:
```javascript
// Defensive approach:
const getId = (item) => item.id || item._id || item._id?.toString();

// Usage:
api.get(`/suppliers/${getId(supplier)}`)
```

**Action Items**:
1. ⏳ Check backend response format - does it return `id` or `_id`?
2. ⏳ Search for `item._id` vs `item.id` usage inconsistencies
3. ⏳ Add toJSON transform to all Mongoose models if missing
4. ⏳ Create utility function `getId()` for consistent ID access

---

## Testing Checklist

### For Super Admin User:

**Navigation Access**:
- [ ] Dashboard loads correctly
- [ ] All menu items visible (no 403 errors)
- [ ] Can navigate to all pages in sidebar

**Core Features**:
- [ ] View Agents list
- [ ] View Customers list
- [ ] View Suppliers list (under Supplier Management)
- [ ] View Itineraries
- [ ] View Quotes
- [ ] View Bookings

**Finance Module**:
- [ ] Finance Overview/Analytics
- [ ] Bank Reconciliation page
- [ ] Multi-Currency page

**Supplier Management**:
- [ ] Suppliers list
- [ ] Inventory page
- [ ] Rate Sheets page
- [ ] Sync Dashboard

**Analytics**:
- [ ] Demand Forecasting
- [ ] Reports
- [ ] Insights

**Admin Pages**:
- [ ] System Health
- [ ] Performance Monitoring
- [ ] User Management
- [ ] Tenant Settings

**API Calls** (check browser console):
- [ ] No 404 errors on page load
- [ ] No 403 errors when fetching data
- [ ] No 401 errors (authentication working)
- [ ] Data loads correctly in tables/lists

---

## Quick Diagnostic Steps

### 1. Check User Role in Browser Console
```javascript
// Open browser console (F12) and run:
JSON.parse(localStorage.getItem('auth-storage'))?.state?.user?.role
```
Expected output for super admin: `"super_admin"`

### 2. Check API Base URL
```javascript
// In browser console:
localStorage.getItem('VITE_API_URL')
// Or check .env file: VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Monitor Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Navigate through app
4. Look for red (failed) requests
5. Click failed request to see:
   - Request URL
   - Status Code (404, 403, 401, 500)
   - Response body (error message)

### 4. Check Console for Errors
Look for:
```
❌ Failed to load resource: 404 (Not Found)
❌ Access denied: insufficient permissions
❌ Cannot read property 'id' of undefined
❌ Cannot read property '_id' of undefined
```

---

## Known API Endpoint Patterns

### Standard CRUD Operations:
```javascript
GET    /api/v1/resource           // List all
GET    /api/v1/resource/:id       // Get one
POST   /api/v1/resource           // Create
PUT    /api/v1/resource/:id       // Update
DELETE /api/v1/resource/:id       // Delete
```

### Nested Resources:
```javascript
GET    /api/v1/suppliers/:id/inventory
POST   /api/v1/suppliers/:id/inventory
GET    /api/v1/rate-sheets/:id/versions
```

### Special Actions:
```javascript
POST   /api/v1/resource/:id/action    // e.g., /publish, /archive
GET    /api/v1/resource/:id/stats     // Get statistics
```

---

## Priority Fix Order

### Immediate (P0) - Blocking Issues:
1. ✅ Remove duplicate menu items
2. ⏳ Fix super admin permission denials
3. ⏳ Fix critical 404 errors preventing page load

### High Priority (P1) - User Impact:
4. ⏳ Fix _id vs id inconsistencies causing crashes
5. ⏳ Fix API path mismatches causing data not to load
6. ⏳ Ensure all CRUD operations work

### Medium Priority (P2) - UX Issues:
7. ⏳ Standardize error messages
8. ⏳ Add loading states for missing data
9. ⏳ Improve error handling UI

### Low Priority (P3) - Nice to Have:
10. ⏳ Add API response caching
11. ⏳ Optimize bundle size
12. ⏳ Add API request retry logic

---

## Next Steps

1. **User Testing Session**:
   - Login as super admin
   - Navigate through each menu item
   - Document specific errors encountered
   - Note which pages work vs. which fail

2. **Error Collection**:
   ```bash
   # Watch backend logs:
   cd backend
   npm run dev
   
   # Check for errors like:
   # - Route not found
   # - Permission denied
   # - Invalid ObjectId
   ```

3. **Create Detailed Issue List**:
   - For each page with errors:
     - Page name & URL
     - Error message
     - HTTP status code
     - Expected behavior
     - Actual behavior

4. **Systematic Fixes**:
   - Fix one issue type at a time
   - Test after each fix
   - Document solution
   - Rebuild and redeploy

---

## Common Fix Patterns

### Fix 1: Add Missing Endpoint
```javascript
// backend/src/routes/someRoutes.js
router.get('/some-endpoint', someController.getSomeData);

// Register in backend/src/routes/index.js
router.use('/some-resource', someRoutes);
```

### Fix 2: Add Role to Protected Route
```javascript
// Before:
<RoleBasedRoute allowedRoles={['operator']}>
  <SomePage />
</RoleBasedRoute>

// After:
<RoleBasedRoute allowedRoles={['super_admin', 'operator']}>
  <SomePage />
</RoleBasedRoute>
```

### Fix 3: Handle Both _id and id
```javascript
// In frontend components:
const itemId = item.id || item._id;

// Or in backend serializer:
schema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});
```

### Fix 4: Fix API Path
```javascript
// Check frontend API call:
const response = await api.get('/wrong-path');

// Compare with backend route:
router.get('/correct-path', handler);

// Fix:
const response = await api.get('/correct-path');
```

---

## Files to Check for Issues

### Frontend:
```
frontend/src/
├── App.jsx                          # Route definitions
├── components/
│   ├── Sidebar.jsx                  # ✅ Fixed (duplicate menu)
│   └── RoleBasedRoute.jsx          # Permission checks
├── services/
│   ├── api.js                       # Base API config
│   └── api/
│       ├── supplierApi.js
│       ├── inventoryApi.js
│       ├── rateSheetApi.js
│       └── ...                      # All API service files
├── pages/
│   └── (all page components)        # Check for API calls
└── stores/
    └── authStore.js                 # User role storage
```

### Backend:
```
backend/src/
├── routes/
│   └── index.js                     # ✅ Route registration verified
├── middleware/
│   ├── auth.js                      # Role permission checks
│   └── tenant.js                    # Tenant identification
├── models/                          # Check toJSON transforms
└── controllers/                     # Check response formats
```

---

## Support Information

**Environment**:
- Backend: Node.js + Express + MongoDB
- Frontend: React + Vite + React Router
- API Base URL: `http://localhost:5000/api/v1`
- Default Role: `super_admin`

**Debug Mode**:
To enable verbose logging:
```bash
# Backend:
DEBUG=* npm run dev

# Frontend:
VITE_DEBUG=true npm run dev
```

---

## Status Summary

| Issue | Status | Priority | Assigned |
|-------|--------|----------|----------|
| Duplicate menu items | ✅ Fixed | P0 | Completed |
| API 404 errors | ⏳ Investigating | P0 | In Progress |
| Permission denied | ⏳ Investigating | P0 | Pending |
| _id vs id issues | ⏳ Investigating | P1 | Pending |

---

**Last Updated**: November 15, 2025  
**Next Review**: After user testing session  
**Contact**: Development Team
