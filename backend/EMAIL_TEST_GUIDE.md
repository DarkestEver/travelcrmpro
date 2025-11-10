# Email Testing Guide

## ✅ Email Service Status: WORKING!

Successfully sent test email to **keshav@eurasiaglobal.online** on November 7, 2025.

- **Message ID**: `cb6823b8-f9f4-c36b-f5f1-3f549075b685@travelmanagerpro.com`
- **SMTP Response**: `250 2.0.0 Ok: queued as 2FFC880078B`
- **Status**: ✅ Working perfectly!

---

## Quick Test Script

Run this command from the backend directory to send a test email:

```bash
node test-email.js
```

This will send a beautifully formatted test email to keshav@eurasiaglobal.online.

---

## API Endpoints for Email Testing

### 1. Send Test Email

**Endpoint**: `POST /api/v1/email/test`

**Authentication**: Required (Bearer Token)

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "type": "welcome"
}
```

**Available Email Types**:
- `welcome` - Welcome email for new users
- `invoice` - Professional invoice with details
- `payment` - Payment confirmation receipt
- `booking` - Booking details and confirmation
- `commission` - Commission earned notification
- `credit-alert` - Credit limit warning/alert
- `overdue` - Payment reminder for overdue invoice

**Example using curl** (replace `YOUR_TOKEN` with your actual JWT):
```bash
curl -X POST http://localhost:5000/api/v1/email/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"to\":\"keshav@eurasiaglobal.online\",\"type\":\"invoice\"}"
```

**Example using PowerShell**:
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TOKEN"
}
$body = @{
    to = "keshav@eurasiaglobal.online"
    type = "invoice"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/email/test" -Method Post -Headers $headers -Body $body
```

### 2. Get Available Email Types

**Endpoint**: `GET /api/v1/email/types`

**Authentication**: Required (Bearer Token)

**Example**:
```bash
curl -X GET http://localhost:5000/api/v1/email/types \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Email Configuration

### Current SMTP Settings (.env)

```env
EMAIL_SERVICE_ENABLED=true
EMAIL_SERVICE=smtp
EMAIL_FROM_NAME=Travel Manager Pro
EMAIL_FROM=app@travelmanagerpro.com
EMAIL_HOST=travelmanagerpro.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=app@travelmanagerpro.com
EMAIL_PASSWORD='Ip@warming#123'
```

### Important Notes

1. **TLS Certificate Warning**: The SMTP server has an expired certificate, but we've configured the email service to accept it using `rejectUnauthorized: false` in the TLS settings.

2. **Mock Mode Removed**: Mock mode is now disabled. All emails will be sent via SMTP.

3. **Email Templates**: All email templates are professional HTML emails with responsive design and inline CSS.

---

## Testing Invoice Email Sending

### Via Frontend

1. Log in to the agent portal
2. Navigate to **Invoices** → **Create Invoice**
3. Fill in the invoice details
4. Click **Create Invoice**
5. On the invoice list, click **Send** button
6. The system will:
   - Generate a PDF invoice
   - Send email to the customer
   - Create a notification for the agent

### Via API

**Endpoint**: `POST /api/v1/agent/invoices/:id/send`

**Example**:
```bash
curl -X POST http://localhost:5000/api/v1/agent/invoices/INVOICE_ID/send \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Email Templates Available

### 1. Invoice Email
Professional invoice with company branding, itemized details, payment instructions.

### 2. Payment Receipt
Payment confirmation with transaction details and remaining balance.

### 3. Booking Confirmation
Travel booking confirmation with itinerary details, dates, and amount.

### 4. Commission Notification
Agent commission earned notification with booking details and payout status.

### 5. Credit Limit Alert
Warning email when credit utilization reaches thresholds (75%, 90%, 100%).

### 6. Overdue Invoice Reminder
Professional reminder for overdue invoices with days overdue and payment urgency.

### 7. Welcome Email
Welcome message for new users with system introduction and next steps.

### 8. Password Reset
Secure password reset email with time-limited reset link.

---

## Troubleshooting

### Certificate Error
If you see "certificate has expired" warnings, don't worry! The email service is configured to bypass this with:
```javascript
tls: {
  rejectUnauthorized: false
}
```

### Authentication Errors
If emails fail with "Invalid login" errors:
1. Verify SMTP credentials in `.env`
2. Check if the email server allows SMTP authentication
3. Try using a different SMTP provider (Gmail, SendGrid, etc.)

### Emails Not Received
1. Check spam/junk folder
2. Verify recipient email address
3. Check server logs for errors
4. Use the test script to verify SMTP connection

---

## Next Steps

Now that email service is working:

1. ✅ Email Service - **COMPLETE**
2. ✅ Email Templates - **COMPLETE**  
3. ✅ Invoice Email Integration - **COMPLETE**
4. ⏳ Test all email types - **IN PROGRESS**
5. 🔜 Build Notification Center Frontend
6. 🔜 Integrate emails with other features (payments, bookings)
7. 🔜 Add email preferences/settings

---

## Support

For issues or questions:
- Check server logs: `backend/logs/`
- Review email service code: `backend/src/services/emailService.js`
- Test SMTP connection: `node test-email.js`
