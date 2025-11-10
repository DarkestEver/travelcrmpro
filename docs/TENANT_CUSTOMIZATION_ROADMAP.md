# 🎨 Tenant Customization & Branding - Complete Guide

## 📋 What's Currently Configurable

### 1. **Company Branding** ✅
- **Company Name**: Display name shown across the platform
- **Logo**: Company logo (PNG/JPG, max 2MB, stored as base64)
- **Primary Color**: Main brand color for buttons, headers, accents
- **Secondary Color**: Complementary color for highlights and links

### 2. **Contact Information** ✅
- **Email**: Primary contact email
- **Phone**: Contact phone number with international format
- **Address**: Street address
- **City**: City/Location
- **Country**: Country of operation
- **Website**: Company website URL (optional)

### 3. **Regional Settings** ✅
- **Timezone**: Operating timezone (UTC, EST, PST, etc.)
- **Currency**: Default currency (USD, EUR, GBP, etc.)
- **Language**: Platform language (English, Spanish, etc.)

---

## 🚀 What ELSE Can Be Configured (Future Enhancements)

### 1. **Advanced Branding**
```javascript
settings: {
  branding: {
    // Current
    companyName: String,
    logo: String,
    primaryColor: String,
    secondaryColor: String,
    
    // Future Enhancements
    favicon: String,                    // Browser tab icon
    loginBackgroundImage: String,       // Custom login page background
    fontFamily: String,                 // Custom font (Google Fonts)
    logoPosition: String,               // 'left' | 'center' | 'right'
    companyTagline: String,             // Slogan/tagline
    footerText: String,                 // Custom footer text
    customCSS: String,                  // Advanced: Custom CSS overrides
    darkModeEnabled: Boolean,           // Enable dark theme
    accentColor: String,                // Additional accent color
    headerStyle: String                 // 'modern' | 'classic' | 'minimal'
  }
}
```

### 2. **Email Customization**
```javascript
settings: {
  email: {
    senderName: String,                 // "From" name in emails
    senderEmail: String,                // Reply-to email
    emailSignature: String,             // HTML signature
    emailTemplates: {
      bookingConfirmation: String,      // Custom booking email
      quoteRequest: String,             // Custom quote email
      paymentReceipt: String,           // Custom payment email
      welcomeEmail: String              // New user welcome
    },
    emailHeaderColor: String,           // Email header background
    emailFooterText: String,            // Email footer
    showLogoInEmail: Boolean            // Include logo in emails
  }
}
```

### 3. **Business Rules**
```javascript
settings: {
  business: {
    operatingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      // ... other days
    },
    autoApproveBookings: Boolean,       // Auto-confirm bookings
    requireDepositForBooking: Boolean,  // Require upfront payment
    depositPercentage: Number,          // % required as deposit
    cancellationPolicy: String,         // Cancellation terms
    refundPolicy: String,               // Refund policy text
    termsAndConditions: String,         // T&C for bookings
    privacyPolicy: String,              // Privacy policy
    minimumBookingNotice: Number,       // Hours before travel date
    maximumBookingAdvance: Number       // Days in advance allowed
  }
}
```

### 4. **Payment Configuration**
```javascript
settings: {
  payment: {
    acceptedMethods: [String],          // ['card', 'bank_transfer', 'paypal']
    stripeEnabled: Boolean,
    stripePublicKey: String,
    paypalEnabled: Boolean,
    paypalClientId: String,
    razorpayEnabled: Boolean,
    bankAccountDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      swiftCode: String
    },
    taxRate: Number,                    // Default tax %
    serviceFeePercentage: Number,       // Platform fee %
    lateFeePercentage: Number           // Late payment fee
  }
}
```

### 5. **Customer Portal Customization**
```javascript
settings: {
  customerPortal: {
    enabled: Boolean,                   // Enable customer portal
    allowSelfBooking: Boolean,          // Customers can book directly
    requireApproval: Boolean,           // Bookings need approval
    showPricing: Boolean,               // Show prices to customers
    allowReviews: Boolean,              // Customers can leave reviews
    welcomeMessage: String,             // Portal welcome text
    featuredDestinations: [String],     // Highlight destinations
    customMenuItems: [{
      label: String,
      url: String,
      icon: String
    }]
  }
}
```

### 6. **Agent Portal Settings**
```javascript
settings: {
  agentPortal: {
    commissionRate: Number,             // Default agent commission %
    tieredCommissions: [{               // Commission tiers
      tier: String,                     // 'bronze', 'silver', 'gold'
      minBookings: Number,
      rate: Number
    }],
    allowSubAgents: Boolean,            // Agents can create sub-users
    requireVerification: Boolean,       // Verify agent credentials
    autoPayoutEnabled: Boolean,         // Auto commission payout
    payoutSchedule: String,             // 'weekly' | 'monthly'
    agentDashboardWidgets: [String]     // Customizable widgets
  }
}
```

### 7. **Notifications & Alerts**
```javascript
settings: {
  notifications: {
    emailNotifications: {
      bookingCreated: Boolean,
      paymentReceived: Boolean,
      bookingCancelled: Boolean,
      reviewReceived: Boolean,
      lowInventory: Boolean
    },
    smsNotifications: {
      enabled: Boolean,
      provider: String,               // 'twilio', 'sns'
      sendBookingConfirmation: Boolean,
      sendPaymentReminder: Boolean
    },
    pushNotifications: {
      enabled: Boolean,
      fcmServerKey: String
    },
    slackIntegration: {
      enabled: Boolean,
      webhookUrl: String,
      notifyChannel: String
    }
  }
}
```

### 8. **Integrations**
```javascript
settings: {
  integrations: {
    googleAnalytics: {
      enabled: Boolean,
      trackingId: String
    },
    facebookPixel: {
      enabled: Boolean,
      pixelId: String
    },
    googleMaps: {
      enabled: Boolean,
      apiKey: String,
      defaultZoom: Number
    },
    crm: {
      type: String,                   // 'salesforce', 'hubspot', 'zoho'
      apiKey: String,
      syncEnabled: Boolean
    },
    accounting: {
      type: String,                   // 'quickbooks', 'xero'
      apiKey: String,
      autoSync: Boolean
    },
    whatsapp: {
      enabled: Boolean,
      businessNumber: String,
      apiKey: String
    }
  }
}
```

### 9. **Security & Compliance**
```javascript
settings: {
  security: {
    requireTwoFactor: Boolean,          // Enforce 2FA
    sessionTimeout: Number,             // Minutes of inactivity
    passwordPolicy: {
      minLength: Number,
      requireUppercase: Boolean,
      requireNumbers: Boolean,
      requireSpecialChars: Boolean,
      expiryDays: Number
    },
    ipWhitelist: [String],              // Allowed IP addresses
    allowedCountries: [String],         // Geographic restrictions
    gdprCompliant: Boolean,
    dataRetentionDays: Number,
    auditLogsEnabled: Boolean
  }
}
```

### 10. **Custom Domain & White Label**
```javascript
settings: {
  whiteLabel: {
    customDomain: String,               // 'bookings.youragency.com'
    domainVerified: Boolean,
    sslEnabled: Boolean,
    hidePoweredBy: Boolean,             // Remove "Powered by Travel CRM"
    customLoginUrl: String,
    customLogoutRedirect: String,
    faviconUrl: String,
    ogImage: String                     // Social media preview image
  }
}
```

---

## 🎯 Priority Implementation Roadmap

### Phase 1: Essential (Next Sprint)
1. ✅ Basic branding (logo, colors, company name)
2. ✅ Contact information
3. ✅ Timezone & currency
4. [ ] Email sender configuration
5. [ ] Business hours
6. [ ] Payment methods selection

### Phase 2: Business Critical
1. [ ] Email template customization
2. [ ] Cancellation & refund policies
3. [ ] Agent commission rates
4. [ ] Customer portal toggle
5. [ ] Notification preferences
6. [ ] Tax configuration

### Phase 3: Advanced
1. [ ] Custom domain setup
2. [ ] Payment gateway integration
3. [ ] CRM/Accounting sync
4. [ ] SMS notifications
5. [ ] White-label options
6. [ ] Advanced security settings

### Phase 4: Enterprise
1. [ ] Custom CSS overrides
2. [ ] API access configuration
3. [ ] Multi-language support
4. [ ] Advanced analytics
5. [ ] Custom workflows
6. [ ] SSO/SAML integration

---

## 📖 UI/UX Considerations

### Settings Page Structure
```
Tenant Settings
├── 1. Branding ✅
│   ├── Company Info
│   ├── Logo & Favicon
│   └── Colors & Fonts
├── 2. Contact ✅
│   ├── Primary Contact
│   ├── Business Address
│   └── Social Media
├── 3. General ✅
│   ├── Timezone & Currency
│   ├── Language
│   └── Date Format
├── 4. Business (TODO)
│   ├── Operating Hours
│   ├── Booking Rules
│   └── Policies
├── 5. Payment (TODO)
│   ├── Payment Methods
│   ├── Gateway Config
│   └── Tax Settings
├── 6. Notifications (TODO)
│   ├── Email Preferences
│   ├── SMS Setup
│   └── Push Notifications
├── 7. Portal Settings (TODO)
│   ├── Customer Portal
│   ├── Agent Portal
│   └── Access Control
├── 8. Integrations (TODO)
│   ├── Google Analytics
│   ├── Payment Gateways
│   └── Third-party APIs
└── 9. Security (TODO)
    ├── Authentication
    ├── IP Restrictions
    └── Audit Logs
```

---

## 🔧 Technical Implementation Notes

### Logo Upload Enhancement
**Current**: Base64 storage in MongoDB (2MB limit)
**Recommended**: 
```javascript
// Use cloud storage for better performance
const uploadLogo = async (file) => {
  // Upload to S3/Cloudinary
  const url = await cloudStorage.upload(file);
  
  // Store URL in database instead of base64
  await Tenant.updateOne(
    { _id: tenantId },
    { 'settings.branding.logo': url }
  );
};
```

### Color Theme Application
```javascript
// Frontend: Apply colors dynamically
useEffect(() => {
  if (tenantSettings?.branding) {
    document.documentElement.style.setProperty(
      '--primary-color',
      tenantSettings.branding.primaryColor
    );
    document.documentElement.style.setProperty(
      '--secondary-color',
      tenantSettings.branding.secondaryColor
    );
  }
}, [tenantSettings]);
```

### Email Template Variables
```javascript
// Available variables in email templates
const emailVariables = {
  '{{companyName}}': tenant.settings.branding.companyName,
  '{{customerName}}': customer.name,
  '{{bookingNumber}}': booking.bookingNumber,
  '{{travelDate}}': booking.travelDates.startDate,
  '{{totalAmount}}': booking.financial.totalAmount,
  '{{logo}}': tenant.settings.branding.logo,
  '{{contactEmail}}': tenant.settings.contact.email,
  '{{contactPhone}}': tenant.settings.contact.phone
};
```

---

## ✅ Summary

**Currently Implemented** (3/10 categories):
- ✅ Branding (logo, colors, company name)
- ✅ Contact information
- ✅ Regional settings (timezone, currency)

**Ready for Development** (7/10 categories):
- Business rules & policies
- Payment configuration
- Email customization
- Notification preferences
- Portal settings
- Integrations
- Security & compliance

**Next Steps**:
1. Test current implementation
2. Prioritize Phase 1 features
3. Design UI for business settings
4. Implement payment configuration
5. Add email template editor

---

**Need Help?** Contact the development team or refer to:
- `TENANT_SETTINGS_GUIDE.md` - Testing guide
- `CURRENT_STATUS.md` - Project status
- Backend: `src/controllers/tenantController.js`
- Frontend: `src/pages/TenantSettings.jsx`
