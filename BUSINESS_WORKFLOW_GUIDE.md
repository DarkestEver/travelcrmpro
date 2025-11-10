# 🏢 Travel CRM Business Workflow Guide

**Complete Guide to Roles, Itineraries, Pricing, and Commission Structure**

---

## 📊 Business Model Overview

```
Supplier → Creates Base Itinerary → Agent → Adds Markup → Customer
   ↓                                    ↓                      ↓
Sets Base Price              Earns Commission          Sees Final Price
   ↓                                    ↓                      ↓
                        Agency Owner Monitors Everything
```

---

## 👥 User Roles & Responsibilities

### 1. **Supplier** 🏨🚌🎡
**Who:** Hotels, Transport Companies, Activity Providers, Tour Operators

**Capabilities:**
- ✅ Create itinerary items (hotels, tours, activities, transfers)
- ✅ Set **base/wholesale prices**
- ✅ Manage inventory and availability
- ✅ Upload product images and descriptions
- ✅ View their own orders and bookings
- ✅ Track revenue from all agents
- ✅ Update pricing and availability

**Cannot:**
- ❌ See other suppliers' prices
- ❌ Access customer details directly
- ❌ Modify agent markups
- ❌ View agency commissions

**Example:**
```
Hotel Sunshine Palace creates:
- Deluxe Room: $100/night (base price)
- Suite: $200/night (base price)
- Transfers: $50 per trip
```

---

### 2. **Agent** 🎫
**Who:** Travel Agents working for the travel agency

**Capabilities:**
- ✅ Browse all supplier itineraries
- ✅ Add **markup/commission** to base prices
- ✅ Create custom packages for customers
- ✅ Combine multiple suppliers into one itinerary
- ✅ Send quotes to customers
- ✅ Manage customer bookings
- ✅ Track their own sales and commissions
- ✅ Communicate with customers

**Cannot:**
- ❌ See other agents' markups
- ❌ Modify supplier base prices
- ❌ Access agency owner financials
- ❌ Create new supplier accounts

**Example:**
```
Agent takes Hotel Sunshine Palace items:
- Deluxe Room: $100 (base) + $30 (markup) = $130 (customer price)
- Suite: $200 (base) + $50 (markup) = $250 (customer price)

Agent earns $30 + $50 = $80 commission per booking
```

---

### 3. **Customer** 🧳
**Who:** End travelers booking trips

**Capabilities:**
- ✅ View itineraries with **final prices** (base + markup)
- ✅ Request quotes
- ✅ Book travel packages
- ✅ Make payments
- ✅ Track bookings
- ✅ View invoices and receipts
- ✅ Leave reviews
- ✅ Communicate with assigned agent

**Cannot:**
- ❌ See supplier base prices
- ❌ See agent markups/commissions
- ❌ Access backend pricing breakdown
- ❌ Modify itineraries directly

**Example:**
```
Customer sees:
- 5-Day Bali Package: $1,250 per person
  (Doesn't see: $900 supplier cost + $350 agent markup)
```

---

### 4. **Agency Owner** (Super Admin/Operator) 👔
**Who:** Travel agency management/owner

**Capabilities:**
- ✅ See **ALL itineraries** from all suppliers
- ✅ Monitor **ALL agents** and their sales
- ✅ View **ALL customers** and bookings
- ✅ Track **ALL commissions** and revenue
- ✅ See complete pricing breakdown:
  - Supplier base price
  - Agent markup
  - Total customer price
  - Agency profit
- ✅ Manage users (create, edit, deactivate)
- ✅ Set agency-wide markup rules
- ✅ Generate financial reports
- ✅ Manage tenants (if multi-tenant)

**Example Dashboard View:**
```
Total Revenue This Month: $50,000
├─ Supplier Costs: $35,000
├─ Agent Commissions: $10,000
└─ Agency Profit: $5,000

Top Performing Agents:
1. Agent John: $15,000 sales, $3,000 commission
2. Agent Sarah: $12,000 sales, $2,500 commission

Top Suppliers:
1. Hotel Sunshine: 50 bookings, $20,000 revenue
2. Safari Tours: 30 bookings, $15,000 revenue
```

---

## 💰 Pricing Structure

### Data Model (Already Implemented)

```javascript
// Itinerary Pricing Schema
estimatedCost: {
  baseCost: 1000,           // ← Supplier's base price
  currency: "USD",
  
  breakdown: {
    accommodation: 500,      // Hotel base cost
    transport: 200,          // Transfer base cost
    activities: 200,         // Tour base cost
    meals: 100              // Meal base cost
  },
  
  markup: {
    percentage: 30,          // ← Agent's markup: 30%
    amount: 300             // ← Calculated: $1000 × 30% = $300
  },
  
  taxes: {
    percentage: 10,          // Tax: 10%
    amount: 130             // Tax on total: ($1000 + $300) × 10%
  },
  
  totalCost: 1430,          // ← Customer pays this
  profitMargin: 300         // ← Agent earns this
},

supplierReferences: [
  {
    supplierId: "...",
    serviceType: "Hotel",
    cost: 500,              // ← Supplier's cost for this service
    contactPerson: "John"
  },
  {
    supplierId: "...",
    serviceType: "Transport",
    cost: 200
  }
]
```

---

## 🔄 Complete Workflow

### Step 1: Supplier Creates Itinerary

```
Supplier: Hotel Sunshine Palace
Action: Creates "3-Day Beach Package"

Base Pricing:
├─ 2 Nights Accommodation: $200
├─ Airport Transfer: $50
├─ Breakfast: $30
└─ Beach Tour: $70
─────────────────────────────
Total Supplier Cost: $350
```

### Step 2: Agent Adds Markup

```
Agent: Sarah Thompson
Action: Adds markup to create customer package

Calculation:
├─ Supplier Base: $350
├─ Agent Markup (40%): $140
├─ Subtotal: $490
├─ Taxes (10%): $49
└─ Final Customer Price: $539
─────────────────────────────
Agent Commission: $140
```

### Step 3: Customer Books

```
Customer: John Doe
Action: Books "3-Day Beach Package"

Customer Sees:
├─ Package Name: "3-Day Bali Beach Getaway"
├─ Includes: Hotel, Transfer, Breakfast, Tour
├─ Price: $539 per person
└─ [Book Now Button]

Customer Does NOT See:
❌ Supplier cost: $350
❌ Agent markup: $140
❌ Breakdown details
```

### Step 4: Agency Owner Monitors

```
Agency Owner Dashboard:

Booking #12345:
├─ Customer: John Doe
├─ Agent: Sarah Thompson
├─ Package: 3-Day Beach Package
├─ Customer Paid: $539
├─ Supplier Cost: $350
├─ Agent Commission: $140
├─ Agency Admin Fee (15%): $21
├─ Agency Profit: $19
└─ Status: Confirmed

Monthly Summary:
├─ Total Sales: $50,000
├─ Supplier Costs: $35,000
├─ Agent Commissions: $10,000
├─ Admin Fees: $3,000
└─ Net Profit: $2,000
```

---

## 📱 Portal Access

### Supplier Portal: `/supplier`

**Dashboard Shows:**
- Total revenue from all agents
- Number of bookings
- Popular products
- Pending orders
- Revenue trends

**Can Manage:**
- Product catalog (hotels, tours, activities)
- Pricing and availability
- Images and descriptions
- Order fulfillment
- Performance analytics

---

### Agent Portal: `/agent`

**Dashboard Shows:**
- Personal sales and commissions
- Active customers
- Pending quotes
- Conversion rate
- Commission trends

**Can Manage:**
- Customer inquiries
- Create itineraries from supplier products
- Add custom markup
- Send quotes
- Manage bookings
- Customer communications

---

### Customer Portal: `/customer`

**Dashboard Shows:**
- Active bookings
- Past trips
- Upcoming trips
- Payment history
- Documents (tickets, vouchers)

**Can Access:**
- Browse packages
- Request quotes
- Make bookings
- Make payments
- Track bookings
- Contact agent
- Download documents

---

### Agency Owner Portal: `/dashboard`

**Dashboard Shows:**
- **Complete Financial Overview:**
  - Total revenue
  - Supplier costs
  - Agent commissions
  - Net profit
  
- **All Suppliers:**
  - Active suppliers
  - Total inventory
  - Revenue per supplier
  
- **All Agents:**
  - Active agents
  - Sales performance
  - Commission earned
  
- **All Customers:**
  - Total customers
  - Active bookings
  - Customer lifetime value

**Can Manage:**
- User accounts (all roles)
- Pricing rules and policies
- Commission structures
- Financial reports
- System settings

---

## 💼 Commission Structure Examples

### Example 1: Fixed Markup

```
Supplier Base: $1,000
Agent Fixed Markup: $300 (30%)
─────────────────────────
Customer Price: $1,300
Agent Commission: $300
```

### Example 2: Tiered Markup

```
Agent Markup Rules:
- Budget packages (<$500): 20% markup
- Standard packages ($500-$2000): 30% markup
- Luxury packages (>$2000): 40% markup

Example:
Supplier Base: $3,000 (Luxury)
Agent Markup: $1,200 (40%)
─────────────────────────
Customer Price: $4,200
Agent Commission: $1,200
```

### Example 3: Agency Split

```
Customer Pays: $5,000
Supplier Cost: $3,500
Total Markup: $1,500

Split:
├─ Agent Commission (80%): $1,200
└─ Agency Admin Fee (20%): $300
```

---

## 🔐 Data Visibility Matrix

| Data Point | Supplier | Agent | Customer | Agency Owner |
|------------|----------|-------|----------|--------------|
| Supplier Base Price | ✅ Own | ✅ All | ❌ | ✅ All |
| Agent Markup | ❌ | ✅ Own | ❌ | ✅ All |
| Customer Final Price | ✅ | ✅ | ✅ | ✅ |
| Agent Commission | ❌ | ✅ Own | ❌ | ✅ All |
| Total Revenue | ✅ Own | ✅ Own | ❌ | ✅ All |
| Customer Contact Details | ❌ | ✅ Assigned | ✅ Own | ✅ All |
| Booking Details | ✅ Own | ✅ Own | ✅ Own | ✅ All |
| Financial Reports | ❌ | ⚠️ Partial | ❌ | ✅ Complete |

**Legend:**
- ✅ Full Access
- ⚠️ Limited Access
- ❌ No Access
- "Own" = Only their own data
- "All" = All data across system

---

## 📊 Reports Available by Role

### Supplier Reports
- Sales by product
- Revenue trends
- Popular destinations
- Agent performance (which agents sell most)
- Seasonal demand

### Agent Reports
- Personal sales
- Commission earned
- Customer conversion rate
- Average deal size
- Top-selling packages
- Pipeline value

### Customer Reports
- Booking history
- Payment history
- Upcoming trips
- Loyalty points/credits
- Spending summary

### Agency Owner Reports
- **Financial Dashboard:**
  - Total revenue
  - Supplier costs
  - Agent commissions
  - Net profit margins
  - Cash flow
  
- **Sales Analytics:**
  - Revenue by destination
  - Revenue by product type
  - Revenue by agent
  - Revenue by supplier
  - Sales trends
  
- **Performance Metrics:**
  - Agent leaderboard
  - Supplier performance
  - Customer acquisition cost
  - Customer lifetime value
  - Conversion rates

---

## 🎯 Key Business Rules

### 1. **Itinerary Creation**
- ✅ Suppliers create base itineraries
- ✅ Agents can clone and customize
- ✅ Agents add markup before showing to customers
- ❌ Customers cannot see original supplier prices

### 2. **Pricing Transparency**
- ✅ Customers see final price only
- ✅ Agents see base + markup breakdown
- ✅ Agency owners see complete breakdown
- ❌ Suppliers cannot see agent markups

### 3. **Commission Payment**
- ✅ Customer pays agent (full price)
- ✅ Agent pays supplier (base price)
- ✅ Agent keeps markup as commission
- ✅ Optional: Agency takes admin fee from markup

### 4. **Booking Flow**
```
Customer Books → Agent Confirms → Supplier Fulfills
      ↓               ↓                  ↓
  Pays Full      Gets Commission    Gets Base Price
```

---

## 🚀 Implementation Status

### Already Implemented ✅

1. **Data Models:**
   - ✅ User roles (super_admin, operator, agent, supplier, customer)
   - ✅ Itinerary schema with pricing structure
   - ✅ Markup and commission fields
   - ✅ Supplier references in itineraries
   - ✅ Multi-tenant support

2. **Authentication:**
   - ✅ Role-based access control
   - ✅ Separate portals for each role
   - ✅ JWT token authentication
   - ✅ Permission middleware

3. **Pricing Structure:**
   - ✅ `baseCost` - Supplier base price
   - ✅ `markup` - Agent commission
   - ✅ `totalCost` - Customer final price
   - ✅ `profitMargin` - Calculated commission
   - ✅ `supplierReferences` - Link to suppliers

---

## 📋 Next Steps (If Not Yet Implemented)

### Frontend Features Needed:

1. **Supplier Portal:**
   - [ ] Product catalog management UI
   - [ ] Pricing management
   - [ ] Order dashboard
   - [ ] Revenue analytics

2. **Agent Portal:**
   - [ ] Browse supplier inventory
   - [ ] Markup calculator tool
   - [ ] Quote builder
   - [ ] Customer management
   - [ ] Commission tracker

3. **Customer Portal:**
   - [ ] Package browsing (shows final prices)
   - [ ] Quote request form
   - [ ] Booking checkout
   - [ ] Payment integration
   - [ ] Booking history

4. **Agency Owner Portal:**
   - [ ] Complete financial dashboard
   - [ ] All suppliers view
   - [ ] All agents view with performance
   - [ ] All customers view
   - [ ] Commission reports
   - [ ] Revenue breakdown reports

---

## 🔍 Example Database Queries

### For Supplier: "Show my total revenue"
```javascript
// Get all itineraries using this supplier's services
Itinerary.find({
  'supplierReferences.supplierId': supplierId,
  status: 'confirmed'
}).populate('supplierReferences');

// Calculate: Sum of all supplierReferences.cost where supplierId matches
```

### For Agent: "Show my commission"
```javascript
// Get all itineraries created by this agent
Itinerary.find({
  createdBy: agentId,
  status: 'confirmed'
});

// Calculate: Sum of all estimatedCost.profitMargin
```

### For Agency Owner: "Show total revenue breakdown"
```javascript
// Get ALL confirmed itineraries
Itinerary.find({ status: 'confirmed' });

// Calculate:
// - Total customer payments: Sum(totalCost)
// - Total supplier costs: Sum(supplierReferences.cost)
// - Total agent commissions: Sum(profitMargin)
// - Net profit: customer payments - supplier costs - agent commissions
```

---

## 📝 Summary

Your Travel CRM follows a **B2B2C model**:

1. **Suppliers (B2B)** provide inventory at wholesale prices
2. **Agents (B2C)** add markup and sell to customers
3. **Customers (C)** pay final price and book trips
4. **Agency Owner** orchestrates and monitors everything

**Key Value Propositions:**
- **For Suppliers:** Access to multiple agents, increased bookings
- **For Agents:** Earn commission, manage customers, build packages
- **For Customers:** Personalized service, custom packages, easy booking
- **For Agency:** Revenue from admin fees, scalable business model

---

**File:** `BUSINESS_WORKFLOW_GUIDE.md`  
**Created:** November 9, 2025  
**Purpose:** Complete business model and role documentation
