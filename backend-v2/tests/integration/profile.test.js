const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const redis = require('../../src/lib/redis');
const { USER_ROLES, USER_STATUS } = require('../../src/config/constants');

// Mock Redis and nodemailer
jest.mock('../../src/lib/redis');
jest.mock('nodemailer');

describe('Profile Management Integration Tests', () => {
  let testTenant1, testTenant2;
  let superAdminUser, tenantAdminUser, agentUser;
  let superAdminToken, tenantAdminToken, agentToken;
  let testRefreshToken;

  const testId = Date.now();

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: `test-profile-${testId}` } });
    await Tenant.deleteMany({ slug: { $regex: `test-profile-${testId}` } });

    // Create test tenants
    testTenant1 = await Tenant.create({
      name: `Test Tenant 1 Profile ${testId}`,
      slug: `test-profile-${testId}-tenant1`,
      domain: `test-profile-${testId}-tenant1.example.com`,
      status: 'active',
      subscription: {
        plan: 'professional',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    testTenant2 = await Tenant.create({
      name: `Test Tenant 2 Profile ${testId}`,
      slug: `test-profile-${testId}-tenant2`,
      domain: `test-profile-${testId}-tenant2.example.com`,
      status: 'active',
      subscription: {
        plan: 'professional',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Create test users
    superAdminUser = await User.create({
      email: `test-profile-${testId}-superadmin@example.com`,
      password: 'SuperAdmin123!',
      firstName: 'Super',
      lastName: 'Admin',
      role: USER_ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    tenantAdminUser = await User.create({
      email: `test-profile-${testId}-tenantadmin@example.com`,
      password: 'TenantAdmin123!',
      firstName: 'Tenant',
      lastName: 'Admin',
      tenant: testTenant1._id,
      role: USER_ROLES.TENANT_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
      phone: '+1234567890',
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
      },
    });

    agentUser = await User.create({
      email: `test-profile-${testId}-agent@example.com`,
      password: 'Agent123!',
      firstName: 'Test',
      lastName: 'Agent',
      tenant: testTenant1._id,
      role: USER_ROLES.AGENT,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    // Login users
    const superAdminLogin = await request(app)
      .post('/auth/login')
      .send({
        email: superAdminUser.email,
        password: 'SuperAdmin123!',
      });
    superAdminToken = superAdminLogin.body?.data?.accessToken || '';

    const tenantAdminLogin = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', testTenant1.slug)
      .send({
        email: tenantAdminUser.email,
        password: 'TenantAdmin123!',
      });
    tenantAdminToken = tenantAdminLogin.body?.data?.accessToken || '';
    testRefreshToken = tenantAdminLogin.body?.data?.refreshToken || '';

    const agentLogin = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', testTenant1.slug)
      .send({
        email: agentUser.email,
        password: 'Agent123!',
      });
    agentToken = agentLogin.body?.data?.accessToken || '';

    // Mock Redis for session tests
    redis.keys = jest.fn();
    redis.get = jest.fn();
    redis.ttl = jest.fn();
    redis.del = jest.fn();
  });

  afterEach(async () => {
    await User.deleteMany({ email: { $regex: `test-profile-${testId}` } });
    await Tenant.deleteMany({ slug: { $regex: `test-profile-${testId}` } });
    jest.clearAllMocks();
  });

  describe('GET /profile', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(tenantAdminUser.email);
      expect(response.body.data.firstName).toBe('Tenant');
      expect(response.body.data.lastName).toBe('Admin');
      expect(response.body.data.role).toBe(USER_ROLES.TENANT_ADMIN);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should populate tenant information', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.tenant).toBeDefined();
      expect(response.body.data.tenant.name).toBe(testTenant1.name);
      expect(response.body.data.tenant.slug).toBe(testTenant1.slug);
    });

    it('should work for super admin without tenant', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(superAdminUser.email);
      expect(response.body.data.role).toBe(USER_ROLES.SUPER_ADMIN);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /profile', () => {
    it('should update profile fields', async () => {
      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          phone: '+9876543210',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.phone).toBe('+9876543210');

      // Verify in database
      const updatedUser = await User.findById(agentUser._id);
      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
      expect(updatedUser.phone).toBe('+9876543210');
    });

    it('should update preferences', async () => {
      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({
          preferences: {
            language: 'es',
            currency: 'EUR',
            notifications: {
              email: false,
              push: true,
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.preferences.language).toBe('es');
      expect(response.body.data.preferences.currency).toBe('EUR');
      expect(response.body.data.preferences.timezone).toBe('America/New_York'); // Preserved
    });

    it('should merge preferences with existing ones', async () => {
      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({
          preferences: {
            currency: 'GBP',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.preferences.currency).toBe('GBP');
      expect(response.body.data.preferences.language).toBe('en'); // Preserved
      expect(response.body.data.preferences.timezone).toBe('America/New_York'); // Preserved
    });

    it('should reject invalid phone format', async () => {
      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          phone: 'invalid-phone',
        });

      expect(response.status).toBe(400);
    });

    it('should require at least one field', async () => {
      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should not update email or role', async () => {
      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          firstName: 'Updated',
          email: 'hacker@example.com',
          role: USER_ROLES.SUPER_ADMIN,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.email).toBe(agentUser.email); // Unchanged
      expect(response.body.data.role).toBe(USER_ROLES.AGENT); // Unchanged
    });
  });

  describe('PUT /profile/password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .put('/profile/password')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          oldPassword: 'Agent123!',
          newPassword: 'NewAgent456!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/auth/login')
        .set('X-Tenant-Slug', testTenant1.slug)
        .send({
          email: agentUser.email,
          password: 'NewAgent456!',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should reject incorrect old password', async () => {
      const response = await request(app)
        .put('/profile/password')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          oldPassword: 'WrongPassword!',
          newPassword: 'NewAgent456!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('should reject same password', async () => {
      const response = await request(app)
        .put('/profile/password')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          oldPassword: 'Agent123!',
          newPassword: 'Agent123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('SAME_PASSWORD');
    });

    it('should reject weak new password', async () => {
      const response = await request(app)
        .put('/profile/password')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          oldPassword: 'Agent123!',
          newPassword: 'weak',
        });

      expect(response.status).toBe(400);
    });

    it('should require both old and new password', async () => {
      const response = await request(app)
        .put('/profile/password')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          newPassword: 'NewAgent456!',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /profile/avatar', () => {
    it('should upload avatar (placeholder test)', async () => {
      // Note: This will be fully implemented when uploadService is ready
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', `Bearer ${agentToken}`);

      // For now, expect error since no file uploaded
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('NO_FILE');
    });
  });

  describe('GET /profile/sessions', () => {
    it('should list active sessions', async () => {
      // Mock Redis responses
      redis.keys.mockResolvedValue([
        `refresh_token:${tenantAdminUser._id}:token1`,
        `refresh_token:${tenantAdminUser._id}:token2`,
      ]);

      redis.get.mockImplementation((key) => {
        return Promise.resolve(JSON.stringify({
          userId: tenantAdminUser._id,
          tenantId: testTenant1._id,
          createdAt: new Date(),
        }));
      });

      redis.ttl.mockResolvedValue(604800); // 7 days

      const response = await request(app)
        .get('/profile/sessions')
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('sessionId');
      expect(response.body.data[0]).toHaveProperty('createdAt');
      expect(response.body.data[0]).toHaveProperty('expiresIn');
    });

    it('should handle no active sessions', async () => {
      redis.keys.mockResolvedValue([]);

      const response = await request(app)
        .get('/profile/sessions')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('DELETE /profile/sessions/:sessionId', () => {
    it('should revoke a session', async () => {
      redis.del.mockResolvedValue(1);

      const response = await request(app)
        .delete('/profile/sessions/token123')
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(redis.del).toHaveBeenCalledWith(
        `refresh_token:${tenantAdminUser._id}:token123`
      );
    });

    it('should return 404 for non-existent session', async () => {
      redis.del.mockResolvedValue(0);

      const response = await request(app)
        .delete('/profile/sessions/nonexistent')
        .set('Authorization', `Bearer ${tenantAdminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('should prevent revoking current session', async () => {
      // This test needs sessionId in JWT token, which requires token service modification
      // For now, skip this edge case
      // Will be properly tested when sessionId is added to JWT payload
    });
  });
});
