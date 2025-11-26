# Phase 3: Packages Catalog

**Duration:** 1-1.5 weeks  
**Start:** Week 5-6  
**Dependencies:** Phase 2 (Suppliers & Rate Lists)  
**Status:** Not Started

---

## 🎯 Goals

1. Implement package creation from rate lists
2. Build publish/unpublish workflow with visibility controls
3. Implement browsing with advanced filters
4. Create search functionality
5. Implement sorting by multiple criteria
6. Build featured packages system
7. Track package statistics (views, quotes, bookings)
8. Implement SEO optimization

---

## 📦 Deliverables

- Package CRUD operations
- Day-wise itinerary composition from rate lists
- Publish/unpublish workflow
- Visibility settings (public/private/agent-only)
- Featured packages management
- Browse with filters (destination, price, duration, dates)
- Text search by keywords
- Sorting (price, popularity, rating, newest)
- Package view counter
- Image gallery management
- SEO fields and meta tags

---

## 🏗️ Database Model

### Package Model
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  
  name: String,                    // "Golden Triangle Tour - 7D/6N"
  slug: String,                    // "golden-triangle-tour-7d6n" (unique per tenant)
  code: String,                    // "PKG-GT-001"
  
  destination: {
    primary: String,               // "Delhi"
    cities: [String],              // ["Delhi", "Agra", "Jaipur"]
    state: String,
    country: String,
  },
  
  duration: {
    days: Number,                  // 7
    nights: Number,                // 6
  },
  
  // Day-wise itinerary
  itinerary: [{
    dayNumber: Number,
    title: String,                 // "Day 1: Arrival in Delhi"
    description: String,
    
    // Services included from rate lists
    accommodation: {
      rateListId: ObjectId,
      serviceName: String,
      checkIn: String,             // "14:00"
      checkOut: String,            // "11:00"
      roomType: String,
      mealPlan: String,            // "CP", "MAP", "AP"
    },
    
    transport: [{
      rateListId: ObjectId,
      type: String,                // "flight", "train", "car"
      from: String,
      to: String,
      departureTime: String,
      arrivalTime: String,
    }],
    
    activities: [{
      rateListId: ObjectId,
      name: String,
      duration: String,            // "2 hours"
      description: String,
    }],
    
    meals: [{
      rateListId: ObjectId,
      type: String,                // "breakfast", "lunch", "dinner"
      venue: String,
    }],
    
    guide: {
      rateListId: ObjectId,
      language: String,
      type: String,                // "full-day", "half-day"
    },
  }],
  
  // Pricing
  pricing: {
    baseCurrency: String,          // "INR"
    
    // Per person pricing by occupancy
    perPerson: [{
      occupancy: String,           // "single", "double", "triple"
      minPax: Number,
      maxPax: Number,
      basePrice: Number,
      taxPercentage: Number,
      totalPrice: Number,
    }],
    
    // Group pricing
    groupPricing: [{
      minPax: Number,
      maxPax: Number,
      pricePerPerson: Number,
    }],
    
    // What's included in price
    inclusions: [String],
    exclusions: [String],
    
    // Optional add-ons
    addOns: [{
      name: String,
      price: Number,
      description: String,
    }],
  },
  
  // Media
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean,
    order: Number,
  }],
  
  videos: [{
    url: String,
    title: String,
    thumbnail: String,
  }],
  
  // Publishing
  isPublished: Boolean,
  publishedAt: Date,
  publishedBy: ObjectId,
  
  visibility: String,              // "public", "private", "agent_only"
  isFeatured: Boolean,
  featuredOrder: Number,
  
  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    ogImage: String,
  },
  
  // Highlights
  highlights: [String],            // ["Taj Mahal visit", "Desert safari"]
  
  // Additional info
  themes: [String],                // ["Adventure", "Cultural", "Luxury"]
  travelStyle: String,             // "Budget", "Standard", "Luxury", "Premium"
  bestSeason: [String],            // ["October", "November", "December"]
  difficulty: String,              // "Easy", "Moderate", "Difficult"
  ageRestriction: {
    min: Number,
    max: Number,
  },
  
  // Requirements
  requirements: {
    fitness: String,
    documents: [String],           // ["Passport", "Visa"]
    vaccinations: [String],
  },
  
  // Terms & Policies
  cancellationPolicy: String,
  termsAndConditions: String,
  importantNotes: [String],
  
  // Statistics
  stats: {
    viewCount: Number,
    quoteCount: Number,
    bookingCount: Number,
    averageRating: Number,
    reviewCount: Number,
    lastBookedAt: Date,
  },
  
  status: String,                  // "draft", "published", "archived"
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
}
```

---

## 🔌 APIs

### Package Management APIs

#### 1. GET /packages/published
**Purpose:** Browse published packages (public endpoint)  
**Auth:** Optional (shows more if authenticated)  
**Query Params:**
- `destination` (optional): Filter by city/state/country
- `minPrice`, `maxPrice` (optional): Price range
- `duration` (optional): Filter by days (e.g., "7-10")
- `startDate`, `endDate` (optional): Available in date range
- `themes` (optional): Comma-separated themes
- `travelStyle` (optional): Budget/Standard/Luxury
- `sort` (optional): price_asc, price_desc, popularity, rating, newest
- `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Golden Triangle Tour - 7D/6N",
      "slug": "golden-triangle-tour-7d6n",
      "destination": {
        "primary": "Delhi",
        "cities": ["Delhi", "Agra", "Jaipur"]
      },
      "duration": { "days": 7, "nights": 6 },
      "pricing": {
        "baseCurrency": "INR",
        "perPerson": [
          { "occupancy": "double", "totalPrice": 25000 }
        ]
      },
      "images": [
        {
          "url": "https://cdn.example.com/packages/golden-triangle-1.jpg",
          "isPrimary": true
        }
      ],
      "stats": {
        "viewCount": 1250,
        "averageRating": 4.5,
        "reviewCount": 45
      },
      "isFeatured": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "filters": {
      "destinations": ["Delhi", "Agra", "Jaipur", "Mumbai"],
      "priceRange": { "min": 15000, "max": 150000 },
      "durations": [3, 5, 7, 10, 14],
      "themes": ["Adventure", "Cultural", "Luxury"]
    }
  },
  "traceId": "req_abc123"
}
```

#### 2. GET /packages/filter
**Purpose:** Filter packages with advanced criteria  
**Auth:** Optional  
**Query Params:** (Same as /packages/published with additional filters)

#### 3. GET /packages/search
**Purpose:** Text search packages  
**Auth:** Optional  
**Query Params:**
- `q` (required): Search query
- `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Golden Triangle Tour - 7D/6N",
      "highlights": ["Taj Mahal visit", "Amber Fort"],
      "matchScore": 0.95
    }
  ],
  "meta": {
    "query": "taj mahal",
    "total": 12
  },
  "traceId": "req_abc123"
}
```

#### 4. GET /packages/featured
**Purpose:** Get featured packages  
**Auth:** None  
**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Golden Triangle Tour",
      "featuredOrder": 1
    }
  ],
  "traceId": "req_abc123"
}
```

#### 5. GET /packages/:id
**Purpose:** Get package details  
**Auth:** Optional (visibility check)  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Golden Triangle Tour - 7D/6N",
    "itinerary": [
      {
        "dayNumber": 1,
        "title": "Day 1: Arrival in Delhi",
        "description": "Arrive at IGI Airport...",
        "accommodation": {
          "serviceName": "The Imperial Hotel",
          "roomType": "Deluxe Room"
        },
        "activities": [
          {
            "name": "Red Fort Visit",
            "duration": "2 hours"
          }
        ]
      }
    ],
    "pricing": {
      "perPerson": [
        {
          "occupancy": "double",
          "basePrice": 23000,
          "taxPercentage": 5,
          "totalPrice": 24150
        }
      ],
      "inclusions": ["Accommodation", "Breakfast", "All transfers"],
      "exclusions": ["Airfare", "Personal expenses"]
    },
    "images": [...],
    "stats": {
      "viewCount": 1251,
      "averageRating": 4.5
    }
  },
  "traceId": "req_abc123"
}
```

#### 6. POST /packages/create
**Purpose:** Create new package  
**Auth:** Bearer token + `packages:create` permission  
**Request:**
```json
{
  "name": "Golden Triangle Tour - 7D/6N",
  "destination": {
    "primary": "Delhi",
    "cities": ["Delhi", "Agra", "Jaipur"],
    "country": "India"
  },
  "duration": { "days": 7, "nights": 6 },
  "itinerary": [
    {
      "dayNumber": 1,
      "title": "Day 1: Arrival in Delhi",
      "accommodation": {
        "rateListId": "507f1f77bcf86cd799439020"
      }
    }
  ],
  "pricing": {
    "baseCurrency": "INR",
    "perPerson": [
      {
        "occupancy": "double",
        "basePrice": 25000
      }
    ]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "slug": "golden-triangle-tour-7d6n",
    "message": "Package created successfully"
  },
  "traceId": "req_abc123"
}
```

#### 7. PATCH /packages/:id
**Purpose:** Update package  
**Auth:** Bearer token + `packages:update` permission

#### 8. DELETE /packages/:id
**Purpose:** Delete package  
**Auth:** Bearer token + `packages:delete` permission

#### 9. POST /packages/:id/publish
**Purpose:** Publish package  
**Auth:** Bearer token + `packages:update` permission  
**Request:**
```json
{
  "visibility": "public"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Package published successfully",
    "publishedAt": "2025-11-23T10:30:00Z"
  },
  "traceId": "req_abc123"
}
```

#### 10. POST /packages/:id/unpublish
**Purpose:** Unpublish package  
**Auth:** Bearer token + `packages:update` permission

#### 11. POST /packages/:id/quote
**Purpose:** Create quote from package  
**Auth:** Bearer token  
**Request:**
```json
{
  "queryId": "507f1f77bcf86cd799439030",
  "travelDates": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-07"
  },
  "travelers": {
    "adults": 2,
    "children": 1,
    "infants": 0
  },
  "customizations": {
    "accommodation": "upgrade",
    "transport": "private"
  }
}
```

---

## 📝 Implementation Details

### 1. Package Service

**File:** `src/services/packageService.js`

```javascript
const Package = require('../models/Package');
const RateList = require('../models/RateList');
const { NotFoundError, ValidationError } = require('../lib/errors');
const logger = require('../lib/logger');

class PackageService {
  /**
   * Create package from rate lists
   */
  async createPackage(tenantId, userId, packageData) {
    // Validate rate lists exist
    const rateListIds = this.extractRateListIds(packageData.itinerary);
    const rateLists = await RateList.find({
      _id: { $in: rateListIds },
      tenantId,
      status: 'published',
    });
    
    if (rateLists.length !== rateListIds.length) {
      throw new ValidationError('Some rate lists not found or not published');
    }
    
    // Generate unique slug
    const slug = await this.generateUniqueSlug(tenantId, packageData.name);
    
    // Calculate pricing from rate lists
    const pricing = await this.calculatePackagePricing(
      packageData.itinerary,
      rateLists,
      packageData.pricing
    );
    
    const pkg = await Package.create({
      ...packageData,
      tenantId,
      slug,
      pricing,
      status: 'draft',
      createdBy: userId,
      stats: {
        viewCount: 0,
        quoteCount: 0,
        bookingCount: 0,
        reviewCount: 0,
        averageRating: 0,
      },
    });
    
    logger.info('Package created', {
      packageId: pkg._id,
      name: pkg.name,
      tenantId,
    });
    
    return pkg;
  }
  
  /**
   * Publish package
   */
  async publishPackage(packageId, tenantId, userId, visibility = 'public') {
    const pkg = await Package.findOne({ _id: packageId, tenantId });
    
    if (!pkg) {
      throw new NotFoundError('Package not found');
    }
    
    // Validate package is complete
    this.validatePackageComplete(pkg);
    
    pkg.isPublished = true;
    pkg.publishedAt = new Date();
    pkg.publishedBy = userId;
    pkg.visibility = visibility;
    pkg.status = 'published';
    
    await pkg.save();
    
    logger.info('Package published', {
      packageId: pkg._id,
      visibility,
      userId,
    });
    
    return pkg;
  }
  
  /**
   * Increment view counter
   */
  async incrementViewCount(packageId) {
    await Package.findByIdAndUpdate(
      packageId,
      { $inc: { 'stats.viewCount': 1 } },
      { new: false }
    );
  }
  
  /**
   * Search packages by text
   */
  async searchPackages(tenantId, query, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    const searchQuery = {
      tenantId,
      isPublished: true,
      $text: { $search: query },
    };
    
    const packages = await Package.find(searchQuery)
      .select('name slug destination duration pricing images stats highlights')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Package.countDocuments(searchQuery);
    
    return {
      packages: packages.map(pkg => ({
        ...pkg,
        matchScore: pkg.score,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
  
  /**
   * Filter packages with advanced criteria
   */
  async filterPackages(tenantId, filters, options = {}) {
    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;
    
    const query = {
      tenantId,
      isPublished: true,
      visibility: { $in: ['public'] }, // Add agent_only if authenticated
    };
    
    // Destination filter
    if (filters.destination) {
      query.$or = [
        { 'destination.primary': new RegExp(filters.destination, 'i') },
        { 'destination.cities': new RegExp(filters.destination, 'i') },
        { 'destination.state': new RegExp(filters.destination, 'i') },
        { 'destination.country': new RegExp(filters.destination, 'i') },
      ];
    }
    
    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      query['pricing.perPerson.totalPrice'] = {};
      if (filters.minPrice) {
        query['pricing.perPerson.totalPrice'].$gte = parseFloat(filters.minPrice);
      }
      if (filters.maxPrice) {
        query['pricing.perPerson.totalPrice'].$lte = parseFloat(filters.maxPrice);
      }
    }
    
    // Duration filter
    if (filters.duration) {
      const [minDays, maxDays] = filters.duration.split('-').map(Number);
      query['duration.days'] = { $gte: minDays, $lte: maxDays || minDays };
    }
    
    // Themes filter
    if (filters.themes) {
      const themesArray = filters.themes.split(',');
      query.themes = { $in: themesArray };
    }
    
    // Travel style filter
    if (filters.travelStyle) {
      query.travelStyle = filters.travelStyle;
    }
    
    // Sort mapping
    const sortMap = {
      price_asc: { 'pricing.perPerson.0.totalPrice': 1 },
      price_desc: { 'pricing.perPerson.0.totalPrice': -1 },
      popularity: { 'stats.viewCount': -1 },
      rating: { 'stats.averageRating': -1 },
      newest: { createdAt: -1 },
    };
    
    const sortOption = sortMap[sort] || { createdAt: -1 };
    
    const packages = await Package.find(query)
      .select('name slug destination duration pricing images stats isFeatured')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Package.countDocuments(query);
    
    // Get filter options for UI
    const filterOptions = await this.getFilterOptions(tenantId);
    
    return {
      packages,
      total,
      page,
      pages: Math.ceil(total / limit),
      filters: filterOptions,
    };
  }
  
  /**
   * Get featured packages
   */
  async getFeaturedPackages(tenantId, limit = 10) {
    return await Package.find({
      tenantId,
      isPublished: true,
      isFeatured: true,
      visibility: 'public',
    })
      .select('name slug destination duration pricing images stats')
      .sort({ featuredOrder: 1 })
      .limit(limit)
      .lean();
  }
  
  // Helper methods
  
  extractRateListIds(itinerary) {
    const ids = new Set();
    itinerary.forEach(day => {
      if (day.accommodation?.rateListId) ids.add(day.accommodation.rateListId.toString());
      day.transport?.forEach(t => t.rateListId && ids.add(t.rateListId.toString()));
      day.activities?.forEach(a => a.rateListId && ids.add(a.rateListId.toString()));
      day.meals?.forEach(m => m.rateListId && ids.add(m.rateListId.toString()));
      if (day.guide?.rateListId) ids.add(day.guide.rateListId.toString());
    });
    return Array.from(ids);
  }
  
  async generateUniqueSlug(tenantId, name) {
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let counter = 1;
    let uniqueSlug = slug;
    
    while (await Package.exists({ tenantId, slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    
    return uniqueSlug;
  }
  
  async calculatePackagePricing(itinerary, rateLists, basePricing) {
    // Implement pricing calculation logic
    // This is a placeholder - actual implementation would be complex
    return basePricing;
  }
  
  validatePackageComplete(pkg) {
    if (!pkg.itinerary || pkg.itinerary.length === 0) {
      throw new ValidationError('Package must have at least one day in itinerary');
    }
    
    if (!pkg.images || pkg.images.length === 0) {
      throw new ValidationError('Package must have at least one image');
    }
    
    if (!pkg.pricing || !pkg.pricing.perPerson || pkg.pricing.perPerson.length === 0) {
      throw new ValidationError('Package must have pricing information');
    }
  }
  
  async getFilterOptions(tenantId) {
    // Aggregate filter options from published packages
    const packages = await Package.find({ tenantId, isPublished: true });
    
    const destinations = [...new Set(packages.flatMap(p => p.destination.cities))];
    const themes = [...new Set(packages.flatMap(p => p.themes || []))];
    const durations = [...new Set(packages.map(p => p.duration.days))].sort((a, b) => a - b);
    const prices = packages.map(p => p.pricing.perPerson[0]?.totalPrice || 0);
    
    return {
      destinations: destinations.sort(),
      themes: themes.sort(),
      durations,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
    };
  }
}

module.exports = new PackageService();
```

### 2. Package Model with Text Index

**File:** `src/models/Package.js`

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const packageSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  code: String,
  
  destination: {
    primary: String,
    cities: [String],
    state: String,
    country: String,
  },
  
  duration: {
    days: { type: Number, required: true },
    nights: { type: Number, required: true },
  },
  
  itinerary: [{
    dayNumber: Number,
    title: String,
    description: String,
    accommodation: {
      rateListId: Schema.Types.ObjectId,
      serviceName: String,
      checkIn: String,
      checkOut: String,
      roomType: String,
      mealPlan: String,
    },
    transport: [{
      rateListId: Schema.Types.ObjectId,
      type: String,
      from: String,
      to: String,
    }],
    activities: [{
      rateListId: Schema.Types.ObjectId,
      name: String,
      duration: String,
    }],
    meals: [{
      rateListId: Schema.Types.ObjectId,
      type: String,
    }],
    guide: {
      rateListId: Schema.Types.ObjectId,
      language: String,
    },
  }],
  
  pricing: {
    baseCurrency: String,
    perPerson: [{
      occupancy: String,
      minPax: Number,
      maxPax: Number,
      basePrice: Number,
      taxPercentage: Number,
      totalPrice: Number,
    }],
    inclusions: [String],
    exclusions: [String],
  },
  
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean,
    order: Number,
  }],
  
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  publishedBy: Schema.Types.ObjectId,
  visibility: { type: String, enum: ['public', 'private', 'agent_only'], default: 'private' },
  isFeatured: { type: Boolean, default: false },
  featuredOrder: Number,
  
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
  },
  
  highlights: [String],
  themes: [String],
  travelStyle: { type: String, enum: ['Budget', 'Standard', 'Luxury', 'Premium'] },
  
  stats: {
    viewCount: { type: Number, default: 0 },
    quoteCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  createdBy: Schema.Types.ObjectId,
}, {
  timestamps: true,
});

// Indexes
packageSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
packageSchema.index({ tenantId: 1, isPublished: 1, visibility: 1 });
packageSchema.index({ 'destination.cities': 1 });
packageSchema.index({ themes: 1 });
packageSchema.index({ 'pricing.perPerson.totalPrice': 1 });
packageSchema.index({ 'stats.averageRating': -1 });
packageSchema.index({ createdAt: -1 });

// Text search index
packageSchema.index({
  name: 'text',
  'destination.cities': 'text',
  highlights: 'text',
  'itinerary.title': 'text',
  'itinerary.description': 'text',
});

module.exports = mongoose.model('Package', packageSchema);
```

---

## ✅ Acceptance Criteria

- [ ] Packages with `visibility=public` visible to all
- [ ] Packages with `visibility=agent_only` visible only to agents
- [ ] Text search finds packages by name, destination, highlights
- [ ] Filters work in combination (destination + price + dates)
- [ ] View counter increments on detail view (debounced)
- [ ] Featured packages return max 10 results
- [ ] Slug auto-generated and unique per tenant
- [ ] Images uploaded and optimized
- [ ] Publishing validates package completeness
- [ ] Test coverage > 80%

---

## 📋 TODO Checklist

### Models
- [ ] Create `src/models/Package.js` with full schema
- [ ] Add all indexes for performance
- [ ] Add text search index
- [ ] Test model validation

### Services
- [ ] Create `src/services/packageService.js`
- [ ] Implement package creation
- [ ] Implement publish/unpublish workflow
- [ ] Implement filter logic
- [ ] Implement search logic
- [ ] Implement view counter (Redis-based debouncing)
- [ ] Test all service methods

### Controllers
- [ ] Create `src/controllers/packageController.js`
- [ ] Implement all CRUD endpoints
- [ ] Implement filter/search endpoints
- [ ] Test controllers

### Routes
- [ ] Create `src/routes/package.js`
- [ ] Wire up routes in app
- [ ] Add RBAC middleware to protected routes

### Image Management
- [ ] Image upload endpoint
- [ ] Image optimization (Sharp)
- [ ] Gallery reordering
- [ ] Primary image selection

### Testing
- [ ] Integration tests for package CRUD
- [ ] Integration tests for publish workflow
- [ ] Integration tests for filtering
- [ ] Integration tests for search
- [ ] Test view counter
- [ ] Coverage > 80%

### Documentation
- [ ] Update OpenAPI spec
- [ ] Add examples

---

## 🔗 Next Phase Dependencies

Phase 4 (Queries & Assignment) will use:
- Packages for quote creation
- Package visibility for query assignment
