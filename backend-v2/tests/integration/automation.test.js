const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Tenant = require('../../src/models/Tenant');
const User = require('../../src/models/User');
const AutomationRule = require('../../src/models/AutomationRule');
const Query = require('../../src/models/Query');
const automationEngine = require('../../src/services/automationEngine');
const tokenService = require('../../src/services/tokenService');

describe('Automation System Integration', () => {
  let tenant;
  let admin;
  let adminToken;
  let agent;
  let customer;

  beforeAll(async () => {
    // Create tenant
    tenant = await Tenant.create({
      name: 'Test Travel Agency',
      code: 'TEST',
      slug: 'test-automation',
      email: 'test@automation.com',
      phone: '+1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
      },
    });

    // Create admin user
    admin = await User.create({
      tenant: tenant._id,
      email: 'admin@automation.com',
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'tenant_admin',
      isActive: true,
      isEmailVerified: true,
    });

    adminToken = tokenService.generateAccessToken({
      _id: admin._id,
      email: admin.email,
      role: admin.role,
      tenant: tenant._id,
    });

    // Create agent
    agent = await User.create({
      tenant: tenant._id,
      email: 'agent@automation.com',
      password: 'Password123!',
      firstName: 'Agent',
      lastName: 'User',
      role: 'agent',
      isActive: true,
      isEmailVerified: true,
    });

    // Create customer
    customer = await User.create({
      tenant: tenant._id,
      email: 'customer@automation.com',
      password: 'Password123!',
      firstName: 'Customer',
      lastName: 'User',
      role: 'customer',
      isActive: true,
      isEmailVerified: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await AutomationRule.deleteMany({});
    await Query.deleteMany({});
  });

  afterEach(async () => {
    await AutomationRule.deleteMany({});
    await Query.deleteMany({});
  });

  describe('POST /automation/rules', () => {
    it('should create automation rule', async () => {
      const ruleData = {
        name: 'Auto-assign new queries',
        description: 'Automatically assign new queries to available agents',
        ruleType: 'follow_up',
        trigger: {
          event: 'query_created',
          conditions: [
            {
              field: 'status',
              operator: 'equals',
              value: 'pending',
            },
          ],
        },
        actions: [
          {
            actionType: 'assign_query',
            config: {
              assignTo: agent._id.toString(),
              assignmentMethod: 'specific_user',
            },
          },
        ],
        isActive: true,
      };

      const res = await request(app)
        .post('/automation/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(ruleData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(ruleData.name);
      expect(res.body.data.trigger.event).toBe('query_created');
      expect(res.body.data.actions).toHaveLength(1);
    });

    it('should validate automation rule data', async () => {
      const invalidRule = {
        name: 'Invalid Rule',
        // Missing required fields
      };

      const res = await request(app)
        .post('/automation/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidRule);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /automation/rules', () => {
    beforeEach(async () => {
      await AutomationRule.create({
        tenant: tenant._id,
        name: 'Test Rule 1',
        ruleType: 'follow_up',
        trigger: {
          event: 'query_created',
          conditions: [],
        },
        actions: [],
        createdBy: admin._id,
        isActive: true,
      });

      await AutomationRule.create({
        tenant: tenant._id,
        name: 'Test Rule 2',
        ruleType: 'sla_escalation',
        trigger: {
          event: 'sla_breached',
          conditions: [],
        },
        actions: [],
        createdBy: admin._id,
        isActive: false,
      });
    });

    it('should get all automation rules', async () => {
      const res = await request(app)
        .get('/automation/rules')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rules).toHaveLength(2);
    });

    it('should filter rules by type', async () => {
      const res = await request(app)
        .get('/automation/rules?ruleType=follow_up')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rules).toHaveLength(1);
      expect(res.body.data.rules[0].ruleType).toBe('follow_up');
    });

    it('should filter rules by active status', async () => {
      const res = await request(app)
        .get('/automation/rules?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rules).toHaveLength(1);
      expect(res.body.data.rules[0].isActive).toBe(true);
    });
  });

  describe('PATCH /automation/rules/:id/toggle', () => {
    it('should toggle rule active status', async () => {
      const rule = await AutomationRule.create({
        tenant: tenant._id,
        name: 'Toggle Test',
        ruleType: 'follow_up',
        trigger: { event: 'query_created', conditions: [] },
        actions: [],
        createdBy: admin._id,
        isActive: true,
      });

      const res = await request(app)
        .patch(`/automation/rules/${rule._id}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      // Toggle again
      const res2 = await request(app)
        .patch(`/automation/rules/${rule._id}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.isActive).toBe(true);
    });
  });

  describe('Automation Engine', () => {
    it('should execute automation rule when conditions match', async () => {
      const rule = await AutomationRule.create({
        tenant: tenant._id,
        name: 'Update Status Rule',
        ruleType: 'custom',
        trigger: {
          event: 'query_created',
          conditions: [
            {
              field: 'priority',
              operator: 'equals',
              value: 'urgent',
            },
          ],
        },
        actions: [
          {
            actionType: 'update_status',
            config: {
              newStatus: 'in_progress',
            },
          },
        ],
        createdBy: admin._id,
        isActive: true,
      });

      const query = await Query.create({
        tenant: tenant._id,
        queryNumber: 'Q-001',
        source: 'website',
        customer: {
          name: 'Test Customer',
          email: 'test@customer.com',
          phone: '+1234567890',
        },
        tripDetails: {
          destination: 'India',
          travelDates: {
            preferred: {
              from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              to: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
            },
          },
          travelers: {
            adults: 2,
            children: 0,
          },
        },
        tripType: 'leisure',
        priority: 'urgent',
        status: 'pending',
        createdBy: customer._id,
      });

      const results = await automationEngine.executeRules(
        'query_created',
        query.toObject(),
        tenant._id
      );

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should not execute rule when conditions do not match', async () => {
      const rule = await AutomationRule.create({
        tenant: tenant._id,
        name: 'Conditional Rule',
        ruleType: 'custom',
        trigger: {
          event: 'query_created',
          conditions: [
            {
              field: 'priority',
              operator: 'equals',
              value: 'urgent',
            },
          ],
        },
        actions: [],
        createdBy: admin._id,
        isActive: true,
      });

      const query = await Query.create({
        tenant: tenant._id,
        queryNumber: 'Q-002',
        source: 'website',
        customer: {
          name: 'Test Customer',
          email: 'test2@customer.com',
          phone: '+1234567890',
        },
        tripDetails: {
          destination: 'India',
          travelDates: {
            preferred: {
              from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              to: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
            },
          },
          travelers: {
            adults: 2,
            children: 0,
          },
        },
        tripType: 'leisure',
        priority: 'medium', // Different from rule condition
        status: 'pending',
        createdBy: customer._id,
      });

      const results = await automationEngine.executeRules(
        'query_created',
        query.toObject(),
        tenant._id
      );

      expect(results).toHaveLength(0);
    });

    it('should track rule execution statistics', async () => {
      const rule = await AutomationRule.create({
        tenant: tenant._id,
        name: 'Stats Test Rule',
        ruleType: 'custom',
        trigger: {
          event: 'query_created',
          conditions: [],
        },
        actions: [
          {
            actionType: 'notify_user',
            config: {
              notificationMessage: 'Test notification',
            },
          },
        ],
        createdBy: admin._id,
        isActive: true,
        executionCount: 0,
        successCount: 0,
      });

      const query = await Query.create({
        tenant: tenant._id,
        queryNumber: 'Q-003',
        source: 'website',
        customer: {
          name: 'Test Customer',
          email: 'test3@customer.com',
          phone: '+1234567890',
        },
        tripDetails: {
          destination: 'India',
          travelDates: {
            preferred: {
              from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              to: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
            },
          },
          travelers: {
            adults: 2,
            children: 0,
          },
        },
        tripType: 'leisure',
        priority: 'medium',
        status: 'pending',
        createdBy: customer._id,
      });

      await automationEngine.executeRules('query_created', query.toObject(), tenant._id);

      const updatedRule = await AutomationRule.findById(rule._id);
      expect(updatedRule.executionCount).toBe(1);
      expect(updatedRule.successCount).toBe(1);
      expect(updatedRule.lastExecutedAt).toBeDefined();
    });
  });

  describe('DELETE /automation/rules/:id', () => {
    it('should delete automation rule', async () => {
      const rule = await AutomationRule.create({
        tenant: tenant._id,
        name: 'Delete Test',
        ruleType: 'follow_up',
        trigger: { event: 'query_created', conditions: [] },
        actions: [],
        createdBy: admin._id,
      });

      const res = await request(app)
        .delete(`/automation/rules/${rule._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const deletedRule = await AutomationRule.findById(rule._id);
      expect(deletedRule).toBeNull();
    });
  });
});
