# 🧪 Role-Based Access Control - Manual Testing Guide

**Date**: November 9, 2025  
**Implementation Status**: ✅ COMPLETE - READY FOR TESTING

---

## 📋 What Was Implemented

### ✅ Completed Features
1. **RoleBasedRoute Component** - Protects routes at component level
2. **403 Unauthorized Page** - User-friendly access denied page
3. **Supplier Portal** - Complete portal with 5 pages (Dashboard, Bookings, Inventory, Payments, Profile)
4. **Supplier Backend APIs** - Dashboard stats, bookings list, status updates
5. **Tenant Branding** - Applied to Agent, Customer, and Supplier portals
6. **Route Protection** - All routes protected with role verification
7. **Fixed Sidebar Menu** - Suppliers no longer see admin menu items

---

## 🎯 Testing Objectives

This guide will help you verify:
- ✅ Each role can only access authorized routes
- ✅ Manual URL entry to unauthorized routes is blocked
- ✅ Users are redirected to appropriate dashboards
- ✅ Tenant branding appears for all user roles
- ✅ Supplier portal functions correctly
- ✅ All portals display correct menu items

---

## 🚀 Pre-Testing Setup

### Step 1: Ensure Backend is Running
```powershell
# Backend should auto-restart via nodemon
# If needed, check status:
cd backend
npm run dev
```

### Step 2: Ensure Frontend is Running
```powershell
# Frontend should be running
cd frontend
npm run dev
# Should be on http://localhost:5173
```

### Step 3: Ensure Test Users Exist
You need users with these roles:
- `super_admin`
- `operator`
- `agent`
- `supplier`
- `customer`

If you don't have them, use the seed script or create them via register.

---

## 🧪 Test Suite 1: Super Admin Access

### Login as Super Admin
1. Navigate to `http://localhost:5173/login`
2. Login with super_admin credentials
3. Should redirect to `/dashboard`

### Verify Super Admin Can Access:
- [ ] `/dashboard` - Main admin dashboard loads
- [ ] `/agents` - Agents management page loads
- [ ] `/customers` - Customers list loads
- [ ] `/suppliers` - Suppliers list loads
- [ ] `/itineraries` - Itineraries page loads
- [ ] `/quotes` - Quotes page loads
- [ ] `/bookings` - Bookings page loads
- [ ] `/analytics` - Analytics page loads
- [ ] `/audit-logs` - Audit logs page loads
- [ ] `/settings` - Tenant settings page loads
- [ ] `/tenants` - Tenant management page loads
- [ ] `/profile` - Profile page loads

### Verify Super Admin Sidebar Shows:
- [x] Dashboard
- [x] Agents
- [x] Customers
- [x] Suppliers
- [x] Itineraries
- [x] Quotes
- [x] Bookings
- [x] Analytics
- [x] Tenant Settings
- [x] Tenant Management
- [x] Audit Logs

### Verify Super Admin CANNOT Access:
- [ ] Type `/agent/dashboard` → Should redirect to `/dashboard`
- [ ] Type `/supplier/dashboard` → Should redirect to `/dashboard`
- [ ] Type `/customer/dashboard` → Should redirect to `/customer/login`

### Verify Tenant Branding:
- [ ] Logo appears in sidebar (or colored initial if no logo)
- [ ] Company name displays correctly
- [ ] Primary color applied to active menu items

**Result**: ✅ / ❌

---

## 🧪 Test Suite 2: Operator Access

### Login as Operator
1. Logout from super_admin
2. Login with operator credentials
3. Should redirect to `/dashboard`

### Verify Operator Can Access:
- [ ] `/dashboard` - Main admin dashboard loads
- [ ] `/agents` - Agents management page loads
- [ ] `/customers` - Customers list loads
- [ ] `/suppliers` - Suppliers list loads
- [ ] `/itineraries` - Itineraries page loads
- [ ] `/quotes` - Quotes page loads
- [ ] `/bookings` - Bookings page loads
- [ ] `/analytics` - Analytics page loads
- [ ] `/settings` - Tenant settings page loads
- [ ] `/profile` - Profile page loads

### Verify Operator CANNOT Access (Should Redirect):
- [ ] Type `/audit-logs` → Should redirect to `/dashboard`
- [ ] Type `/tenants` → Should redirect to `/dashboard`
- [ ] Type `/tenants/create` → Should redirect to `/dashboard`
- [ ] Type `/agent/dashboard` → Should redirect to `/dashboard`
- [ ] Type `/supplier/dashboard` → Should redirect to `/dashboard`

### Verify Operator Sidebar Shows:
- [x] Dashboard
- [x] Agents
- [x] Customers
- [x] Suppliers
- [x] Itineraries
- [x] Quotes
- [x] Bookings
- [x] Analytics
- [x] Tenant Settings
- [ ] ~~Tenant Management~~ (Should NOT appear)
- [ ] ~~Audit Logs~~ (Should NOT appear)

### Verify Tenant Branding:
- [ ] Logo appears in sidebar
- [ ] Company name displays correctly
- [ ] Primary color applied to active menu items

**Result**: ✅ / ❌

---

## 🧪 Test Suite 3: Agent Access

### Login as Agent
1. Logout from operator
2. Login with agent credentials
3. Should redirect to `/agent/dashboard`

### Verify Agent Can Access:
- [ ] `/agent/dashboard` - Agent dashboard loads
- [ ] `/agent/customers` - Agent's customers list loads
- [ ] `/agent/quotes` - Agent's quotes loads
- [ ] `/agent/quotes/new` - Request quote form loads
- [ ] `/agent/bookings` - Agent's bookings loads
- [ ] `/agent/commissions` - Commissions page loads
- [ ] `/agent/payments` - Payments page loads
- [ ] `/agent/reports` - Reports page loads
- [ ] `/agent/invoices` - Invoices page loads
- [ ] `/agent/invoices/new` - Create invoice form loads
- [ ] `/agent/notifications` - Notifications page loads
- [ ] `/agent/sub-users` - Sub-users page loads

### Verify Agent CANNOT Access (Should Redirect to /agent/dashboard):
- [ ] Type `/dashboard` → Should redirect to `/agent/dashboard`
- [ ] Type `/agents` → Should redirect to `/agent/dashboard`
- [ ] Type `/analytics` → Should redirect to `/agent/dashboard`
- [ ] Type `/audit-logs` → Should redirect to `/agent/dashboard`
- [ ] Type `/settings` → Should redirect to `/agent/dashboard`
- [ ] Type `/tenants` → Should redirect to `/agent/dashboard`
- [ ] Type `/supplier/dashboard` → Should redirect to `/agent/dashboard`

### Verify Agent Sidebar Shows:
- [x] Dashboard
- [x] Customers
- [x] Quote Requests
- [x] Bookings
- [x] Commissions
- [x] Payments
- [x] Invoices
- [x] Reports
- [x] Sub Users
- [x] "Agent Portal" header with tenant logo/name

### Verify Tenant Branding in Agent Layout:
- [ ] Logo appears in sidebar header
- [ ] Company name displays with "Agent Portal" subtitle
- [ ] Primary color applied to active menu items
- [ ] Primary color on user avatar circle

**Result**: ✅ / ❌

---

## 🧪 Test Suite 4: Supplier Access (NEW)

### Login as Supplier
1. Logout from agent
2. Login with supplier credentials
3. Should redirect to `/supplier/dashboard`

### Verify Supplier Can Access:
- [ ] `/supplier/dashboard` - Supplier dashboard loads
- [ ] `/supplier/bookings` - Bookings assigned to supplier loads
- [ ] `/supplier/inventory` - Inventory management page loads
- [ ] `/supplier/payments` - Payments page loads
- [ ] `/supplier/profile` - Profile page loads

### Verify Supplier Dashboard Shows:
- [ ] Stats cards display (Pending Confirmations, Confirmed Bookings, Total Bookings, Total Revenue, Active Services)
- [ ] Recent bookings list (or empty state if no bookings)
- [ ] Quick action buttons (View All Bookings, Manage Inventory, View Payments)

### Verify Supplier Bookings Page:
- [ ] Search bar present
- [ ] Status filter dropdown (All, Pending, Confirmed, Completed, Cancelled)
- [ ] Bookings list displays (or empty state)
- [ ] Each booking shows: Customer name, destination, date, amount, status badge
- [ ] Pending bookings show "Confirm" and "Cancel" buttons
- [ ] Confirmed bookings show "Complete" button

### Verify Supplier CANNOT Access (Should Redirect to /supplier/dashboard):
- [ ] Type `/dashboard` → Should redirect to `/supplier/dashboard`
- [ ] Type `/agents` → Should redirect to `/supplier/dashboard`
- [ ] Type `/customers` → Should redirect to `/supplier/dashboard`
- [ ] Type `/suppliers` → Should redirect to `/supplier/dashboard`
- [ ] Type `/analytics` → Should redirect to `/supplier/dashboard`
- [ ] Type `/audit-logs` → Should redirect to `/supplier/dashboard`
- [ ] Type `/settings` → Should redirect to `/supplier/dashboard`
- [ ] Type `/tenants` → Should redirect to `/supplier/dashboard`
- [ ] Type `/agent/dashboard` → Should redirect to `/supplier/dashboard`

### Verify Supplier Sidebar Shows:
- [x] Dashboard
- [x] My Bookings
- [x] Inventory
- [x] Payments
- [x] Profile
- [x] Tenant logo and company name in header
- [x] "Supplier Portal" subtitle
- [ ] ~~Should NOT see: Customers, Suppliers, Agents, Analytics, Settings~~

### Verify Tenant Branding in Supplier Layout:
- [ ] Logo appears in sidebar header
- [ ] Company name displays with "Supplier Portal" subtitle
- [ ] Primary color applied to active menu items
- [ ] Primary color on user avatar circle
- [ ] User role shows as "Supplier"

**Result**: ✅ / ❌

---

## 🧪 Test Suite 5: Customer Access

### Login as Customer
1. Logout from supplier
2. Navigate to `/customer/login` (SEPARATE LOGIN)
3. Login with customer credentials
4. Should redirect to `/customer/dashboard`

### Verify Customer Can Access:
- [ ] `/customer/dashboard` - Customer dashboard loads
- [ ] `/customer/bookings` - Customer's bookings list loads
- [ ] `/customer/bookings/:id` - Booking details page loads
- [ ] `/customer/invoices` - Invoices page loads
- [ ] `/customer/request-quote` - Request quote form loads
- [ ] `/customer/profile` - Profile page loads
- [ ] `/customer/notifications` - Notifications page loads

### Verify Customer CANNOT Access (Should Redirect):
- [ ] Type `/dashboard` → Should redirect to `/customer/login` (not authenticated in main app)
- [ ] Type `/agent/dashboard` → Should redirect to `/customer/login`
- [ ] Type `/supplier/dashboard` → Should redirect to `/customer/login`

### Verify Customer Sidebar Shows:
- [x] Dashboard
- [x] My Bookings
- [x] Invoices
- [x] Request Quote
- [x] My Profile
- [x] Tenant logo and company name

### Verify Tenant Branding in Customer Layout:
- [ ] Logo appears in sidebar header
- [ ] Company name displays
- [ ] Primary color applied to active menu items
- [ ] Primary color on user avatar circle
- [ ] User name and email display

**Result**: ✅ / ❌

---

## 🧪 Test Suite 6: Unauthorized Access (403 Page)

### Test Unauthorized Page
1. Login as agent
2. In browser, navigate to `/unauthorized`
3. Should see 403 page

### Verify 403 Page Contains:
- [ ] Shield icon
- [ ] "403" error code
- [ ] "Access Denied" heading
- [ ] Explanation message
- [ ] Current role displayed (e.g., "Current Role: Agent")
- [ ] "Go to Dashboard" button
- [ ] "Go Back" button
- [ ] Help text at bottom

### Test Go to Dashboard Button:
- [ ] Click "Go to Dashboard"
- [ ] Should redirect to role-appropriate dashboard:
  - Agent → `/agent/dashboard`
  - Supplier → `/supplier/dashboard`
  - Customer → `/customer/dashboard`
  - Super Admin/Operator → `/dashboard`

**Result**: ✅ / ❌

---

## 🧪 Test Suite 7: Role-Based Redirect Logic

### Test Smart Redirect on Login
Test that users are sent to correct dashboard after login:

| Role | Expected Redirect |
|------|-------------------|
| super_admin | `/dashboard` |
| operator | `/dashboard` |
| agent | `/agent/dashboard` |
| supplier | `/supplier/dashboard` |
| customer | `/customer/dashboard` |

### Test Each Role:
- [ ] Super Admin → `/dashboard` ✅
- [ ] Operator → `/dashboard` ✅
- [ ] Agent → `/agent/dashboard` ✅
- [ ] Supplier → `/supplier/dashboard` ✅
- [ ] Customer → `/customer/dashboard` ✅

**Result**: ✅ / ❌

---

## 🧪 Test Suite 8: Backend API Protection

### Test Supplier Portal APIs
Login as supplier and test API endpoints:

#### 1. Dashboard Stats
```bash
GET /api/v1/suppliers/dashboard-stats
```
- [ ] Returns: totalBookings, pendingConfirmations, confirmedBookings, totalRevenue, activeServices

#### 2. My Bookings
```bash
GET /api/v1/suppliers/my-bookings?page=1&limit=10
```
- [ ] Returns: List of bookings assigned to this supplier only
- [ ] Includes pagination
- [ ] Supports status filter: `?status=pending`
- [ ] Supports search: `?search=customer`

#### 3. Update Booking Status
```bash
PUT /api/v1/suppliers/bookings/:bookingId/status
Body: { "status": "confirmed" }
```
- [ ] Updates booking status
- [ ] Only works for bookings assigned to this supplier
- [ ] Returns error if booking not assigned to this supplier

### Test API Protection (Should Fail)
Try accessing supplier APIs as non-supplier user:

- [ ] Login as agent
- [ ] Try GET `/api/v1/suppliers/dashboard-stats` → Should get 403 error
- [ ] Try GET `/api/v1/suppliers/my-bookings` → Should get 403 error

**Result**: ✅ / ❌

---

## 🧪 Test Suite 9: Edge Cases

### Test 1: Direct URL Manipulation
1. Login as agent
2. Try each of these URLs directly in browser:
   - [ ] `/analytics` → Redirect to `/agent/dashboard`
   - [ ] `/audit-logs` → Redirect to `/agent/dashboard`
   - [ ] `/tenants` → Redirect to `/agent/dashboard`
   - [ ] `/settings` → Redirect to `/agent/dashboard`

### Test 2: Logout and Access Protected Route
1. Logout
2. Try accessing `/dashboard` → Should redirect to `/login`
3. Try accessing `/agent/dashboard` → Should redirect to `/login`
4. Try accessing `/supplier/dashboard` → Should redirect to `/login`

### Test 3: Session Expiry
1. Login as any user
2. Clear localStorage: `localStorage.clear()`
3. Try accessing any protected route → Should redirect to `/login`

### Test 4: Invalid Role
1. Login as agent
2. In browser console, try changing role:
   ```javascript
   // This should NOT work - backend validates
   localStorage.setItem('user', JSON.stringify({...JSON.parse(localStorage.getItem('user')), role: 'super_admin'}))
   ```
3. Try accessing `/tenants` → Should still be blocked by backend

**Result**: ✅ / ❌

---

## 📊 Test Results Summary

| Test Suite | Status | Pass Rate | Notes |
|------------|--------|-----------|-------|
| 1. Super Admin Access | ⏳ Pending | 0/X | |
| 2. Operator Access | ⏳ Pending | 0/X | |
| 3. Agent Access | ⏳ Pending | 0/X | |
| 4. Supplier Access | ⏳ Pending | 0/X | |
| 5. Customer Access | ⏳ Pending | 0/X | |
| 6. Unauthorized Page | ⏳ Pending | 0/X | |
| 7. Redirect Logic | ⏳ Pending | 0/5 | |
| 8. API Protection | ⏳ Pending | 0/X | |
| 9. Edge Cases | ⏳ Pending | 0/X | |

---

## 🐛 Issues Found

### Template for Logging Issues:
```
**Issue #**: 
**Test Suite**: 
**Severity**: Critical / High / Medium / Low
**Description**: 
**Steps to Reproduce**:
1. 
2. 
3. 
**Expected Behavior**: 
**Actual Behavior**: 
**Screenshot/Error**: 
```

---

## ✅ Sign-Off

**Tester Name**: _________________  
**Date**: _________________  
**Overall Result**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

**Notes**:
```
(Add any additional observations, recommendations, or concerns)
```

---

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Mark implementation as production-ready
2. ✅ Update IMPLEMENTATION_STATUS.md
3. ✅ Create user documentation
4. ✅ Deploy to staging environment

If issues found:
1. ❌ Log all issues above
2. ❌ Prioritize by severity
3. ❌ Create fix plan
4. ❌ Retest after fixes

---

**Note**: Wait 1 minute after making code changes to allow nodemon to restart the backend server before testing.
