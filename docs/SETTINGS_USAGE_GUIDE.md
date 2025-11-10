# 📖 Tenant Settings API Reference

## How to Use Tenant Settings in Your Code

### Frontend - Accessing Settings

```javascript
// In any React component
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

function MyComponent() {
  // Fetch current tenant settings
  const { data: tenantData } = useQuery({
    queryKey: ['tenant', 'current'],
    queryFn: async () => {
      const { data } = await api.get('/tenants/current');
      return data.data.tenant;
    }
  });

  // Access settings
  const companyName = tenantData?.settings?.branding?.companyName;
  const primaryColor = tenantData?.settings?.branding?.primaryColor;
  const operatingHours = tenantData?.settings?.business?.operatingHours;
  const taxRate = tenantData?.settings?.payment?.taxRate;

  return (
    <div style={{ color: primaryColor }}>
      <h1>{companyName}</h1>
      {/* Use settings in your component */}
    </div>
  );
}
```

---

## Available Settings Reference

### 1. Branding Settings
```javascript
tenant.settings.branding = {
  companyName: String,        // Company display name
  logo: String,               // Base64 encoded logo
  primaryColor: String,       // Hex color (e.g., "#4F46E5")
  secondaryColor: String      // Hex color (e.g., "#06B6D4")
}

// Usage Examples:
// - Display company name in header
// - Apply brand colors to buttons/links
// - Show logo in emails and invoices
```

### 2. Contact Information
```javascript
tenant.settings.contact = {
  email: String,              // Primary contact email
  phone: String,              // Contact phone number
  address: String,            // Street address
  city: String,               // City name
  country: String,            // Country name
  website: String             // Company website URL
}

// Usage Examples:
// - Display in footer
// - Show on invoices and quotes
// - Use in "Contact Us" page
// - Include in email signatures
```

### 3. Business Rules
```javascript
tenant.settings.business = {
  operatingHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  },
  autoApproveBookings: Boolean,
  requireDepositForBooking: Boolean,
  depositPercentage: Number,          // 0-100
  cancellationPolicy: String,         // Multi-line text
  refundPolicy: String,               // Multi-line text
  termsAndConditions: String,         // Multi-line text
  minimumBookingNotice: Number,       // Hours
  maximumBookingAdvance: Number       // Days
}

// Usage Examples:
// - Show operating hours on booking page
// - Auto-approve bookings if enabled
// - Calculate deposit amount: total * (depositPercentage / 100)
// - Display policies on booking confirmation
// - Validate booking dates against min/max rules
```

### 4. Email Configuration
```javascript
tenant.settings.email = {
  senderName: String,                 // "From" name in emails
  senderEmail: String,                // "From" email address
  replyToEmail: String,               // Reply-to address
  emailSignature: String,             // Email signature text
  showLogoInEmail: Boolean,           // Include logo in emails
  emailFooterText: String,            // Email footer
  templates: {
    bookingConfirmation: {
      subject: String,
      body: String,
      enabled: Boolean
    },
    quoteRequest: {
      subject: String,
      body: String,
      enabled: Boolean
    },
    paymentReceipt: {
      subject: String,
      body: String,
      enabled: Boolean
    },
    welcomeEmail: {
      subject: String,
      body: String,
      enabled: Boolean
    }
  }
}

// Usage Examples:
// - Send emails with configured sender name/email
// - Append signature to all outgoing emails
// - Include logo if showLogoInEmail is true
// - Use custom templates for notifications
```

### 5. Payment Settings
```javascript
tenant.settings.payment = {
  acceptedMethods: [String],          // Array: ['cash', 'card', 'bank_transfer', etc.]
  defaultCurrency: String,            // 'USD', 'EUR', etc.
  taxRate: Number,                    // Percentage (0-100)
  serviceFeePercentage: Number,       // Percentage (0-100)
  lateFeePercentage: Number,          // Percentage (0-100)
  stripeEnabled: Boolean,
  stripePublicKey: String,
  paypalEnabled: Boolean,
  paypalClientId: String,
  bankAccountDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    swiftCode: String,
    iban: String
  }
}

// Usage Examples:
// - Show only accepted payment methods on checkout
// - Calculate tax: amount * (taxRate / 100)
// - Calculate service fee: amount * (serviceFeePercentage / 100)
// - Display bank details for bank transfer option
// - Enable Stripe/PayPal checkout if configured
```

### 6. Regional Preferences
```javascript
tenant.metadata = {
  timezone: String,                   // 'UTC', 'America/New_York', etc.
  currency: String,                   // 'USD', 'EUR', 'GBP', etc.
  industry: String,
  size: String,
  country: String
}

// Usage Examples:
// - Display dates/times in tenant's timezone
// - Format currency amounts
// - Localize content based on country
```

### 7. Subscription & Limits
```javascript
tenant.subscription = {
  plan: String,                       // 'free', 'starter', 'professional', 'enterprise'
  status: String,                     // 'trial', 'active', 'suspended', 'cancelled'
  startDate: Date,
  endDate: Date,
  trialEndsAt: Date,
  billingCycle: String,               // 'monthly', 'yearly'
  price: Number
}

tenant.settings.features = {
  maxUsers: Number,
  maxAgents: Number,
  maxCustomers: Number,
  maxBookings: Number,
  enableAnalytics: Boolean,
  enableAuditLogs: Boolean,
  enableNotifications: Boolean,
  enableWhiteLabel: Boolean
}

tenant.usage = {
  users: Number,
  agents: Number,
  customers: Number,
  bookings: Number,
  storage: Number                     // MB
}

// Usage Examples:
// - Check if tenant can add more users: tenant.usage.users < tenant.settings.features.maxUsers
// - Show upgrade prompt if limits reached
// - Hide features based on plan
// - Display trial expiration warning
```

---

## Practical Usage Examples

### Example 1: Calculate Booking Total with Tax & Fees
```javascript
function calculateBookingTotal(baseAmount, tenant) {
  const tax = baseAmount * (tenant.settings.payment.taxRate / 100);
  const serviceFee = baseAmount * (tenant.settings.payment.serviceFeePercentage / 100);
  const total = baseAmount + tax + serviceFee;
  
  return {
    baseAmount,
    tax,
    serviceFee,
    total
  };
}

// Usage:
const pricing = calculateBookingTotal(1000, tenantData);
// Result: { baseAmount: 1000, tax: 85, serviceFee: 25, total: 1110 }
```

### Example 2: Calculate Required Deposit
```javascript
function calculateDeposit(totalAmount, tenant) {
  if (!tenant.settings.business.requireDepositForBooking) {
    return 0;
  }
  
  const percentage = tenant.settings.business.depositPercentage;
  return totalAmount * (percentage / 100);
}

// Usage:
const deposit = calculateDeposit(1000, tenantData);
// Result: 200 (if depositPercentage is 20)
```

### Example 3: Validate Booking Date
```javascript
function validateBookingDate(bookingDate, tenant) {
  const now = new Date();
  const minDate = new Date(now.getTime() + tenant.settings.business.minimumBookingNotice * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() + tenant.settings.business.maximumBookingAdvance * 24 * 60 * 60 * 1000);
  
  if (bookingDate < minDate) {
    return { valid: false, error: `Booking must be at least ${tenant.settings.business.minimumBookingNotice} hours in advance` };
  }
  
  if (bookingDate > maxDate) {
    return { valid: false, error: `Booking cannot be more than ${tenant.settings.business.maximumBookingAdvance} days in advance` };
  }
  
  return { valid: true };
}
```

### Example 4: Check if Business is Open
```javascript
function isBusinessOpen(tenant) {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  
  const hours = tenant.settings.business.operatingHours[dayName];
  
  if (hours.closed) {
    return { open: false, reason: 'Closed today' };
  }
  
  if (currentTime < hours.open || currentTime > hours.close) {
    return { open: false, reason: `Open ${hours.open} - ${hours.close}` };
  }
  
  return { open: true };
}
```

### Example 5: Show Payment Methods
```javascript
function PaymentMethodSelector({ tenant }) {
  const methods = tenant.settings.payment.acceptedMethods;
  
  return (
    <div>
      <h3>Select Payment Method</h3>
      {methods.includes('card') && <button>Pay with Card</button>}
      {methods.includes('paypal') && tenant.settings.payment.paypalEnabled && (
        <button>Pay with PayPal</button>
      )}
      {methods.includes('stripe') && tenant.settings.payment.stripeEnabled && (
        <button>Pay with Stripe</button>
      )}
      {methods.includes('bank_transfer') && (
        <div>
          <button>Bank Transfer</button>
          <div>
            <p>Account: {tenant.settings.payment.bankAccountDetails.accountName}</p>
            <p>Number: {tenant.settings.payment.bankAccountDetails.accountNumber}</p>
            <p>Bank: {tenant.settings.payment.bankAccountDetails.bankName}</p>
          </div>
        </div>
      )}
      {methods.includes('cash') && <button>Pay Cash on Arrival</button>}
    </div>
  );
}
```

### Example 6: Apply Brand Colors
```javascript
function BrandedButton({ children, tenant }) {
  return (
    <button
      style={{
        backgroundColor: tenant.settings.branding.primaryColor,
        color: '#ffffff',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = tenant.settings.branding.secondaryColor;
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = tenant.settings.branding.primaryColor;
      }}
    >
      {children}
    </button>
  );
}
```

### Example 7: Display Cancellation Policy on Booking Page
```javascript
function BookingPolicies({ tenant }) {
  return (
    <div className="policies">
      <h3>Important Information</h3>
      
      <div>
        <h4>Cancellation Policy</h4>
        <p>{tenant.settings.business.cancellationPolicy}</p>
      </div>
      
      <div>
        <h4>Refund Policy</h4>
        <p>{tenant.settings.business.refundPolicy}</p>
      </div>
      
      {tenant.settings.business.termsAndConditions && (
        <div>
          <h4>Terms & Conditions</h4>
          <p>{tenant.settings.business.termsAndConditions}</p>
        </div>
      )}
      
      <label>
        <input type="checkbox" required />
        I agree to the cancellation policy and terms
      </label>
    </div>
  );
}
```

---

## Backend Usage

### Access Settings in Controllers
```javascript
// In any controller with tenantContext middleware
const getTenantSettings = asyncHandler(async (req, res) => {
  // Tenant is available via middleware
  const tenant = req.tenant;
  
  // Access settings
  const primaryColor = tenant.settings.branding.primaryColor;
  const depositRequired = tenant.settings.business.requireDepositForBooking;
  const taxRate = tenant.settings.payment.taxRate;
  
  // Use in business logic
  if (depositRequired) {
    const deposit = calculateDeposit(bookingTotal, tenant);
    // ... process deposit
  }
  
  res.json({ settings: tenant.settings });
});
```

### Enforce Business Rules
```javascript
const createBooking = asyncHandler(async (req, res) => {
  const tenant = req.tenant;
  const { bookingDate, totalAmount } = req.body;
  
  // Validate against business rules
  const minDate = new Date(Date.now() + tenant.settings.business.minimumBookingNotice * 60 * 60 * 1000);
  if (new Date(bookingDate) < minDate) {
    throw new AppError(`Booking must be at least ${tenant.settings.business.minimumBookingNotice} hours in advance`, 400);
  }
  
  // Calculate financial details
  const tax = totalAmount * (tenant.settings.payment.taxRate / 100);
  const serviceFee = totalAmount * (tenant.settings.payment.serviceFeePercentage / 100);
  const deposit = tenant.settings.business.requireDepositForBooking
    ? totalAmount * (tenant.settings.business.depositPercentage / 100)
    : 0;
  
  // Create booking with calculated values
  const booking = await Booking.create({
    ...req.body,
    financial: {
      subtotal: totalAmount,
      tax,
      serviceFee,
      total: totalAmount + tax + serviceFee,
      depositRequired: deposit,
      depositPaid: 0
    },
    status: tenant.settings.business.autoApproveBookings ? 'confirmed' : 'pending'
  });
  
  res.json({ booking });
});
```

---

## Email Template Variables

When sending emails, you can use these variables in templates:

```javascript
const emailVariables = {
  // Company Info
  '{{companyName}}': tenant.settings.branding.companyName,
  '{{companyEmail}}': tenant.settings.contact.email,
  '{{companyPhone}}': tenant.settings.contact.phone,
  '{{companyWebsite}}': tenant.settings.contact.website,
  
  // Customer Info
  '{{customerName}}': customer.name,
  '{{customerEmail}}': customer.email,
  
  // Booking Info
  '{{bookingNumber}}': booking.bookingNumber,
  '{{bookingDate}}': booking.travelDates.startDate,
  '{{destination}}': booking.destination,
  '{{numberOfTravelers}}': booking.numberOfTravelers,
  
  // Financial
  '{{totalAmount}}': booking.financial.total,
  '{{depositAmount}}': booking.financial.depositRequired,
  '{{currency}}': tenant.metadata.currency,
  
  // Quote Info
  '{{quoteNumber}}': quote.quoteNumber,
  '{{quoteAmount}}': quote.pricing.totalPrice,
  
  // Branding
  '{{logo}}': tenant.settings.branding.logo,
  '{{primaryColor}}': tenant.settings.branding.primaryColor,
  
  // Policies
  '{{cancellationPolicy}}': tenant.settings.business.cancellationPolicy,
  '{{refundPolicy}}': tenant.settings.business.refundPolicy
};
```

---

## Quick Reference Cheat Sheet

| Setting | Path | Type | Use Case |
|---------|------|------|----------|
| Company Name | `settings.branding.companyName` | String | Headers, emails, invoices |
| Primary Color | `settings.branding.primaryColor` | String | Buttons, theme |
| Operating Hours | `settings.business.operatingHours` | Object | Booking validation |
| Auto Approve | `settings.business.autoApproveBookings` | Boolean | Booking workflow |
| Deposit % | `settings.business.depositPercentage` | Number | Payment calculation |
| Tax Rate | `settings.payment.taxRate` | Number | Price calculation |
| Service Fee | `settings.payment.serviceFeePercentage` | Number | Price calculation |
| Payment Methods | `settings.payment.acceptedMethods` | Array | Checkout options |
| Sender Email | `settings.email.senderEmail` | String | Email from address |
| Timezone | `metadata.timezone` | String | Date/time display |
| Currency | `metadata.currency` | String | Price formatting |

---

**Last Updated**: November 9, 2024
**Version**: 1.0
