# Phase 12: Customer Portal & Document Management

**Status:** ❌ Not Started  
**Priority:** P1 (High)  
**Estimated Time:** 4-5 days  
**Dependencies:** Phase 5 (Booking), Phase 6 (Quotes), Phase 7 (Payments)

## Overview

Customer-facing portal for self-service access to queries, quotes, bookings, payments, and document management with OCR capabilities.

## Current Implementation Status

### ✅ Implemented
- None - This phase is completely new

### ❌ Missing (100%)
- [ ] **Customer portal APIs**
- [ ] **Document model**
- [ ] **Document upload** (S3/MinIO)
- [ ] **OCR integration** (Tesseract.js)
- [ ] **Document verification** workflow
- [ ] **Expiry alerts** system
- [ ] **Document sharing** with agents
- [ ] **Review submission**
- [ ] **Customer dashboard**

## Database Models

### Document Schema (NEW - To Implement)

```javascript
const documentSchema = new mongoose.Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Owner (customer)
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User', // or Customer model if separate
    required: true,
    index: true,
  },

  // Related booking (optional)
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    index: true,
  },

  // Document type
  documentType: {
    type: String,
    required: true,
    enum: [
      'passport',
      'visa',
      'pan_card',
      'aadhar_card',
      'driving_license',
      'photo',
      'vaccination_certificate',
      'insurance',
      'flight_ticket',
      'hotel_voucher',
      'other'
    ],
    index: true,
  },

  // File information
  fileName: {
    type: String,
    required: true,
  },

  fileUrl: {
    type: String,
    required: true,
  },

  fileSize: Number, // Bytes

  mimeType: String,

  thumbnailUrl: String,

  // Document details
  documentNumber: String, // Extracted via OCR or entered manually

  issuedBy: String,

  issueDate: Date,

  expiryDate: {
    type: Date,
    index: true,
  },

  issuedCountry: String,

  // OCR extracted data
  ocrData: {
    extracted: {
      type: Boolean,
      default: false,
    },
    extractedAt: Date,
    confidence: Number, // 0-100
    rawData: Schema.Types.Mixed,
    fields: {
      fullName: String,
      dateOfBirth: Date,
      nationality: String,
      gender: String,
      passportNumber: String,
      placeOfIssue: String,
      // Add more fields as needed
    },
  },

  // Verification
  verificationStatus: {
    type: String,
    enum: ['pending', 'in_review', 'verified', 'rejected', 'expired'],
    default: 'pending',
    index: true,
  },

  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  verifiedAt: Date,

  verificationNotes: String,

  rejectionReason: String,

  // Expiry tracking
  expiryAlerts: [{
    daysBeforeExpiry: Number, // e.g., 90, 60, 30
    sentAt: Date,
    emailSent: Boolean,
  }],

  isExpired: {
    type: Boolean,
    default: false,
  },

  expiredAt: Date,

  // Sharing
  sharedWith: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
    permissions: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view',
    },
    expiresAt: Date,
  }],

  isPublic: {
    type: Boolean,
    default: false,
  },

  // Metadata
  tags: [String],
  notes: String,

  uploadedBy: {
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
documentSchema.index({ tenant: 1, customer: 1, documentType: 1 });
documentSchema.index({ tenant: 1, verificationStatus: 1 });
documentSchema.index({ tenant: 1, expiryDate: 1 });
documentSchema.index({ tenant: 1, booking: 1 });

// Virtual: Days until expiry
documentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const now = new Date();
  const diff = this.expiryDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method: Mark as verified
documentSchema.methods.verify = function(userId, notes) {
  this.verificationStatus = 'verified';
  this.verifiedBy = userId;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
};

// Method: Reject document
documentSchema.methods.reject = function(userId, reason) {
  this.verificationStatus = 'rejected';
  this.verifiedBy = userId;
  this.verifiedAt = new Date();
  this.rejectionReason = reason;
};

// Method: Share with user
documentSchema.methods.shareWith = function(userId, permissions = 'view', expiresAt = null) {
  // Remove existing share if present
  this.sharedWith = this.sharedWith.filter(share => !share.user.equals(userId));
  
  // Add new share
  this.sharedWith.push({
    user: userId,
    sharedAt: new Date(),
    permissions,
    expiresAt,
  });
};

// Method: Check if expired
documentSchema.methods.checkExpiry = function() {
  if (this.expiryDate && new Date() > this.expiryDate && !this.isExpired) {
    this.isExpired = true;
    this.expiredAt = new Date();
    this.verificationStatus = 'expired';
    return true;
  }
  return false;
};

// Pre-save: Check expiry
documentSchema.pre('save', function(next) {
  this.checkExpiry();
  next();
});
```

## API Endpoints

```javascript
// ========== Customer Portal - Queries ==========

// Get my queries
GET /customer/queries
Query params: status, page, limit

// Get query details
GET /customer/queries/:id

// Create new query
POST /customer/queries/create

// ========== Customer Portal - Quotes ==========

// Get my quotes
GET /customer/quotes
Query params: status, page, limit

// Get quote details
GET /customer/quotes/:id

// View quote PDF
GET /customer/quotes/:id/pdf

// Approve quote (magic link, no auth required)
POST /customer/quotes/:id/approve/:token
Body: { customerName, notes }

// Reject quote (magic link, no auth required)
POST /customer/quotes/:id/reject/:token
Body: { reason }

// Compare quotes
POST /customer/quotes/compare
Body: { quoteIds: [] }

// ========== Customer Portal - Bookings ==========

// Get my bookings
GET /customer/bookings
Query params: status, upcoming, past, page, limit

// Get booking details
GET /customer/bookings/:id

// Download booking voucher
GET /customer/bookings/:id/voucher

// Get trip itinerary
GET /customer/bookings/:id/itinerary

// ========== Customer Portal - Payments ==========

// Get my payments
GET /customer/payments
Query params: status, bookingId, page, limit

// Get payment details
GET /customer/payments/:id

// Download payment receipt
GET /customer/payments/:id/receipt

// Get payment history for booking
GET /customer/bookings/:bookingId/payments

// ========== Customer Portal - Documents ==========

// Get my documents
GET /customer/documents
Query params: documentType, bookingId, verificationStatus, page, limit

// Get document details
GET /customer/documents/:id

// Upload document
POST /customer/documents/upload
Body: FormData with file + metadata

// Update document details
PATCH /customer/documents/:id
Body: { documentNumber, issueDate, expiryDate }

// Delete document
DELETE /customer/documents/:id

// Download document
GET /customer/documents/:id/download

// Get documents by type
GET /customer/documents/type/:documentType

// Get expiring documents
GET /customer/documents/expiring
Query params: days (default 90)

// ========== Document Verification (Operator/Agent) ==========

// Get pending documents
GET /documents/pending-verification
Query params: documentType, customer, page, limit

// Verify document
POST /documents/:id/verify
Body: { notes }

// Reject document
POST /documents/:id/reject
Body: { reason }

// Request additional documents
POST /documents/request
Body: { customerId, bookingId, documentTypes: [], message }

// ========== Document Sharing ==========

// Share document
POST /customer/documents/:id/share
Body: { userId, permissions, expiresAt }

// Revoke share
DELETE /customer/documents/:id/share/:userId

// Get shared documents (agent/operator view)
GET /documents/shared-with-me

// ========== Reviews ==========

// Submit review
POST /customer/reviews/submit
Body: { bookingId, overallRating, ratings: {}, reviewText, photos }

// Get my reviews
GET /customer/reviews

// ========== Customer Dashboard ==========

// Get dashboard data
GET /customer/dashboard
Returns: {
  upcomingTrips: [],
  recentQuotes: [],
  pendingPayments: [],
  expiringDocuments: [],
  stats: { totalBookings, totalSpent, documentsCount }
}

// ========== OCR Processing ==========

// Trigger OCR extraction (background job)
POST /documents/:id/extract-ocr

// Get OCR results
GET /documents/:id/ocr-data
```

## Implementation Steps

### Step 1: Create Document Model (0.5 day)
- [ ] Create `src/models/Document.js`
- [ ] Add all indexes
- [ ] Add virtual fields
- [ ] Add instance methods
- [ ] Add pre-save hooks

### Step 2: Document Upload Service (1 day)
- [ ] Create `src/services/documentUploadService.js`
- [ ] Integrate with S3/MinIO
- [ ] Implement file validation
  - [ ] File type validation (PDF, JPG, PNG)
  - [ ] File size limits (10MB max)
  - [ ] Virus scanning (ClamAV integration)
- [ ] Generate thumbnails for images
- [ ] Store metadata

### Step 3: OCR Integration (1.5 days)
- [ ] Install Tesseract.js: `npm install tesseract.js`
- [ ] Create `src/services/ocrService.js`
- [ ] Implement passport OCR
  - [ ] Extract passport number
  - [ ] Extract full name
  - [ ] Extract date of birth
  - [ ] Extract nationality
  - [ ] Extract issue/expiry dates
- [ ] Implement visa OCR
- [ ] Implement PAN card OCR (India-specific)
- [ ] Implement Aadhar card OCR (India-specific)
- [ ] Create Bull job for background OCR processing
- [ ] Store OCR results with confidence scores

### Step 4: Document Verification System (0.5 day)
- [ ] Create verification workflow
- [ ] Implement verification endpoints
- [ ] Send notifications on verification status change
- [ ] Track verifier and timestamp

### Step 5: Expiry Alert System (0.5 day)
- [ ] Create Bull job: Check expiring documents (runs daily)
- [ ] Find documents expiring in 90, 60, 30 days
- [ ] Send email alerts to customers
- [ ] Track alert sent status
- [ ] Mark expired documents

### Step 6: Customer Portal Controller (1 day)
- [ ] Create `src/controllers/customerPortalController.js`
- [ ] Implement `getMyQueries()`
- [ ] Implement `getMyQuotes()`
- [ ] Implement `getMyBookings()`
- [ ] Implement `getMyPayments()`
- [ ] Implement `getMyDocuments()`
- [ ] Implement `getDashboard()`
- [ ] Implement `submitReview()`
- [ ] All methods filter by authenticated customer

### Step 7: Document Controller (0.5 day)
- [ ] Create `src/controllers/documentController.js`
- [ ] Implement document CRUD
- [ ] Implement upload endpoint
- [ ] Implement verification endpoints
- [ ] Implement sharing endpoints
- [ ] Implement OCR trigger endpoint

### Step 8: Validation & Routes (0.5 day)
- [ ] Create `src/validation/documentSchemas.js`
- [ ] Create `src/validation/customerPortalSchemas.js`
- [ ] Create `src/routes/customerPortal.js`
- [ ] Create `src/routes/document.js`
- [ ] Apply authentication middleware
- [ ] Apply RBAC
- [ ] Mount routes in app.js

### Step 9: Testing (1 day)
- [ ] Create `tests/integration/customer-portal.test.js`
- [ ] Create `tests/integration/document.test.js`
- [ ] Test document upload
- [ ] Test OCR extraction
  - [ ] Test passport OCR accuracy
  - [ ] Test visa OCR
  - [ ] Test confidence scores
- [ ] Test verification workflow
- [ ] Test expiry alerts
- [ ] Test document sharing
- [ ] Test customer portal endpoints
- [ ] Test multi-tenant isolation

## Testing Strategy

### Unit Tests
- [ ] Test OCR extraction logic
- [ ] Test expiry calculation
- [ ] Test verification status transitions
- [ ] Test sharing permissions

### Integration Tests
- [ ] Test complete document lifecycle
- [ ] Test OCR accuracy with sample documents
- [ ] Test expiry alert job
- [ ] Test verification workflow
- [ ] Test customer portal access controls

### OCR Accuracy Tests
- [ ] Test with 10+ passport samples
- [ ] Test with various image qualities
- [ ] Test with different countries
- [ ] Measure extraction accuracy %

## Acceptance Criteria

- [ ] Documents upload to S3/MinIO successfully
- [ ] File validation rejects invalid files
- [ ] OCR extracts passport data with >80% accuracy
- [ ] OCR extracts visa data correctly
- [ ] Confidence scores reflect extraction quality
- [ ] Verification workflow updates status correctly
- [ ] Expiry alerts sent 90, 60, 30 days before
- [ ] Expired documents marked automatically
- [ ] Document sharing works with permissions
- [ ] Shared documents visible to agents
- [ ] Customer portal shows only own data
- [ ] Dashboard displays correct summary
- [ ] Reviews submit successfully
- [ ] All tests pass (>75% coverage)

## TODO Checklist

### Database
- [ ] Create Document model
- [ ] Add indexes
- [ ] Test model methods

### Services
- [ ] Create documentUploadService.js
- [ ] Create ocrService.js
- [ ] S3/MinIO integration
- [ ] Thumbnail generation
- [ ] Virus scanning integration

### OCR
- [ ] Install Tesseract.js
- [ ] Passport OCR implementation
- [ ] Visa OCR implementation
- [ ] PAN card OCR (optional)
- [ ] Aadhar OCR (optional)
- [ ] Background job for OCR

### Controllers
- [ ] Create customerPortalController.js
- [ ] Create documentController.js
- [ ] Implement all endpoints

### Expiry Alerts
- [ ] Create Bull job
- [ ] Email templates for alerts
- [ ] Alert tracking

### Validation & Routes
- [ ] Create schemas
- [ ] Create routes
- [ ] Apply auth & RBAC
- [ ] Mount routes

### Testing
- [ ] Document upload tests
- [ ] OCR accuracy tests
- [ ] Portal access tests
- [ ] Verification tests

### Documentation
- [ ] Update API docs
- [ ] OCR accuracy report
- [ ] Customer portal guide

## Dependencies

**NPM Packages:**
```bash
npm install tesseract.js multer sharp clamav.js
```

**Environment Variables:**
```env
DOCUMENT_STORAGE_BUCKET=travel-documents
MAX_DOCUMENT_SIZE=10485760  # 10MB
ALLOWED_DOCUMENT_TYPES=application/pdf,image/jpeg,image/png
OCR_CONFIDENCE_THRESHOLD=80
EXPIRY_ALERT_DAYS=90,60,30
ENABLE_VIRUS_SCAN=true
```

## Notes

- OCR accuracy depends on image quality
- Passport OCR is more reliable than visa OCR
- Store original files even after OCR extraction
- Consider manual verification for low-confidence extractions
- Expiry alerts are critical for international travel
- GDPR: Customers must be able to delete documents
- Encrypt sensitive documents at rest
- Audit all document access
- Consider third-party OCR APIs for better accuracy (AWS Textract, Google Vision)
