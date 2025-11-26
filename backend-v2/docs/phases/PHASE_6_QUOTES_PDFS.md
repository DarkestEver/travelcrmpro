# Phase 6: Quotes & PDF Generation

**Status:** ❌ Not Started  
**Priority:** P0 (Critical - Blocking Revenue)  
**Estimated Time:** 6-7 days  
**Dependencies:** Phase 4 (Itinerary Builder), Phase 5 (Booking Management)

## Overview

Complete quote generation system with versioning, approval workflow, PDF generation (branded), and customer interactions.

## Current Implementation Status

### ✅ Implemented
- None - This phase is completely new

### ❌ Missing (100%)
- [ ] **Quote model** with versioning
- [ ] **Quote generation** from itinerary
- [ ] **Quote numbering system** (auto-increment)
- [ ] **Payment schedule** calculation
- [ ] **Quote approval workflow**
- [ ] **Quote rejection** with reasons
- [ ] **Quote revision** (versioning)
- [ ] **PDF generation** (Puppeteer)
- [ ] **Branded templates** (tenant logo/colors)
- [ ] **Itinerary PDF** generation
- [ ] **Email delivery** of quotes
- [ ] **Quote expiry** handling
- [ ] **Quote comparison** (multiple quotes)
- [ ] **Terms & conditions** management

## Database Models

### Quote Schema (NEW - To Implement)

```javascript
const quoteSchema = new mongoose.Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Quote identification
  quoteNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Related entities
  lead: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    index: true,
  },

  itinerary: {
    type: Schema.Types.ObjectId,
    ref: 'Itinerary',
    required: true,
    index: true,
  },

  customer: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: String,
  },

  // Quote details
  title: {
    type: String,
    required: true,
    trim: true,
  },

  destination: String,
  duration: Number, // Days
  travelDates: {
    startDate: Date,
    endDate: Date,
  },

  travelers: {
    adults: {
      type: Number,
      default: 1,
      min: 0,
    },
    children: {
      type: Number,
      default: 0,
      min: 0,
    },
    infants: {
      type: Number,
      default: 0,
      min: 0,
    },
  },

  // Line items (from itinerary)
  lineItems: [{
    day: Number,
    itemType: {
      type: String,
      enum: ['accommodation', 'transport', 'activity', 'meal', 'guide', 'transfer', 'visa', 'insurance', 'other'],
    },
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    rateListSnapshot: {
      type: Schema.Types.ObjectId,
      ref: 'RateList',
    },
  }],

  // Pricing breakdown
  pricing: {
    subtotal: {
      type: Number,
      required: true,
    },
    
    // Discounts
    discounts: [{
      name: String,
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
      value: Number,
      amount: Number,
    }],
    
    discountTotal: {
      type: Number,
      default: 0,
    },

    // Taxes
    taxes: [{
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
      },
      value: {
        type: Number,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    }],
    
    taxTotal: {
      type: Number,
      default: 0,
    },

    // Grand total
    grandTotal: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: 'USD',
    },
  },

  // Payment schedule
  paymentSchedule: [{
    milestone: {
      type: String,
      required: true,
    },
    dueDate: Date,
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },
  }],

  // Validity
  validFrom: {
    type: Date,
    required: true,
    default: Date.now,
  },
  
  validUntil: {
    type: Date,
    required: true,
  },

  // Inclusions/Exclusions
  inclusions: [String],
  exclusions: [String],

  // Terms & Conditions
  termsAndConditions: String,
  cancellationPolicy: String,

  // Status workflow
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted'],
    default: 'draft',
    index: true,
  },

  // Approval tracking
  sentAt: Date,
  sentBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  
  viewedAt: Date,
  
  approvedAt: Date,
  approvedBy: String, // Customer name
  approvalNotes: String,
  
  rejectedAt: Date,
  rejectionReason: String,
  
  expiredAt: Date,
  
  convertedAt: Date,
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
  },

  // Versioning
  version: {
    type: Number,
    default: 1,
  },
  
  parentQuote: {
    type: Schema.Types.ObjectId,
    ref: 'Quote',
  },
  
  revisionNotes: String,

  // PDFs
  quotePdfUrl: String,
  itineraryPdfUrl: String,
  pdfGeneratedAt: Date,

  // Email tracking
  emailsSent: [{
    sentAt: {
      type: Date,
      default: Date.now,
    },
    toEmail: String,
    template: String,
    messageId: String,
  }],

  // Notes and metadata
  internalNotes: String,
  tags: [String],

  // Agent/Operator
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
quoteSchema.index({ tenant: 1, quoteNumber: 1 }, { unique: true });
quoteSchema.index({ tenant: 1, status: 1, validUntil: 1 });
quoteSchema.index({ tenant: 1, customer.email: 1 });
quoteSchema.index({ createdBy: 1, status: 1 });

// Virtual: Is quote expired
quoteSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil && this.status !== 'approved' && this.status !== 'converted';
});

// Virtual: Days until expiry
quoteSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diff = this.validUntil - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method: Generate quote number
quoteSchema.statics.generateQuoteNumber = async function(tenantId) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const count = await this.countDocuments({
    tenant: tenantId,
    quoteNumber: new RegExp(`^QT-${year}${month}-`),
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `QT-${year}${month}-${sequence}`;
};

// Method: Create revision
quoteSchema.methods.createRevision = async function(updateData, userId) {
  const Quote = this.constructor;
  
  const revision = new Quote({
    ...this.toObject(),
    _id: undefined,
    version: this.version + 1,
    parentQuote: this._id,
    status: 'draft',
    quotePdfUrl: undefined,
    itineraryPdfUrl: undefined,
    pdfGeneratedAt: undefined,
    sentAt: undefined,
    viewedAt: undefined,
    approvedAt: undefined,
    rejectedAt: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    ...updateData,
    updatedBy: userId,
  });
  
  await revision.save();
  return revision;
};

// Method: Mark as sent
quoteSchema.methods.markAsSent = function(userId) {
  this.status = 'sent';
  this.sentAt = new Date();
  this.sentBy = userId;
};

// Method: Mark as viewed
quoteSchema.methods.markAsViewed = function() {
  if (this.status === 'sent' && !this.viewedAt) {
    this.status = 'viewed';
    this.viewedAt = new Date();
  }
};

// Method: Approve quote
quoteSchema.methods.approve = function(customerName, notes) {
  this.status = 'approved';
  this.approvedAt = new Date();
  this.approvedBy = customerName;
  this.approvalNotes = notes;
};

// Method: Reject quote
quoteSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
};

// Method: Convert to booking
quoteSchema.methods.convertToBooking = function(bookingId) {
  this.status = 'converted';
  this.convertedAt = new Date();
  this.booking = bookingId;
};

// Pre-save: Auto-expire check
quoteSchema.pre('save', function(next) {
  if (this.status === 'sent' || this.status === 'viewed') {
    if (new Date() > this.validUntil) {
      this.status = 'expired';
      this.expiredAt = new Date();
    }
  }
  next();
});
```

## API Endpoints

```javascript
// List all quotes
GET /quotes
Query params: 
  - status
  - customerId
  - leadId
  - dateFrom, dateTo
  - page, limit, sort

// Get single quote
GET /quotes/:id

// Create quote from itinerary
POST /quotes/create
Body: {
  itineraryId,
  leadId (optional),
  customer: { name, email, phone },
  validityDays: 7,
  paymentSchedule: [],
  discounts: [],
  inclusions: [],
  exclusions: [],
  termsAndConditions,
  cancellationPolicy
}

// Update quote (draft only)
PATCH /quotes/:id

// Delete quote (draft only)
DELETE /quotes/:id

// Send quote via email
POST /quotes/:id/send
Body: {
  toEmail,
  ccEmails: [],
  message,
  attachments: ['quote_pdf', 'itinerary_pdf']
}

// Mark as viewed (customer action)
POST /quotes/:id/view

// Approve quote (customer action)
POST /quotes/:id/approve
Body: {
  customerName,
  approvalNotes
}

// Reject quote (customer action)
POST /quotes/:id/reject
Body: {
  rejectionReason
}

// Create revision
POST /quotes/:id/revise
Body: {
  updates: {},
  revisionNotes
}

// Generate PDF
POST /quotes/:id/generate-pdf
Body: {
  type: 'quote' | 'itinerary' | 'both'
}

// Download PDF
GET /quotes/:id/pdf/quote
GET /quotes/:id/pdf/itinerary

// Convert to booking
POST /quotes/:id/convert-to-booking

// Get quote versions (all revisions)
GET /quotes/:id/versions

// Compare quotes
POST /quotes/compare
Body: {
  quoteIds: []
}

// Expire old quotes (cron job endpoint)
POST /quotes/expire-old

// Quote statistics
GET /quotes/stats
Query: dateFrom, dateTo, agentId
```

## Implementation Steps

### Step 1: Create Quote Model (1 day)
- [ ] Create `src/models/Quote.js`
- [ ] Implement full schema
- [ ] Add indexes
- [ ] Add virtual fields
- [ ] Implement `generateQuoteNumber()` static
- [ ] Implement `createRevision()` method
- [ ] Implement status transition methods
- [ ] Add validation hooks

### Step 2: PDF Generation Service (2 days)
- [ ] Install Puppeteer: `npm install puppeteer`
- [ ] Create `src/services/pdfGenerationService.js`
- [ ] Create HTML templates for quote PDF
- [ ] Create HTML templates for itinerary PDF
- [ ] Implement branding (tenant logo, colors)
- [ ] Add header/footer with page numbers
- [ ] Implement PDF generation function
- [ ] Store PDFs in S3/MinIO
- [ ] Add error handling and retries

### Step 3: Quote Controller (1.5 days)
- [ ] Create `src/controllers/quoteController.js`
- [ ] Implement `getAllQuotes()` with filters
- [ ] Implement `getQuote()`
- [ ] Implement `createQuote()` from itinerary
- [ ] Implement `updateQuote()`
- [ ] Implement `deleteQuote()`
- [ ] Implement `sendQuote()` with email
- [ ] Implement `markAsViewed()`
- [ ] Implement `approveQuote()`
- [ ] Implement `rejectQuote()`
- [ ] Implement `reviseQuote()`
- [ ] Implement `generatePdf()`
- [ ] Implement `convertToBooking()`
- [ ] Implement `getQuoteVersions()`
- [ ] Implement `compareQuotes()`
- [ ] Implement `expireOldQuotes()` cron
- [ ] Implement `getQuoteStats()`

### Step 4: Validation Schemas (0.5 day)
- [ ] Create `src/validation/quoteSchemas.js`
- [ ] Create `createQuoteSchema`
- [ ] Create `updateQuoteSchema`
- [ ] Create `sendQuoteSchema`
- [ ] Create `approveQuoteSchema`
- [ ] Create `rejectQuoteSchema`
- [ ] Create `reviseQuoteSchema`

### Step 5: Routes & Middleware (0.5 day)
- [ ] Create `src/routes/quote.js`
- [ ] Add all endpoints
- [ ] Apply RBAC middleware
- [ ] Apply validation middleware
- [ ] Add public routes for customer actions

### Step 6: Email Integration (0.5 day)
- [ ] Create email template for quote sending
- [ ] Integrate with Email service
- [ ] Add tracking links (view, approve, reject)
- [ ] Add PDF attachments

### Step 7: Cron Jobs (0.5 day)
- [ ] Create job to expire old quotes daily
- [ ] Create job to send follow-up emails (day 3, 7)
- [ ] Add to Bull queue

### Step 8: Testing (1 day)
- [ ] Create `tests/integration/quote.test.js`
- [ ] Test quote creation from itinerary
- [ ] Test quote numbering sequence
- [ ] Test payment schedule calculation
- [ ] Test versioning/revisions
- [ ] Test status transitions
- [ ] Test PDF generation
- [ ] Test email sending
- [ ] Test approval/rejection
- [ ] Test expiry logic
- [ ] Test conversion to booking

## Testing Strategy

### Unit Tests
- [ ] Test `generateQuoteNumber()` uniqueness
- [ ] Test `createRevision()` increments version
- [ ] Test status transition methods
- [ ] Test expiry detection
- [ ] Test pricing calculations

### Integration Tests
- [ ] Test complete quote lifecycle
- [ ] Test PDF generation produces valid files
- [ ] Test email delivery with PDFs
- [ ] Test customer approval workflow
- [ ] Test quote comparison
- [ ] Test multi-tenant isolation
- [ ] Test RBAC permissions

### PDF Tests
- [ ] Test branded PDFs include tenant logo
- [ ] Test PDFs are readable (not corrupted)
- [ ] Test PDF size is reasonable (<5MB)
- [ ] Test PDF generation handles large itineraries

## Acceptance Criteria

- [ ] Quotes auto-generate unique numbers per tenant
- [ ] Payment schedule calculates correctly (% or fixed amounts)
- [ ] Quotes expire automatically after validity period
- [ ] PDFs generate with tenant branding (logo, colors)
- [ ] Quote PDFs include all pricing details
- [ ] Itinerary PDFs show day-wise breakdown
- [ ] Emails deliver with PDF attachments
- [ ] Customers can approve/reject via email links
- [ ] Revisions create new versions linked to parent
- [ ] Quote comparison shows side-by-side pricing
- [ ] Approved quotes can be converted to bookings
- [ ] Expired quotes cannot be approved
- [ ] All tests pass (>80% coverage)

## TODO Checklist

### Database
- [ ] Create Quote model
- [ ] Add indexes
- [ ] Test model methods

### Services
- [ ] Create pdfGenerationService.js
- [ ] Install Puppeteer
- [ ] Create HTML templates
- [ ] Implement branding logic
- [ ] PDF storage (S3/MinIO)

### Controllers
- [ ] Create quoteController.js
- [ ] Implement all CRUD operations
- [ ] Implement workflow actions
- [ ] Implement PDF generation
- [ ] Implement email sending

### Validation
- [ ] Create quoteSchemas.js
- [ ] All validation schemas

### Routes
- [ ] Create quote.js routes
- [ ] Public routes for customers
- [ ] Apply RBAC
- [ ] Mount in app.js

### Email
- [ ] Quote email template
- [ ] Tracking links
- [ ] PDF attachments

### Cron Jobs
- [ ] Expiry job
- [ ] Follow-up email job

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] PDF generation tests
- [ ] Email delivery tests

### Documentation
- [ ] Update API documentation
- [ ] PDF template guide
- [ ] Customer approval flow diagram

## Dependencies

**NPM Packages:**
```bash
npm install puppeteer
npm install handlebars  # For HTML templates
```

**Environment Variables:**
```env
PDF_STORAGE_PATH=/tmp/pdfs
PDF_BUCKET=travel-crm-pdfs
QUOTE_VALIDITY_DAYS=7
QUOTE_FOLLOW_UP_DAYS=3,7
```

## Notes

- Quote PDFs are customer-facing - quality matters
- Branding must be pixel-perfect (logos, colors)
- PDF generation can be slow - consider queue
- Store PDFs in S3 for scalability
- Consider PDF archival after 90 days
- Track quote conversion rates for analytics
- Implement quote approval magic links (no login required)
