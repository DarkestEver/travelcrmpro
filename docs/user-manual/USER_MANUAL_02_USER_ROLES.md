# Travel CRM Pro - User Manual
## Part 2: User Roles & Permissions Guide

**Version**: 2.1.0  
**Last Updated**: November 15, 2025  
**Document**: 2 of 14

---

## Table of Contents

1. [Overview of User Roles](#overview)
2. [Super Admin Role](#super-admin)
3. [Operator Role](#operator)
4. [Agent Role](#agent)
5. [Customer Role](#customer)
6. [Supplier Role](#supplier)
7. [Finance Role](#finance)
8. [Permission Matrix](#permission-matrix)
9. [Custom Permissions](#custom-permissions)
10. [Role Assignment](#role-assignment)

---

## 1. Overview of User Roles {#overview}

Travel CRM Pro implements a comprehensive role-based access control (RBAC) system with 6 primary user roles. Each role has specific permissions and access levels designed to match real-world organizational structure.

### 1.1 Available Roles

| Role | Access Level | Primary Use Case |
|------|--------------|------------------|
| **Super Admin** | Full System Access | Platform owner, system configuration |
| **Operator** | Administrative | Day-to-day operations, staff members |
| **Agent** | Limited Portal | Travel agents, partners |
| **Customer** | Self-Service Portal | End customers |
| **Supplier** | Supplier Portal | Hotels, airlines, tour operators |
| **Finance** | Finance Module | Accounting, billing, reconciliation |

### 1.2 Role Hierarchy

```
┌─────────────────────────────────────┐
│          SUPER ADMIN                │
│    (Full Platform Access)           │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼──────┐      ┌──────▼────┐
│ OPERATOR │      │  FINANCE  │
│ (Admin)  │      │(Financial)│
└───┬──────┘      └──────┬────┘
    │                    │
    │     ┌──────────────┘
    │     │
┌───▼─────▼───┬────────────┬──────────┐
│   AGENT     │  CUSTOMER  │ SUPPLIER │
│  (Limited)  │  (Portal)  │ (Portal) │
└─────────────┴────────────┴──────────┘
```

---

## 2. Super Admin Role {#super-admin}

### 2.1 Description

The Super Admin has complete control over the entire platform, including tenant management, system configuration, and all other roles' capabilities. This is the highest privilege level.

### 2.2 Key Responsibilities

- ✅ Manage multiple tenants (organizations)
- ✅ Configure system-wide settings
- ✅ Create and manage all user types
- ✅ Access audit logs and system logs
- ✅ Monitor system health and performance
- ✅ Configure integrations and APIs
- ✅ Manage subscriptions and billing
- ✅ Override permissions when needed

### 2.3 Access Rights

**Full Access To:**
- ✅ Tenant Management
- ✅ User Management (all roles)
- ✅ System Settings
- ✅ Audit Logs
- ✅ Analytics & Reports
- ✅ Email Configuration
- ✅ Payment Gateway Setup
- ✅ API Keys & Integrations
- ✅ Backup & Restore
- ✅ Database Management

**Dashboard Modules:**
- Tenant Overview
- System Health Monitoring
- User Activity Analytics
- Performance Metrics
- Audit Logs
- Security Alerts
- Subscription Management

### 2.4 Limitations

- ⚠️ Cannot delete own account
- ⚠️ Requires 2FA for sensitive operations
- ⚠️ All actions are logged and auditable

### 2.5 Best Practices

1. **Limit Super Admin Accounts**: Only 1-2 per organization
2. **Use for Setup Only**: Day-to-day ops should use Operator role
3. **Enable 2FA**: Always require two-factor authentication
4. **Regular Security Audits**: Review access logs monthly
5. **Strong Passwords**: Enforce 12+ character passwords

---

## 3. Operator Role {#operator}

### 3.1 Description

Operators are staff members who handle day-to-day operations of the travel business. They have administrative privileges within their tenant but cannot manage the system itself.

### 3.2 Key Responsibilities

- ✅ Manage customers
- ✅ Create and manage bookings
- ✅ Build itineraries
- ✅ Generate quotes
- ✅ Process payments (with limits)
- ✅ Manage agents
- ✅ Handle customer support
- ✅ Generate reports

### 3.3 Access Rights

**Full Access To:**
- ✅ Customer Management
- ✅ Agent Management
- ✅ Booking Management
- ✅ Quote Management
- ✅ Itinerary Builder
- ✅ Invoice Generation
- ✅ Email Dashboard
- ✅ Review Queue
- ✅ Analytics (tenant-level)
- ✅ Supplier Management

**Limited Access To:**
- ⚠️ User Management (can't create Operators or Super Admins)
- ⚠️ Financial Reports (view only, no reconciliation)
- ⚠️ Tenant Settings (view only)

**No Access To:**
- ❌ Tenant Management
- ❌ System Settings
- ❌ Super Admin Functions
- ❌ Audit Logs (system-wide)
- ❌ API Keys Management

### 3.4 Dashboard Modules

- Operations Dashboard
- Customer List & CRM
- Bookings Calendar
- Quote Requests
- Itinerary Builder
- Email Automation
- Performance Analytics
- Task Management

### 3.5 Permission Levels

| Function | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| Customers | ✅ | ✅ | ✅ | ✅ |
| Bookings | ✅ | ✅ | ✅ | ⚠️ Limited |
| Quotes | ✅ | ✅ | ✅ | ✅ |
| Itineraries | ✅ | ✅ | ✅ | ✅ |
| Invoices | ✅ | ✅ | ✅ | ⚠️ Limited |
| Agents | ✅ | ✅ | ✅ | ⚠️ Suspend only |
| Suppliers | ✅ | ✅ | ✅ | ❌ |
| Payments | ⚠️ Limited | ✅ | ⚠️ Limited | ❌ |

---

## 4. Agent Role {#agent}

### 4.1 Description

Travel agents use a dedicated portal to manage their customers, request quotes, and earn commissions. They represent external partners or franchisees.

### 4.2 Key Responsibilities

- ✅ Manage their own customers
- ✅ Request quotes from operators
- ✅ View and track bookings
- ✅ View commission statements
- ✅ Process customer payments
- ✅ Generate invoices
- ✅ Manage sub-users (if allowed)

### 4.3 Access Rights

**Full Access To:**
- ✅ Agent Dashboard
- ✅ My Customers
- ✅ Quote Requests
- ✅ My Bookings
- ✅ Commission Reports
- ✅ Payment History
- ✅ My Invoices
- ✅ Profile Settings

**Limited Access To:**
- ⚠️ Customer Data (only their assigned customers)
- ⚠️ Booking Details (only their bookings)
- ⚠️ Financial Reports (own performance only)

**No Access To:**
- ❌ Other Agents' Data
- ❌ System Settings
- ❌ Operator Functions
- ❌ Full Customer Database
- ❌ Supplier Management
- ❌ Email Configuration

### 4.4 Dashboard Modules

- Agent Dashboard
- My Customers
- Quote Requests (Create & Track)
- My Bookings
- Commission Tracking
- Payment History
- Invoice Generation
- Performance Reports
- Sub-User Management (if enabled)
- Notifications

### 4.5 Commission Structure

Agents typically work on commission:

- **Commission Rate**: Set per agent (e.g., 10-15%)
- **Payment Terms**: Weekly, bi-weekly, or monthly
- **Minimum Payout**: Configurable threshold
- **Commission Types**:
  - Percentage of booking value
  - Flat fee per booking
  - Tiered based on volume
  - Performance bonuses

### 4.6 Sub-Users (Optional)

Agents can create sub-users for their team:

- **Sub-User Limit**: Defined per agent
- **Permissions**: Limited to agent's scope
- **Commission Sharing**: Configurable
- **Reporting**: Rolls up to main agent account

---

## 5. Customer Role {#customer}

### 5.1 Description

End customers who book travel services. They have access to a self-service portal to view bookings, request quotes, and manage their travel.

### 5.2 Key Responsibilities

- ✅ View booking details
- ✅ Request new quotes
- ✅ Track bookings status
- ✅ Download vouchers/tickets
- ✅ View invoices
- ✅ Make payments
- ✅ Update profile information
- ✅ View travel history

### 5.3 Access Rights

**Full Access To:**
- ✅ Customer Dashboard
- ✅ My Bookings
- ✅ My Quotes
- ✅ Invoices & Payments
- ✅ Travel Documents
- ✅ Profile Settings
- ✅ Notifications
- ✅ Support/Help

**Limited Access To:**
- ⚠️ Only their own data
- ⚠️ Cannot see other customers
- ⚠️ Read-only on confirmed bookings

**No Access To:**
- ❌ Admin Functions
- ❌ Other Customers' Data
- ❌ System Settings
- ❌ Financial Reports
- ❌ Supplier Information

### 5.4 Dashboard Modules

- Customer Dashboard
- My Bookings (Upcoming & Past)
- Request Quote
- Invoices & Payments
- Travel Documents (Vouchers, Tickets)
- Profile Management
- Notifications
- Support/Chat

### 5.5 Self-Service Features

**Booking Management:**
- View booking details
- Download vouchers
- Track booking status
- View itineraries
- Access travel documents

**Quote Requests:**
- Create new quote request
- Provide travel details
- Upload requirements
- Track quote status
- Accept/reject quotes

**Payments:**
- View outstanding balances
- Make online payments
- Download receipts
- View payment history
- Set up payment plans

**Communications:**
- View notifications
- Read messages from agents/operators
- Chat support
- Email correspondence

---

## 6. Supplier Role {#supplier}

### 6.1 Description

Hotels, airlines, tour operators, and other service providers who supply travel services. They manage inventory and fulfill bookings.

### 6.2 Key Responsibilities

- ✅ Manage inventory/availability
- ✅ Update rate sheets
- ✅ Confirm bookings
- ✅ Process cancellations
- ✅ View payment status
- ✅ Upload contracts/agreements
- ✅ Provide booking confirmations

### 6.3 Access Rights

**Full Access To:**
- ✅ Supplier Dashboard
- ✅ Inventory Management
- ✅ Rate Sheet Management
- ✅ Booking Requests
- ✅ Payment Status
- ✅ Performance Reports
- ✅ Contract Management
- ✅ Profile Settings

**Limited Access To:**
- ⚠️ Booking Details (service-related info only)
- ⚠️ Customer Data (name, dates only - no personal info)
- ⚠️ Financial Reports (payment status only)

**No Access To:**
- ❌ Full Customer Database
- ❌ Other Suppliers' Data
- ❌ System Settings
- ❌ Admin Functions
- ❌ Agent Information
- ❌ Pricing Markups

### 6.4 Dashboard Modules

- Supplier Dashboard
- Inventory Management
- Rate Sheets
- Booking Requests
- Confirmed Bookings
- Cancellation Requests
- Payment Status
- Performance Analytics
- Contract Documents
- Sync Status (if automated)

### 6.5 Inventory Management

**Capabilities:**
- Add/edit inventory items
- Set availability calendars
- Update pricing (seasonal)
- Manage blackout dates
- Bulk upload via CSV
- API integration for auto-sync
- Set minimum/maximum stays
- Define cancellation policies

### 6.6 Rate Sheets

**Features:**
- Create rate sheets (seasonal, special offers)
- Version control
- Approval workflow
- Rate comparison
- Bulk pricing updates
- Contract period management
- Commission structures
- Terms & conditions

---

## 7. Finance Role {#finance}

### 7.1 Description

Finance team members who handle accounting, invoicing, reconciliation, and financial reporting. They have specialized access to financial modules.

### 7.2 Key Responsibilities

- ✅ Process payments
- ✅ Generate invoices
- ✅ Bank reconciliation
- ✅ Financial reporting
- ✅ Tax management
- ✅ Currency management
- ✅ Audit financial transactions
- ✅ Approve refunds

### 7.3 Access Rights

**Full Access To:**
- ✅ Finance Dashboard
- ✅ Payments (all types)
- ✅ Invoices (create, edit, void)
- ✅ Bank Reconciliation
- ✅ Multi-Currency Management
- ✅ Financial Reports
- ✅ Tax Settings
- ✅ Payment Methods
- ✅ Refunds & Credits

**Limited Access To:**
- ⚠️ Customer Data (financial info only)
- ⚠️ Booking Data (pricing only)
- ⚠️ Agent Commissions (view and approve)

**No Access To:**
- ❌ Itinerary Creation
- ❌ Customer Communication
- ❌ Supplier Inventory
- ❌ System Settings
- ❌ User Management

### 7.4 Dashboard Modules

- Finance Dashboard
- Payments Overview
- Invoices Management
- Bank Reconciliation
- Multi-Currency Manager
- Tax Configuration
- Financial Reports:
  - Revenue Reports
  - Profit & Loss
  - Accounts Receivable
  - Accounts Payable
  - Commission Reports
  - Tax Reports
- Audit Logs (financial)

### 7.5 Financial Operations

**Payment Processing:**
- Record payments (cash, card, bank transfer)
- Process refunds
- Manage payment plans
- Void/cancel payments
- Generate receipts
- Handle disputes

**Reconciliation:**
- Bank statement upload
- Auto-matching transactions
- Manual matching
- Discrepancy resolution
- Mark as reconciled
- Export reconciliation reports

**Multi-Currency:**
- Manage exchange rates
- Currency conversions
- Multi-currency invoicing
- Foreign exchange gains/losses
- Currency risk reports

---

## 8. Permission Matrix {#permission-matrix}

Comprehensive permission matrix across all modules:

### 8.1 Customer Management

| Action | Super Admin | Operator | Agent | Customer | Supplier | Finance |
|--------|-------------|----------|-------|----------|----------|---------|
| View All Customers | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ Limited |
| View Own Customers | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Limited |
| Create Customer | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Customer | ✅ | ✅ | ⚠️ Own only | ⚠️ Profile only | ❌ | ❌ |
| Delete Customer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Export Customers | ✅ | ✅ | ⚠️ Own only | ❌ | ❌ | ⚠️ Limited |

### 8.2 Booking Management

| Action | Super Admin | Operator | Agent | Customer | Supplier | Finance |
|--------|-------------|----------|-------|----------|----------|---------|
| View All Bookings | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| View Own Bookings | ✅ | ✅ | ✅ | ✅ | ⚠️ Relevant only | ✅ |
| Create Booking | ✅ | ✅ | ⚠️ Via quote | ❌ | ❌ | ❌ |
| Edit Booking | ✅ | ✅ | ⚠️ Limited | ❌ | ⚠️ Confirmation | ⚠️ Pricing |
| Cancel Booking | ✅ | ✅ | ⚠️ Request only | ⚠️ Request only | ⚠️ Approve | ⚠️ Approve |
| Confirm Booking | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

### 8.3 Financial Operations

| Action | Super Admin | Operator | Agent | Customer | Supplier | Finance |
|--------|-------------|----------|-------|----------|----------|---------|
| View Payments | ✅ | ⚠️ Limited | ⚠️ Own only | ⚠️ Own only | ⚠️ Own only | ✅ |
| Process Payment | ✅ | ⚠️ Limited | ⚠️ Limited | ✅ | ❌ | ✅ |
| Issue Refund | ✅ | ⚠️ Approval | ❌ | ❌ | ❌ | ✅ |
| Generate Invoice | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Bank Reconciliation | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Financial Reports | ✅ | ⚠️ Limited | ⚠️ Own only | ⚠️ Own only | ⚠️ Own only | ✅ |

### 8.4 System Administration

| Action | Super Admin | Operator | Agent | Customer | Supplier | Finance |
|--------|-------------|----------|-------|----------|----------|---------|
| Manage Tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ⚠️ Limited | ⚠️ Sub-users | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Email Configuration | ✅ | ⚠️ View only | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ⚠️ Limited | ❌ | ❌ | ❌ | ⚠️ Financial |
| API Keys | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 8.5 Reporting & Analytics

| Action | Super Admin | Operator | Agent | Customer | Supplier | Finance |
|--------|-------------|----------|-------|----------|----------|---------|
| Dashboard Access | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Performance Reports | ✅ | ✅ | ⚠️ Own only | ❌ | ⚠️ Own only | ✅ |
| Revenue Reports | ✅ | ⚠️ Limited | ⚠️ Commission | ❌ | ❌ | ✅ |
| Customer Reports | ✅ | ✅ | ⚠️ Own only | ❌ | ❌ | ⚠️ Limited |
| Export Reports | ✅ | ✅ | ⚠️ Limited | ⚠️ Own data | ⚠️ Limited | ✅ |
| Custom Reports | ✅ | ⚠️ Limited | ❌ | ❌ | ❌ | ✅ |

---

## 9. Custom Permissions {#custom-permissions}

### 9.1 Granular Permission Control

Super Admins can create custom permission sets:

**Available Permission Categories:**
1. **Customer Management**: View, Create, Edit, Delete, Export
2. **Booking Management**: View, Create, Edit, Cancel, Confirm
3. **Financial**: View Payments, Process Payments, Refunds, Reconciliation
4. **Itineraries**: View, Create, Edit, Delete, Share
5. **Quotes**: View, Create, Edit, Approve, Reject
6. **Suppliers**: View, Create, Edit, Manage Inventory
7. **Reports**: View, Create, Export, Share
8. **Email**: View, Send, Configure
9. **Settings**: View, Edit, System Config

### 9.2 Creating Custom Roles

1. Navigate to **Settings** → **User Management** → **Roles**
2. Click **Create Custom Role**
3. Enter role details:
   - Role Name
   - Description
   - Base Role (template)
4. Select permissions from checklist
5. Set limitations:
   - Data scope (own/team/all)
   - Time restrictions
   - IP restrictions
6. Save custom role
7. Assign to users

### 9.3 Permission Inheritance

```
Base Role
    │
    ├─→ Default Permissions
    │
    ├─→ Custom Permissions (Added)
    │
    └─→ Restricted Permissions (Removed)
```

---

## 10. Role Assignment {#role-assignment}

### 10.1 Assigning Roles to Users

**Super Admin Assignment:**
1. Go to **Users** → Select user
2. Click **Edit**
3. Select role from dropdown
4. Apply custom permissions (if needed)
5. Set effective date (optional)
6. Save changes
7. User receives notification

**Bulk Assignment:**
1. Select multiple users (checkbox)
2. Click **Bulk Actions** → **Change Role**
3. Select new role
4. Confirm changes
5. Users notified

### 10.2 Role Change Workflow

**Immediate Changes:**
- Role changes take effect immediately
- User's current session continues
- New permissions apply on next login/refresh

**Scheduled Changes:**
- Set future effective date
- Useful for promotions/transitions
- Automated notification before change
- Automatic rollback if needed

### 10.3 Multi-Role Users

Some users may have multiple roles:

**Example Scenarios:**
- Operator + Finance: Staff member handling operations and accounting
- Agent + Customer: Agent who also books for themselves
- Supplier + Agent: Supplier who also refers customers

**Configuration:**
1. Assign primary role
2. Add secondary role(s)
3. Set role priority
4. Define conflict resolution
5. User can switch between roles in interface

### 10.4 Role Audit Trail

All role changes are logged:

**Logged Information:**
- User ID and name
- Old role → New role
- Changed by (admin)
- Change timestamp
- Reason (optional)
- IP address
- Session information

**Access Audit Logs:**
- **Settings** → **Audit Logs** → **User Management**
- Filter by user, role, date range
- Export audit trail

---

## 11. Security Considerations

### 11.1 Principle of Least Privilege

- Assign minimum required permissions
- Regular permission audits (quarterly)
- Remove unused permissions
- Time-bound elevated access
- Require approval for sensitive operations

### 11.2 Role-Based Security

**Best Practices:**
1. **Regular Reviews**: Audit user roles monthly
2. **Separation of Duties**: No single user should have conflicting permissions
3. **Temporary Elevation**: Use temporary admin access for maintenance
4. **Session Management**: Timeout inactive sessions
5. **2FA Enforcement**: Require for admin roles
6. **IP Whitelisting**: Restrict admin access by IP
7. **Activity Monitoring**: Alert on suspicious role usage

### 11.3 Compliance

Role-based permissions help meet compliance requirements:

- **GDPR**: Data access control and audit trails
- **PCI-DSS**: Financial data protection
- **SOC 2**: Access control and monitoring
- **ISO 27001**: Information security management

---

## 12. Quick Reference

### Role Comparison Chart

| Feature | Super Admin | Operator | Agent | Customer | Supplier | Finance |
|---------|------------|----------|-------|----------|----------|---------|
| **Primary Dashboard** | System Admin | Operations | Agent Portal | Customer Portal | Supplier Portal | Finance |
| **Customer Access** | All | All | Own Only | Self Only | None | View Only |
| **Booking Management** | Full | Full | Limited | View Only | Confirm | Financial |
| **Financial Operations** | Full | Limited | Commission | Pay Only | View Payments | Full |
| **System Configuration** | Full | View | None | None | None | None |
| **Reporting** | All | Operational | Own Data | Own Data | Own Data | Financial |
| **User Management** | Full | Limited | Sub-users | None | None | None |

### Default Login Redirects

- **Super Admin** → `/dashboard` (Admin Dashboard)
- **Operator** → `/dashboard` (Operations Dashboard)
- **Agent** → `/agent/dashboard`
- **Customer** → `/customer/dashboard`
- **Supplier** → `/supplier/dashboard`
- **Finance** → `/finance/dashboard`

---

**End of Part 2: User Roles & Permissions Guide**

*← [Part 1: Getting Started](USER_MANUAL_01_GETTING_STARTED.md) | [Part 3: Authentication & Account Management](USER_MANUAL_03_AUTHENTICATION.md) →*
