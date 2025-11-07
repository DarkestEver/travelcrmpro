const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const SubUser = require('../../src/models/SubUser');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/jwt');

describe('Agent Sub-User Controller', () => {
  let agentToken;
  let agentUser;
  let tenantId;
  let subUserId;

  beforeAll(async () => {
    tenantId = new mongoose.Types.ObjectId();
    
    // Create test agent user
    agentUser = await User.create({
      email: 'testagent@example.com',
      password: 'Password123!',
      role: 'agent',
      firstName: 'Test',
      lastName: 'Agent',
      tenantId,
      isActive: true,
      agentCode: 'AGT001',
      agentLevel: 'gold',
      creditLimit: 10000,
      commissionRate: 15,
    });

    agentToken = generateToken(agentUser._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await SubUser.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/v1/agent-portal/sub-users', () => {
    it('should create a new sub-user', async () => {
      const res = await request(app)
        .post('/api/v1/agent-portal/sub-users')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          role: 'user',
          permissions: {
            customers: { view: true, edit: false },
            quotes: { view: true, create: true },
          },
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subUser).toHaveProperty('_id');
      expect(res.body.data.subUser.email).toBe('john@example.com');
      expect(res.body.data.subUser.role).toBe('user');
      
      subUserId = res.body.data.subUser._id;
    });

    it('should not allow duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/agent-portal/sub-users')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'Password123!',
          role: 'user',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('email already exists');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/agent-portal/sub-users')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/agent-portal/sub-users', () => {
    it('should get all sub-users for agent', async () => {
      const res = await request(app)
        .get('/api/v1/agent-portal/sub-users')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.subUsers)).toBe(true);
      expect(res.body.data.subUsers.length).toBeGreaterThan(0);
    });

    it('should filter by role', async () => {
      const res = await request(app)
        .get('/api/v1/agent-portal/sub-users?role=user')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.subUsers.every(su => su.role === 'user')).toBe(true);
    });

    it('should search by name or email', async () => {
      const res = await request(app)
        .get('/api/v1/agent-portal/sub-users?search=john')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.subUsers.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/agent-portal/sub-users/:id', () => {
    it('should get single sub-user by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/agent-portal/sub-users/${subUserId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subUser._id).toBe(subUserId);
    });

    it('should return 404 for non-existent sub-user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/agent-portal/sub-users/${fakeId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/v1/agent-portal/sub-users/:id', () => {
    it('should update sub-user', async () => {
      const res = await request(app)
        .put(`/api/v1/agent-portal/sub-users/${subUserId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          name: 'John Updated',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subUser.name).toBe('John Updated');
    });
  });

  describe('PATCH /api/v1/agent-portal/sub-users/:id/permissions', () => {
    it('should update sub-user permissions', async () => {
      const res = await request(app)
        .patch(`/api/v1/agent-portal/sub-users/${subUserId}/permissions`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          permissions: {
            customers: { view: true, edit: true, delete: false },
            bookings: { view: true },
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.subUser.permissions.customers.edit).toBe(true);
    });
  });

  describe('PATCH /api/v1/agent-portal/sub-users/:id/toggle-status', () => {
    it('should toggle sub-user active status', async () => {
      const res = await request(app)
        .patch(`/api/v1/agent-portal/sub-users/${subUserId}/toggle-status`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.subUser.isActive).toBe(false);
    });
  });

  describe('GET /api/v1/agent-portal/sub-users/stats', () => {
    it('should get sub-user statistics', async () => {
      const res = await request(app)
        .get('/api/v1/agent-portal/sub-users/stats')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.stats).toHaveProperty('total');
      expect(res.body.data.stats).toHaveProperty('active');
      expect(res.body.data.stats).toHaveProperty('byRole');
    });
  });

  describe('DELETE /api/v1/agent-portal/sub-users/:id', () => {
    it('should delete sub-user', async () => {
      const res = await request(app)
        .delete(`/api/v1/agent-portal/sub-users/${subUserId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const deletedUser = await SubUser.findById(subUserId);
      expect(deletedUser).toBeNull();
    });
  });
});
