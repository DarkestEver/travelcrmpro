// Mock Redis (not installed) - MUST be before app import
jest.mock('../../src/lib/redis', () => ({
  get: jest.fn((key) => {
    // Smart mock for refresh tokens
    if (key && key.includes('refresh:')) {
      const userId = key.split(':')[1];
      return Promise.resolve(JSON.stringify({ userId }));
    }
    return Promise.resolve(null);
  }),
  set: jest.fn(() => Promise.resolve('OK')),
  del: jest.fn(() => Promise.resolve(1)),
  setex: jest.fn(() => Promise.resolve('OK')),
  exists: jest.fn(() => Promise.resolve(0)),
}));

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Package = require('../../src/models/Package');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const { USER_ROLES, USER_STATUS } = require('../../src/config/constants');

describe('Package API Integration Tests', () => {
  let authToken;
  let tenantId;
  let tenantSlug;
  let userId;
  let testPackage;

  beforeEach(async () => {
    // Create tenant
    const tenant = await Tenant.create({
      name: 'Test Travel Agency',
      slug: 'test-travel-agency',
      domain: 'test-travel.com',
      status: 'active',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });
    tenantId = tenant._id;
    tenantSlug = tenant.slug;

    // Create admin user
    const user = await User.create({
      tenant: tenantId,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'Test@1234',
      role: USER_ROLES.TENANT_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });
    userId = user._id;

    // Login to get token
    const loginRes = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', 'test-travel-agency')
      .send({
        email: 'admin@test.com',
        password: 'Test@1234',
      });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
    }

    authToken = loginRes.body?.data?.accessToken || '';
    
    if (!authToken) {
      throw new Error(`No auth token received. Login response: ${JSON.stringify(loginRes.body)}`);
    }

    // Create a testPackage for tests that need it
    testPackage = await Package.create({
      tenant: tenantId,
      packageCode: 'PKG-TEST-001',
      title: 'Test Package for Integration Tests',
      description: 'A test package used across various test cases',
      destination: {
        country: 'India',
        state: 'Goa',
        city: 'Panaji',
      },
      duration: {
        days: 3,
        nights: 2,
      },
      pricing: {
        basePrice: 15000,
        currency: 'INR',
      },
      status: 'published',
      visibility: 'public',
      createdBy: userId,
    });
  });

  afterAll(async () => {
    // Cleanup is handled by global afterAll in setup.js
  });

  describe('POST /packages - Create Package', () => {
    it('should create a new package successfully', async () => {
      const packageData = {
        packageCode: 'PKG001',
        title: 'Manali Adventure Package',
        description: 'Explore the beautiful mountains of Manali with adventure activities',
        destination: {
          country: 'India',
          state: 'Himachal Pradesh',
          city: 'Manali',
        },
        duration: {
          days: 5,
          nights: 4,
        },
        pricing: {
          basePrice: 25000,
          currency: 'INR',
        },
        status: 'draft',
        visibility: 'private',
      };

      const res = await request(app)
        .post('/packages')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send(packageData);

      if (res.status !== 201) {
        console.error('\n❌ CREATE FAILED:', res.status);
        console.error('Error:', res.body.error || res.body);
        console.error('Message:', res.body.message || 'No message');
      }
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.packageCode).toBe('PKG001');
      expect(res.body.data.title).toBe('Manali Adventure Package');
      expect(res.body.data.slug).toBeTruthy();
      expect(String(res.body.data.tenant)).toBe(String(tenantId));
      expect(String(res.body.data.createdBy)).toBe(String(userId));

      testPackage = res.body.data;
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/packages')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .send({ packageCode: 'PKG002', title: 'Test' });

      expect(res.status).toBe(401);
    });

    it('should fail with duplicate package code', async () => {
      const packageData = {
        packageCode: 'PKG-TEST-001', // Same as testPackage created in beforeEach
        title: 'Another Package',
        description: 'Test description',
        destination: { country: 'India' },
        duration: { days: 3, nights: 2 },
        pricing: { basePrice: 10000 },
      };

      const res = await request(app)
        .post('/packages')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send(packageData);

      expect(res.status).toBe(400);
    });

    it('should create package with complete itinerary', async () => {
      const packageData = {
        packageCode: 'PKG002',
        title: 'Goa Beach Package',
        description: 'Relax on the beaches of Goa',
        destination: {
          country: 'India',
          state: 'Goa',
          city: 'Goa',
        },
        duration: {
          days: 4,
          nights: 3,
        },
        itinerary: [
          {
            day: 1,
            title: 'Arrival and Beach Visit',
            description: 'Arrive in Goa and visit Baga Beach',
            activities: ['Beach visit', 'Water sports', 'Sunset viewing'],
            accommodation: {
              name: 'Beach Resort',
              type: '4-star',
              mealPlan: 'MAP',
            },
          },
          {
            day: 2,
            title: 'North Goa Sightseeing',
            description: 'Explore North Goa attractions',
            activities: ['Fort Aguada', 'Chapora Fort', 'Anjuna Flea Market'],
          },
        ],
        pricing: {
          basePrice: 18000,
          currency: 'INR',
        },
        status: 'published',
        visibility: 'public',
      };

      const res = await request(app)
        .post('/packages')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send(packageData);

      expect(res.status).toBe(201);
      expect(res.body.data.itinerary).toHaveLength(2);
      expect(res.body.data.itinerary[0].day).toBe(1);
      expect(res.body.data.itinerary[0].activities).toContain('Beach visit');
    });

    it('should create package with seasonal pricing', async () => {
      const packageData = {
        packageCode: 'PKG003',
        title: 'Kashmir Winter Package',
        description: 'Experience snow in Kashmir',
        destination: {
          country: 'India',
          state: 'Jammu & Kashmir',
          city: 'Srinagar',
        },
        duration: {
          days: 6,
          nights: 5,
        },
        pricing: {
          basePrice: 30000,
          currency: 'INR',
          seasonalPricing: [
            {
              season: 'peak',
              dateRanges: [
                {
                  from: new Date('2025-12-15'),
                  to: new Date('2026-01-15'),
                },
              ],
              pricePerPerson: 45000,
            },
            {
              season: 'off',
              dateRanges: [
                {
                  from: new Date('2026-03-01'),
                  to: new Date('2026-05-31'),
                },
              ],
              pricePerPerson: 25000,
            },
          ],
        },
        status: 'published',
        visibility: 'public',
      };

      const res = await request(app)
        .post('/packages')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send(packageData);

      expect(res.status).toBe(201);
      expect(res.body.data.pricing.seasonalPricing).toHaveLength(2);
      expect(res.body.data.pricing.seasonalPricing[0].season).toBe('peak');
    });

    it('should create package with group discounts', async () => {
      const packageData = {
        packageCode: 'PKG004',
        title: 'Kerala Backwaters Group Tour',
        description: 'Group tour of Kerala backwaters',
        destination: {
          country: 'India',
          state: 'Kerala',
          city: 'Alleppey',
        },
        duration: {
          days: 5,
          nights: 4,
        },
        pricing: {
          basePrice: 20000,
          currency: 'INR',
          groupDiscounts: [
            {
              minGroupSize: 5,
              maxGroupSize: 10,
              discountType: 'percentage',
              discountValue: 10,
            },
            {
              minGroupSize: 11,
              discountType: 'percentage',
              discountValue: 15,
            },
          ],
        },
        status: 'published',
        visibility: 'public',
      };

      const res = await request(app)
        .post('/packages')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send(packageData);

      expect(res.status).toBe(201);
      expect(res.body.data.pricing.groupDiscounts).toHaveLength(2);
    });
  });

  describe('GET /packages - Get All Packages', () => {
    it('should get all packages with pagination', async () => {
      const res = await request(app)
        .get('/packages')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.packages).toBeInstanceOf(Array);
      expect(res.body.data.pagination).toHaveProperty('total');
      expect(res.body.data.pagination).toHaveProperty('pages');
    });

    it('should filter packages by destination country', async () => {
      const res = await request(app)
        .get('/packages?country=India')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.packages.length).toBeGreaterThan(0);
      res.body.data.packages.forEach(pkg => {
        expect(pkg.destination.country).toMatch(/India/i);
      });
    });

    it('should filter packages by status', async () => {
      const res = await request(app)
        .get('/packages?status=published')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.packages.forEach(pkg => {
        expect(pkg.status).toBe('published');
      });
    });

    it('should filter packages by price range', async () => {
      const res = await request(app)
        .get('/packages?minPrice=15000&maxPrice=30000')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.packages.forEach(pkg => {
        expect(pkg.pricing.basePrice).toBeGreaterThanOrEqual(15000);
        expect(pkg.pricing.basePrice).toBeLessThanOrEqual(30000);
      });
    });

    it('should filter packages by duration', async () => {
      const res = await request(app)
        .get('/packages?minDays=4&maxDays=6')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.packages.forEach(pkg => {
        expect(pkg.duration.days).toBeGreaterThanOrEqual(4);
        expect(pkg.duration.days).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('GET /packages/browse - Browse Public Packages', () => {
    it('should get only public packages', async () => {
      const res = await request(app)
        .get('/packages/browse')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.packages).toBeInstanceOf(Array);
    });
  });

  describe('GET /packages/featured - Get Featured Packages', () => {
    beforeEach(async () => {
      // Mark a package as featured
      await Package.findByIdAndUpdate(testPackage._id, {
        isFeatured: true,
        featuredOrder: 1,
        status: 'published',
        visibility: 'public',
      });
    });

    it('should get featured packages', async () => {
      const res = await request(app)
        .get('/packages/featured')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/packages/featured?limit=2')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /packages/popular - Get Popular Packages', () => {
    it('should get popular packages sorted by bookings', async () => {
      const res = await request(app)
        .get('/packages/popular')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /packages/statistics - Get Package Statistics', () => {
    it('should get package statistics', async () => {
      const res = await request(app)
        .get('/packages/statistics')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('draft');
      expect(res.body.data).toHaveProperty('published');
      expect(res.body.data).toHaveProperty('archived');
      expect(res.body.data.draft).toHaveProperty('count');
      expect(res.body.data.draft).toHaveProperty('totalViews');
    });
  });

  describe('GET /packages/:id - Get Package by ID', () => {
    it('should get package by ID', async () => {
      const res = await request(app)
        .get(`/packages/${testPackage._id}`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(String(res.body.data._id)).toBe(String(testPackage._id));
    });

    it('should track view when trackView=true', async () => {
      const res = await request(app)
        .get(`/packages/${testPackage._id}?trackView=true`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      
      // Verify view count increased
      const updated = await Package.findById(testPackage._id);
      expect(updated.stats.views).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent package', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/packages/${fakeId}`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /packages/slug/:slug - Get Package by Slug', () => {
    it('should get published package by slug', async () => {
      // Ensure package is published
      await Package.findByIdAndUpdate(testPackage._id, {
        status: 'published',
        visibility: 'public',
      });

      const res = await request(app)
        .get(`/packages/slug/${testPackage.slug}`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe(testPackage.slug);
    });
  });

  describe('PUT /packages/:id - Update Package', () => {
    it('should update package successfully', async () => {
      const updates = {
        title: 'Updated Manali Package',
        description: 'Updated description',
      };

      const res = await request(app)
        .put(`/packages/${testPackage._id}`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Manali Package');
      expect(res.body.data.description).toBe('Updated description');
    });

    it('should not allow updating tenant field', async () => {
      const fakeTenantId = new mongoose.Types.ObjectId();
      const updates = {
        tenant: fakeTenantId,
        title: 'Hacked Package',
      };

      const res = await request(app)
        .put(`/packages/${testPackage._id}`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.data.tenant.toString()).not.toBe(fakeTenantId.toString());
      expect(res.body.data.tenant.toString()).toBe(tenantId.toString());
    });
  });

  describe('POST /packages/:id/calculate-price - Calculate Package Price', () => {
    let pricingPackage;

    beforeEach(async () => {
      // Create a package with comprehensive pricing
      const pkg = await Package.create({
        tenant: tenantId,
        createdBy: userId,
        packageCode: 'PRICE001',
        title: 'Pricing Test Package',
        slug: 'pricing-test-package',
        description: 'Package for price calculation tests',
        destination: { country: 'India', city: 'Delhi' },
        duration: { days: 3, nights: 2 },
        pricing: {
          basePrice: 10000,
          currency: 'INR',
          seasonalPricing: [
            {
              season: 'peak',
              dateRanges: [{ from: new Date('2025-12-20'), to: new Date('2025-12-31') }],
              pricePerPerson: 15000,
            },
          ],
          groupDiscounts: [
            {
              minGroupSize: 5,
              maxGroupSize: 10,
              discountType: 'percentage',
              discountValue: 10,
            },
          ],
          childDiscount: {
            ageFrom: 5,
            ageTo: 12,
            discountPercentage: 50,
          },
          infantDiscount: {
            ageFrom: 0,
            ageTo: 4,
            discountPercentage: 75,
          },
        },
        availableFrom: new Date('2025-11-01'),
        availableTo: new Date('2026-12-31'),
        status: 'published',
        visibility: 'public',
      });
      pricingPackage = pkg;
    });

    it('should calculate base price for group', async () => {
      const res = await request(app)
        .post(`/packages/${pricingPackage._id}/calculate-price`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          travelDate: '2025-11-25',
          groupSize: 4,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.basePrice).toBe(10000);
      expect(res.body.data.pricePerPerson).toBe(10000);
      expect(res.body.data.adults.count).toBe(4);
      expect(res.body.data.totalPrice).toBe(40000);
    });

    it('should apply seasonal pricing', async () => {
      const res = await request(app)
        .post(`/packages/${pricingPackage._id}/calculate-price`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          travelDate: '2025-12-25',
          groupSize: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.basePrice).toBe(15000);
      expect(res.body.data.pricePerPerson).toBe(15000);
    });

    it('should apply group discount', async () => {
      const res = await request(app)
        .post(`/packages/${pricingPackage._id}/calculate-price`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          travelDate: '2025-11-25',
          groupSize: 6,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.discount).toBe(1000); // 10% of 10000
      expect(res.body.data.pricePerPerson).toBe(9000);
    });

    it('should calculate price with children and infants', async () => {
      const res = await request(app)
        .post(`/packages/${pricingPackage._id}/calculate-price`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          travelDate: '2025-11-25',
          groupSize: 2,
          children: 1,
          infants: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.adults.totalPrice).toBe(20000);
      expect(res.body.data.children.count).toBe(1);
      expect(res.body.data.children.pricePerPerson).toBe(5000); // 50% discount
      expect(res.body.data.infants.count).toBe(1);
      expect(res.body.data.infants.pricePerPerson).toBe(2500); // 75% discount
      expect(res.body.data.totalPrice).toBe(27500);
    });

    it('should fail for unavailable dates', async () => {
      const res = await request(app)
        .post(`/packages/${pricingPackage._id}/calculate-price`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          travelDate: '2027-01-01', // Outside available range
          groupSize: 2,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /packages/:id/check-availability - Check Availability', () => {
    let availPackage;

    beforeEach(async () => {
      const pkg = await Package.create({
        tenant: tenantId,
        createdBy: userId,
        packageCode: 'AVAIL001',
        title: 'Availability Test Package',
        slug: 'availability-test-package',
        description: 'Package for availability tests',
        destination: { country: 'India' },
        duration: { days: 3, nights: 2 },
        pricing: { basePrice: 10000 },
        availableFrom: new Date('2025-11-01'),
        availableTo: new Date('2026-10-31'),
        blackoutDates: [
          {
            from: new Date('2025-12-24'),
            to: new Date('2025-12-26'),
            reason: 'Christmas holiday',
          },
        ],
        status: 'published',
      });
      availPackage = pkg;
    });

    it('should return available for valid date', async () => {
      const res = await request(app)
        .post(`/packages/${availPackage._id}/check-availability`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ travelDate: '2025-11-25' });

      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(true);
    });

    it('should return unavailable for blackout date', async () => {
      const res = await request(app)
        .post(`/packages/${availPackage._id}/check-availability`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ travelDate: '2025-12-25' });

      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(false);
    });

    it('should require travelDate parameter', async () => {
      const res = await request(app)
        .post(`/packages/${availPackage._id}/check-availability`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /packages/:id/clone - Clone Package', () => {
    it('should clone package successfully', async () => {
      const res = await request(app)
        .post(`/packages/${testPackage._id}/clone`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageCode: 'CLONE001',
          title: 'Cloned Package',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.packageCode).toBe('CLONE001');
      expect(res.body.data.title).toBe('Cloned Package');
      expect(res.body.data.status).toBe('draft');
      expect(String(res.body.data._id)).not.toBe(String(testPackage._id));
    });
  });

  describe('PUT /packages/bulk/visibility - Bulk Update Visibility', () => {
    let bulkPackages;

    beforeEach(async () => {
      const packages = await Package.create([
        {
          tenant: tenantId,
          createdBy: userId,
          packageCode: 'BULK001',
          title: 'Bulk Test 1',
          slug: 'bulk-test-1',
          description: 'Test',
          destination: { country: 'India' },
          duration: { days: 3, nights: 2 },
          pricing: { basePrice: 10000 },
          visibility: 'private',
        },
        {
          tenant: tenantId,
          createdBy: userId,
          packageCode: 'BULK002',
          title: 'Bulk Test 2',
          slug: 'bulk-test-2',
          description: 'Test',
          destination: { country: 'India' },
          duration: { days: 3, nights: 2 },
          pricing: { basePrice: 10000 },
          visibility: 'private',
        },
      ]);
      bulkPackages = packages;
    });

    it('should update visibility for multiple packages', async () => {
      const packageIds = bulkPackages.map(p => p._id);

      const res = await request(app)
        .put('/packages/bulk/visibility')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageIds,
          visibility: 'public',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.modifiedCount).toBe(2);

      // Verify updates
      const updated = await Package.find({ _id: { $in: packageIds } });
      updated.forEach(pkg => {
        expect(pkg.visibility).toBe('public');
      });
    });
  });

  describe('PUT /packages/bulk/status - Bulk Update Status', () => {
    let statusPackages;

    beforeEach(async () => {
      statusPackages = await Package.create([
        {
          tenant: tenantId,
          createdBy: userId,
          packageCode: 'STATUS001',
          title: 'Status Test 1',
          description: 'Test',
          destination: { country: 'India' },
          duration: { days: 3, nights: 2 },
          pricing: { basePrice: 10000 },
          status: 'draft',
        },
        {
          tenant: tenantId,
          createdBy: userId,
          packageCode: 'STATUS002',
          title: 'Status Test 2',
          description: 'Test',
          destination: { country: 'India' },
          duration: { days: 3, nights: 2 },
          pricing: { basePrice: 10000 },
          status: 'draft',
        },
      ]);
    });

    it('should update status for multiple packages', async () => {
      const packageIds = statusPackages.map(p => p._id);

      const res = await request(app)
        .put('/packages/bulk/status')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageIds,
          status: 'published',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.modifiedCount).toBeGreaterThan(0);
    });
  });

  describe('DELETE /packages/bulk - Bulk Delete Packages', () => {
    let deletePackages;

    beforeEach(async () => {
      deletePackages = await Package.create([
        {
          tenant: tenantId,
          createdBy: userId,
          packageCode: 'DELETE001',
          title: 'Delete Test 1',
          description: 'Test',
          destination: { country: 'India' },
          duration: { days: 3, nights: 2 },
          pricing: { basePrice: 10000 },
        },
        {
          tenant: tenantId,
          createdBy: userId,
          packageCode: 'DELETE002',
          title: 'Delete Test 2',
          description: 'Test',
          destination: { country: 'India' },
          duration: { days: 3, nights: 2 },
          pricing: { basePrice: 10000 },
        },
      ]);
    });

    it('should delete multiple packages', async () => {
      const packageIds = deletePackages.map(p => p._id);

      const res = await request(app)
        .delete('/packages/bulk')
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ packageIds });

      expect(res.status).toBe(200);
      expect(res.body.data.deletedCount).toBe(deletePackages.length);

      // Verify deletion
      const remaining = await Package.find({ _id: { $in: packageIds } });
      expect(remaining.length).toBe(0);
    });
  });

  describe('DELETE /packages/:id - Delete Package', () => {
    it('should delete package successfully', async () => {
      const pkg = await Package.create({
        tenant: tenantId,
        createdBy: userId,
        packageCode: 'DELETE001',
        title: 'To Delete',
        slug: 'to-delete',
        description: 'Test',
        destination: { country: 'India' },
        duration: { days: 3, nights: 2 },
        pricing: { basePrice: 10000 },
      });

      const res = await request(app)
        .delete(`/packages/${pkg._id}`)
        .set('X-Tenant-Slug', 'test-travel-agency')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Verify deletion
      const deleted = await Package.findById(pkg._id);
      expect(deleted).toBeNull();
    });
  });
});
