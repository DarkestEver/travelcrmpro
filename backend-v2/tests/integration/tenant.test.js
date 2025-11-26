// Mock Redis (not installed) - MUST be before app import
jest.mock('../../src/lib/redis', () => ({
  get: jest.fn((key) => {
    // Return valid token data for refresh tokens
    if (key && key.startsWith('refresh_token:')) {
      const userId = key.split(':')[1];
      return JSON.stringify({
        userId,
        tenantId: '507f1f77bcf86cd799439011', // Valid ObjectId string
        tokenVersion: 1,
      });
    }
    return null;
  }),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(1),
  setex: jest.fn().mockResolvedValue('OK'),
  healthCheck: jest.fn().mockResolvedValue(true),
}));

// Mock nodemailer to avoid sending real emails - MUST be before app import
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
  }),
}));

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Tenant = require('../../src/models/Tenant');
const User = require('../../src/models/User');

describe('Tenant Routes Integration Tests', () => {
  let superAdminToken;
  let superAdminUser;
  let superAdminTenant;
  let tenantAdminToken;
  let tenantAdminUser;
  let tenantAdminTenant;
  let agentToken;
  let agentUser;
  let testTenant;
  let testId; // For unique test data

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm-test');
    }

    // Drop old indexes that might conflict
    try {
      await Tenant.collection.dropIndex('subdomain_1');
    } catch (err) {
      // Index might not exist, that's fine
    }
  });

  beforeEach(async () => {
    // Ensure clean state - wait for operations to complete
    await User.deleteMany({}).exec();
    await Tenant.deleteMany({}).exec();
    
    // Small delay to ensure MongoDB has flushed changes
    await new Promise(resolve => setTimeout(resolve, 50));

    // Create unique test ID to avoid collisions
    testId = Date.now();

    // Create super admin tenant
    superAdminTenant = await Tenant.create({
      name: 'Super Admin Tenant',
      slug: `super-admin-tenant-${testId}`,
      status: 'active',
    });

    // Create super admin user
    superAdminUser = await User.create({
      tenant: superAdminTenant._id,
      email: `superadmin-${testId}@test.com`,
      password: 'Password123!',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isEmailVerified: true,
    });

    // Login as super admin
    const superAdminLoginRes = await request(app)
      .post('/auth/login')
      .set('x-tenant-slug', `super-admin-tenant-${testId}`)
      .send({
        email: `superadmin-${testId}@test.com`,
        password: 'Password123!',
      });
    
    // Debug: Always log login response for troubleshooting
    if (!superAdminLoginRes.body.success) {
      console.error('Super admin login failed:', JSON.stringify(superAdminLoginRes.body, null, 2));
      console.error('Status:', superAdminLoginRes.status);
      console.error('TestId:', testId);
    }
    
    superAdminToken = superAdminLoginRes.body.data?.accessToken;

    // Create tenant admin tenant
    tenantAdminTenant = await Tenant.create({
      name: 'Tenant Admin Tenant',
      slug: `tenant-admin-tenant-${testId}`,
      status: 'active',
    });

    // Create tenant admin user
    tenantAdminUser = await User.create({
      tenant: tenantAdminTenant._id,
      email: `tenantadmin-${testId}@test.com`,
      password: 'Password123!',
      firstName: 'Tenant',
      lastName: 'Admin',
      role: 'tenant_admin',
      isEmailVerified: true,
    });

    // Login as tenant admin
    const tenantAdminLoginRes = await request(app)
      .post('/auth/login')
      .set('x-tenant-slug', `tenant-admin-tenant-${testId}`)
      .send({
        email: `tenantadmin-${testId}@test.com`,
        password: 'Password123!',
      });
    tenantAdminToken = tenantAdminLoginRes.body.data.accessToken;

    // Create agent user in tenant admin's tenant
    agentUser = await User.create({
      tenant: tenantAdminTenant._id,
      email: `agent-${testId}@test.com`,
      password: 'Password123!',
      firstName: 'Agent',
      lastName: 'User',
      role: 'agent',
      isEmailVerified: true,
    });

    // Login as agent
    const agentLoginRes = await request(app)
      .post('/auth/login')
      .set('x-tenant-slug', `tenant-admin-tenant-${testId}`)
      .send({
        email: `agent-${testId}@test.com`,
        password: 'Password123!',
      });
    agentToken = agentLoginRes.body.data.accessToken;

    // Create a test tenant for operations
    testTenant = await Tenant.create({
      name: 'Test Tenant',
      slug: `test-tenant-${testId}`,
      domain: `test-tenant-${testId}.example.com`,
      status: 'trial',
      subscription: {
        plan: 'starter',
        isActive: true,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data - delete in reverse order to avoid foreign key issues
    try {
      await User.deleteMany({}).exec();
      await Tenant.deleteMany({}).exec();
      // Small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /tenants', () => {
    it('should create a new tenant as super admin', async () => {
      const res = await request(app)
        .post('/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'New Tenant',
          slug: 'new-tenant',
          domain: 'new-tenant.example.com',
          subscription: {
            plan: 'professional',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenant).toBeDefined();
      expect(res.body.data.tenant.name).toBe('New Tenant');
      expect(res.body.data.tenant.slug).toBe('new-tenant');
      expect(res.body.data.tenant.subscription.plan).toBe('professional');
      expect(res.body.data.tenant.status).toBe('trial'); // Default

      // Verify in database
      const tenant = await Tenant.findById(res.body.data.tenant._id);
      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('New Tenant');
    });

    it('should reject tenant creation as tenant admin', async () => {
      const res = await request(app)
        .post('/tenants')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({
          name: 'Unauthorized Tenant',
          slug: 'unauthorized-tenant',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SUPER_ADMIN_REQUIRED');
    });

    it('should reject tenant creation with duplicate slug', async () => {
      const res = await request(app)
        .post('/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Duplicate Slug Tenant',
          slug: testTenant.slug, // Use existing tenant's slug
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SLUG_EXISTS');
      expect(res.body.error.message).toContain('slug');
    });

    it('should reject tenant creation with invalid slug format', async () => {
      const res = await request(app)
        .post('/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Invalid Slug Tenant',
          slug: 'Invalid_Slug!', // Uppercase and special characters
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject tenant creation without required fields', async () => {
      const res = await request(app)
        .post('/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          domain: 'missing-name.example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /tenants', () => {
    it('should get all tenants as super admin', async () => {
      const res = await request(app)
        .get('/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenants).toBeInstanceOf(Array);
      expect(res.body.data.tenants.length).toBeGreaterThan(0);
      expect(res.body.meta.pagination).toBeDefined();
      expect(res.body.meta.pagination.total).toBeGreaterThan(0);
    });

    it('should filter tenants by status', async () => {
      const res = await request(app)
        .get('/tenants?status=active')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tenants.every((t) => t.status === 'active')).toBe(true);
    });

    it('should filter tenants by plan', async () => {
      const res = await request(app)
        .get('/tenants?plan=starter')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tenants.every((t) => t.subscription.plan === 'starter')).toBe(true);
    });

    it('should search tenants by name', async () => {
      const res = await request(app)
        .get('/tenants?search=Test')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tenants.length).toBeGreaterThan(0);
    });

    it('should paginate tenants', async () => {
      const res = await request(app)
        .get('/tenants?page=1&limit=2')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tenants.length).toBeLessThanOrEqual(2);
      expect(res.body.meta.pagination.page).toBe(1);
      expect(res.body.meta.pagination.limit).toBe(2);
    });

    it('should reject tenant listing as tenant admin', async () => {
      const res = await request(app)
        .get('/tenants')
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /tenants/:id', () => {
    it('should get tenant by ID as super admin', async () => {
      const res = await request(app)
        .get(`/tenants/${testTenant._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenant._id).toBe(testTenant._id.toString());
      expect(res.body.data.tenant.name).toBe('Test Tenant');
    });

    it('should get own tenant as tenant admin', async () => {
      const res = await request(app)
        .get(`/tenants/${tenantAdminTenant._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tenant._id).toBe(tenantAdminTenant._id.toString());
    });

    it('should reject getting other tenant as tenant admin', async () => {
      const res = await request(app)
        .get(`/tenants/${testTenant._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent tenant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/tenants/${fakeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /tenants/:id', () => {
    it('should update tenant as super admin', async () => {
      const res = await request(app)
        .put(`/tenants/${testTenant._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Updated Tenant Name',
          status: 'active',
          subscription: {
            plan: 'enterprise',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenant.name).toBe('Updated Tenant Name');
      expect(res.body.data.tenant.status).toBe('active');
      expect(res.body.data.tenant.subscription.plan).toBe('enterprise');

      // Verify in database
      const tenant = await Tenant.findById(testTenant._id);
      expect(tenant.name).toBe('Updated Tenant Name');
    });

    it('should update own tenant as tenant admin (except status)', async () => {
      const res = await request(app)
        .put(`/tenants/${tenantAdminTenant._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({
          name: 'Updated By Tenant Admin',
          subscription: {
            plan: 'professional',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.tenant.name).toBe('Updated By Tenant Admin');
    });

    it('should reject status change by tenant admin', async () => {
      const res = await request(app)
        .put(`/tenants/${tenantAdminTenant._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({
          status: 'suspended',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('status');
    });

    it('should reject updating other tenant as tenant admin', async () => {
      const res = await request(app)
        .put(`/tenants/${testTenant._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject update with duplicate domain', async () => {
      const res = await request(app)
        .put(`/tenants/${tenantAdminTenant._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          domain: testTenant.domain, // Use existing tenant's domain
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('domain');
    });
  });

  describe('PUT /tenants/:id/branding', () => {
    it('should update branding as super admin', async () => {
      const res = await request(app)
        .put(`/tenants/${testTenant._id}/branding`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          logo: 'https://example.com/logo.png',
          primaryColor: '#FF5733',
          secondaryColor: '#33FF57',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.branding.logo).toBe('https://example.com/logo.png');
      expect(res.body.data.branding.primaryColor).toBe('#FF5733');
    });

    it('should update own tenant branding as tenant admin', async () => {
      const res = await request(app)
        .put(`/tenants/${tenantAdminTenant._id}/branding`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({
          primaryColor: '#0000FF',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.branding.primaryColor).toBe('#0000FF');
    });

    it('should reject invalid color format', async () => {
      const res = await request(app)
        .put(`/tenants/${testTenant._id}/branding`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          primaryColor: 'invalid-color',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject branding update for other tenant as tenant admin', async () => {
      const res = await request(app)
        .put(`/tenants/${testTenant._id}/branding`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({
          primaryColor: '#FF0000',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /tenants/:id', () => {
    it('should delete tenant with no users as super admin', async () => {
      const emptyTenant = await Tenant.create({
        name: 'Empty Tenant',
        slug: 'empty-tenant',
      });

      const res = await request(app)
        .delete(`/tenants/${emptyTenant._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('deleted');

      // Verify deleted
      const tenant = await Tenant.findById(emptyTenant._id);
      expect(tenant).toBeNull();
    });

    it('should reject deletion of tenant with users', async () => {
      const res = await request(app)
        .delete(`/tenants/${tenantAdminTenant._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('users');
    });

    it('should reject deletion as tenant admin', async () => {
      const res = await request(app)
        .delete(`/tenants/${tenantAdminTenant._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /tenants/:id/stats', () => {
    it('should get tenant stats as super admin', async () => {
      const res = await request(app)
        .get(`/tenants/${tenantAdminTenant._id}/stats`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.users).toBeDefined();
      expect(res.body.data.stats.users.total).toBeGreaterThan(0);
      expect(res.body.data.stats.subscription).toBeDefined();
    });

    it('should get own tenant stats as tenant admin', async () => {
      const res = await request(app)
        .get(`/tenants/${tenantAdminTenant._id}/stats`)
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats.users.total).toBeGreaterThan(0);
    });

    it('should reject stats for other tenant as tenant admin', async () => {
      const res = await request(app)
        .get(`/tenants/${testTenant._id}/stats`)
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Unauthenticated requests', () => {
    it('should reject requests without token', async () => {
      const res = await request(app).get('/tenants');
      expect(res.status).toBe(401);
    });
  });
});
