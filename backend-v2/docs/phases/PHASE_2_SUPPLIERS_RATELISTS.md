# Phase 2: Suppliers & Rate Lists

**Duration:** 2 weeks  
**Start:** Week 3-4  
**Dependencies:** Phase 1 (Auth & Multi-Tenant)  
**Status:** Not Started

---

## 🎯 Goals

1. Implement comprehensive supplier management system
2. Create flexible rate list structure supporting multiple service types
3. Implement seasonal pricing and bulk discounts
4. Build CSV/Excel import/export functionality
5. Implement date overlap validation
6. Create blackout dates management
7. Implement rate list versioning and publish workflow
8. Set up caching strategy for hot rate lists

---

## 📦 Deliverables

- Supplier CRUD with full business information
- Rate list system with seasonal pricing
- Bulk discount and age-based pricing
- CSV/Excel import with validation
- CSV/Excel export functionality
- Blackout dates management
- Rate list publish/unpublish workflow
- Caching layer for frequently accessed rate lists
- Comprehensive validation and error handling

---

## 🏗️ Database Models

### Supplier Model
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  
  name: String,                    // "Taj Hotels"
  type: String,                    // "hotel", "transport", "activity", "guide", "restaurant"
  code: String,                    // "SUP-TAJ-001" (unique per tenant)
  
  contact: {
    primaryName: String,
    primaryEmail: String,
    primaryPhone: String,
    secondaryName: String,
    secondaryEmail: String,
    secondaryPhone: String,
  },
  
  businessInfo: {
    registrationNumber: String,
    taxId: String,                 // GST/VAT number
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    website: String,
  },
  
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    branchName: String,
    ifscCode: String,
    swiftCode: String,
  },
  
  contractTerms: {
    commissionRate: Number,        // Percentage (e.g., 10 = 10%)
    commissionType: String,        // "percentage" or "fixed"
    paymentTerms: String,          // "net30", "net15", "advance"
    creditLimit: Number,
    contractStartDate: Date,
    contractEndDate: Date,
  },
  
  ratings: {
    quality: Number,               // 1-5
    pricing: Number,
    reliability: Number,
    avgRating: Number,
    totalReviews: Number,
  },
  
  settings: {
    isPreferred: Boolean,
    autoApproval: Boolean,
    notificationEmail: String,
  },
  
  metadata: {
    rateListsCount: Number,
    activeBookingsCount: Number,
    totalRevenue: Number,
    lastBookingDate: Date,
  },
  
  status: String,                  // "active", "inactive", "suspended"
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
}
```

### RateList Model
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  supplierId: ObjectId,
  
  name: String,                    // "Taj Mahal Palace - 2025 Rates"
  code: String,                    // "RATE-TAJ-2025-001"
  serviceType: String,             // "hotel", "transport", "activity", "meal", "guide"
  
  // Validity period
  validFrom: Date,
  validTo: Date,
  isActive: Boolean,
  
  // Location (for hotels/activities)
  destination: {
    city: String,
    state: String,
    country: String,
  },
  
  // Pricing structure
  pricing: {
    // Base pricing
    baseType: String,              // "per_night", "per_person", "per_trip", "per_hour", "per_day"
    baseCurrency: String,          // "INR", "USD", etc.
    
    // Seasonal pricing
    seasonal: [{
      name: String,               // "Peak Season", "Off Season"
      type: String,               // "peak", "normal", "off"
      dateRanges: [{
        from: Date,
        to: Date,
      }],
      pricePerUnit: Number,
      markup: Number,             // Additional % markup for this season
    }],
    
    // Occupancy-based pricing (for hotels)
    occupancy: [{
      type: String,               // "single", "double", "triple", "quad"
      pricePerNight: Number,
      maxOccupants: Number,
    }],
    
    // Age-based pricing (for activities/transport)
    ageBased: [{
      category: String,           // "adult", "child", "infant", "senior"
      ageFrom: Number,
      ageTo: Number,
      price: Number,
    }],
    
    // Bulk/Group discounts
    bulkDiscounts: [{
      minQuantity: Number,        // Minimum pax
      maxQuantity: Number,
      discountType: String,       // "percentage" or "fixed"
      discountValue: Number,
    }],
    
    // Additional charges
    additionalCharges: [{
      name: String,               // "Extra bed", "Airport pickup"
      price: Number,
      isMandatory: Boolean,
      applicableFor: String,      // "per_person", "per_booking", "per_night"
    }],
  },
  
  // Availability
  availability: {
    minNights: Number,            // Minimum nights (hotels)
    maxNights: Number,
    minPax: Number,               // Minimum travelers
    maxPax: Number,
    advanceBookingDays: Number,   // Minimum days in advance
    cutoffHours: Number,          // Booking cutoff (hours before)
    
    // Blackout dates
    blackoutDates: [{
      from: Date,
      to: Date,
      reason: String,
    }],
    
    // Weekly availability
    weeklyAvailability: {
      monday: Boolean,
      tuesday: Boolean,
      wednesday: Boolean,
      thursday: Boolean,
      friday: Boolean,
      saturday: Boolean,
      sunday: Boolean,
    },
  },
  
  // Policies
  cancellationPolicy: [{
    daysBeforeCheckIn: Number,
    refundPercentage: Number,
  }],
  
  inclusions: [String],           // ["Breakfast", "WiFi", "Parking"]
  exclusions: [String],           // ["Lunch", "Dinner"]
  
  // Metadata
  description: String,
  notes: String,
  attachments: [{
    name: String,
    url: String,
    type: String,
  }],
  
  // Versioning
  version: Number,
  previousVersionId: ObjectId,
  
  // Publishing
  publishedAt: Date,
  publishedBy: ObjectId,
  
  status: String,                 // "draft", "published", "archived"
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
}
```

---

## 🔌 APIs

### Supplier APIs

#### 1. GET /suppliers
**Purpose:** List all suppliers with filters  
**Auth:** Bearer token + `suppliers:read` permission  
**Query Params:**
- `type` (optional): Filter by supplier type
- `status` (optional): Filter by status
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page
- `sort` (optional): Sort field (e.g., `name`, `-createdAt`)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Taj Hotels",
      "type": "hotel",
      "code": "SUP-TAJ-001",
      "contact": {
        "primaryEmail": "bookings@taj.com",
        "primaryPhone": "+911234567890"
      },
      "ratings": {
        "avgRating": 4.5,
        "totalReviews": 120
      },
      "status": "active"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  },
  "traceId": "req_abc123"
}
```

#### 2. POST /suppliers
**Purpose:** Create new supplier  
**Auth:** Bearer token + `suppliers:create` permission  
**Request:**
```json
{
  "name": "Taj Hotels",
  "type": "hotel",
  "contact": {
    "primaryName": "Reservation Manager",
    "primaryEmail": "bookings@taj.com",
    "primaryPhone": "+911234567890"
  },
  "businessInfo": {
    "registrationNumber": "REG123456",
    "taxId": "GST123456",
    "address": {
      "city": "Mumbai",
      "country": "India"
    }
  },
  "contractTerms": {
    "commissionRate": 10,
    "commissionType": "percentage",
    "paymentTerms": "net30"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Taj Hotels",
    "code": "SUP-TAJ-001",
    "message": "Supplier created successfully"
  },
  "traceId": "req_abc123"
}
```

#### 3. GET /suppliers/:id
**Purpose:** Get supplier details  
**Auth:** Bearer token + `suppliers:read` permission

#### 4. PATCH /suppliers/:id
**Purpose:** Update supplier  
**Auth:** Bearer token + `suppliers:update` permission

#### 5. DELETE /suppliers/:id
**Purpose:** Delete/deactivate supplier  
**Auth:** Bearer token + `suppliers:delete` permission

---

### Rate List APIs

#### 6. GET /suppliers/rate-lists
**Purpose:** List rate lists with filters  
**Auth:** Bearer token + `suppliers:read` permission  
**Query Params:**
- `supplierId` (optional)
- `serviceType` (optional)
- `destination` (optional)
- `validOn` (optional): Filter rate lists valid on specific date
- `status` (optional): draft, published, archived
- `page`, `limit`, `sort`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Taj Mahal Palace - 2025 Rates",
      "code": "RATE-TAJ-2025-001",
      "supplierId": "507f1f77bcf86cd799439011",
      "supplierName": "Taj Hotels",
      "serviceType": "hotel",
      "validFrom": "2025-01-01",
      "validTo": "2025-12-31",
      "destination": {
        "city": "Mumbai",
        "country": "India"
      },
      "status": "published"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  },
  "traceId": "req_abc123"
}
```

#### 7. POST /suppliers/rate-lists/create
**Purpose:** Create new rate list  
**Auth:** Bearer token + `suppliers:create` permission  
**Request:** (See RateList model structure)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "message": "Rate list created successfully"
  },
  "traceId": "req_abc123"
}
```

#### 8. GET /suppliers/rate-lists/:id
**Purpose:** Get rate list details with full pricing  
**Auth:** Bearer token + `suppliers:read` permission

#### 9. PATCH /suppliers/rate-lists/:id
**Purpose:** Update rate list (creates new version if published)  
**Auth:** Bearer token + `suppliers:update` permission

#### 10. DELETE /suppliers/rate-lists/:id
**Purpose:** Delete/archive rate list  
**Auth:** Bearer token + `suppliers:delete` permission

#### 11. POST /suppliers/rate-lists/import
**Purpose:** Bulk import rate lists from CSV/Excel  
**Auth:** Bearer token + `suppliers:create` permission  
**Content-Type:** multipart/form-data  
**Request:**
```
file: [CSV/Excel file]
supplierId: "507f1f77bcf86cd799439011"
serviceType: "hotel"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "imported": 150,
    "failed": 5,
    "errors": [
      {
        "row": 12,
        "error": "Invalid date range",
        "data": { "validFrom": "2025-13-01" }
      }
    ]
  },
  "traceId": "req_abc123"
}
```

#### 12. GET /suppliers/rate-lists/export
**Purpose:** Export rate lists to CSV/Excel  
**Auth:** Bearer token + `suppliers:read` permission  
**Query Params:** Same as list filters  
**Response:** File download (CSV/Excel)

#### 13. POST /suppliers/rate-lists/bulk
**Purpose:** Bulk update rate lists  
**Auth:** Bearer token + `suppliers:update` permission  
**Request:**
```json
{
  "rateListIds": ["id1", "id2", "id3"],
  "updates": {
    "pricing.seasonal.0.markup": 5,
    "status": "published"
  }
}
```

#### 14. POST /suppliers/rate-lists/validate
**Purpose:** Validate rate list data (date overlaps, pricing)  
**Auth:** Bearer token + `suppliers:read` permission  
**Request:** Rate list data object

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "errors": [
      {
        "field": "validFrom",
        "message": "Overlaps with existing rate list RATE-TAJ-2024-002"
      },
      {
        "field": "pricing.seasonal.0.dateRanges",
        "message": "Date ranges overlap within same rate list"
      }
    ]
  },
  "traceId": "req_abc123"
}
```

#### 15. POST /suppliers/rate-lists/:id/publish
**Purpose:** Publish draft rate list  
**Auth:** Bearer token + `suppliers:update` permission

#### 16. POST /suppliers/rate-lists/:id/unpublish
**Purpose:** Unpublish rate list (archive)  
**Auth:** Bearer token + `suppliers:update` permission

---

## 📝 Implementation Details

### 1. Date Overlap Validation Service

**File:** `src/services/rateListValidationService.js`

```javascript
const RateList = require('../models/RateList');
const { ValidationError } = require('../lib/errors');

class RateListValidationService {
  /**
   * Check for date overlaps with existing rate lists
   */
  async checkDateOverlaps(tenantId, supplierId, validFrom, validTo, excludeId = null) {
    const query = {
      tenantId,
      supplierId,
      status: { $in: ['published', 'draft'] },
      $or: [
        {
          validFrom: { $lte: validTo },
          validTo: { $gte: validFrom },
        },
      ],
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const overlapping = await RateList.find(query).select('name code validFrom validTo');
    
    if (overlapping.length > 0) {
      throw new ValidationError('Date range overlaps with existing rate lists', {
        overlapping: overlapping.map(r => ({
          id: r._id,
          name: r.name,
          code: r.code,
          validFrom: r.validFrom,
          validTo: r.validTo,
        })),
      });
    }
  }
  
  /**
   * Validate seasonal date ranges don't overlap
   */
  validateSeasonalRanges(seasonal) {
    const ranges = seasonal.flatMap(s => 
      s.dateRanges.map(dr => ({ ...dr, seasonName: s.name }))
    );
    
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const r1 = ranges[i];
        const r2 = ranges[j];
        
        if (r1.from <= r2.to && r1.to >= r2.from) {
          throw new ValidationError('Seasonal date ranges overlap', {
            season1: r1.seasonName,
            season2: r2.seasonName,
            overlap: { from: r1.from, to: r2.to },
          });
        }
      }
    }
  }
  
  /**
   * Validate pricing structure
   */
  validatePricing(pricing) {
    const errors = [];
    
    // Validate seasonal pricing
    if (pricing.seasonal && pricing.seasonal.length > 0) {
      pricing.seasonal.forEach((season, idx) => {
        if (!season.pricePerUnit || season.pricePerUnit <= 0) {
          errors.push({
            field: `pricing.seasonal.${idx}.pricePerUnit`,
            message: 'Price must be greater than 0',
          });
        }
        
        if (!season.dateRanges || season.dateRanges.length === 0) {
          errors.push({
            field: `pricing.seasonal.${idx}.dateRanges`,
            message: 'At least one date range required',
          });
        }
      });
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Pricing validation failed', { errors });
    }
  }
}

module.exports = new RateListValidationService();
```

### 2. CSV Import Service

**File:** `src/services/csvImportService.js`

```javascript
const csv = require('csv-parser');
const fs = require('fs');
const { parse } = require('date-fns');

class CSVImportService {
  /**
   * Parse and import rate lists from CSV
   */
  async importRateLists(filePath, tenantId, supplierId, serviceType) {
    const results = [];
    const errors = [];
    let rowNumber = 0;
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;
          try {
            const rateList = this.parseRow(row, tenantId, supplierId, serviceType);
            results.push(rateList);
          } catch (error) {
            errors.push({
              row: rowNumber,
              error: error.message,
              data: row,
            });
          }
        })
        .on('end', () => {
          resolve({ results, errors });
        })
        .on('error', reject);
    });
  }
  
  /**
   * Parse single CSV row to rate list object
   */
  parseRow(row, tenantId, supplierId, serviceType) {
    return {
      tenantId,
      supplierId,
      serviceType,
      name: row.name,
      validFrom: parse(row.validFrom, 'yyyy-MM-dd', new Date()),
      validTo: parse(row.validTo, 'yyyy-MM-dd', new Date()),
      destination: {
        city: row.city,
        state: row.state,
        country: row.country,
      },
      pricing: {
        baseType: row.baseType || 'per_night',
        baseCurrency: row.baseCurrency || 'INR',
        seasonal: [{
          name: 'Default',
          type: 'normal',
          pricePerUnit: parseFloat(row.price),
          dateRanges: [{
            from: parse(row.validFrom, 'yyyy-MM-dd', new Date()),
            to: parse(row.validTo, 'yyyy-MM-dd', new Date()),
          }],
        }],
      },
      status: 'draft',
    };
  }
  
  /**
   * Generate CSV template
   */
  generateTemplate() {
    return [
      'name,validFrom,validTo,city,state,country,baseType,baseCurrency,price',
      'Sample Hotel Rate,2025-01-01,2025-12-31,Mumbai,Maharashtra,India,per_night,INR,5000',
    ].join('\n');
  }
}

module.exports = new CSVImportService();
```

### 3. Caching Strategy

**File:** `src/services/rateListCacheService.js`

```javascript
const redis = require('../lib/redis');
const logger = require('../lib/logger');

const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = 'ratelist:';

class RateListCacheService {
  /**
   * Get rate list from cache
   */
  async get(rateListId) {
    try {
      const cached = await redis.client.get(`${CACHE_PREFIX}${rateListId}`);
      if (cached) {
        logger.debug('Rate list cache hit', { rateListId });
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Cache get error', { error });
      return null;
    }
  }
  
  /**
   * Set rate list in cache
   */
  async set(rateListId, data) {
    try {
      await redis.client.setex(
        `${CACHE_PREFIX}${rateListId}`,
        CACHE_TTL,
        JSON.stringify(data)
      );
      logger.debug('Rate list cached', { rateListId });
    } catch (error) {
      logger.error('Cache set error', { error });
    }
  }
  
  /**
   * Invalidate cache for rate list
   */
  async invalidate(rateListId) {
    try {
      await redis.client.del(`${CACHE_PREFIX}${rateListId}`);
      logger.debug('Rate list cache invalidated', { rateListId });
    } catch (error) {
      logger.error('Cache invalidate error', { error });
    }
  }
  
  /**
   * Invalidate all rate lists for supplier
   */
  async invalidateSupplier(supplierId) {
    try {
      const pattern = `${CACHE_PREFIX}*`;
      const keys = await redis.client.keys(pattern);
      
      // Filter keys by supplierId (requires fetching from DB)
      // For now, just clear all - can be optimized
      if (keys.length > 0) {
        await redis.client.del(...keys);
        logger.debug('Supplier rate list cache cleared', { supplierId });
      }
    } catch (error) {
      logger.error('Cache clear error', { error });
    }
  }
}

module.exports = new RateListCacheService();
```

---

## 🧪 Testing

### Integration Tests

**File:** `tests/integration/rateList.test.js`

```javascript
const request = require('supertest');
const app = require('../../src/app');
const RateList = require('../../src/models/RateList');
const { connectDatabase, disconnectDatabase } = require('../../src/lib/database');

describe('Rate List Management', () => {
  let authToken;
  let supplierId;
  
  beforeAll(async () => {
    await connectDatabase();
    // Setup test data, login, get token
  });
  
  afterAll(async () => {
    await disconnectDatabase();
  });
  
  describe('POST /suppliers/rate-lists/create', () => {
    test('should create rate list successfully', async () => {
      const res = await request(app)
        .post('/suppliers/rate-lists/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId,
          name: 'Test Rate List',
          serviceType: 'hotel',
          validFrom: '2025-01-01',
          validTo: '2025-12-31',
          pricing: {
            baseType: 'per_night',
            baseCurrency: 'INR',
            seasonal: [{
              name: 'Peak Season',
              pricePerUnit: 5000,
              dateRanges: [{
                from: '2025-01-01',
                to: '2025-03-31',
              }],
            }],
          },
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
    
    test('should reject overlapping date ranges', async () => {
      // Test date overlap validation
    });
  });
  
  // More tests...
});
```

---

## ✅ Acceptance Criteria

- [ ] Rate list date overlaps flagged on create/update
- [ ] CSV import handles 1000+ rows without timeout
- [ ] Seasonal pricing auto-applied based on date range
- [ ] Indexes created: `tenantId + supplierId`, `tenantId + destination + validFrom + validTo`
- [ ] Blackout dates prevent bookings in pricing calculation
- [ ] Bulk discount calculation works correctly
- [ ] Age-based pricing applied correctly
- [ ] Cache hit rate > 70% for hot rate lists
- [ ] CSV export generates valid file
- [ ] Rate list versioning preserves history
- [ ] Test coverage > 80%

---

## 📋 TODO Checklist

### Models
- [ ] Create `src/models/Supplier.js`
- [ ] Create `src/models/RateList.js`
- [ ] Add indexes for performance
- [ ] Test model validation

### Services
- [ ] Create `src/services/supplierService.js`
- [ ] Create `src/services/rateListService.js`
- [ ] Create `src/services/rateListValidationService.js`
- [ ] Create `src/services/csvImportService.js`
- [ ] Create `src/services/csvExportService.js`
- [ ] Create `src/services/rateListCacheService.js`
- [ ] Test all services

### Controllers
- [ ] Create `src/controllers/supplierController.js`
- [ ] Create `src/controllers/rateListController.js`
- [ ] Test controllers

### Routes
- [ ] Create `src/routes/supplier.js`
- [ ] Wire up routes in app

### Import/Export
- [ ] Install `csv-parser`, `xlsx` packages
- [ ] Implement CSV parser with validation
- [ ] Implement Excel parser
- [ ] Implement CSV generator
- [ ] Implement Excel generator
- [ ] Test with large files (10000+ rows)

### Validation
- [ ] Date overlap detection
- [ ] Seasonal range validation
- [ ] Pricing validation
- [ ] Blackout date validation
- [ ] Test edge cases

### Caching
- [ ] Implement Redis caching for rate lists
- [ ] Cache invalidation on update
- [ ] Implement cache warming for hot rate lists
- [ ] Monitor cache hit/miss rates

### Testing
- [ ] Integration tests for supplier CRUD
- [ ] Integration tests for rate list CRUD
- [ ] Integration tests for CSV import/export
- [ ] Integration tests for validation
- [ ] Load tests for bulk import
- [ ] Coverage > 80%

### Documentation
- [ ] Update OpenAPI spec
- [ ] Document CSV format
- [ ] Add examples

---

## 🔗 Next Phase Dependencies

Phase 3 (Packages Catalog) will use:
- Rate lists from this phase
- Supplier data for package composition
