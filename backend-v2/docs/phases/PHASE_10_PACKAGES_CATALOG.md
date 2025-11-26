# Phase 10: Packages Catalog

**Status:** ❌ Not Started  
**Priority:** P1 (High)  
**Estimated Time:** 4-5 days  
**Dependencies:** Phase 2 (Rate Lists), Phase 4 (Itinerary Builder)

## Overview

Pre-built package catalog with publishing, browsing, filtering, and search capabilities for customers to explore travel packages.

## Current Implementation Status

### ✅ Implemented
- None - This phase is completely new

### ❌ Missing (100%)
- [ ] **Package model** with complete schema
- [ ] **Package creation** from rate lists
- [ ] **Day-wise itinerary** structure
- [ ] **Publish/unpublish** workflow
- [ ] **Visibility controls** (public/private/agent-only)
- [ ] **Featured packages** selection
- [ ] **Package browsing** (public endpoint)
- [ ] **Advanced filters** (destination, price, duration, dates)
- [ ] **Text search** (name, destination, highlights)
- [ ] **Sorting** (price, popularity, rating, newest)
- [ ] **View counter** (analytics)
- [ ] **Quote generation** from package
- [ ] **Image management**
- [ ] **SEO fields**

## Database Models

### Package Schema (NEW - To Implement)

```javascript
const packageSchema = new mongoose.Schema({
  // Multi-tenancy
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Package identification
  packageCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },

  // Basic information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },

  tagline: {
    type: String,
    trim: true,
    maxlength: 250,
  },

  description: {
    type: String,
    required: true,
  },

  highlights: [String],

  // Destination
  destination: {
    country: {
      type: String,
      required: true,
      index: true,
    },
    city: String,
    region: String,
    places: [String],
  },

  // Trip details
  duration: {
    days: {
      type: Number,
      required: true,
      min: 1,
    },
    nights: {
      type: Number,
      required: true,
      min: 0,
    },
  },

  // Day-wise itinerary
  itinerary: [{
    day: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    
    accommodation: {
      name: String,
      type: String,
      rating: Number,
      roomType: String,
      rateList: {
        type: Schema.Types.ObjectId,
        ref: 'RateList',
      },
    },

    activities: [{
      time: String,
      name: {
        type: String,
        required: true,
      },
      description: String,
      duration: String,
      rateList: {
        type: Schema.Types.ObjectId,
        ref: 'RateList',
      },
    }],

    meals: [{
      type: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
      },
      included: {
        type: Boolean,
        default: true,
      },
      description: String,
    }],

    transport: {
      mode: String,
      description: String,
      rateList: {
        type: Schema.Types.ObjectId,
        ref: 'RateList',
      },
    },
  }],

  // Pricing
  pricing: {
    currency: {
      type: String,
      default: 'USD',
    },
    
    // Base price per person
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Pricing by occupancy
    singleOccupancy: Number,
    doubleOccupancy: Number,
    tripleOccupancy: Number,

    // Child pricing
    childPrice: Number,
    infantPrice: Number,

    // Seasonal pricing
    seasonalPricing: [{
      season: String,
      dateRanges: [{
        from: Date,
        to: Date,
      }],
      priceMultiplier: {
        type: Number,
        default: 1.0,
      },
    }],

    // Group discounts
    groupDiscounts: [{
      minPeople: Number,
      maxPeople: Number,
      discountPercentage: Number,
    }],
  },

  // Inclusions & Exclusions
  inclusions: [String],
  exclusions: [String],

  // Important information
  importantInfo: {
    thingsToCarry: [String],
    prerequisites: [String],
    restrictions: [String],
  },

  // Terms & Conditions
  termsAndConditions: String,
  cancellationPolicy: String,

  // Media
  images: [{
    url: {
      type: String,
      required: true,
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
    order: Number,
  }],

  videos: [{
    url: String,
    platform: {
      type: String,
      enum: ['youtube', 'vimeo', 'other'],
    },
    embedCode: String,
  }],

  // Availability
  availability: {
    startDate: Date, // Season start
    endDate: Date,   // Season end
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    }],
    blackoutDates: [{
      from: Date,
      to: Date,
      reason: String,
    }],
    maxBookings: Number, // Total capacity
    currentBookings: {
      type: Number,
      default: 0,
    },
  },

  // Publishing & Visibility
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },

  visibility: {
    type: String,
    enum: ['public', 'private', 'agent_only'],
    default: 'private',
    index: true,
  },

  isPublished: {
    type: Boolean,
    default: false,
    index: true,
  },

  publishedAt: Date,

  publishedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  // Featured & Promotions
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },

  featuredUntil: Date,

  isPromoted: {
    type: Boolean,
    default: false,
  },

  promotionBadge: String, // "Hot Deal", "Limited Offer", etc.

  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    ogImage: String,
  },

  // Analytics
  stats: {
    viewCount: {
      type: Number,
      default: 0,
    },
    quoteCount: {
      type: Number,
      default: 0,
    },
    bookingCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },

  // Tags & Categories
  tags: [String],
  category: {
    type: String,
    enum: ['adventure', 'leisure', 'honeymoon', 'family', 'business', 'pilgrimage', 'luxury', 'budget', 'group', 'solo'],
    index: true,
  },

  // Related packages
  relatedPackages: [{
    type: Schema.Types.ObjectId,
    ref: 'Package',
  }],

  // Version control
  version: {
    type: Number,
    default: 1,
  },

  // Metadata
  notes: String,

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
packageSchema.index({ tenant: 1, packageCode: 1 }, { unique: true });
packageSchema.index({ tenant: 1, status: 1, isPublished: 1 });
packageSchema.index({ tenant: 1, visibility: 1, isPublished: 1 });
packageSchema.index({ 'destination.country': 1, 'destination.city': 1 });
packageSchema.index({ 'pricing.basePrice': 1 });
packageSchema.index({ category: 1, isFeatured: 1 });
packageSchema.index({ tags: 1 });

// Text search index
packageSchema.index({
  name: 'text',
  tagline: 'text',
  description: 'text',
  highlights: 'text',
  'destination.country': 'text',
  'destination.city': 'text',
});

// Virtual: Total days/nights display
packageSchema.virtual('durationDisplay').get(function() {
  return `${this.duration.days} Days / ${this.duration.nights} Nights`;
});

// Virtual: Is available now
packageSchema.virtual('isAvailable').get(function() {
  if (!this.isPublished || this.status !== 'published') return false;
  
  const now = new Date();
  if (this.availability.startDate && now < this.availability.startDate) return false;
  if (this.availability.endDate && now > this.availability.endDate) return false;
  
  return true;
});

// Method: Increment view counter (debounced via service)
packageSchema.methods.incrementView = function() {
  this.stats.viewCount += 1;
  return this.save();
};

// Method: Increment quote counter
packageSchema.methods.incrementQuote = function() {
  this.stats.quoteCount += 1;
  return this.save();
};

// Method: Publish package
packageSchema.methods.publish = function(userId) {
  this.status = 'published';
  this.isPublished = true;
  this.publishedAt = new Date();
  this.publishedBy = userId;
};

// Method: Unpublish package
packageSchema.methods.unpublish = function() {
  this.status = 'draft';
  this.isPublished = false;
};

// Static: Generate package code
packageSchema.statics.generatePackageCode = async function(tenantId) {
  const count = await this.countDocuments({ tenant: tenantId });
  const sequence = String(count + 1).padStart(4, '0');
  return `PKG-${sequence}`;
};

// Static: Get featured packages
packageSchema.statics.getFeatured = function(tenantId, limit = 10) {
  return this.find({
    tenant: tenantId,
    isPublished: true,
    isFeatured: true,
    $or: [
      { featuredUntil: { $exists: false } },
      { featuredUntil: { $gte: new Date() } },
    ],
  })
    .sort({ 'stats.viewCount': -1 })
    .limit(limit)
    .populate('relatedPackages', 'name slug pricing.basePrice images');
};

// Pre-save: Generate slug from name
packageSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Pre-save: Ensure only one primary image
packageSchema.pre('save', function(next) {
  if (this.isModified('images')) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Keep first, unset others
      this.images.forEach((img, idx) => {
        if (idx > 0) img.isPrimary = false;
      });
    }
  }
  next();
});
```

## API Endpoints

```javascript
// ========== Public Endpoints (Browse & Search) ==========

// Browse published packages
GET /packages/browse
Query params:
  - destination (country, city)
  - category
  - priceMin, priceMax
  - durationMin, durationMax
  - dateFrom, dateTo (availability)
  - tags
  - page, limit
  - sort (price, popularity, rating, newest)

// Search packages
GET /packages/search
Query params:
  - q (search query)
  - filters (same as browse)

// Get featured packages
GET /packages/featured

// Get package details (public)
GET /packages/:slug

// Similar packages
GET /packages/:slug/similar

// ========== Internal Endpoints (Operator/Admin) ==========

// List all packages (internal)
GET /packages
Query params: status, visibility, category, page, limit

// Get package by ID (internal)
GET /packages/id/:id

// Create package
POST /packages/create
Body: Package schema

// Update package
PATCH /packages/:id

// Delete package
DELETE /packages/:id

// Publish package
POST /packages/:id/publish

// Unpublish package
POST /packages/:id/unpublish

// Set as featured
POST /packages/:id/feature
Body: { featuredUntil }

// Unset featured
POST /packages/:id/unfeature

// Upload images
POST /packages/:id/images
Body: FormData with files

// Delete image
DELETE /packages/:id/images/:imageId

// Reorder images
PATCH /packages/:id/images/reorder
Body: { imageIds: [] }

// Create quote from package
POST /packages/:id/create-quote
Body: {
  travelDate,
  adults,
  children,
  infants,
  customizations
}

// Clone package
POST /packages/:id/clone

// Bulk operations
POST /packages/bulk-publish
Body: { packageIds: [] }

POST /packages/bulk-unpublish
Body: { packageIds: [] }

// Package statistics
GET /packages/:id/stats

// Analytics
GET /packages/analytics
Query: dateFrom, dateTo
```

## Implementation Steps

### Step 1: Create Package Model (1 day)
- [ ] Create `src/models/Package.js`
- [ ] Implement full schema
- [ ] Add all indexes (8 indexes)
- [ ] Add text search index
- [ ] Add virtual fields
- [ ] Implement `incrementView()`
- [ ] Implement `incrementQuote()`
- [ ] Implement `publish()`/`unpublish()`
- [ ] Implement `generatePackageCode()` static
- [ ] Implement `getFeatured()` static
- [ ] Add pre-save hooks (slug, primary image)

### Step 2: Package Controller (1.5 days)
- [ ] Create `src/controllers/packageController.js`
- [ ] Implement `browsePackages()` (public)
  - [ ] Apply filters (destination, price, duration, category)
  - [ ] Combine filters (AND logic)
  - [ ] Pagination
  - [ ] Sorting
  - [ ] Only show published + public/agent_only
- [ ] Implement `searchPackages()` (text search)
- [ ] Implement `getFeaturedPackages()`
- [ ] Implement `getPackageBySlug()` (public)
- [ ] Implement `getSimilarPackages()`
- [ ] Implement `getAllPackages()` (internal with filters)
- [ ] Implement `getPackageById()` (internal)
- [ ] Implement `createPackage()`
  - [ ] Auto-generate package code
  - [ ] Generate slug from name
  - [ ] Validate rate list references
- [ ] Implement `updatePackage()`
- [ ] Implement `deletePackage()`
- [ ] Implement `publishPackage()`
- [ ] Implement `unpublishPackage()`
- [ ] Implement `featurePackage()`
- [ ] Implement `unfeaturePackage()`
- [ ] Implement `createQuoteFromPackage()`
- [ ] Implement `clonePackage()`
- [ ] Implement `bulkPublish()`
- [ ] Implement `bulkUnpublish()`
- [ ] Implement `getPackageStats()`
- [ ] Implement `getAnalytics()`

### Step 3: Image Management (0.5 day)
- [ ] Install `multer` for file uploads
- [ ] Create image upload middleware
- [ ] Implement `uploadImages()`
- [ ] Implement `deleteImage()`
- [ ] Implement `reorderImages()`
- [ ] Store images in S3/MinIO
- [ ] Generate thumbnails (optional)

### Step 4: View Counter Service (0.5 day)
- [ ] Create `src/services/packageViewService.js`
- [ ] Implement debounced view counter
- [ ] Use Redis to track unique views (by IP + package)
- [ ] Update view count in batches (every 5 min)

### Step 5: Validation Schemas (0.5 day)
- [ ] Create `src/validation/packageSchemas.js`
- [ ] Create `createPackageSchema`
- [ ] Create `updatePackageSchema`
- [ ] Create `publishPackageSchema`
- [ ] Create `featurePackageSchema`
- [ ] Create `createQuoteFromPackageSchema`
- [ ] Create `searchPackagesSchema`
- [ ] Create `browsePackagesSchema`

### Step 6: Routes & Middleware (0.5 day)
- [ ] Create `src/routes/package.js`
- [ ] Add public routes (browse, search, featured, view)
- [ ] Add internal routes (CRUD, publish, feature)
- [ ] Apply RBAC (agents can create, admins can publish)
- [ ] Apply validation middleware
- [ ] Mount routes in `app.js`

### Step 7: Testing (1 day)
- [ ] Create `tests/integration/package.test.js`
- [ ] Test package creation
- [ ] Test package code generation (uniqueness)
- [ ] Test slug generation from name
- [ ] Test publish/unpublish workflow
- [ ] Test visibility controls
  - [ ] Public packages visible to all
  - [ ] Agent-only packages require authentication
  - [ ] Private packages not visible in browse
- [ ] Test featured packages
- [ ] Test browsing with filters
  - [ ] Destination filter
  - [ ] Price range filter
  - [ ] Duration filter
  - [ ] Date availability filter
  - [ ] Category filter
  - [ ] Combined filters
- [ ] Test text search
- [ ] Test sorting (price, popularity, newest)
- [ ] Test view counter
- [ ] Test quote generation from package
- [ ] Test image upload/delete/reorder
- [ ] Test similar packages
- [ ] Test multi-tenant isolation

## Testing Strategy

### Unit Tests
- [ ] Test package code generation
- [ ] Test slug generation
- [ ] Test virtual fields (durationDisplay, isAvailable)
- [ ] Test publish/unpublish methods
- [ ] Test primary image enforcement

### Integration Tests
- [ ] Test complete CRUD workflow
- [ ] Test browsing as public user
- [ ] Test browsing as authenticated agent
- [ ] Test all filter combinations
- [ ] Test text search relevance
- [ ] Test featured packages selection
- [ ] Test view counter accuracy
- [ ] Test quote generation from package

### Performance Tests
- [ ] Test browsing with 1000+ packages
- [ ] Test text search performance
- [ ] Test filter query performance
- [ ] Test view counter under load

## Acceptance Criteria

- [ ] Packages can be created with complete itinerary
- [ ] Package codes auto-generate uniquely per tenant
- [ ] Slugs auto-generate from package name
- [ ] Publish/unpublish workflow works correctly
- [ ] Public packages visible to all users
- [ ] Agent-only packages require authentication
- [ ] Private packages not visible in browse
- [ ] Featured packages show on homepage
- [ ] Browsing filters work correctly (all combinations)
- [ ] Text search returns relevant results
- [ ] Sorting works (price, popularity, rating, newest)
- [ ] View counter increments (debounced, unique by IP)
- [ ] Quote generation from package creates correct quote
- [ ] Images upload and display correctly
- [ ] Primary image enforcement works
- [ ] Similar packages algorithm works
- [ ] Multi-tenant isolation enforced
- [ ] All tests pass (>80% coverage)

## TODO Checklist

### Database
- [ ] Create Package model
- [ ] Add 8+ indexes
- [ ] Add text search index
- [ ] Add virtual fields
- [ ] Add instance methods
- [ ] Add static methods
- [ ] Add pre-save hooks

### Controller
- [ ] Create packageController.js
- [ ] Implement public endpoints (browse, search, featured, view)
- [ ] Implement internal CRUD endpoints
- [ ] Implement publish/unpublish
- [ ] Implement feature/unfeature
- [ ] Implement image management
- [ ] Implement quote creation
- [ ] Implement analytics

### Services
- [ ] Create packageViewService.js (debounced view counter)
- [ ] Redis-based unique view tracking
- [ ] Batch view count updates

### Validation
- [ ] Create packageSchemas.js
- [ ] All validation schemas

### Routes
- [ ] Create package.js routes
- [ ] Public routes
- [ ] Internal routes
- [ ] RBAC middleware
- [ ] Mount in app.js

### Image Upload
- [ ] Install multer
- [ ] Image upload middleware
- [ ] S3/MinIO integration
- [ ] Thumbnail generation (optional)

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance tests
- [ ] Filter combination tests
- [ ] Search relevance tests

### Documentation
- [ ] Update API docs
- [ ] Package creation guide
- [ ] SEO best practices guide

## Dependencies

**NPM Packages:**
```bash
npm install multer sharp  # Image upload and processing
```

**Environment Variables:**
```env
PACKAGE_IMAGE_BUCKET=travel-packages
MAX_PACKAGE_IMAGES=10
VIEW_COUNTER_BATCH_INTERVAL=300000  # 5 minutes
```

## Notes

- Packages are the marketing frontend - quality matters
- SEO optimization is critical for organic traffic
- View counter should be debounced to prevent spam
- Featured packages should rotate based on performance
- Consider A/B testing for package descriptions
- Track conversion rates (views → quotes → bookings)
- Implement package recommendations based on user behavior
- Consider package variants (economy/deluxe versions)
