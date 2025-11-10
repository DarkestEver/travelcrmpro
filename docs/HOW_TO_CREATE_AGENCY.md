# 🏢 How to Create a New Agency (Agent)

**Travel CRM System - Agent Creation Guide**  
**Date:** November 9, 2025

---

## 📋 Table of Contents

1. [Who Can Create an Agent?](#who-can-create-an-agent)
2. [Two Ways to Create an Agent](#two-ways-to-create-an-agent)
3. [Self-Registration Process](#self-registration-process)
4. [Admin Creation Process](#admin-creation-process)
5. [Agent Approval Workflow](#agent-approval-workflow)
6. [API Endpoints](#api-endpoints)
7. [Frontend Instructions](#frontend-instructions)
8. [Step-by-Step Guide](#step-by-step-guide)

---

## 👥 Who Can Create an Agent?

### Method 1: Self-Registration
**Who:** Anyone (Public)  
**Result:** Agent profile created with `pending` status  
**Requires:** Admin approval before activation

### Method 2: Admin Creation
**Who:** Super Admin or Operator  
**Result:** Agent profile created with `active` status  
**Requires:** No approval needed (instant activation)

---

## 🔄 Two Ways to Create an Agent

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  METHOD 1: Self-Registration (Public)                   │
│  ─────────────────────────────────                      │
│  1. User visits registration page                       │
│  2. Fills out agent registration form                   │
│  3. System creates user + agent profile                 │
│  4. Status: PENDING (needs approval)                    │
│  5. Admin reviews and approves                          │
│  6. Status: ACTIVE                                      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  METHOD 2: Admin Creation (Private)                     │
│  ─────────────────────────────                          │
│  1. Admin logs into system                              │
│  2. Goes to Agents page                                 │
│  3. Clicks "Add New Agent"                              │
│  4. Fills out agent form                                │
│  5. Status: ACTIVE (instant)                            │
│  6. No approval needed                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🆕 Self-Registration Process

### Step 1: Access Registration Page

**URL:** `http://localhost:5173/register`

### Step 2: Fill Registration Form

**Required Information:**
```javascript
{
  "name": "John Doe",                    // User's full name
  "email": "john@agency.com",            // Email (must be unique)
  "password": "SecurePass@123",          // Strong password
  "role": "agent",                       // Must be "agent"
  "phone": "+1234567890",                // Contact number
  
  // Agent-specific fields (optional)
  "agencyName": "John's Travel Agency",
  "contactPerson": "John Doe",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "zipCode": "10001"
  }
}
```

### Step 3: System Creates Profile

**What Happens:**
1. ✅ User account created in database
2. ✅ Agent profile created with `status: "pending"`
3. ✅ Credit limit set to `0`
4. ✅ Tier set to `"standard"`
5. ✅ Email sent to admins for approval
6. ⏳ User cannot login until approved

### Step 4: Wait for Approval

**User receives message:**
> "Registration successful! Your account is pending approval. You will receive an email once approved."

**Admin must approve before agent can login.**

---

## 👨‍💼 Admin Creation Process

### Who Can Create: Super Admin or Operator

### Step 1: Login as Admin

**Credentials:**
```
Email:    admin@travelcrm.com
Password: Admin@123
URL:      http://localhost:5173/login
```

### Step 2: Navigate to Agents Page

**Path:** Dashboard → Agents  
**URL:** `http://localhost:5173/agents`

### Step 3: Click "Add New Agent"

Button in top-right corner with "+" icon

### Step 4: Fill Agent Creation Form

**Required Fields:**

```javascript
{
  // User Information (if creating new user)
  "userId": "existing_user_id",          // OR create new user
  
  // Agency Information
  "agencyName": "ABC Travel Agency",     // Required
  "contactPerson": "Jane Smith",         // Required
  "email": "contact@abctravel.com",      // Required, unique
  "phone": "+1234567890",                // Required
  
  // Address
  "address": {
    "street": "456 Business Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "zipCode": "90001"
  },
  
  // Business Settings
  "creditLimit": 50000,                  // Default: 0
  "tier": "premium",                     // standard, premium, elite
  
  // Commission Rules
  "commissionRules": {
    "type": "percentage",
    "value": 10,
    "minAmount": 0,
    "maxAmount": null
  },
  
  // Documents (Optional)
  "documents": {
    "businessLicense": "license_url",
    "taxId": "tax_id_url",
    "contract": "contract_url"
  }
}
```

### Step 5: Submit Form

**What Happens:**
1. ✅ Agent profile created immediately
2. ✅ Status set to `"active"` (no approval needed)
3. ✅ Credit limit and tier set as specified
4. ✅ Agent can login immediately
5. ✅ Welcome email sent to agent

---

## ✅ Agent Approval Workflow

### For Self-Registered Agents

### Step 1: Admin Reviews Pending Agents

**Path:** Dashboard → Agents → Filter by "Pending"

### Step 2: Click "Approve" Button

Admin can view agent details and approve/reject

### Step 3: Set Credit Limit & Tier

**Approval Form:**
```javascript
{
  "creditLimit": 25000,              // Set credit limit
  "tier": "standard"                 // Set tier level
}
```

### Step 4: Confirm Approval

**What Happens:**
1. ✅ Agent status changed to `"active"`
2. ✅ Credit limit and tier assigned
3. ✅ Approval email sent to agent
4. ✅ Agent can now login
5. ✅ Agent appears in active agents list

### Agent Status Flow

```
Registration → pending → (Admin Approves) → active → (Agent can login)
                ↓
         (Admin Rejects) → rejected → (Cannot login)
```

---

## 🔌 API Endpoints

### 1. Self-Registration (Public)

```
POST /api/v1/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@agency.com",
  "password": "SecurePass@123",
  "role": "agent",
  "phone": "+1234567890",
  "agencyName": "John's Travel Agency"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Your account is pending approval.",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@agency.com",
      "role": "agent",
      "status": "pending"
    }
  }
}
```

---

### 2. Create Agent (Admin Only)

```
POST /api/v1/agents
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "existing_user_id",
  "agencyName": "ABC Travel Agency",
  "contactPerson": "Jane Smith",
  "email": "contact@abctravel.com",
  "phone": "+1234567890",
  "address": {
    "street": "456 Business Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "zipCode": "90001"
  },
  "creditLimit": 50000,
  "tier": "premium",
  "commissionRules": {
    "type": "percentage",
    "value": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent profile created successfully",
  "data": {
    "agent": {
      "_id": "agent_id",
      "agencyName": "ABC Travel Agency",
      "status": "active",
      "creditLimit": 50000,
      "tier": "premium"
    }
  }
}
```

---

### 3. Get All Agents (Admin Only)

```
GET /api/v1/agents?page=1&limit=10&status=pending
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (pending, active, suspended)
- `tier` - Filter by tier (standard, premium, elite)
- `search` - Search by name, email, agency

---

### 4. Approve Agent (Admin Only)

```
PATCH /api/v1/agents/:id/approve
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "creditLimit": 25000,
  "tier": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent approved successfully",
  "data": {
    "agent": {
      "_id": "agent_id",
      "status": "active",
      "creditLimit": 25000,
      "tier": "standard"
    }
  }
}
```

---

### 5. Suspend Agent (Admin Only)

```
PATCH /api/v1/agents/:id/suspend
Authorization: Bearer {admin_token}
```

---

### 6. Reactivate Agent (Admin Only)

```
PATCH /api/v1/agents/:id/reactivate
Authorization: Bearer {admin_token}
```

---

## 🖥️ Frontend Instructions

### For Self-Registration

1. **Open Registration Page:**
   ```
   http://localhost:5173/register
   ```

2. **Fill Registration Form:**
   - Enter full name
   - Enter email address
   - Create strong password
   - Select role: "Agent"
   - Enter phone number
   - Enter agency name (optional)

3. **Click "Register" Button**

4. **See Confirmation Message:**
   > "Registration successful! Your account is pending approval."

5. **Wait for Admin Approval Email**

---

### For Admin Creation

1. **Login as Admin:**
   ```
   URL:      http://localhost:5173/login
   Email:    admin@travelcrm.com
   Password: Admin@123
   ```

2. **Navigate to Agents:**
   - Click "Agents" in sidebar
   - Or go to: `http://localhost:5173/agents`

3. **Click "Add New Agent" Button:**
   - Top-right corner
   - Plus (+) icon

4. **Fill Agent Creation Form:**
   - Agency Name *
   - Contact Person *
   - Email *
   - Phone *
   - Address
   - Credit Limit
   - Tier (Standard/Premium/Elite)
   - Commission Rules

5. **Click "Save" or "Create Agent"**

6. **Agent is Created with Active Status**

---

### For Approving Pending Agents

1. **Login as Admin**

2. **Go to Agents Page**

3. **Filter by "Pending" Status:**
   - Use status dropdown
   - Select "Pending"

4. **Click "Approve" Button on Agent Row**

5. **Set Credit Limit and Tier:**
   - Enter credit limit (e.g., 25000)
   - Select tier (Standard/Premium/Elite)

6. **Click "Confirm Approval"**

7. **Agent Status Changes to "Active"**

---

## 📝 Step-by-Step Guide

### Scenario 1: New Agent Self-Registers

```
Step 1: Agent Visits Registration Page
└─→ http://localhost:5173/register

Step 2: Agent Fills Form
├─→ Name: John Doe
├─→ Email: john@agency.com
├─→ Password: SecurePass@123
├─→ Role: Agent
├─→ Phone: +1234567890
└─→ Agency: John's Travel Agency

Step 3: Agent Submits Form
└─→ Account created with status "pending"

Step 4: Admin Receives Notification
└─→ Email: "New agent pending approval"

Step 5: Admin Logs In
└─→ http://localhost:5173/login

Step 6: Admin Goes to Agents Page
└─→ Filters by "Pending"

Step 7: Admin Clicks "Approve"
├─→ Sets credit limit: 25,000
└─→ Sets tier: Standard

Step 8: System Updates Agent
├─→ Status: active
├─→ Sends approval email
└─→ Agent can now login

Step 9: Agent Logs In
└─→ http://localhost:5173/login (with credentials)

Step 10: Agent Accesses Agent Portal
└─→ Redirected to /agent/dashboard
```

---

### Scenario 2: Admin Creates Agent Directly

```
Step 1: Admin Logs In
└─→ http://localhost:5173/login

Step 2: Admin Goes to Agents Page
└─→ Dashboard → Agents

Step 3: Admin Clicks "Add New Agent"
└─→ Opens agent creation form

Step 4: Admin Fills Form
├─→ Agency Name: ABC Travel
├─→ Contact: Jane Smith
├─→ Email: jane@abctravel.com
├─→ Phone: +1234567890
├─→ Credit Limit: 50,000
└─→ Tier: Premium

Step 5: Admin Clicks "Save"
└─→ Agent created with status "active"

Step 6: System Sends Welcome Email
└─→ Email sent to jane@abctravel.com

Step 7: Agent Can Login Immediately
└─→ No approval needed
```

---

## 🎯 Agent Tiers Explained

### Standard Tier
- **Credit Limit:** Up to $25,000
- **Commission:** 8-10%
- **Support:** Email support
- **Access:** Basic features

### Premium Tier
- **Credit Limit:** Up to $100,000
- **Commission:** 10-12%
- **Support:** Priority email + phone
- **Access:** Advanced features

### Elite Tier
- **Credit Limit:** Unlimited
- **Commission:** 12-15%
- **Support:** Dedicated account manager
- **Access:** All features + custom tools

---

## 🔒 Permissions & Access

### What Agents Can Do:
- ✅ Create customers
- ✅ Create quotes
- ✅ Create bookings
- ✅ View their own dashboard
- ✅ Track commissions
- ✅ Manage sub-users
- ✅ View payments
- ✅ Generate reports

### What Agents Cannot Do:
- ❌ Create other agents
- ❌ Approve agents
- ❌ Access admin dashboard
- ❌ View other agents' data
- ❌ Modify system settings
- ❌ Delete their own account

---

## ❓ FAQ

### Q: Can an agent create their own account?
**A:** Yes, through self-registration at `/register`. However, it requires admin approval.

### Q: Can an agent login before approval?
**A:** No, self-registered agents must wait for admin approval.

### Q: Who can approve agents?
**A:** Super Admin and Operators can approve pending agents.

### Q: Can an admin create an agent without approval?
**A:** Yes, admin-created agents are automatically active.

### Q: What happens if registration is rejected?
**A:** The user cannot login and must contact support.

### Q: Can an agent's credit limit be changed later?
**A:** Yes, admins can update credit limits anytime.

### Q: How many agents can be created?
**A:** Unlimited (based on your multi-tenant setup).

---

## 📞 Support

### Need Help Creating an Agent?

**For Admins:**
- Check the Agents page for pending approvals
- Use search to find existing agents
- Review agent performance before approval

**For Self-Registering Agents:**
- Contact admin for approval status
- Check email for approval notification
- Ensure all required fields are filled

---

## ✅ Checklist

### For Self-Registration:
- [ ] Visit registration page
- [ ] Fill all required fields
- [ ] Use strong password
- [ ] Select "Agent" role
- [ ] Submit form
- [ ] Wait for admin approval email
- [ ] Login after approval

### For Admin Creation:
- [ ] Login as admin
- [ ] Navigate to Agents page
- [ ] Click "Add New Agent"
- [ ] Fill agent information
- [ ] Set credit limit and tier
- [ ] Save agent
- [ ] Agent is immediately active

### For Approval:
- [ ] Login as admin
- [ ] Go to Agents page
- [ ] Filter by "Pending"
- [ ] Review agent details
- [ ] Click "Approve"
- [ ] Set credit limit and tier
- [ ] Confirm approval
- [ ] Agent receives email

---

**Document Version:** 1.0.0  
**Last Updated:** November 9, 2025  
**Status:** ✅ Complete
