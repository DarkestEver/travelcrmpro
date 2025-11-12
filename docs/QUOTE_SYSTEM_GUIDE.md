# Quote System - Complete Guide

## Overview
The Travel CRM supports two types of quote creation workflows:
1. **Email-Based Quotes** - Create quotes from matched email packages
2. **Manual Quotes** - Create quotes directly from itineraries

---

## 1. Email-Based Quote Workflow (Automated)

### How It Works
When a customer email arrives with travel requirements, the system:
1. Extracts travel details (destination, dates, travelers, budget)
2. Matches against available packages
3. Allows operator to create quotes from matched packages
4. Sends multiple quotes in a single email

### Creating Quotes from Email

#### Step-by-Step Process:
```
1. Email arrives → AI extracts data
2. Go to "Matches" tab → See matched packages with scores
3. Click "Add to Quote" on any package (Paris, Bali, etc.)
4. Modal opens with that package pre-selected
5. Adjust pricing:
   - Base Cost: USD 280 (from package)
   - Markup %: 15% (default, adjustable)
   - Total: USD 322
6. Optionally include PDF attachment
7. Click "Create Quote"
8. Quote created! Repeat for other packages
9. Go to "Quotes" tab to see all created quotes
```

#### API Endpoint:
```http
POST /api/v1/quotes/from-email
Authorization: Bearer {token}
Content-Type: application/json

{
  "emailId": "67137569bc51b82e755770a3",
  "matchedItineraryIds": ["673abc123def456789012345"], // Single itinerary
  "includePdfAttachment": false,
  "customPricing": {
    "baseCost": 280,
    "markup": {
      "percentage": 15,
      "amount": 42
    }
  }
}
```

#### Response:
```json
{
  "success": true,
  "message": "Quote created successfully from email",
  "data": {
    "quote": {
      "_id": "673xyz...",
      "quoteNumber": "Q2025-000001",
      "customerName": "Priya Rai",
      "customerEmail": "priya.rai@gmail.com",
      "destination": "Paris",
      "pricing": {
        "baseCost": 280,
        "markup": {
          "percentage": 15,
          "amount": 42
        },
        "totalPrice": 322,
        "currency": "USD"
      },
      "status": "draft",
      "source": "email",
      "validUntil": "2025-12-12T00:00:00.000Z"
    }
  }
}
```

---

## 2. Sending Multiple Quotes in Single Email

### The Problem This Solves
Customer asks: "I want honeymoon package in Paris, Bali, or Maldives"

**Before**: Had to send 3 separate emails with 3 different quotes
**Now**: Create 3 quotes → Send all in ONE email

### How to Send Multiple Quotes

#### Step-by-Step:
```
1. Create Quote #1 for Paris ($4,500)
2. Create Quote #2 for Bali ($2,800)
3. Create Quote #3 for Maldives ($4,000)
4. All quotes appear in "Quotes" tab
5. Click "Send All Quotes (3)" button
6. Modal opens showing all draft quotes
7. Select which quotes to include (checkboxes)
8. Click "Send X Quotes"
9. Customer receives ONE email with all 3 options!
```

#### API Endpoint:
```http
POST /api/v1/quotes/send-multiple
Authorization: Bearer {token}
Content-Type: application/json

{
  "quoteIds": [
    "673quote1...",
    "673quote2...",
    "673quote3..."
  ],
  "emailId": "67137569bc51b82e755770a3",
  "message": "Thank you for your inquiry! We have prepared the following package options for you."
}
```

#### Response:
```json
{
  "success": true,
  "message": "Successfully sent 3 quotes to priya.rai@gmail.com",
  "data": {
    "sentQuotes": 3,
    "customerEmail": "priya.rai@gmail.com",
    "quoteNumbers": ["Q2025-000001", "Q2025-000002", "Q2025-000003"]
  }
}
```

#### Email Preview:
```
Subject: Travel Packages - 3 Quotes for Your Trip

Dear Priya Rai,

Thank you for your inquiry! We have prepared the following package options for you:

┌─────────────────────────────────────────┐
│ Option 1: Romantic Paris Getaway        │
│ Quote Number: Q2025-000001              │
│                                         │
│ 📍 Destination: Paris                   │
│ 📅 Duration: 7 days                     │
│ 👥 Travelers: 2 Adults                  │
│ 📦 Package Type: Honeymoon              │
│ 🍽️ Meal Plan: Breakfast & Dinner       │
│                                         │
│ ✅ Inclusions:                          │
│ • Eiffel Tower visit                    │
│ • Seine River cruise                    │
│ • Louvre Museum tickets                 │
│                                         │
│ Total Price: USD 4,500                  │
│ Valid until: Dec 12, 2025               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Option 2: Bali Beach Paradise           │
│ Quote Number: Q2025-000002              │
│ ...                                     │
│ Total Price: USD 2,800                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Option 3: Maldives Luxury Resort        │
│ Quote Number: Q2025-000003              │
│ ...                                     │
│ Total Price: USD 4,000                  │
└─────────────────────────────────────────┘

Next Steps:
1. Review all the package options above
2. Reply to this email with your preferred option
3. We'll confirm availability and proceed with booking

If you have any questions, please don't hesitate to reach out!
```

---

## 3. Manual Quote Creation (Direct)

### Use Cases:
- Walk-in customer (no email)
- Phone inquiry
- Direct quote without email context
- Custom packages not from supplier

### How to Create Manual Quote

#### From Quotes Page:
```
1. Navigate to Quotes section
2. Click "Create New Quote" button
3. Fill in details:
   - Select Customer (dropdown)
   - Select Itinerary (dropdown)
   - Number of Travelers
   - Travel Dates
   - Pricing (base cost + markup)
   - Valid Until date
   - Notes & Terms
4. Click "Create Quote"
5. Quote saved with status: draft
6. Can send later via "Send Quote" button
```

#### API Endpoint:
```http
POST /api/v1/quotes
Authorization: Bearer {token}
Content-Type: application/json

{
  "itineraryId": "673abc123...",
  "customerId": "673customer123...",
  "agentId": "673agent123...",
  "numberOfTravelers": {
    "adults": 2,
    "children": 0
  },
  "travelDates": {
    "startDate": "2025-12-20",
    "endDate": "2025-12-27"
  },
  "pricing": {
    "baseCost": 3000,
    "markup": {
      "percentage": 15,
      "amount": 450
    },
    "totalPrice": 3450,
    "currency": "USD"
  },
  "validUntil": "2025-12-12",
  "notes": "Customer prefers sea-view room",
  "terms": "Full payment required 30 days before travel"
}
```

---

## Quote Status Lifecycle

```
draft → sent → viewed → accepted/rejected/expired
  ↑                         ↓
  └─────────── revised ←────┘
```

### Status Definitions:
- **draft**: Created but not sent
- **sent**: Emailed to customer
- **viewed**: Customer opened the quote
- **accepted**: Customer confirmed
- **rejected**: Customer declined
- **expired**: Valid until date passed
- **revised**: Modified after rejection

---

## Key Features

### ✅ 1 Itinerary = 1 Quote
- Each package gets its own separate quote
- Customer can compare options side-by-side
- Clear pricing for each option

### ✅ Multiple Quotes in One Email
- Bundle multiple quotes in single email
- Reduces email clutter
- Customer sees all options at once

### ✅ Auto-filled from Email Extraction
- Customer name, email, phone
- Destination and dates
- Number of travelers
- Budget and currency
- Package preferences

### ✅ Custom Pricing Control
- Adjust base cost
- Set markup percentage
- Auto-calculates total
- Multi-currency support

### ✅ PDF Attachments (Coming Soon)
- Detailed itinerary PDF per quote
- Can include/exclude per quote
- Downloaded on-demand

### ✅ Quote History in Email
- See all quotes created from email
- Track sent/viewed/responded status
- Timeline of quote interactions

---

## Frontend Components

### QuotesTab.jsx
**Location**: `frontend/src/components/emails/QuotesTab.jsx`

**Features**:
- Display quote history
- Create quote modal (auto-opens from "Add to Quote")
- Send multiple quotes modal
- Quote status badges
- Edit/View/Download actions

**State Management**:
```javascript
selectedItinerary (single object) // 1 itinerary per quote
includePdf (boolean)
customPricing { baseCost, markupPercentage }
selectedQuotesToSend (array) // For sending multiple
showCreateQuoteModal, showSendModal
creating, sending (loading states)
```

---

## API Summary

### Quote Endpoints:

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/quotes/from-email` | Create quote from email match | Operator, Admin |
| POST | `/quotes/send-multiple` | Send multiple quotes in one email | Operator, Admin |
| POST | `/quotes` | Create manual quote | Agent, Operator |
| GET | `/quotes` | List all quotes | Agent, Operator |
| GET | `/quotes/:id` | Get single quote | All authenticated |
| PUT | `/quotes/:id` | Update quote | Owner |
| POST | `/quotes/:id/send` | Send single quote | Owner |
| PATCH | `/quotes/:id/accept` | Accept quote | Owner |
| PATCH | `/quotes/:id/reject` | Reject quote | Owner |
| DELETE | `/quotes/:id` | Delete quote | Owner |

---

## Database Schema

### EmailLog.quotesGenerated[]
```javascript
{
  quoteId: ObjectId,
  quoteNumber: "Q2025-000001",
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired",
  totalPrice: 322,
  currency: "USD",
  includedItineraries: [{
    itineraryId: ObjectId,
    title: "Romantic Paris Getaway"
  }],
  includePdfAttachment: false,
  pdfUrl: "https://...",
  sentAt: Date,
  sentBy: ObjectId,
  viewedAt: Date,
  respondedAt: Date,
  response: "accepted" | "rejected" | "negotiating",
  createdAt: Date
}
```

---

## Testing the Workflow

### Test Scenario: Honeymoon Inquiry

1. **Email arrives**:
   ```
   From: priya.rai@gmail.com
   Subject: Honeymoon packages

   Hi! We're planning our honeymoon in December.
   Looking for Paris, Bali, or Maldives.
   Budget: $3000-5000 for 7 days.
   2 adults, prefer all-inclusive.
   ```

2. **AI extracts data**:
   - Destination: Paris, Bali, Maldives
   - Duration: 7 days
   - Travelers: 2 adults
   - Budget: $3000-5000
   - Package type: Honeymoon

3. **System matches packages**:
   - Romantic Paris Getaway - 80/100
   - Bali Beach Honeymoon - 85/100
   - Maldives Luxury - 75/100

4. **Operator creates quotes**:
   - Click "Add to Quote" on Paris → Create quote ($4,500)
   - Click "Add to Quote" on Bali → Create quote ($2,800)
   - Click "Add to Quote" on Maldives → Create quote ($4,000)

5. **Send all quotes**:
   - Click "Send All Quotes (3)"
   - Select all 3 quotes
   - Click "Send 3 Quotes"

6. **Customer receives**:
   - ONE email with 3 package options
   - Can compare prices and features
   - Replies with preferred option

---

## Troubleshooting

### Issue: "quoteNumber is required" error
**Cause**: Quote creation before quoteNumber generation
**Fix**: Ensured quoteNumber is generated before `Quote.create()`

### Issue: Multiple quotes not bundling
**Cause**: No endpoint to send multiple quotes
**Fix**: Created `POST /quotes/send-multiple` endpoint

### Issue: Modal showing all packages for selection
**Cause**: Old radio button implementation
**Fix**: Pre-select itinerary from "Add to Quote" click

---

## Next Steps

### Phase 1 (Current):
- ✅ Create quotes from email matches
- ✅ Send multiple quotes in one email
- ✅ Quote history in email detail
- ✅ Manual quote creation

### Phase 2 (Coming Soon):
- ⏳ PDF generation for itineraries
- ⏳ Email templates customization
- ⏳ Quote comparison view for customer
- ⏳ Quote analytics dashboard

### Phase 3 (Future):
- 🔮 Customer portal for quote viewing
- 🔮 Online payment integration
- 🔮 Digital signature for acceptance
- 🔮 Automated follow-up emails
