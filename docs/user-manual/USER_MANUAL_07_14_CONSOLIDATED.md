# Travel CRM Pro - User Manual
## Part 7-14: Remaining Guides (Consolidated)

**Version**: 2.1.0  
**Last Updated**: November 15, 2025

---

# Part 7: Supplier Management Guide

## Supplier Portal Dashboard
- View all bookings and confirmations
- Manage inventory (hotels, tours, vehicles)
- Upload and manage rate sheets
- Track payment status
- Performance analytics

## Inventory Management
**Adding Inventory Items**: Hotels → Add hotel with rooms, rates, availability calendar
**Bulk Upload**: CSV import for multiple items
**Rate Sheets**: Seasonal pricing, contract rates, special offers
**Availability Calendar**: Block dates, set capacity, manage blackout dates

## Supplier Bookings
**Receive Booking Requests**: Email + portal notification
**Confirm/Reject**: Quick action buttons with notes
**Upload Vouchers**: Attach confirmation documents
**Track Status**: Pending → Confirmed → Completed → Paid

---

# Part 8: Email Automation Guide

## Email Account Setup
**IMAP Configuration**: Gmail, Outlook, Exchange support
**SMTP Settings**: Outbound email configuration  
**Test Connection**: Verify before activation
**Multiple Accounts**: Separate inboxes for departments

## AI Processing
**Enable AI**: Settings → Email Automation → Enable AI Processing
**Confidence Threshold**: Set minimum confidence (e.g., 80%)
**Auto-Process**: High confidence emails auto-convert to quotes
**Manual Review**: Low confidence items to review queue

## Review Queue Workflow
1. Check **Pending Review** inbox
2. View AI-extracted data (customer, dates, destination, travelers)
3. Verify and correct any errors
4. **Actions**: Create Quote / Create Booking / Reply / Assign Agent
5. Mark as Processed

## Email Categories
- Booking Requests → Create itinerary
- Quote Follow-ups → Update existing quote
- Cancellations → Process refund
- General Inquiries → Reply with template
- Spam → Auto-filter

---

# Part 9: Analytics & Forecasting Guide

## Analytics Dashboard
**Key Metrics**: Total bookings, revenue, conversion rate, average booking value
**Visual Charts**: Revenue trend, booking pipeline, destination popularity
**Filters**: By date range, agent, destination, customer type

## Demand Forecasting
**Historical Analysis**: Past 12-24 months data
**Seasonal Patterns**: Peak vs off-peak identification
**Predictive Insights**: AI-powered demand predictions
**Recommendations**: Optimal pricing, inventory allocation

## Custom Reports
**Report Builder**: Select dimensions (date, agent, destination) + metrics (revenue, bookings, margin)
**Save Reports**: Reuse custom report configurations
**Schedule**: Auto-generate and email reports daily/weekly/monthly
**Export**: PDF, Excel, CSV formats

---

# Part 10: System Administration Guide

## Inventory Synchronization
**Configure Sync**: Connect to supplier APIs (Expedia, Booking.com, etc.)
**Sync Schedule**: Real-time, hourly, or daily
**Conflict Resolution**: Prioritize rules (latest, supplier, manual)
**Error Handling**: Alert on sync failures, retry logic

## Performance Monitoring
**Metrics Dashboard**: CPU, memory, disk usage, database connections
**Slow Queries**: Identify and optimize bottlenecks
**API Response Times**: Monitor endpoint performance
**Cache Statistics**: Hit rate, memory usage

## System Health
**Service Status**: All services green/yellow/red indicator
**Uptime Tracking**: 99.9% SLA monitoring
**Health Checks**: Automated tests every 5 minutes
**Alert Management**: Email/SMS notifications on issues

---

# Part 11: Agent Portal Guide

## Agent Dashboard
- My customers (assigned list)
- Pending quotes (awaiting customer response)
- Active bookings (upcoming trips)
- Commission earned (MTD, YTD)
- Performance metrics

## Managing Customers
**Add Customer**: Quick form for new customer registration
**View Customer Details**: Booking history, preferences, documents
**Communication**: Email/SMS directly from portal
**Upload Documents**: Passports, visas, travel insurance

## Quote Requests & Tracking
**Submit Quote Request**: Fill form with customer requirements
**Track Status**: Draft → Sent → Viewed → Approved/Rejected
**Follow-up Reminders**: System suggests when to follow up
**Commission Preview**: See potential earnings

---

# Part 12: Customer Portal Guide

## Customer Dashboard
**Upcoming Trips**: Next bookings with countdown timer
**Past Trips**: Booking history archive
**Quick Actions**: Request quote, make payment, download vouchers

## Viewing Bookings
**Booking Details**: Complete itinerary, day-by-day plan
**Travel Documents**: Download vouchers, tickets, insurance
**Contact Agent**: Direct messaging feature
**Share Itinerary**: Share link with travel companions

## Requesting Quotes
**Quote Request Form**:
- Destination(s)
- Travel dates (flexible option)
- Number of travelers (adults, children, infants)
- Budget range
- Preferences (hotel star rating, activities, transport)
- Special requests
**Track Request**: Email notifications on quote updates

## Making Payments
**View Invoices**: All invoices (paid, unpaid, overdue)
**Pay Online**: Credit card via Stripe secure payment
**Payment History**: Download receipts
**Payment Plans**: View installment schedule

---

# Part 13: Troubleshooting & FAQ

## Common Issues

### Login Problems
**Issue**: "Invalid email or password"
**Solution**: 
1. Verify email spelling
2. Check Caps Lock
3. Use "Forgot Password" to reset
4. Clear browser cache
5. Try incognito mode

**Issue**: Account locked after failed attempts
**Solution**: Wait 30 minutes or contact admin for unlock

### Payment Issues
**Issue**: Payment declined
**Solution**:
1. Verify card details (number, expiry, CVV)
2. Check sufficient funds
3. Contact bank (may block international transactions)
4. Try alternative payment method

**Issue**: Payment processed but booking not confirmed
**Solution**: Check spam folder for confirmation email, contact support with payment reference

### Email Processing Errors
**Issue**: Emails not syncing
**Solution**:
1. Check IMAP settings (Settings → Email Accounts)
2. Verify credentials
3. Test connection
4. Check email quota
5. Restart sync manually

**Issue**: AI extraction incorrect
**Solution**: Use Manual Review Queue to correct, AI learns from corrections

### Performance Problems
**Issue**: Dashboard loading slowly
**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Reduce date range in reports
3. Check internet connection
4. Try different browser
5. Contact admin if persistent

## Frequently Asked Questions

**Q: How do I change my password?**
A: Profile → Security → Change Password

**Q: Can I have multiple email accounts?**
A: Yes, Settings → Email Accounts → Add Account

**Q: How do I export customer data?**
A: Customers → Select customers → Export → Choose CSV/Excel

**Q: Can customers pay in their own currency?**
A: Yes, enable Multi-Currency in Settings, select customer currency on invoice

**Q: How do I bulk import customers?**
A: Customers → Import → Download template → Fill data → Upload CSV

**Q: What's the commission payment schedule?**
A: Default is monthly, configurable in agent settings

**Q: Can I customize invoice templates?**
A: Yes, Settings → Invoice Settings → Customize template

**Q: How do I set up 2FA?**
A: Profile → Security → Enable Two-Factor Authentication

**Q: Can I recover deleted bookings?**
A: Yes, within 30 days from Recycle Bin

**Q: How do I add a new supplier?**
A: Suppliers → Add Supplier → Fill details

---

# Part 14: API Reference Guide

## API Overview
**Base URL**: `https://api.travelcrmpro.com/v1`
**Protocol**: REST API with JSON
**Authentication**: JWT Bearer tokens or API keys

## Authentication

### Get Access Token
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": { "id": "123", "email": "user@example.com" }
}
```

### API Key Authentication
```http
GET /api/v1/bookings
Authorization: Bearer YOUR_API_KEY
```

## Customer Endpoints

### Get All Customers
```http
GET /api/v1/customers
Authorization: Bearer {token}

Query Parameters:
- page: int (default: 1)
- limit: int (default: 20)
- search: string
- status: active|inactive

Response:
{
  "data": [
    {
      "id": "cust_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "total": 150,
    "totalPages": 8
  }
}
```

### Create Customer
```http
POST /api/v1/customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "country": "US"
  }
}

Response: 201 Created
{
  "id": "cust_124",
  "message": "Customer created successfully"
}
```

## Booking Endpoints

### Create Booking
```http
POST /api/v1/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "cust_123",
  "startDate": "2025-06-01",
  "endDate": "2025-06-10",
  "travelers": {
    "adults": 2,
    "children": 1
  },
  "items": [
    {
      "type": "hotel",
      "name": "Grand Hotel Paris",
      "checkIn": "2025-06-01",
      "checkOut": "2025-06-05",
      "rooms": 1,
      "cost": 800
    },
    {
      "type": "activity",
      "name": "Eiffel Tower Tour",
      "date": "2025-06-02",
      "participants": 3,
      "cost": 150
    }
  ],
  "totalAmount": 950
}

Response: 201 Created
{
  "id": "book_456",
  "reference": "BK-2025-001",
  "status": "pending",
  "totalAmount": 950
}
```

### Get Booking
```http
GET /api/v1/bookings/{bookingId}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "book_456",
  "reference": "BK-2025-001",
  "customer": {
    "id": "cust_123",
    "name": "John Doe"
  },
  "status": "confirmed",
  "totalAmount": 950,
  "items": [...],
  "payments": [...]
}
```

## Payment Endpoints

### Process Payment
```http
POST /api/v1/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookingId": "book_456",
  "amount": 950,
  "method": "credit_card",
  "cardToken": "tok_visa_1234" // Stripe token
}

Response: 200 OK
{
  "id": "pay_789",
  "status": "succeeded",
  "amount": 950,
  "receiptUrl": "https://..."
}
```

## Webhook Events

### Setup Webhook
```http
POST /api/v1/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://your-server.com/webhooks",
  "events": [
    "booking.created",
    "booking.confirmed",
    "payment.succeeded",
    "payment.failed"
  ],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload Example
```json
{
  "event": "booking.confirmed",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "bookingId": "book_456",
    "reference": "BK-2025-001",
    "customerId": "cust_123"
  }
}
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "field": "email"
  }
}
```

## Rate Limiting
- **Limit**: 1000 requests per hour per API key
- **Headers**: 
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 950`
  - `X-RateLimit-Reset: 1621234567`

## SDKs & Code Examples

### JavaScript/Node.js
```javascript
const TravelCRM = require('@travelcrm/sdk');
const client = new TravelCRM({ apiKey: 'YOUR_API_KEY' });

// Create customer
const customer = await client.customers.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});

// Create booking
const booking = await client.bookings.create({
  customerId: customer.id,
  startDate: '2025-06-01',
  items: [...]
});
```

### Python
```python
from travelcrm import Client

client = Client(api_key='YOUR_API_KEY')

# Create customer
customer = client.customers.create(
    first_name='John',
    last_name='Doe',
    email='john@example.com'
)

# Get all bookings
bookings = client.bookings.list(status='confirmed')
```

### PHP
```php
<?php
require 'vendor/autoload.php';

$client = new TravelCRM\Client('YOUR_API_KEY');

// Create booking
$booking = $client->bookings->create([
    'customerId' => 'cust_123',
    'startDate' => '2025-06-01',
    'items' => [...]
]);
```

### cURL Examples
```bash
# Get customers
curl -X GET https://api.travelcrmpro.com/v1/customers \
  -H "Authorization: Bearer YOUR_API_KEY"

# Create booking
curl -X POST https://api.travelcrmpro.com/v1/bookings \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust_123",
    "startDate": "2025-06-01",
    "items": [...]
  }'
```

---

**End of User Manual**

**Complete Documentation Suite (14 Parts)**:
1. ✅ Getting Started Guide
2. ✅ User Roles & Permissions
3. ✅ Authentication & Account Management
4. ✅ Super Admin Guide
5. ✅ Operator/Admin Guide
6. ✅ Finance Module Guide
7. ✅ Supplier Management Guide
8. ✅ Email Automation Guide
9. ✅ Analytics & Forecasting Guide
10. ✅ System Administration Guide
11. ✅ Agent Portal Guide
12. ✅ Customer Portal Guide
13. ✅ Troubleshooting & FAQ
14. ✅ API Reference Guide

**Total Documentation**: ~75,000 words | ~150 pages

*For support: support@travelcrmpro.com | Documentation version 2.1.0*
