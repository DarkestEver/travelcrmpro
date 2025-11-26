const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const Supplier = require('../../src/models/Supplier');
const redis = require('../../src/lib/redis');

// Mock Redis
jest.mock('../../src/lib/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
  quit: jest.fn(),
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

let testTenant1, testTenant2;
let superAdminUser, tenantAdminUser, agentUser;
let superAdminToken, tenantAdminToken, agentToken;
let testSupplier1, testSupplier2;

const testId = Date.now();

beforeAll(async () => {
  // Connect to real MongoDB
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/travel-crm');
  }
});

afterAll(async () => {
  await redis.quit();
});

beforeEach(async () => {
  // Clear data
  await User.deleteMany({});
  await Tenant.deleteMany({});
  await Supplier.deleteMany({});

  // Create test tenants
  testTenant1 = await Tenant.create({
    name: `Test Tenant 1 ${testId}`,
    slug: `test-tenant-1-${testId}`,
    email: `tenant1-${testId}@test.com`,
    phone: '1234567890',
    status: 'active',
  });

  testTenant2 = await Tenant.create({
    name: `Test Tenant 2 ${testId}`,
    slug: `test-tenant-2-${testId}`,
    email: `tenant2-${testId}@test.com`,
    phone: '0987654321',
    status: 'active',
  });

  // Create super admin
  superAdminUser = await User.create({
    email: `superadmin-${testId}@test.com`,
    password: 'Password123!',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin',
    tenant: null,
    isActive: true,
  });

  // Create tenant admin
  tenantAdminUser = await User.create({
    email: `admin-${testId}@test.com`,
    password: 'Password123!',
    firstName: 'Tenant',
    lastName: 'Admin',
    role: 'tenant_admin',
    tenant: testTenant1._id,
    isActive: true,
  });

  // Create agent
  agentUser = await User.create({
    email: `agent-${testId}@test.com`,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Agent',
    role: 'agent',
    tenant: testTenant1._id,
    isActive: true,
  });

  // Login to get real access tokens
  const superAdminLogin = await request(app)
    .post('/auth/login')
    .send({
      email: superAdminUser.email,
      password: 'Password123!',
    });
  superAdminToken = superAdminLogin.body?.data?.accessToken || '';

  const tenantAdminLogin = await request(app)
    .post('/auth/login')
    .set('X-Tenant-Slug', testTenant1.slug)
    .send({
      email: tenantAdminUser.email,
      password: 'Password123!',
    });
  tenantAdminToken = tenantAdminLogin.body?.data?.accessToken || '';

  const agentLogin = await request(app)
    .post('/auth/login')
    .set('X-Tenant-Slug', testTenant1.slug)
    .send({
      email: agentUser.email,
      password: 'Password123!',
    });
  agentToken = agentLogin.body?.data?.accessToken || '';

  // Create test suppliers
  testSupplier1 = await Supplier.create({
    tenant: testTenant1._id,
    name: 'Grand Hotel',
    type: 'hotel',
    status: 'active',
    contact: {
      name: 'John Manager',
      email: 'hotel@test.com',
      phone: '+1234567890',
    },
    address: {
      street: '123 Main St',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postalCode: '12345',
    },
    services: [
      {
        name: 'Deluxe Room',
        description: 'Spacious room with city view',
        pricing: {
          amount: 200,
          currency: 'USD',
          unit: 'night',
        },
        availability: 'available',
      },
    ],
    tags: ['luxury', 'downtown', 'wifi'],
    createdBy: tenantAdminUser._id,
  });

  testSupplier2 = await Supplier.create({
    tenant: testTenant1._id,
    name: 'City Tours',
    type: 'activity',
    status: 'active',
    contact: {
      name: 'Sarah Guide',
      email: 'tours@test.com',
      phone: '+0987654321',
    },
    tags: ['sightseeing', 'guided'],
    createdBy: tenantAdminUser._id,
  });
});

afterEach(async () => {
  await User.deleteMany({});
  await Tenant.deleteMany({});
  await Supplier.deleteMany({});
});

describe('Supplier Management', () => {
  describe('GET /suppliers', () => {
    it('should get all suppliers for tenant', async () => {
      const res = await request(app)
        .get('/suppliers')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suppliers).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('should filter suppliers by type', async () => {
      const res = await request(app)
        .get('/suppliers?type=hotel')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(200);
      expect(res.body.data.suppliers).toHaveLength(1);
      expect(res.body.data.suppliers[0].type).toBe('hotel');
    });

    it('should search suppliers by name', async () => {
      const res = await request(app)
        .get('/suppliers?search=Grand')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(200);
      expect(res.body.data.suppliers).toHaveLength(1);
      expect(res.body.data.suppliers[0].name).toContain('Grand');
    });

    it('should paginate suppliers', async () => {
      const res = await request(app)
        .get('/suppliers?page=1&limit=1')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(200);
      expect(res.body.data.suppliers).toHaveLength(1);
      expect(res.body.data.pagination.pages).toBe(2);
    });

    it('should allow agents to view suppliers', async () => {
      const res = await request(app)
        .get('/suppliers')
        .set('Authorization', `Bearer ${agentToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /suppliers/:id', () => {
    it('should get supplier by ID', async () => {
      const res = await request(app)
        .get(`/suppliers/${testSupplier1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.supplier.name).toBe('Grand Hotel');
      expect(res.body.data.supplier.contact.email).toBe('hotel@test.com');
    });

    it('should return 404 for non-existent supplier', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/suppliers/${fakeId}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should not return supplier from different tenant', async () => {
      const res = await request(app)
        .get(`/suppliers/${testSupplier1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant2.slug);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /suppliers', () => {
    it('should create new supplier as tenant admin', async () => {
      const supplierData = {
        name: 'New Airline',
        type: 'airline',
        contact: {
          email: 'airline@test.com',
        },
      };

      const res = await request(app)
        .post('/suppliers')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(supplierData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.supplier.name).toBe('New Airline');
      expect(res.body.data.supplier.type).toBe('airline');
      expect(res.body.data.supplier.tenant.toString()).toBe(testTenant1._id.toString());
    });

    it('should reject supplier creation without required fields', async () => {
      const invalidData = {
        name: 'Test',
        // Missing type and contact.email
      };

      const res = await request(app)
        .post('/suppliers')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(invalidData);

      expect(res.status).toBe(400);
    });

    it('should reject supplier creation by agent', async () => {
      const supplierData = {
        name: 'New Supplier',
        type: 'hotel',
        contact: { email: 'test@test.com' },
      };

      const res = await request(app)
        .post('/suppliers')
        .set('Authorization', `Bearer ${agentToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(supplierData);

      expect(res.status).toBe(403);
    });

    it('should create supplier with full details', async () => {
      const fullSupplierData = {
        name: 'Luxury Resort',
        type: 'hotel',
        status: 'active',
        contact: {
          name: 'Resort Manager',
          email: 'resort@test.com',
          phone: '+1111111111',
          website: 'https://resort.com',
        },
        address: {
          street: '456 Beach Rd',
          city: 'Beach City',
          country: 'Beach Country',
          coordinates: {
            lat: 12.345,
            lng: 67.890,
          },
        },
        services: [
          {
            name: 'Ocean View Suite',
            description: 'Premium suite with ocean view',
            pricing: {
              amount: 500,
              currency: 'USD',
              unit: 'night',
            },
            availability: 'available',
          },
        ],
        paymentTerms: {
          method: 'bank_transfer',
          creditDays: 30,
          currency: 'USD',
        },
        tags: ['luxury', 'beach', 'resort'],
        notes: 'Preferred supplier for beach destinations',
      };

      const res = await request(app)
        .post('/suppliers')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(fullSupplierData);

      expect(res.status).toBe(201);
      expect(res.body.data.supplier.address.city).toBe('Beach City');
      expect(res.body.data.supplier.services).toHaveLength(1);
      expect(res.body.data.supplier.tags).toContain('luxury');
    });
  });

  describe('PUT /suppliers/:id', () => {
    it('should update supplier', async () => {
      const updateData = {
        name: 'Updated Grand Hotel',
        status: 'inactive',
      };

      const res = await request(app)
        .put(`/suppliers/${testSupplier1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.supplier.name).toBe('Updated Grand Hotel');
      expect(res.body.data.supplier.status).toBe('inactive');
    });

    it('should reject update without any fields', async () => {
      const res = await request(app)
        .put(`/suppliers/${testSupplier1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject supplier update by agent', async () => {
      const res = await request(app)
        .put(`/suppliers/${testSupplier1._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send({ name: 'Updated' });

      expect(res.status).toBe(403);
    });

    it('should update nested fields', async () => {
      const updateData = {
        contact: {
          name: 'New Manager',
          email: 'newmanager@test.com',
          phone: '+9999999999',
        },
      };

      const res = await request(app)
        .put(`/suppliers/${testSupplier1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.data.supplier.contact.name).toBe('New Manager');
      expect(res.body.data.supplier.contact.email).toBe('newmanager@test.com');
    });
  });

  describe('DELETE /suppliers/:id', () => {
    it('should delete supplier', async () => {
      const res = await request(app)
        .delete(`/suppliers/${testSupplier1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const supplier = await Supplier.findById(testSupplier1._id);
      expect(supplier).toBeNull();
    });

    it('should reject deletion by agent', async () => {
      const res = await request(app)
        .delete(`/suppliers/${testSupplier1._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent supplier', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/suppliers/${fakeId}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /suppliers/:id/rating', () => {
    it('should update supplier rating', async () => {
      const ratingData = {
        quality: 4.5,
        service: 4.0,
        value: 4.2,
      };

      const res = await request(app)
        .put(`/suppliers/${testSupplier1._id}/rating`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(ratingData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating.quality).toBe(4.5);
      expect(res.body.data.rating.service).toBe(4.0);
      expect(res.body.data.rating.value).toBe(4.2);
      expect(res.body.data.rating.reviewCount).toBe(1);
    });

    it('should reject invalid rating values', async () => {
      const invalidRating = {
        quality: 6, // Max is 5
      };

      const res = await request(app)
        .put(`/suppliers/${testSupplier1._id}/rating`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(invalidRating);

      expect(res.status).toBe(400);
    });

    it('should reject rating update by agent', async () => {
      const res = await request(app)
        .put(`/suppliers/${testSupplier1._id}/rating`)
        .set('Authorization', `Bearer ${agentToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send({ quality: 4 });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /suppliers/:id/documents', () => {
    it('should add document to supplier', async () => {
      const documentData = {
        name: 'Business License',
        type: 'license',
        url: 'https://example.com/license.pdf',
        expiryDate: '2025-12-31',
      };

      const res = await request(app)
        .post(`/suppliers/${testSupplier1._id}/documents`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(documentData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.documents).toHaveLength(1);
      expect(res.body.data.documents[0].name).toBe('Business License');
    });

    it('should reject document without required fields', async () => {
      const invalidDoc = {
        name: 'Test Document',
        // Missing type
      };

      const res = await request(app)
        .post(`/suppliers/${testSupplier1._id}/documents`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(invalidDoc);

      expect(res.status).toBe(400);
    });

    it('should reject document addition by agent', async () => {
      const documentData = {
        name: 'Test Doc',
        type: 'contract',
        url: 'https://test.com/doc.pdf',
      };

      const res = await request(app)
        .post(`/suppliers/${testSupplier1._id}/documents`)
        .set('Authorization', `Bearer ${agentToken}`)
        .set('X-Tenant-Slug', testTenant1.slug)
        .send(documentData);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /suppliers/stats', () => {
    it('should get supplier statistics', async () => {
      const res = await request(app)
        .get('/suppliers/stats')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.active).toBe(2);
      expect(res.body.data.byType).toBeDefined();
    });

    it('should reject stats request by agent', async () => {
      const res = await request(app)
        .get('/suppliers/stats')
        .set('Authorization', `Bearer ${agentToken}`)
        .set('X-Tenant-Slug', testTenant1.slug);

      expect(res.status).toBe(403);
    });
  });
});
