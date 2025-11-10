# Routes and Menu Mapping

## 📋 Overview

This document maps all existing routes in the application and shows which ones are linked in navigation menus and which ones are missing.

## 🎯 Route Categories

### 1. **Super Admin Routes** (`/` - Main Dashboard)
Accessible to: `super_admin` role only

| Route | Page Component | Menu Link | Status |
|-------|---------------|-----------|--------|
| `/dashboard` | Dashboard.jsx | ✅ Sidebar | Active |
| `/agents` | Agents.jsx | ✅ Sidebar | Active |
| `/customers` | Customers.jsx | ✅ Sidebar | Active |
| `/suppliers` | Suppliers.jsx | ✅ Sidebar | Active |
| `/itineraries` | Itineraries.jsx | ✅ Sidebar | Active |
| `/itineraries/:id/build` | ItineraryBuilder.jsx | 🔗 Link from Itineraries | Active |
| `/itinerary-preview/:id` | ItineraryPreview.jsx | 🔗 Link from Builder | Active |
| `/quotes` | Quotes.jsx | ✅ Sidebar | Active |
| `/bookings` | Bookings.jsx | ✅ Sidebar | Active |
| `/analytics` | Analytics.jsx | ✅ Sidebar | Active |
| `/audit-logs` | AuditLogs.jsx | ✅ Sidebar | Active |
| `/profile` | Profile.jsx | 👤 Profile dropdown | Active |
| `/settings` | TenantSettings.jsx | ✅ Sidebar | Active |
| `/settings/email-accounts` | EmailAccounts.jsx | ⚠️ **MISSING** | **Needs Link** |
| `/emails` | EmailDashboard.jsx | ⚠️ **MISSING** | **Needs Link** |
| `/emails/:id` | EmailDetail.jsx | 🔗 Link from Email list | Active |
| `/emails/review-queue` | ReviewQueue.jsx | ⚠️ **MISSING** | **Needs Link** |
| `/emails/analytics` | EmailAnalytics.jsx | ⚠️ **MISSING** | **Needs Link** |
| `/tenants` | TenantList.jsx | ✅ Sidebar | Active |
| `/tenants/create` | CreateTenant.jsx | 🔗 Button in Tenants | Active |
| `/tenants/:id` | TenantDetail.jsx | 🔗 Link from list | Active |

### 2. **Operator Routes** (`/` - Main Dashboard)
Accessible to: `operator` role

| Route | Page Component | Menu Link | Status |
|-------|---------------|-----------|--------|
| `/dashboard` | Dashboard.jsx | ✅ Sidebar | Active |
| `/agents` | Agents.jsx | ✅ Sidebar | Active |
| `/customers` | Customers.jsx | ✅ Sidebar | Active |
| `/suppliers` | Suppliers.jsx | ✅ Sidebar | Active |
| `/itineraries` | Itineraries.jsx | ✅ Sidebar | Active |
| `/quotes` | Quotes.jsx | ✅ Sidebar | Active |
| `/bookings` | Bookings.jsx | ✅ Sidebar | Active |
| `/analytics` | Analytics.jsx | ✅ Sidebar | Active |
| `/settings` | TenantSettings.jsx | ✅ Sidebar | Active |
| `/emails` | EmailDashboard.jsx | ⚠️ **MISSING** | **Needs Link** |
| `/emails/review-queue` | ReviewQueue.jsx | ⚠️ **MISSING** | **Needs Link** |
| `/emails/analytics` | EmailAnalytics.jsx | ⚠️ **MISSING** | **Needs Link** |

### 3. **Agent Portal Routes** (`/agent/*`)
Accessible to: `agent` role

| Route | Page Component | Menu Link | Status |
|-------|---------------|-----------|--------|
| `/agent/dashboard` | agent/Dashboard.jsx | ✅ AgentLayout | Active |
| `/agent/customers` | agent/Customers.jsx | ✅ AgentLayout | Active |
| `/agent/quotes` | agent/QuoteRequests.jsx | ✅ AgentLayout | Active |
| `/agent/bookings` | agent/Bookings.jsx | ✅ AgentLayout | Active |
| `/agent/commissions` | agent/Commissions.jsx | ✅ AgentLayout | Active |
| `/agent/payments` | agent/Payments.jsx | ✅ AgentLayout | Active |
| `/agent/invoices` | agent/Invoices.jsx | ✅ AgentLayout | Active |
| `/agent/invoices/new` | agent/CreateInvoice.jsx | 🔗 Button in Invoices | Active |
| `/agent/reports` | agent/Reports.jsx | ✅ AgentLayout | Active |
| `/agent/sub-users` | agent/SubUsers.jsx | ✅ AgentLayout | Active |
| `/agent/notifications` | agent/Notifications.jsx | ⚠️ **MISSING** | **Needs Link** |

### 4. **Supplier Portal Routes** (`/supplier/*`)
Accessible to: `supplier` role

| Route | Page Component | Menu Link | Status |
|-------|---------------|-----------|--------|
| `/supplier/dashboard` | supplier/Dashboard.jsx | ✅ SupplierLayout | Active |
| `/supplier/bookings` | supplier/Bookings.jsx | ✅ SupplierLayout | Active |
| `/supplier/inventory` | supplier/Inventory.jsx | ✅ SupplierLayout | Active |
| `/supplier/payments` | supplier/Payments.jsx | ✅ SupplierLayout | Active |
| `/supplier/profile` | supplier/Profile.jsx | 👤 Profile dropdown | Active |

### 5. **Finance Portal Routes** (`/finance/*`)
Accessible to: `finance` role

| Route | Page Component | Menu Link | Status |
|-------|---------------|-----------|--------|
| `/finance/dashboard` | finance/Dashboard.jsx | ✅ FinanceLayout | Active |
| `/finance/pending-approvals` | finance/PendingApprovals.jsx | ✅ FinanceLayout | Active |
| `/finance/payments` | finance/Payments.jsx | ✅ FinanceLayout | Active |
| `/finance/invoices` | finance/Invoices.jsx | ✅ FinanceLayout | Active |
| `/finance/reconciliation` | finance/Reconciliation.jsx | ✅ FinanceLayout | Active |
| `/finance/tax-settings` | finance/TaxSettings.jsx | ✅ FinanceLayout | Active |
| `/finance/reports` | finance/Reports.jsx | ✅ FinanceLayout | Active |
| `/finance/settings` | finance/Settings.jsx | ✅ FinanceLayout | Active |

### 6. **Customer Portal Routes** (`/customer/*`)
Accessible to: `customer` role

| Route | Page Component | Menu Link | Status |
|-------|---------------|-----------|--------|
| `/customer/dashboard` | customer/Dashboard.jsx | ✅ CustomerLayout | Active |
| `/customer/bookings` | customer/Bookings.jsx | ✅ CustomerLayout | Active |
| `/customer/bookings/:id` | customer/BookingDetails.jsx | 🔗 Link from list | Active |
| `/customer/invoices` | customer/Invoices.jsx | ✅ CustomerLayout | Active |
| `/customer/request-quote` | customer/RequestQuote.jsx | ✅ CustomerLayout | Active |
| `/customer/profile` | customer/Profile.jsx | 👤 Profile dropdown | Active |
| `/customer/notifications` | customer/Notifications.jsx | 🔗 Bell icon | Active |

### 7. **Public Routes**
Accessible to: All users

| Route | Page Component | Purpose |
|-------|---------------|---------|
| `/login` | auth/Login.jsx | Main login page |
| `/register` | auth/Register.jsx | Admin registration |
| `/customer/login` | customer/Login.jsx | Customer login |
| `/customer/register` | customer/Register.jsx | Customer registration |
| `/unauthorized` | Unauthorized.jsx | Access denied page |
| `*` | NotFound.jsx | 404 page |

## ⚠️ Missing Menu Links

### Email Management System (AI Email Automation)
These pages exist but are not in any menu:

1. **Email Dashboard** (`/emails`)
   - Component: `EmailDashboard.jsx`
   - Should be in: Main Sidebar (super_admin, operator)
   - Priority: **HIGH**

2. **Email Review Queue** (`/emails/review-queue`)
   - Component: `ReviewQueue.jsx`
   - Should be accessible from: Email Dashboard or Sidebar
   - Priority: **HIGH**

3. **Email Analytics** (`/emails/analytics`)
   - Component: `EmailAnalytics.jsx`
   - Should be accessible from: Email Dashboard or Sidebar
   - Priority: **MEDIUM**

4. **Email Accounts Settings** (`/settings/email-accounts`)
   - Component: `EmailAccounts.jsx`
   - Should be in: Settings submenu or Email Dashboard
   - Priority: **HIGH**

### Agent Notifications
5. **Agent Notifications** (`/agent/notifications`)
   - Component: `agent/Notifications.jsx`
   - Should be: Bell icon in AgentLayout header
   - Priority: **MEDIUM**

## 🔧 Recommended Menu Structure

### Main Sidebar (Super Admin / Operator)

```
Dashboard
├─ Agents
├─ Customers
├─ Suppliers
├─ Itineraries
├─ Quotes
├─ Bookings
├─ 📧 Emails (NEW)
│  ├─ Dashboard
│  ├─ Review Queue
│  └─ Analytics
├─ Analytics
├─ Settings
│  ├─ General Settings
│  └─ Email Accounts (NEW)
├─ Tenant Management (super_admin only)
└─ Audit Logs (super_admin only)
```

### Agent Layout
```
Dashboard
├─ Customers
├─ Quote Requests
├─ Bookings
├─ Commissions
├─ Payments
├─ Invoices
├─ Reports
└─ Sub Users

Header:
├─ 🔔 Notifications (NEW - link to /agent/notifications)
└─ Profile Dropdown
```

## 🎨 Implementation Plan

### Phase 1: Add Email Management to Main Sidebar

**File**: `frontend/src/components/Sidebar.jsx`

Add email management menu item with submenu:

```javascript
{
  name: 'Emails',
  icon: FiMail, // Add FiMail import
  roles: ['super_admin', 'operator'],
  submenu: [
    {
      name: 'Dashboard',
      path: '/emails',
    },
    {
      name: 'Review Queue',
      path: '/emails/review-queue',
      badge: 'count' // Show pending count
    },
    {
      name: 'Analytics',
      path: '/emails/analytics',
    }
  ]
}
```

### Phase 2: Add Email Accounts to Settings

Update Settings page to include Email Accounts link:

```javascript
// In TenantSettings.jsx
const settingsSections = [
  { name: 'General', path: '/settings' },
  { name: 'Email Accounts', path: '/settings/email-accounts' }, // NEW
  // ... other settings
]
```

### Phase 3: Add Notifications to Agent Header

**File**: `frontend/src/layouts/AgentLayout.jsx`

Add bell icon with notification count in header.

### Phase 4: Create Submenu Component

Create a reusable submenu/dropdown component for navigation items with children.

## 📊 Route Statistics

- **Total Routes**: 60+
- **Linked Routes**: 48
- **Missing Links**: 5
- **Auto-linked** (buttons, detail pages): 7

## 🔍 Testing Checklist

After implementing menu updates:

- [ ] All email management pages accessible from menu
- [ ] Email accounts accessible from settings
- [ ] Agent notifications accessible from header
- [ ] All roles see only their permitted routes
- [ ] Active menu items highlighted correctly
- [ ] Breadcrumbs work for all pages
- [ ] Mobile menu includes new items
- [ ] Submenu items expand/collapse properly

## 📝 Notes

### Why Some Routes Don't Need Menu Links

1. **Detail Pages**: Like `/emails/:id`, `/bookings/:id` - accessed via links in list views
2. **Create/Edit Pages**: Like `/tenants/create`, `/invoices/new` - accessed via buttons
3. **Preview Pages**: Like `/itinerary-preview/:id` - accessed from builder
4. **Auth Pages**: Login/Register - separate layouts

### Icon Recommendations

- Emails: `FiMail` or `FiInbox`
- Review Queue: `FiCheckSquare` or `FiList`
- Analytics: `FiBarChart2` or `FiTrendingUp`
- Email Accounts: `FiSettings` or `FiServer`
- Notifications: `FiBell`

---

**Last Updated**: November 10, 2025  
**Status**: Documentation Complete - Implementation Pending
