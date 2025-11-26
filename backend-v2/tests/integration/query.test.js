// Mock Redis (not installed) - MUST be before app import
jest.mock('../../src/lib/redis', () => ({
  get: jest.fn((key) => {
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
const Query = require('../../src/models/Query');
const AgentAvailability = require('../../src/models/AgentAvailability');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const Lead = require('../../src/models/Lead');
const { USER_ROLES, USER_STATUS } = require('../../src/config/constants');

describe('Query API Integration Tests', () => {
  let authToken;
  let tenantId;
  let tenantSlug;
  let userId;
  let agentId;
  let testQuery;

  beforeEach(async () => {
    // Create tenant
    const tenant = await Tenant.create({
      name: 'Test Travel Agency',
      slug: 'test-travel-agency',
      domain: 'test-travel.com',
      status: 'active',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
      },
    });
    tenantId = tenant._id;
    tenantSlug = tenant.slug;

    // Create admin user
    const admin = await User.create({
      tenant: tenantId,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'Test@1234',
      role: USER_ROLES.TENANT_ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });
    userId = admin._id;

    // Create agent user
    const agent = await User.create({
      tenant: tenantId,
      firstName: 'Agent',
      lastName: 'Smith',
      email: 'agent@test.com',
      password: 'Test@1234',
      role: USER_ROLES.AGENT,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });
    agentId = agent._id;

    // Login to get token
    const loginRes = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', tenantSlug)
      .send({
        email: 'admin@test.com',
        password: 'Test@1234',
      });

    authToken = loginRes.body?.data?.accessToken || '';

    // Create test query
    const queryNumber = await Query.generateQueryNumber(tenantId);
    testQuery = await Query.create({
      tenant: tenantId,
      queryNumber,
      source: 'website',
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      tripDetails: {
        destination: 'Paris',
        travelDates: {
          preferred: {
            from: new Date('2025-06-01'),
            to: new Date('2025-06-10'),
          },
        },
        travelers: {
          adults: 2,
          children: 0,
          infants: 0,
        },
      },
      budget: {
        amount: 5000,
        currency: 'USD',
      },
      tripType: 'leisure',
      priority: 'medium',
      status: 'pending',
      createdBy: userId,
    });
    testQuery.calculateSLA();
    await testQuery.save();
  });

  afterEach(async () => {
    await Query.deleteMany({});
    await AgentAvailability.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Lead.deleteMany({});
  });

  describe('POST /queries/create - Create Query', () => {
    it('should create a new query with auto-generated query number', async () => {
      const res = await request(app)
        .post('/queries/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          source: 'email',
          customer: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1987654321',
          },
          tripDetails: {
            destination: 'Tokyo',
            travelDates: {
              preferred: {
                from: '2025-07-01',
                to: '2025-07-10',
              },
            },
            travelers: {
              adults: 2,
            },
          },
          budget: {
            amount: 8000,
            currency: 'USD',
          },
          tripType: 'honeymoon',
          priority: 'high',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.queryNumber).toMatch(/^QRY-\d{6}-\d{4}$/);
      expect(res.body.data.customer.email).toBe('jane@example.com');
      expect(res.body.data.sla.deadline).toBeDefined();
      expect(res.body.data.priority).toBe('high');
    });

    it('should calculate correct SLA deadlines based on priority', async () => {
      const res = await request(app)
        .post('/queries/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          source: 'phone',
          customer: {
            name: 'Urgent Customer',
            email: 'urgent@example.com',
            phone: '+1111111111',
          },
          tripDetails: {
            destination: 'London',
            travelers: { adults: 1 },
          },
          priority: 'urgent',
        });

      expect(res.status).toBe(201);
      const createdAt = new Date(res.body.data.createdAt);
      const deadline = new Date(res.body.data.sla.deadline);
      const diffMinutes = Math.round((deadline - createdAt) / (1000 * 60));
      expect(diffMinutes).toBe(120); // 2 hours for urgent priority
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/queries/create')
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          source: 'website',
          customer: {
            name: 'Test',
            email: 'test@example.com',
            phone: '+1111111111',
          },
          tripDetails: {
            destination: 'Paris',
            travelers: { adults: 2 },
          },
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /queries - Get All Queries', () => {
    it('should retrieve all queries with pagination', async () => {
      const res = await request(app)
        .get('/queries')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.queries)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.queries.length).toBeGreaterThan(0);
    });

    it('should filter queries by status', async () => {
      const res = await request(app)
        .get('/queries')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .query({ status: 'pending' });

      expect(res.status).toBe(200);
      expect(res.body.data.queries.every(q => q.status === 'pending')).toBe(true);
    });

    it('should filter queries by priority', async () => {
      const res = await request(app)
        .get('/queries')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .query({ priority: 'medium' });

      expect(res.status).toBe(200);
      expect(res.body.data.queries.every(q => q.priority === 'medium')).toBe(true);
    });

    it('should search queries by customer name', async () => {
      const res = await request(app)
        .get('/queries')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .query({ search: 'John' });

      expect(res.status).toBe(200);
      expect(res.body.data.queries.length).toBeGreaterThan(0);
    });

    it('should filter overdue queries', async () => {
      // Make query overdue by setting old deadline
      testQuery.sla.deadline = new Date(Date.now() - 1000 * 60 * 60);
      await testQuery.save();

      const res = await request(app)
        .get('/queries')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .query({ overdue: 'true' });

      expect(res.status).toBe(200);
      expect(res.body.data.queries.length).toBeGreaterThan(0);
    });
  });

  describe('GET /queries/:id - Get Query by ID', () => {
    it('should retrieve a specific query', async () => {
      const res = await request(app)
        .get(`/queries/${testQuery._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.queryNumber).toBe(testQuery.queryNumber);
      expect(res.body.data.customer.email).toBe('john@example.com');
    });

    it('should track view history', async () => {
      await request(app)
        .get(`/queries/${testQuery._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      const updatedQuery = await Query.findById(testQuery._id);
      expect(updatedQuery.viewedBy.length).toBeGreaterThan(0);
    });

    it('should fail for non-existent query', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/queries/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /queries/:id - Update Query', () => {
    it('should update query fields', async () => {
      const res = await request(app)
        .patch(`/queries/${testQuery._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          customer: {
            name: 'John Updated',
            email: 'john@example.com',
            phone: '+1234567890',
          },
          priority: 'high',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.customer.name).toBe('John Updated');
      expect(res.body.data.priority).toBe('high');
    });

    it('should recalculate SLA when priority changes', async () => {
      const oldDeadline = testQuery.sla.deadline.getTime();
      const oldPriority = testQuery.priority;

      const res = await request(app)
        .patch(`/queries/${testQuery._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          priority: 'urgent',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.priority).toBe('urgent');
      expect(res.body.data.priority).not.toBe(oldPriority);
      
      // New deadline should be different (recalculated)
      const newDeadline = new Date(res.body.data.sla.deadline).getTime();
      expect(Math.abs(newDeadline - oldDeadline)).toBeGreaterThan(0);
    });
  });

  describe('POST /queries/:id/assign - Assign Query', () => {
    it('should assign query to an agent', async () => {
      const res = await request(app)
        .post(`/queries/${testQuery._id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          agentId: agentId.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedTo.toString()).toBe(agentId.toString());
      expect(res.body.data.assignmentMethod).toBe('manual');
      expect(res.body.data.status).toBe('assigned');
    });

    it('should store previous assignments when reassigning', async () => {
      // First assignment
      await request(app)
        .post(`/queries/${testQuery._id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({ agentId: agentId.toString() });

      // Second assignment
      const res = await request(app)
        .post(`/queries/${testQuery._id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({ agentId: userId.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.previousAssignments.length).toBeGreaterThan(0);
    });
  });

  describe('POST /queries/:id/auto-assign - Auto-Assign Query', () => {
    beforeEach(async () => {
      // Create agent availability
      await AgentAvailability.create({
        tenant: tenantId,
        agent: agentId,
        isOnline: true,
        status: 'available',
        currentWorkload: {
          activeQueries: 0,
          activeLeads: 0,
          overdueQueries: 0,
        },
      });
    });

    it('should auto-assign query to available agent', async () => {
      const res = await request(app)
        .post(`/queries/${testQuery._id}/auto-assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({ method: 'workload' });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedTo).toBeDefined();
      expect(res.body.data.assignmentMethod).toBe('auto_workload');
    });

    it('should fail when no agents available', async () => {
      await AgentAvailability.deleteMany({});

      const res = await request(app)
        .post(`/queries/${testQuery._id}/auto-assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({ method: 'workload' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /queries/bulk-assign - Bulk Assign Queries', () => {
    let query2;

    beforeEach(async () => {
      const queryNumber = await Query.generateQueryNumber(tenantId);
      query2 = await Query.create({
        tenant: tenantId,
        queryNumber,
        source: 'phone',
        customer: {
          name: 'Customer 2',
          email: 'customer2@example.com',
          phone: '+1111111111',
        },
        tripDetails: {
          destination: 'Rome',
          travelers: { adults: 2 },
        },
        priority: 'low',
        createdBy: userId,
      });
    });

    it('should assign multiple queries to one agent', async () => {
      const res = await request(app)
        .post('/queries/bulk-assign')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          queryIds: [testQuery._id.toString(), query2._id.toString()],
          agentId: agentId.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assigned).toBe(2);
    });
  });

  describe('POST /queries/:id/unassign - Unassign Query', () => {
    beforeEach(async () => {
      testQuery.assignTo(agentId, 'manual');
      await testQuery.save();
    });

    it('should unassign query from agent', async () => {
      const res = await request(app)
        .post(`/queries/${testQuery._id}/unassign`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          reason: 'Agent unavailable',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedTo).toBeUndefined();
      expect(res.body.data.status).toBe('pending');
    });
  });

  describe('PATCH /queries/:id/status - Update Query Status', () => {
    it('should update query status', async () => {
      const res = await request(app)
        .patch(`/queries/${testQuery._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          status: 'in_progress',
          notes: 'Working on quote',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.notes.length).toBeGreaterThan(0);
    });

    it('should auto-resolve when status is won/lost/cancelled', async () => {
      const res = await request(app)
        .patch(`/queries/${testQuery._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          status: 'won',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.sla.resolved).toBe(true);
      expect(res.body.data.sla.resolvedAt).toBeDefined();
    });
  });

  describe('POST /queries/:id/mark-responded - Mark as Responded', () => {
    it('should mark query as responded', async () => {
      const res = await request(app)
        .post(`/queries/${testQuery._id}/mark-responded`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(200);
      expect(res.body.data.sla.responded).toBe(true);
      expect(res.body.data.sla.respondedAt).toBeDefined();
      expect(res.body.data.sla.responseTime).toBeGreaterThan(0);
    });
  });

  describe('POST /queries/:id/mark-resolved - Mark as Resolved', () => {
    it('should mark query as resolved', async () => {
      const res = await request(app)
        .post(`/queries/${testQuery._id}/mark-resolved`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(200);
      expect(res.body.data.sla.resolved).toBe(true);
      expect(res.body.data.sla.resolvedAt).toBeDefined();
      expect(res.body.data.sla.resolutionTime).toBeGreaterThan(0);
    });
  });

  describe('GET /queries/overdue - Get Overdue Queries', () => {
    it('should retrieve overdue queries', async () => {
      testQuery.sla.deadline = new Date(Date.now() - 1000 * 60 * 60);
      await testQuery.save();

      const res = await request(app)
        .get('/queries/overdue')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(200);
      expect(res.body.data.queries.length).toBeGreaterThan(0);
    });
  });

  describe('POST /queries/:id/escalate - Escalate Query', () => {
    it('should escalate query', async () => {
      const res = await request(app)
        .post(`/queries/${testQuery._id}/escalate`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          level: 2,
          escalateTo: userId.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.sla.escalated).toBe(true);
      expect(res.body.data.sla.escalationLevel).toBe(2);
    });
  });

  describe('POST /queries/find-duplicates - Find Duplicates', () => {
    it('should find duplicate queries by email', async () => {
      const res = await request(app)
        .post('/queries/find-duplicates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          email: 'john@example.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.duplicates.length).toBeGreaterThan(0);
    });

    it('should find duplicate queries by phone', async () => {
      const res = await request(app)
        .post('/queries/find-duplicates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          phone: '+1234567890',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.duplicates.length).toBeGreaterThan(0);
    });
  });

  describe('POST /queries/:id/mark-duplicate - Mark as Duplicate', () => {
    let query2;

    beforeEach(async () => {
      const queryNumber = await Query.generateQueryNumber(tenantId);
      query2 = await Query.create({
        tenant: tenantId,
        queryNumber,
        source: 'phone',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
        tripDetails: {
          destination: 'Paris',
          travelers: { adults: 2 },
        },
        createdBy: userId,
      });
    });

    it('should mark query as duplicate', async () => {
      const res = await request(app)
        .post(`/queries/${query2._id}/mark-duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          originalQueryId: testQuery._id.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.duplicateOf.toString()).toBe(testQuery._id.toString());
      expect(res.body.data.status).toBe('cancelled');
    });
  });

  describe('POST /queries/:id/convert-to-lead - Convert to Lead', () => {
    it('should convert query to lead', async () => {
      const res = await request(app)
        .post(`/queries/${testQuery._id}/convert-to-lead`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(201);
      expect(res.body.data.lead).toBeDefined();
      expect(res.body.data.query.lead).toBeDefined();
      expect(res.body.data.query.status).toBe('won');
      expect(res.body.data.query.sla.resolved).toBe(true);
    });

    it('should fail if already converted', async () => {
      // First conversion
      await request(app)
        .post(`/queries/${testQuery._id}/convert-to-lead`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      // Second conversion attempt
      const res = await request(app)
        .post(`/queries/${testQuery._id}/convert-to-lead`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /queries/:id/notes - Add Note', () => {
    it('should add note to query', async () => {
      const res = await request(app)
        .post(`/queries/${testQuery._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          text: 'Customer called to follow up',
          isInternal: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.notes.length).toBeGreaterThan(0);
    });
  });

  describe('GET /queries/stats - Get Statistics', () => {
    it('should retrieve query statistics', async () => {
      const res = await request(app)
        .get('/queries/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.summary).toBeDefined();
    });
  });

  describe('GET /queries/sla-report - SLA Compliance Report', () => {
    it('should retrieve SLA compliance report', async () => {
      const res = await request(app)
        .get('/queries/sla-report')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(200);
      expect(res.body.data.totalQueries).toBeGreaterThan(0);
      expect(res.body.data.responseComplianceRate).toBeDefined();
      expect(res.body.data.resolutionComplianceRate).toBeDefined();
    });
  });

  describe('Agent Availability', () => {
    it('should set agent status', async () => {
      const res = await request(app)
        .post('/queries/agents/availability/status')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug)
        .send({
          status: 'available',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('available');
      expect(res.body.data.isOnline).toBe(true);
    });

    it('should get online agents', async () => {
      await AgentAvailability.create({
        tenant: tenantId,
        agent: agentId,
        isOnline: true,
        status: 'available',
      });

      const res = await request(app)
        .get('/queries/agents/online')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(200);
      expect(res.body.data.agents.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /queries/:id - Delete Query', () => {
    it('should delete query', async () => {
      const res = await request(app)
        .delete(`/queries/${testQuery._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(200);

      const deletedQuery = await Query.findById(testQuery._id);
      expect(deletedQuery).toBeNull();
    });

    it('should not delete query converted to lead', async () => {
      // Convert to lead first
      const convertRes = await request(app)
        .post(`/queries/${testQuery._id}/convert-to-lead`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(convertRes.status).toBe(201);
      expect(convertRes.body.data.query.lead).toBeDefined();

      const res = await request(app)
        .delete(`/queries/${testQuery._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Slug', tenantSlug);

      expect(res.status).toBe(403);
    });
  });
});
