const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const { USER_ROLES, USER_STATUS } = require('../../src/config/constants');

// Mock Redis (not installed)
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

// Mock nodemailer to avoid sending emails
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
    verify: jest.fn(() => Promise.resolve(true)),
  })),
}));

describe('User Management Integration Tests', () => {
  let testTenant1, testTenant2;
  let superAdminUser, tenantAdminUser1, tenantAdminUser2, agentUser1, customerUser1, agentUser2;
  let superAdminToken, tenantAdmin1Token, tenantAdmin2Token, agentToken, customerToken;
  let testId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/travel-crm');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Generate unique test ID to avoid collisions
    testId = Date.now();

    // Clean up before each test
    await User.deleteMany({}).exec();
    await Tenant.deleteMany({}).exec();
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for cleanup

    // Create test tenants
    testTenant1 = await Tenant.create({
      name: `Test Tenant 1 ${testId}`,
      slug: `test-tenant-1-${testId}`,
      domain: `tenant1-${testId}.example.com`,
      status: 'active',
      subscription: {
        plan: 'professional',
        status: 'active',
      },
      contact: {
        email: `admin1-${testId}@example.com`,
        phone: '+1234567890',
      },
    });

    testTenant2 = await Tenant.create({
      name: `Test Tenant 2 ${testId}`,
      slug: `test-tenant-2-${testId}`,
      domain: `tenant2-${testId}.example.com`,
      status: 'active',
      subscription: {
        plan: 'starter',
        status: 'active',
      },
      contact: {
        email: `admin2-${testId}@example.com`,
        phone: '+0987654321',
      },
    });

    // Create test users
    superAdminUser = await User.create({
      email: `superadmin-${testId}@example.com`,
      password: 'SecurePass123!',
      firstName: 'Super',
      lastName: 'Admin',
      role: USER_ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    tenantAdminUser1 = await User.create({
      tenant: testTenant1._id,
      email: `tenantadmin1-${testId}@example.com`,
      password: 'SecurePass123!',
      firstName: 'Tenant',
      lastName: 'Admin 1',
      role: USER_ROLES.TENANT_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    tenantAdminUser2 = await User.create({
      tenant: testTenant2._id,
      email: `tenantadmin2-${testId}@example.com`,
      password: 'SecurePass123!',
      firstName: 'Tenant',
      lastName: 'Admin 2',
      role: USER_ROLES.TENANT_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    agentUser1 = await User.create({
      tenant: testTenant1._id,
      email: `agent1-${testId}@example.com`,
      password: 'SecurePass123!',
      firstName: 'Agent',
      lastName: 'One',
      role: USER_ROLES.AGENT,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
      agentCode: `AGT1-${testId}`,
    });

    customerUser1 = await User.create({
      tenant: testTenant1._id,
      email: `customer1-${testId}@example.com`,
      password: 'SecurePass123!',
      firstName: 'Customer',
      lastName: 'One',
      role: USER_ROLES.CUSTOMER,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
      assignedAgent: agentUser1._id,
    });

    agentUser2 = await User.create({
      tenant: testTenant2._id,
      email: `agent2-${testId}@example.com`,
      password: 'SecurePass123!',
      firstName: 'Agent',
      lastName: 'Two',
      role: USER_ROLES.AGENT,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
      agentCode: `AGT2-${testId}`,
    });

    // Login all users (super admin doesn't need tenant header)
    const superAdminLogin = await request(app)
      .post('/auth/login')
      .send({
        email: superAdminUser.email,
        password: 'SecurePass123!',
      });

    if (superAdminLogin.status !== 200) {
      throw new Error(`Super admin login failed with status ${superAdminLogin.status}: ${JSON.stringify(superAdminLogin.body)}`);
    }
    superAdminToken = superAdminLogin.body?.data?.accessToken || '';

    const tenantAdmin1Login = await request(app)
      .post('/auth/login')
      .set('x-tenant-slug', testTenant1.slug)
      .send({
        email: tenantAdminUser1.email,
        password: 'SecurePass123!',
      });
    tenantAdmin1Token = tenantAdmin1Login.body?.data?.accessToken || '';

    const tenantAdmin2Login = await request(app)
      .post('/auth/login')
      .set('x-tenant-slug', testTenant2.slug)
      .send({
        email: tenantAdminUser2.email,
        password: 'SecurePass123!',
      });
    tenantAdmin2Token = tenantAdmin2Login.body?.data?.accessToken || '';

    const agentLogin = await request(app)
      .post('/auth/login')
      .set('x-tenant-slug', testTenant1.slug)
      .send({
        email: agentUser1.email,
        password: 'SecurePass123!',
      });
    agentToken = agentLogin.body?.data?.accessToken || '';

    const customerLogin = await request(app)
      .post('/auth/login')
      .set('x-tenant-slug', testTenant1.slug)
      .send({
        email: customerUser1.email,
        password: 'SecurePass123!',
      });
    customerToken = customerLogin.body?.data?.accessToken || '';
  });

  afterEach(async () => {
    await User.deleteMany({}).exec();
    await Tenant.deleteMany({}).exec();
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for cleanup
  });

  // ============================================================================
  // GET /users - Get all users
  // ============================================================================

  describe('GET /users', () => {
    it('should allow super admin to get all users across all tenants', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeDefined();
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(6); // All test users
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(6);
    });

    it('should allow tenant admin to get only users in their tenant', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeDefined();
      expect(res.body.data.users.length).toBe(3); // tenantAdmin1, agent1, customer1
      
      // Verify all users belong to tenant 1
      res.body.data.users.forEach(user => {
        expect(user.tenant._id.toString()).toBe(testTenant1._id.toString());
      });
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/users?role=agent')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(2); // agent1, agent2
      res.body.data.users.forEach(user => {
        expect(user.role).toBe(USER_ROLES.AGENT);
      });
    });

    it('should filter users by status', async () => {
      const res = await request(app)
        .get(`/users?status=${USER_STATUS.ACTIVE}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.users.forEach(user => {
        expect(user.status).toBe(USER_STATUS.ACTIVE);
      });
    });

    it('should search users by name or email', async () => {
      const res = await request(app)
        .get('/users?search=Agent')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(2);
      res.body.data.users.forEach(user => {
        const fullName = `${user.firstName} ${user.lastName}`;
        const matchesSearch = fullName.toLowerCase().includes('agent') || 
                             user.email.toLowerCase().includes('agent');
        expect(matchesSearch).toBe(true);
      });
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/users?page=1&limit=2')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(6);
    });

    it('should reject request without authentication', async () => {
      const res = await request(app)
        .get('/users')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // GET /users/:id - Get user by ID
  // ============================================================================

  describe('GET /users/:id', () => {
    it('should allow super admin to get any user', async () => {
      const res = await request(app)
        .get(`/users/${agentUser2._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id.toString()).toBe(agentUser2._id.toString());
      expect(res.body.data.user.email).toBe(agentUser2.email);
    });

    it('should allow tenant admin to get users in their tenant', async () => {
      const res = await request(app)
        .get(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id.toString()).toBe(agentUser1._id.toString());
    });

    it('should reject tenant admin getting user from other tenant', async () => {
      const res = await request(app)
        .get(`/users/${agentUser2._id}`)
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should allow user to get their own profile', async () => {
      const res = await request(app)
        .get(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id.toString()).toBe(agentUser1._id.toString());
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // PUT /users/:id - Update user
  // ============================================================================

  describe('PUT /users/:id', () => {
    it('should allow super admin to update any user', async () => {
      const res = await request(app)
        .put(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Agent',
          phone: '+9999999999',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.firstName).toBe('Updated');
      expect(res.body.data.user.lastName).toBe('Agent');
      expect(res.body.data.user.phone).toBe('+9999999999');
    });

    it('should allow tenant admin to update users in their tenant', async () => {
      const res = await request(app)
        .put(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .send({
          firstName: 'Modified',
          phone: '+1111111111',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.firstName).toBe('Modified');
      expect(res.body.data.user.phone).toBe('+1111111111');
    });

    it('should reject tenant admin updating user from other tenant', async () => {
      const res = await request(app)
        .put(`/users/${agentUser2._id}`)
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .send({
          firstName: 'Should Fail',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should allow user to update their own profile', async () => {
      const res = await request(app)
        .put(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          firstName: 'Self Updated',
          phone: '+8888888888',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.firstName).toBe('Self Updated');
    });

    it('should reject user trying to update their own role', async () => {
      const res = await request(app)
        .put(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          role: USER_ROLES.TENANT_ADMIN,
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should reject user trying to update their own status', async () => {
      const res = await request(app)
        .put(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          status: USER_STATUS.SUSPENDED,
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should allow super admin to update user status', async () => {
      const res = await request(app)
        .put(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: USER_STATUS.SUSPENDED,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.status).toBe(USER_STATUS.SUSPENDED);
    });

    it('should reject tenant admin trying to change user role', async () => {
      const res = await request(app)
        .put(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .send({
          role: USER_ROLES.TENANT_ADMIN,
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should reject tenant admin trying to update super admin', async () => {
      const res = await request(app)
        .put(`/users/${superAdminUser._id}`)
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .send({
          firstName: 'Should Fail',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // DELETE /users/:id - Delete user
  // ============================================================================

  describe('DELETE /users/:id', () => {
    it('should allow super admin to delete any user', async () => {
      const res = await request(app)
        .delete(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(agentUser1._id);
      expect(deletedUser).toBeNull();
    });

    it('should allow tenant admin to delete users in their tenant', async () => {
      const res = await request(app)
        .delete(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify user is deleted
      const deletedUser = await User.findById(agentUser1._id);
      expect(deletedUser).toBeNull();
    });

    it('should reject tenant admin deleting user from other tenant', async () => {
      const res = await request(app)
        .delete(`/users/${agentUser2._id}`)
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .expect(403);

      expect(res.body.success).toBe(false);

      // Verify user still exists
      const user = await User.findById(agentUser2._id);
      expect(user).not.toBeNull();
    });

    it('should reject user trying to delete themselves', async () => {
      const res = await request(app)
        .delete(`/users/${agentUser1._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);

      // Verify user still exists
      const user = await User.findById(agentUser1._id);
      expect(user).not.toBeNull();
    });

    it('should reject tenant admin trying to delete super admin', async () => {
      const res = await request(app)
        .delete(`/users/${superAdminUser._id}`)
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .expect(403);

      expect(res.body.success).toBe(false);

      // Verify super admin still exists
      const user = await User.findById(superAdminUser._id);
      expect(user).not.toBeNull();
    });

    it('should return 404 when deleting non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // PUT /users/:id/role - Assign role
  // ============================================================================

  describe('PUT /users/:id/role', () => {
    it('should allow super admin to assign any role', async () => {
      const res = await request(app)
        .put(`/users/${agentUser1._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          role: USER_ROLES.TENANT_ADMIN,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe(USER_ROLES.TENANT_ADMIN);

      // Verify role was updated
      const updatedUser = await User.findById(agentUser1._id);
      expect(updatedUser.role).toBe(USER_ROLES.TENANT_ADMIN);
    });

    it('should reject non-super-admin from assigning roles', async () => {
      const res = await request(app)
        .put(`/users/${agentUser1._id}/role`)
        .set('Authorization', `Bearer ${tenantAdmin1Token}`)
        .send({
          role: USER_ROLES.CUSTOMER,
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should reject super admin trying to change their own role', async () => {
      const res = await request(app)
        .put(`/users/${superAdminUser._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          role: USER_ROLES.CUSTOMER,
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .put(`/users/${agentUser1._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          role: 'INVALID_ROLE',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/users/${fakeId}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          role: USER_ROLES.AGENT,
        })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});
