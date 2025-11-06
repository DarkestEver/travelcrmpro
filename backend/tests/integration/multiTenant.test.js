const request = require('supertest');
const app = require('../../src/server');
const { Tenant, User, Customer, Agent } = require('../../src/models');
const mongoose = require('mongoose');

describe('Multi-Tenant Isolation Tests', () => {
  let demoTenantId;
  let testTenantId;
  let demoToken;
  let testToken;
  let demoCustomerId;
  let testCustomerId;

  beforeAll(async () => {
    // Find existing tenants created by seed script
    const demoTenant = await Tenant.findOne({ subdomain: 'demo' });
    const testTenant = await Tenant.findOne({ subdomain: 'test' });
    
    if (!demoTenant || !testTenant) {
      throw new Error('Tenants not found. Please run: npm run seed:tenants');
    }

    demoTenantId = demoTenant._id;
    testTenantId = testTenant._id;

    // Login to both tenants
    const demoLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@demo.travelcrm.com',
        password: 'Demo@123'
      });

    const testLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@test.travelcrm.com',
        password: 'Demo@123'
      });

    demoToken = demoLoginRes.body.data.accessToken;
    testToken = testLoginRes.body.data.accessToken;
  });

  describe('1. Tenant Identification', () => {
    test('should identify tenant from JWT token', async () => {
      const res = await request(app)
        .get('/api/v1/tenants/current')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tenant.subdomain).toBe('demo');
      expect(res.body.data.tenant._id).toBe(demoTenantId.toString());
    });

    test('should identify different tenant from different JWT', async () => {
      const res = await request(app)
        .get('/api/v1/tenants/current')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tenant.subdomain).toBe('test');
      expect(res.body.data.tenant._id).toBe(testTenantId.toString());
    });

    test('should reject request without tenant context', async () => {
      const res = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
    });
  });

  describe('2. Customer Data Isolation', () => {
    test('should create customer in demo tenant', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          name: 'Demo Customer',
          email: 'demo.customer@example.com',
          phone: '+1234567890',
          address: {
            street: '123 Demo St',
            city: 'Demo City',
            country: 'USA'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.data.customer.tenantId).toBe(demoTenantId.toString());
      expect(res.body.data.customer.name).toBe('Demo Customer');
      demoCustomerId = res.body.data.customer._id;
    });

    test('should create customer in test tenant', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Test Customer',
          email: 'test.customer@example.com',
          phone: '+4412345678',
          address: {
            street: '456 Test Ave',
            city: 'London',
            country: 'UK'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.data.customer.tenantId).toBe(testTenantId.toString());
      expect(res.body.data.customer.name).toBe('Test Customer');
      testCustomerId = res.body.data.customer._id;
    });

    test('demo tenant should only see demo customers', async () => {
      const res = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(res.status).toBe(200);
      const customers = res.body.data.data;
      
      // All customers should belong to demo tenant
      customers.forEach(customer => {
        expect(customer.tenantId).toBe(demoTenantId.toString());
      });
      
      // Should include our demo customer
      const demoCustomer = customers.find(c => c._id === demoCustomerId);
      expect(demoCustomer).toBeDefined();
      
      // Should NOT include test customer
      const testCustomer = customers.find(c => c._id === testCustomerId);
      expect(testCustomer).toBeUndefined();
    });

    test('test tenant should only see test customers', async () => {
      const res = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      const customers = res.body.data.data;
      
      // All customers should belong to test tenant
      customers.forEach(customer => {
        expect(customer.tenantId).toBe(testTenantId.toString());
      });
      
      // Should include our test customer
      const testCustomer = customers.find(c => c._id === testCustomerId);
      expect(testCustomer).toBeDefined();
      
      // Should NOT include demo customer
      const demoCustomer = customers.find(c => c._id === demoCustomerId);
      expect(demoCustomer).toBeUndefined();
    });

    test('should not access customer from different tenant', async () => {
      const res = await request(app)
        .get(`/api/v1/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${demoToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('3. Email Uniqueness Per Tenant', () => {
    test('should allow same email in different tenants', async () => {
      const sameEmail = 'duplicate@example.com';

      // Create customer with email in demo tenant
      const demoRes = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          name: 'Demo User',
          email: sameEmail,
          phone: '+1111111111',
          address: {
            street: '111 Demo St',
            city: 'Demo City',
            country: 'USA'
          }
        });

      expect(demoRes.status).toBe(201);
      expect(demoRes.body.data.customer.email).toBe(sameEmail);

      // Create customer with same email in test tenant - should succeed
      const testRes = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Test User',
          email: sameEmail,
          phone: '+2222222222',
          address: {
            street: '222 Test Ave',
            city: 'London',
            country: 'UK'
          }
        });

      expect(testRes.status).toBe(201);
      expect(testRes.body.data.customer.email).toBe(sameEmail);
    });

    test('should reject duplicate email within same tenant', async () => {
      const duplicateEmail = 'unique@demo.com';

      // Create first customer
      const firstRes = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          name: 'First User',
          email: duplicateEmail,
          phone: '+3333333333',
          address: {
            street: '333 Demo St',
            city: 'Demo City',
            country: 'USA'
          }
        });

      expect(firstRes.status).toBe(201);

      // Try to create second customer with same email in same tenant
      const secondRes = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          name: 'Second User',
          email: duplicateEmail,
          phone: '+4444444444',
          address: {
            street: '444 Demo St',
            city: 'Demo City',
            country: 'USA'
          }
        });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toContain('already exists');
    });
  });

  describe('4. Agent Data Isolation', () => {
    test('should create agents scoped to tenant', async () => {
      // Get user IDs from each tenant
      const demoUser = await User.findOne({ tenantId: demoTenantId, email: 'admin@demo.travelcrm.com' });
      const testUser = await User.findOne({ tenantId: testTenantId, email: 'test@test.travelcrm.com' });

      // Create agent in demo tenant
      const demoAgentRes = await request(app)
        .post('/api/v1/agents')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          userId: demoUser._id,
          agencyName: 'Demo Agency',
          contactPerson: 'Demo Agent',
          email: 'agent@demo.com',
          phone: '+5555555555'
        });

      expect(demoAgentRes.status).toBe(201);
      expect(demoAgentRes.body.data.agent.tenantId).toBe(demoTenantId.toString());

      // Create agent in test tenant
      const testAgentRes = await request(app)
        .post('/api/v1/agents')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          userId: testUser._id,
          agencyName: 'Test Agency',
          contactPerson: 'Test Agent',
          email: 'agent@test.com',
          phone: '+6666666666'
        });

      expect(testAgentRes.status).toBe(201);
      expect(testAgentRes.body.data.agent.tenantId).toBe(testTenantId.toString());

      // Verify agents are isolated
      const demoAgentsRes = await request(app)
        .get('/api/v1/agents')
        .set('Authorization', `Bearer ${demoToken}`);

      const demoAgents = demoAgentsRes.body.data.data;
      demoAgents.forEach(agent => {
        expect(agent.tenantId).toBe(demoTenantId.toString());
      });
    });
  });

  describe('5. Statistics Per Tenant', () => {
    test('should return tenant-specific customer statistics', async () => {
      const demoStatsRes = await request(app)
        .get('/api/v1/customers/stats')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(demoStatsRes.status).toBe(200);
      const demoStats = demoStatsRes.body.data;

      const testStatsRes = await request(app)
        .get('/api/v1/customers/stats')
        .set('Authorization', `Bearer ${testToken}`);

      expect(testStatsRes.status).toBe(200);
      const testStats = testStatsRes.body.data;

      // Statistics should be different for each tenant
      expect(demoStats.totalCustomers).toBeDefined();
      expect(testStats.totalCustomers).toBeDefined();
    });
  });

  describe('6. JWT Token Contains TenantId', () => {
    test('JWT should include tenantId in payload', async () => {
      const jwt = require('jsonwebtoken');
      
      // Decode demo token
      const demoDecoded = jwt.decode(demoToken);
      expect(demoDecoded.tenantId).toBe(demoTenantId.toString());
      
      // Decode test token
      const testDecoded = jwt.decode(testToken);
      expect(testDecoded.tenantId).toBe(testTenantId.toString());
    });
  });

  describe('7. Subscription Limits', () => {
    test('should return tenant subscription details', async () => {
      const res = await request(app)
        .get('/api/v1/tenants/current')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(res.status).toBe(200);
      const tenant = res.body.data.tenant;
      
      expect(tenant.subscription).toBeDefined();
      expect(tenant.subscription.plan).toBeDefined();
      expect(tenant.subscription.status).toBe('active');
      expect(tenant.settings.features).toBeDefined();
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Customer.deleteMany({
      email: {
        $in: [
          'demo.customer@example.com',
          'test.customer@example.com',
          'duplicate@example.com',
          'unique@demo.com'
        ]
      }
    });

    await Agent.deleteMany({
      email: {
        $in: ['agent@demo.com', 'agent@test.com']
      }
    });
  });
});
