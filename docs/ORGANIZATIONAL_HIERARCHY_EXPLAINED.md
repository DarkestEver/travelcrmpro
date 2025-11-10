# 🏢 Travel CRM - Organizational Hierarchy Explained

## Current System Structure

### ❌ What You Expected vs ✅ What Actually Exists

You mentioned this flow:
```
Tenant Manager → Super Admin → Operator/Agents → Customers
```

But the actual system is:
```
Platform Super Admin → Tenants (Organizations) → Operators/Agents → Customers
```

---

## 🎯 The Actual Hierarchy

### Level 1: Platform Super Admin (System-Wide)
**Role:** `super_admin`  
**Access:** Entire platform across ALL tenants  
**Login:** `admin@travelcrm.com` / `Admin@123`

**Can Do:**
- ✅ Manage ALL tenants (create, view, edit, suspend, delete)
- ✅ View all organizations using the platform
- ✅ Manage subscriptions for any tenant
- ✅ Access tenant management UI
- ✅ View audit logs across all tenants
- ✅ System-wide analytics

**IMPORTANT:** This is NOT a tenant owner. This is the platform administrator who manages the SaaS platform itself.

---

### Level 2: Tenant (Organization/Agency)
**What it is:** A separate organization/travel agency using the CRM  
**Example:** "Acme Travel Agency", "Global Tours", "Paradise Travels"

**Each tenant has:**
- 🏢 Unique subdomain: `acme-travel.travelcrm.com`
- 👤 Owner (the person who owns this agency)
- 📦 Own database (isolated data)
- 💳 Own subscription plan (Free/Basic/Professional/Enterprise)
- ⚙️ Own settings (currency, timezone, branding)

---

### Level 3: Tenant Owner/Operator (Within One Tenant)
**Role:** `operator`  
**Access:** Only THEIR tenant's data  

**Can Do:**
- ✅ Manage agents within their agency
- ✅ Manage customers
- ✅ View bookings, quotes, itineraries
- ✅ Manage suppliers
- ✅ View analytics for their agency
- ❌ CANNOT see other tenants' data
- ❌ CANNOT manage tenants (not a super admin)

**This is the "Tenant Manager" you mentioned** - they manage their own travel agency.

---

### Level 4: Agent (Employee)
**Role:** `agent`  
**Access:** Limited to their assigned customers and bookings

**Can Do:**
- ✅ Manage their own customers
- ✅ Create quotes and itineraries
- ✅ Make bookings
- ✅ View their commissions
- ❌ CANNOT manage other agents
- ❌ CANNOT see company-wide analytics

---

### Level 5: Customer (End User)
**Role:** `customer` (separate model)  
**Access:** Customer portal only

**Can Do:**
- ✅ View their own bookings
- ✅ Request quotes
- ✅ Make payments
- ✅ View invoices
- ❌ CANNOT access agent/operator dashboard

---

## 🔄 The Correct Flow Explained

### Scenario: Setting Up a New Travel Agency

#### Step 1: Platform Super Admin Creates Tenant
```
Platform Super Admin (admin@travelcrm.com)
    ↓
Creates new tenant: "Acme Travel Agency"
    ↓
Subdomain: acme-travel.travelcrm.com
    ↓
Creates Owner Account:
    - Name: John Doe
    - Email: john@acme.com
    - Role: operator (tenant owner)
    - Plan: Professional
```

#### Step 2: Tenant Owner Logs In
```
John Doe logs in → john@acme.com
    ↓
Sees his dashboard (only Acme Travel Agency data)
    ↓
Can manage:
    - Agents (employees)
    - Customers
    - Bookings
    - Suppliers
```

#### Step 3: Tenant Owner Adds Agents
```
John Doe creates agent accounts:
    ↓
Agent 1: sarah@acme.com (role: agent)
Agent 2: mike@acme.com (role: agent)
    ↓
Agents log in and manage their customers
```

#### Step 4: Agents Work with Customers
```
Sarah (agent) adds customer:
    ↓
Customer: Alice (alice@customer.com)
    ↓
Alice logs into customer portal
    ↓
Views bookings, requests quotes, makes payments
```

---

## 🎨 Visual Hierarchy

```
┌─────────────────────────────────────────┐
│   PLATFORM SUPER ADMIN (System Level)  │
│   admin@travelcrm.com                   │
│   Manages ALL tenants                   │
└─────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐   ┌───▼────┐   ┌───▼────┐
│Tenant 1│   │Tenant 2│   │Tenant 3│
│Acme    │   │Global  │   │Paradise│
│Travel  │   │Tours   │   │Travels │
└───┬────┘   └───┬────┘   └───┬────┘
    │            │            │
┌───▼──────────┐ │            │
│Owner/Operator│ │            │
│john@acme.com │ │            │
│(role:operator)│ │           │
└───┬──────────┘ │            │
    │            │            │
┌───▼───────┬────▼──────┐     │
│Agent 1    │Agent 2    │     │
│sarah@acme │mike@acme  │     │
│(role:agent)│(role:agent)│    │
└───┬───────┴───┬───────┘     │
    │           │             │
┌───▼──────┬────▼─────────────▼──┐
│Customer 1│Customer 2│Customer 3│
│Alice     │Bob       │Carol     │
│(portal)  │(portal)  │(portal)  │
└──────────┴──────────┴──────────┘
```

---

## 🔑 Key Differences

### Super Admin (Platform Level)
- **Purpose:** Manage the SaaS platform itself
- **Scope:** ALL tenants
- **UI:** Has "Tenant Management" menu
- **Example:** You (the platform owner)

### Tenant Owner/Operator (Organization Level)
- **Purpose:** Manage ONE travel agency
- **Scope:** Only their tenant's data
- **UI:** No "Tenant Management" menu
- **Example:** John (owns Acme Travel Agency)

### Agent (Employee Level)
- **Purpose:** Sell travel packages
- **Scope:** Their assigned customers only
- **UI:** Agent portal with limited features
- **Example:** Sarah (works for Acme Travel)

---

## 🚨 What's Missing (What You Expected)

You expected a "**Tenant Manager**" role, but the system uses "**Operator**" instead. 

### Current System:
```
super_admin → operator → agent → customer
```

### What You Might Want:
```
super_admin → tenant_admin → operator → agent → customer
```

Where:
- `tenant_admin` = Full control over one tenant (can manage subscription, settings)
- `operator` = Day-to-day operations manager
- `agent` = Sales person

---

## 📋 Current Role Definitions

```javascript
// From User model
role: {
  type: String,
  enum: ['super_admin', 'operator', 'agent', 'supplier', 'auditor'],
  default: 'agent',
}
```

### Roles Explained:

1. **`super_admin`** - Platform administrator (manages all tenants)
2. **`operator`** - Tenant owner/manager (manages one agency)
3. **`agent`** - Travel agent (sales person)
4. **`supplier`** - Service provider (hotels, airlines)
5. **`auditor`** - Read-only access for compliance

---

## ✅ What You Can Do Right Now

### As Platform Super Admin:
1. Login: `admin@travelcrm.com` / `Admin@123`
2. Go to "Tenant Management"
3. Create a new tenant (this is like creating a new travel agency)
4. Each tenant gets an owner account with `operator` role

### As Tenant Owner (Operator):
1. Login with the owner credentials you set
2. You'll see your agency's dashboard
3. Create agent accounts
4. Agents can then manage customers

### The Flow in Practice:

```
1. YOU (super_admin) create "Acme Travel Agency" tenant
   └─> Owner: john@acme.com (role: operator)

2. John logs in → sees ONLY Acme Travel data
   └─> Creates agents: sarah@acme.com, mike@acme.com

3. Sarah logs in → sees ONLY her assigned customers
   └─> Adds customers, creates bookings

4. Customers log into customer portal
   └─> View their bookings, make payments
```

---

## 🔧 Do You Need a Different Structure?

If you want a different hierarchy like:
```
super_admin → tenant_admin → operator → agent → customer
```

I can help you:
1. Add a new `tenant_admin` role
2. Create different permissions
3. Update the UI to show different menus per role

**Just let me know what structure you prefer!**

---

## 📞 Quick Reference

| Role | Purpose | Access Level | Example |
|------|---------|--------------|---------|
| `super_admin` | Platform owner | ALL tenants | You (admin@travelcrm.com) |
| `operator` | Agency owner | ONE tenant | John (john@acme.com) |
| `agent` | Sales person | Assigned customers | Sarah (sarah@acme.com) |
| `customer` | End user | Own bookings only | Alice (alice@customer.com) |

---

## 💡 Summary

**You said:** "I don't see the Tenant Manager → Super Admin → Operator/Agents → Customer flow"

**The reality is:**
- There is NO "Tenant Manager" role (it's called `operator`)
- `super_admin` is ABOVE tenants (not inside them)
- `operator` IS the "Tenant Manager" (manages one agency)
- The flow is: `super_admin` → `tenant` → `operator` → `agent` → `customer`

**To access Tenant Management:**
- You need `super_admin` role
- This manages the PLATFORM, not a single agency
- Each tenant you create gets an `operator` who manages that agency

Does this make sense? Would you like me to adjust the role structure to match your expectations?
