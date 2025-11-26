const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Lead = require('../../src/models/Lead');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const { USER_ROLES, USER_STATUS } = require('../../src/config/constants');

// Mock Redis (required for login to work)
jest.mock('../../src/lib/redis');
jest.mock('nodemailer');

describe('Lead Management Integration Tests', () => {
  let testTenant;
  let tenantAdmin;
  let agent1;
  let agent2;
  let tenantAdminToken;
  let agent1Token;
  let agent2Token;
  let testLead1;
  let testLead2;
  const testId = Date.now();

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up
    await Lead.deleteMany({ 'customer.email': { $regex: `test-lead-${testId}` } });
    await User.deleteMany({ email: { $regex: `test-lead-${testId}` } });
    await Tenant.deleteMany({ slug: { $regex: `test-lead-${testId}` } });

    // Create test tenant
    testTenant = await Tenant.create({
      name: `Test Tenant Lead ${testId}`,
      slug: `test-lead-${testId}-tenant`,
      domain: `test-lead-${testId}.example.com`,
      status: 'active',
      subscription: {
        plan: 'professional',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Create test users
    tenantAdmin = await User.create({
      email: `test-lead-${testId}-admin@example.com`,
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      tenant: testTenant._id,
      role: USER_ROLES.TENANT_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    agent1 = await User.create({
      email: `test-lead-${testId}-agent1@example.com`,
      password: 'Agent123!',
      firstName: 'Agent',
      lastName: 'One',
      tenant: testTenant._id,
      role: USER_ROLES.AGENT,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    agent2 = await User.create({
      email: `test-lead-${testId}-agent2@example.com`,
      password: 'Agent123!',
      firstName: 'Agent',
      lastName: 'Two',
      tenant: testTenant._id,
      role: USER_ROLES.AGENT,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    // Login users
    const adminLogin = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', testTenant.slug)
      .send({
        email: tenantAdmin.email,
        password: 'Admin123!',
      });
    tenantAdminToken = adminLogin.body?.data?.accessToken || '';

    const agent1Login = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', testTenant.slug)
      .send({
        email: agent1.email,
        password: 'Agent123!',
      });
    agent1Token = agent1Login.body?.data?.accessToken || '';

    const agent2Login = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', testTenant.slug)
      .send({
        email: agent2.email,
        password: 'Agent123!',
      });
    agent2Token = agent2Login.body?.data?.accessToken || '';

    // Create test leads
    testLead1 = await Lead.create({
      tenant: testTenant._id,
      source: 'website',
      status: 'new',
      priority: 'high',
      customer: {
        name: 'John Doe',
        email: `test-lead-${testId}-customer1@example.com`,
        phone: '+1234567890',
        country: 'USA',
        city: 'New York',
      },
      requirements: {
        destination: 'Paris',
        travelDates: {
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-10'),
          flexible: false,
        },
        numberOfTravelers: {
          adults: 2,
          children: 1,
          infants: 0,
        },
        budget: {
          min: 5000,
          max: 7000,
          currency: 'USD',
        },
        packageType: 'luxury',
      },
      assignedTo: agent1._id,
      estimatedValue: {
        amount: 6500,
        currency: 'USD',
      },
      tags: ['europe', 'family'],
    });

    testLead2 = await Lead.create({
      tenant: testTenant._id,
      source: 'phone',
      status: 'contacted',
      priority: 'medium',
      customer: {
        name: 'Jane Smith',
        email: `test-lead-${testId}-customer2@example.com`,
        phone: '+0987654321',
        country: 'UK',
        city: 'London',
      },
      requirements: {
        destination: 'Tokyo',
        numberOfTravelers: {
          adults: 1,
        },
      },
      assignedTo: agent2._id,
    });
  });

  afterEach(async () => {
    await Lead.deleteMany({ 'customer.email': { $regex: `test-lead-${testId}` } });
    await User.deleteMany({ email: { $regex: `test-lead-${testId}` } });
    await Tenant.deleteMany({ slug: { $regex: `test-lead-${testId}` } });
  });

  describe('GET /leads', () => {
    it('should get all leads for tenant admin', async () => {
      const response = await request(app)
        .get('/leads')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta.totalItems).toBe(2);
    });

    it('should get only assigned leads for agent', async () => {
      const response = await request(app)
        .get('/leads')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].customer.email).toBe(testLead1.customer.email);
    });

    it('should filter leads by status', async () => {
      const response = await request(app)
        .get('/leads?status=contacted')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('contacted');
    });

    it('should filter leads by priority', async () => {
      const response = await request(app)
        .get('/leads?priority=high')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].priority).toBe('high');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/leads?page=1&limit=1')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.meta.currentPage).toBe(1);
      expect(response.body.meta.totalPages).toBe(2);
    });

    it('should search leads by text', async () => {
      const response = await request(app)
        .get('/leads?search=Paris')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/leads')
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /leads/:id', () => {
    it('should get lead by ID', async () => {
      const response = await request(app)
        .get(`/leads/${testLead1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(testLead1._id.toString());
      expect(response.body.data.customer.name).toBe('John Doe');
    });

    it('should allow agent to view assigned lead', async () => {
      const response = await request(app)
        .get(`/leads/${testLead1._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(testLead1._id.toString());
    });

    it('should prevent agent from viewing unassigned lead', async () => {
      const response = await request(app)
        .get(`/leads/${testLead2._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent lead', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/leads/${fakeId}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /leads', () => {
    it('should create new lead', async () => {
      const newLead = {
        source: 'email',
        priority: 'high',
        customer: {
          name: 'Test Customer',
          email: `test-lead-${testId}-new@example.com`,
          phone: '+1111111111',
          country: 'USA',
        },
        requirements: {
          destination: 'Bali',
          numberOfTravelers: {
            adults: 2,
          },
        },
        tags: ['asia', 'honeymoon'],
      };

      const response = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send(newLead);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.name).toBe('Test Customer');
      expect(response.body.data.tenant).toBe(testTenant._id.toString());
      expect(response.body.data.status).toBe('new');
    });

    it('should allow agent to create lead', async () => {
      const newLead = {
        customer: {
          name: 'Agent Lead',
          email: `test-lead-${testId}-agent-created@example.com`,
          phone: '+2222222222',
        },
      };

      const response = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send(newLead);

      expect(response.status).toBe(201);
      expect(response.body.data.customer.name).toBe('Agent Lead');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          source: 'website',
        });

      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          customer: {
            name: 'Test',
            email: 'invalid-email',
            phone: '+1234567890',
          },
        });

      expect(response.status).toBe(400);
    });

    it('should create lead with assigned user', async () => {
      const response = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          customer: {
            name: 'Assigned Lead',
            email: `test-lead-${testId}-assigned@example.com`,
            phone: '+3333333333',
          },
          assignedTo: agent1._id.toString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.data.assignedTo).toBe(agent1._id.toString());
    });
  });

  describe('PUT /leads/:id', () => {
    it('should update lead', async () => {
      const response = await request(app)
        .put(`/leads/${testLead1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          status: 'qualified',
          priority: 'urgent',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('qualified');
      expect(response.body.data.priority).toBe('urgent');
    });

    it('should allow agent to update assigned lead', async () => {
      const response = await request(app)
        .put(`/leads/${testLead1._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          status: 'contacted',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('contacted');
    });

    it('should prevent agent from updating unassigned lead', async () => {
      const response = await request(app)
        .put(`/leads/${testLead2._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          status: 'qualified',
        });

      expect(response.status).toBe(403);
    });

    it('should update nested customer fields', async () => {
      const response = await request(app)
        .put(`/leads/${testLead1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          customer: {
            phone: '+9999999999',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.customer.phone).toBe('+9999999999');
      expect(response.body.data.customer.name).toBe('John Doe'); // Preserved
    });

    it('should require at least one field', async () => {
      const response = await request(app)
        .put(`/leads/${testLead1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /leads/:id', () => {
    it('should delete lead (admin only)', async () => {
      const response = await request(app)
        .delete(`/leads/${testLead1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);

      const deletedLead = await Lead.findById(testLead1._id);
      expect(deletedLead).toBeNull();
    });

    it('should prevent agent from deleting lead', async () => {
      const response = await request(app)
        .delete(`/leads/${testLead1._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent lead', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/leads/${fakeId}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /leads/:id/assign', () => {
    it('should assign lead to agent', async () => {
      const response = await request(app)
        .put(`/leads/${testLead1._id}/assign`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          assignedTo: agent2._id.toString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.data.assignedTo).toBe(agent2._id.toString());
    });

    it('should prevent agent from assigning leads', async () => {
      const response = await request(app)
        .put(`/leads/${testLead1._id}/assign`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          assignedTo: agent2._id.toString(),
        });

      expect(response.status).toBe(403);
    });

    it('should validate assigned user exists', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/leads/${testLead1._id}/assign`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          assignedTo: fakeUserId.toString(),
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /leads/:id/notes', () => {
    it('should add note to lead', async () => {
      const response = await request(app)
        .post(`/leads/${testLead1._id}/notes`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          note: 'Customer is very interested in luxury hotels',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.notes.length).toBeGreaterThan(0);
      expect(response.body.data.notes[0].note).toBe('Customer is very interested in luxury hotels');
    });

    it('should prevent agent from adding note to unassigned lead', async () => {
      const response = await request(app)
        .post(`/leads/${testLead2._id}/notes`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          note: 'Trying to add note',
        });

      expect(response.status).toBe(403);
    });

    it('should require note text', async () => {
      const response = await request(app)
        .post(`/leads/${testLead1._id}/notes`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /leads/:id/convert', () => {
    it('should convert lead to booking', async () => {
      const fakeBookingId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/leads/${testLead1._id}/convert`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          bookingId: fakeBookingId.toString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.data.convertedToBooking).toBe(true);
      expect(response.body.data.bookingId).toBe(fakeBookingId.toString());
      expect(response.body.data.status).toBe('won');
    });

    it('should prevent converting already converted lead', async () => {
      const fakeBookingId = new mongoose.Types.ObjectId();
      await request(app)
        .post(`/leads/${testLead1._id}/convert`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          bookingId: fakeBookingId.toString(),
        });

      const response = await request(app)
        .post(`/leads/${testLead1._id}/convert`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          bookingId: new mongoose.Types.ObjectId().toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('ALREADY_CONVERTED');
    });
  });

  describe('GET /leads/stats', () => {
    it('should get lead statistics for admin', async () => {
      const response = await request(app)
        .get('/leads/stats')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('byPriority');
      expect(response.body.data).toHaveProperty('bySource');
      expect(response.body.data).toHaveProperty('conversionRate');
      expect(response.body.data.totalLeads).toBe(2);
    });

    it('should get agent-specific statistics', async () => {
      const response = await request(app)
        .get('/leads/stats')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.totalLeads).toBe(1);
    });
  });
});
