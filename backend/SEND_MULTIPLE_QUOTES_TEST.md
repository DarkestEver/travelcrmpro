# Test: Send Multiple Quotes in Single Email

## Quick Test (Using Postman/Thunder Client)

### 1. Login First
```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "operator@example.com",
  "password": "password123"
}
```

**Copy the token from response**

---

### 2. Get All Quotes (to find quote IDs)
```http
GET http://localhost:5000/api/v1/quotes
Authorization: Bearer YOUR_TOKEN_HERE
```

**Copy the `_id` of 2-3 draft quotes from the same customer**

---

### 3. Send Multiple Quotes
```http
POST http://localhost:5000/api/v1/quotes/send-multiple
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "quoteIds": [
    "673abc123...",
    "673abc456...",
    "673abc789..."
  ],
  "emailId": "67137569bc51b82e755770a3",
  "message": "Thank you for your inquiry! We have prepared the following package options for you."
}
```

---

## Expected Response (Success)

```json
{
  "success": true,
  "message": "Successfully sent 3 quotes to priya.rai@gmail.com",
  "data": {
    "sentQuotes": 3,
    "customerEmail": "priya.rai@gmail.com",
    "quoteNumbers": [
      "Q2025-000001",
      "Q2025-000002", 
      "Q2025-000003"
    ]
  }
}
```

---

## Common Errors

### Error: "All quotes must be for the same customer"
**Cause**: Quote IDs belong to different customer emails
**Fix**: Select quotes that all have the same `customerEmail`

### Error: "No quotes found"
**Cause**: Invalid quote IDs or wrong tenant
**Fix**: Verify quote IDs exist and belong to your tenant

### Error: "Failed to send email"
**Cause**: Email service configuration issue
**Fix**: Check SMTP settings in `.env` file, or email will be mocked in development

---

## What Happens Behind the Scenes

1. ✅ Fetches all quotes by IDs
2. ✅ Validates all quotes have same customer email
3. ✅ Generates beautiful HTML email with all quote details
4. ✅ Sends ONE email to customer with all options
5. ✅ Updates all quote statuses to 'sent'
6. ✅ Updates EmailLog with sent tracking info

---

## Email Preview

The customer receives an email like this:

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
│ 👥 Travelers: 2 Adult(s)                │
│ 📦 Package Type: Honeymoon              │
│ 🍽️ Meal Plan: All Inclusive            │
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
│ ...similar details...                   │
│ Total Price: USD 2,800                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Option 3: Maldives Luxury Resort        │
│ ...similar details...                   │
│ Total Price: USD 4,000                  │
└─────────────────────────────────────────┘

Next Steps:
1. Review all the package options above
2. Reply to this email with your preferred option
3. We'll confirm availability and proceed with booking
```

---

## Testing in Development

If you're in development mode:
- Email service uses MOCK mode
- Email won't actually send
- You'll see email details in console:
  ```
  📧 MOCK EMAIL (DEV MODE)
  To: priya.rai@gmail.com
  Subject: Travel Packages - 3 Quotes for Your Trip
  ```

---

## Testing in Production

Set in `.env`:
```
NODE_ENV=production
EMAIL_SERVICE_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

Then real emails will be sent! 📧
