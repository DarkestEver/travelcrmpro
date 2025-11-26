const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Itinerary = require('../../src/models/Itinerary');
const Lead = require('../../src/models/Lead');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const { USER_ROLES, USER_STATUS } = require('../../src/config/constants');

// Mock Redis (required for login to work)
jest.mock('../../src/lib/redis');
jest.mock('nodemailer');

describe('Itinerary Management Integration Tests', () => {
  let testTenant;
  let tenantAdmin, agent1, agent2;
  let tenantAdminToken, agent1Token, agent2Token;
  let testLead1;
  let testItinerary1, testItinerary2;
  const testId = Date.now();

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up
    await Itinerary.deleteMany({ 'title': { $regex: `test-itinerary-${testId}` } });
    await Lead.deleteMany({ 'customer.email': { $regex: `test-itinerary-${testId}` } });
    await User.deleteMany({ email: { $regex: `test-itinerary-${testId}` } });
    await Tenant.deleteMany({ slug: { $regex: `test-itinerary-${testId}` } });

    // Create test tenant
    testTenant = await Tenant.create({
      name: `Test Tenant Itinerary ${testId}`,
      slug: `test-itinerary-${testId}-tenant`,
      domain: `test-itinerary-${testId}.example.com`,
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
      email: `test-itinerary-${testId}-admin@example.com`,
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      tenant: testTenant._id,
      role: USER_ROLES.TENANT_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    agent1 = await User.create({
      email: `test-itinerary-${testId}-agent1@example.com`,
      password: 'Agent123!',
      firstName: 'Agent',
      lastName: 'One',
      tenant: testTenant._id,
      role: USER_ROLES.AGENT,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    agent2 = await User.create({
      email: `test-itinerary-${testId}-agent2@example.com`,
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

    // Create test lead
    testLead1 = await Lead.create({
      tenant: testTenant._id,
      source: 'website',
      status: 'qualified',
      priority: 'high',
      customer: {
        name: 'John Doe',
        email: `test-itinerary-${testId}-customer1@example.com`,
        phone: '+1234567890',
      },
      requirements: {
        destination: 'Paris',
        numberOfTravelers: { adults: 2 },
      },
      assignedTo: agent1._id,
    });

    // Create test itineraries
    testItinerary1 = await Itinerary.create({
      tenant: testTenant._id,
      title: `test-itinerary-${testId}-paris-trip`,
      description: 'Romantic Paris getaway',
      destination: 'Paris, France',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-05'),
      duration: 5,
      numberOfTravelers: { adults: 2 },
      lead: testLead1._id,
      createdBy: agent1._id,
      status: 'draft',
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Paris',
          description: 'Arrive and check in',
          destination: 'Paris',
          activities: [
            {
              title: 'Eiffel Tower Visit',
              type: 'sightseeing',
              cost: { amount: 50, currency: 'USD' },
            },
          ],
          accommodation: {
            name: 'Hotel de Paris',
            type: 'hotel',
            cost: { amount: 200, currency: 'USD' },
          },
        },
      ],
      pricing: {
        currency: 'USD',
      },
    });

    testItinerary2 = await Itinerary.create({
      tenant: testTenant._id,
      title: `test-itinerary-${testId}-london-trip`,
      description: 'London business trip',
      destination: 'London, UK',
      startDate: new Date('2026-01-10'),
      endDate: new Date('2026-01-12'),
      duration: 3,
      numberOfTravelers: { adults: 1 },
      createdBy: agent2._id,
      status: 'draft',
      days: [],
      pricing: {
        currency: 'GBP',
      },
    });
  });

  afterEach(async () => {
    await Itinerary.deleteMany({ 'title': { $regex: `test-itinerary-${testId}` } });
    await Lead.deleteMany({ 'customer.email': { $regex: `test-itinerary-${testId}` } });
    await User.deleteMany({ email: { $regex: `test-itinerary-${testId}` } });
    await Tenant.deleteMany({ slug: { $regex: `test-itinerary-${testId}` } });
  });

  describe('GET /itineraries', () => {
    it('should get all itineraries for tenant admin', async () => {
      const response = await request(app)
        .get('/itineraries')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it('should get only own itineraries for agent', async () => {
      const response = await request(app)
        .get('/itineraries')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toContain('paris');
    });

    it('should filter itineraries by status', async () => {
      const response = await request(app)
        .get('/itineraries?status=draft')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(i => i.status === 'draft')).toBe(true);
    });

    it('should search itineraries by text', async () => {
      const response = await request(app)
        .get('/itineraries?search=Paris')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/itineraries?page=1&limit=1')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.meta.totalPages).toBe(2);
    });
  });

  describe('GET /itineraries/:id', () => {
    it('should get itinerary by ID', async () => {
      const response = await request(app)
        .get(`/itineraries/${testItinerary1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toContain('paris');
      expect(response.body.data.days.length).toBe(1);
    });

    it('should allow agent to view own itinerary', async () => {
      const response = await request(app)
        .get(`/itineraries/${testItinerary1._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
    });

    it('should prevent agent from viewing other agent itinerary', async () => {
      const response = await request(app)
        .get(`/itineraries/${testItinerary2._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent itinerary', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/itineraries/${fakeId}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /itineraries', () => {
    it('should create new itinerary', async () => {
      const newItinerary = {
        title: `test-itinerary-${testId}-new-rome-trip`,
        description: 'Rome adventure',
        destination: 'Rome, Italy',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        numberOfTravelers: { adults: 2, children: 1 },
        days: [],
      };

      const response = await request(app)
        .post('/itineraries')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send(newItinerary);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toContain('rome');
      expect(response.body.data.duration).toBe(7);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/itineraries')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should validate end date after start date', async () => {
      const response = await request(app)
        .post('/itineraries')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          title: 'Invalid dates',
          destination: 'Test',
          startDate: '2026-03-10',
          endDate: '2026-03-05',
        });

      expect(response.status).toBe(400);
    });

    it('should create itinerary with lead reference', async () => {
      const response = await request(app)
        .post('/itineraries')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          title: `test-itinerary-${testId}-with-lead`,
          destination: 'Tokyo',
          startDate: '2026-04-01',
          endDate: '2026-04-05',
          lead: testLead1._id.toString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.data.lead).toBeDefined();
    });
  });

  describe('PUT /itineraries/:id', () => {
    it('should update itinerary', async () => {
      const response = await request(app)
        .put(`/itineraries/${testItinerary1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          status: 'approved',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('approved');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.version).toBe(2);
    });

    it('should allow agent to update own itinerary', async () => {
      const response = await request(app)
        .put(`/itineraries/${testItinerary1._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          tags: ['romantic', 'honeymoon'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tags).toContain('romantic');
    });

    it('should prevent agent from updating other agent itinerary', async () => {
      const response = await request(app)
        .put(`/itineraries/${testItinerary2._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          status: 'approved',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /itineraries/:id', () => {
    it('should delete itinerary (admin only)', async () => {
      const response = await request(app)
        .delete(`/itineraries/${testItinerary1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);

      const deleted = await Itinerary.findById(testItinerary1._id);
      expect(deleted).toBeNull();
    });

    it('should prevent agent from deleting itinerary', async () => {
      const response = await request(app)
        .delete(`/itineraries/${testItinerary1._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /itineraries/:id/days', () => {
    it('should add day to itinerary', async () => {
      const newDay = {
        title: 'Day at Louvre',
        description: 'Visit the Louvre Museum',
        destination: 'Paris',
        activities: [
          {
            title: 'Louvre Museum',
            type: 'cultural',
            cost: { amount: 20, currency: 'USD' },
          },
        ],
      };

      const response = await request(app)
        .post(`/itineraries/${testItinerary1._id}/days`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send(newDay);

      expect(response.status).toBe(201);
      expect(response.body.data.days.length).toBe(2);
      expect(response.body.data.days[1].dayNumber).toBe(2);
    });

    it('should prevent agent from adding day to other agent itinerary', async () => {
      const response = await request(app)
        .post(`/itineraries/${testItinerary2._id}/days`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({ title: 'Test Day', destination: 'Test' });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /itineraries/:id/days/:dayNumber', () => {
    it('should update day in itinerary', async () => {
      const response = await request(app)
        .put(`/itineraries/${testItinerary1._id}/days/1`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          title: 'Updated Day Title',
          notes: 'Some special notes',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.days[0].title).toBe('Updated Day Title');
      expect(response.body.data.days[0].notes).toBe('Some special notes');
    });

    it('should return 404 for non-existent day', async () => {
      const response = await request(app)
        .put(`/itineraries/${testItinerary1._id}/days/999`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({ title: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /itineraries/:id/days/:dayNumber', () => {
    it('should remove day from itinerary', async () => {
      const response = await request(app)
        .delete(`/itineraries/${testItinerary1._id}/days/1`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.days.length).toBe(0);
    });
  });

  describe('GET /itineraries/:id/calculate-costs', () => {
    it('should calculate itinerary costs', async () => {
      const response = await request(app)
        .get(`/itineraries/${testItinerary1._id}/calculate-costs`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('breakdown');
      expect(response.body.data).toHaveProperty('basePrice');
      expect(response.body.data).toHaveProperty('totalPrice');
      expect(response.body.data.breakdown.activities).toBe(50);
      expect(response.body.data.breakdown.accommodation).toBe(200);
    });
  });

  describe('POST /itineraries/:id/clone', () => {
    it('should clone itinerary', async () => {
      const response = await request(app)
        .post(`/itineraries/${testItinerary1._id}/clone`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.data.title).toContain('Copy');
      expect(response.body.data._id).not.toBe(testItinerary1._id.toString());
    });

    it('should clone itinerary as template', async () => {
      const response = await request(app)
        .post(`/itineraries/${testItinerary1._id}/clone`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          asTemplate: true,
          templateName: 'Paris Romantic Template',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.isTemplate).toBe(true);
      expect(response.body.data.templateName).toBe('Paris Romantic Template');
    });
  });

  describe('POST /itineraries/:id/send', () => {
    it('should send itinerary to client', async () => {
      const response = await request(app)
        .post(`/itineraries/${testItinerary1._id}/send`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          clientEmail: 'client@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('sent-to-client');
      expect(response.body.data.sentToClient.clientEmail).toBe('client@example.com');
    });

    it('should require client email', async () => {
      const response = await request(app)
        .post(`/itineraries/${testItinerary1._id}/send`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /itineraries/stats', () => {
    it('should get itinerary statistics for admin', async () => {
      const response = await request(app)
        .get('/itineraries/stats')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalItineraries');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data.totalItineraries).toBe(2);
    });

    it('should get agent-specific statistics', async () => {
      const response = await request(app)
        .get('/itineraries/stats')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.totalItineraries).toBe(1);
    });
  });
});
