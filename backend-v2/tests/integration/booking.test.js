const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Booking = require('../../src/models/Booking');
const Itinerary = require('../../src/models/Itinerary');
const Lead = require('../../src/models/Lead');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');

// Mock Redis
jest.mock('../../src/lib/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  setex: jest.fn(),
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

describe('Booking Management Integration Tests', () => {
  let testTenant;
  let tenantAdmin;
  let tenantAdminToken;
  let agent1;
  let agent1Token;
  let agent2;
  let agent2Token;
  let testLead;
  let testItinerary1;
  let testItinerary2;
  let testBooking1;
  let testBooking2;

  const testId = Date.now();

  beforeAll(async () => {
    // Tests will automatically connect via setup.js
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear only necessary collections to speed up tests
    await Booking.deleteMany({});
    await Itinerary.deleteMany({});
    await Lead.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});

    // Create tenant
    testTenant = await Tenant.create({
      name: `Test Tenant ${testId}`,
      slug: `test-tenant-${testId}`,
      domain: `test-${testId}.example.com`,
      status: 'active',
      settings: { timezone: 'UTC', currency: 'USD' },
    });

    // Create admin user
    tenantAdmin = await User.create({
      tenant: testTenant._id,
      email: `admin-${testId}@example.com`,
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'tenant_admin',
      isActive: true,
      isEmailVerified: true,
    });

    // Create agent 1
    agent1 = await User.create({
      tenant: testTenant._id,
      email: `agent1-${testId}@example.com`,
      password: 'Password123!',
      firstName: 'Agent',
      lastName: 'One',
      role: 'agent',
      isActive: true,
      isEmailVerified: true,
    });

    // Create agent 2
    agent2 = await User.create({
      tenant: testTenant._id,
      email: `agent2-${testId}@example.com`,
      password: 'Password123!',
      firstName: 'Agent',
      lastName: 'Two',
      role: 'agent',
      isActive: true,
      isEmailVerified: true,
    });

    // Login and get tokens
    const adminLogin = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', testTenant.slug)
      .send({ email: tenantAdmin.email, password: 'Password123!' });
    
    if (adminLogin.status !== 200) {
      throw new Error(`Admin login failed with status ${adminLogin.status}: ${JSON.stringify(adminLogin.body)}`);
    }
    tenantAdminToken = adminLogin.body?.data?.accessToken || '';

    const agent1Login = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', testTenant.slug)
      .send({ email: agent1.email, password: 'Password123!' });
    
    if (agent1Login.status !== 200) {
      throw new Error(`Agent1 login failed with status ${agent1Login.status}: ${JSON.stringify(agent1Login.body)}`);
    }
    agent1Token = agent1Login.body?.data?.accessToken || '';

    const agent2Login = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', testTenant.slug)
      .send({ email: agent2.email, password: 'Password123!' });
    
    if (agent2Login.status !== 200) {
      throw new Error(`Agent2 login failed with status ${agent2Login.status}: ${JSON.stringify(agent2Login.body)}`);
    }
    agent2Token = agent2Login.body?.data?.accessToken || '';

    // Create test lead
    testLead = await Lead.create({
      tenant: testTenant._id,
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      source: 'website',
      status: 'qualified',
      assignedTo: agent1._id,
      createdBy: agent1._id,
    });

    // Create test itinerary 1 (for agent1)
    testItinerary1 = await Itinerary.create({
      tenant: testTenant._id,
      title: `Test Itinerary 1 ${testId}`,
      destination: 'Paris, France',
      startDate: '2026-06-01',
      endDate: '2026-06-07',
      duration: 7,
      numberOfTravelers: { adults: 2, children: 0 },
      days: [],
      pricing: {
        basePrice: 2000,
        totalPrice: 2000,
      },
      createdBy: agent1._id,
    });

    // Create test itinerary 2 (for agent2)
    testItinerary2 = await Itinerary.create({
      tenant: testTenant._id,
      title: `Test Itinerary 2 ${testId}`,
      destination: 'Tokyo, Japan',
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      duration: 10,
      numberOfTravelers: { adults: 2, children: 1 },
      days: [],
      pricing: {
        basePrice: 3000,
        totalPrice: 3000,
      },
      createdBy: agent2._id,
    });

    // Create test booking 1 (by agent1)
    testBooking1 = await Booking.create({
      tenant: testTenant._id,
      bookingNumber: 'BK-2601-0001',
      itinerary: testItinerary1._id,
      lead: testLead._id,
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      travelers: [
        {
          type: 'adult',
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          type: 'adult',
          firstName: 'Jane',
          lastName: 'Doe',
        },
      ],
      travelStartDate: '2026-06-01',
      travelEndDate: '2026-06-07',
      pricing: {
        basePrice: 2000,
        totalPrice: 2000,
      },
      createdBy: agent1._id,
    });

    // Create test booking 2 (by agent2)
    testBooking2 = await Booking.create({
      tenant: testTenant._id,
      bookingNumber: 'BK-2601-0002',
      itinerary: testItinerary2._id,
      customer: {
        name: 'Alice Smith',
        email: 'alice@example.com',
      },
      travelers: [
        {
          type: 'adult',
          firstName: 'Alice',
          lastName: 'Smith',
        },
      ],
      travelStartDate: '2026-07-01',
      travelEndDate: '2026-07-10',
      pricing: {
        basePrice: 3000,
        totalPrice: 3000,
      },
      createdBy: agent2._id,
    });
  });

  describe('GET /bookings', () => {
    it('should list all bookings for admin', async () => {
      const response = await request(app)
        .get('/bookings')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toHaveProperty('total', 2);
    });

    it('should list only own bookings for agent', async () => {
      const response = await request(app)
        .get('/bookings')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].bookingNumber).toBe('BK-2601-0001');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/bookings?status=pending')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should search by booking number', async () => {
      const response = await request(app)
        .get('/bookings?search=0001')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].bookingNumber).toBe('BK-2601-0001');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/bookings?page=1&limit=1')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.pages).toBe(2);
    });
  });

  describe('GET /bookings/:id', () => {
    it('should get booking by id', async () => {
      const response = await request(app)
        .get(`/bookings/${testBooking1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.bookingNumber).toBe('BK-2601-0001');
      expect(response.body.data.customer.name).toBe('John Doe');
    });

    it('should allow agent to view own booking', async () => {
      const response = await request(app)
        .get(`/bookings/${testBooking1._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
    });

    it('should prevent agent from viewing other agent booking', async () => {
      const response = await request(app)
        .get(`/bookings/${testBooking2._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/bookings/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings', () => {
    it('should create new booking', async () => {
      const newBooking = {
        itinerary: testItinerary1._id.toString(),
        lead: testLead._id.toString(),
        customer: {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          phone: '+1234567890',
        },
        travelers: [
          {
            type: 'adult',
            firstName: 'Bob',
            lastName: 'Johnson',
          },
        ],
        travelStartDate: '2026-08-01',
        travelEndDate: '2026-08-07',
        pricing: {
          basePrice: 2500,
          totalPrice: 2500,
        },
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send(newBooking);

      expect(response.status).toBe(201);
      expect(response.body.data.customer.name).toBe('Bob Johnson');
      expect(response.body.data.bookingNumber).toMatch(/^BK-\d{4}-\d{4}$/);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.paymentStatus).toBe('not-paid');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should validate travel dates', async () => {
      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          itinerary: testItinerary1._id.toString(),
          customer: {
            name: 'Test',
            email: 'test@example.com',
          },
          travelers: [{ type: 'adult', firstName: 'Test', lastName: 'User' }],
          travelStartDate: '2026-08-07',
          travelEndDate: '2026-08-01', // End before start
          pricing: {
            basePrice: 1000,
            totalPrice: 1000,
          },
        });

      expect(response.status).toBe(400);
    });

    it('should validate itinerary exists', async () => {
      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          itinerary: '507f1f77bcf86cd799439011',
          customer: {
            name: 'Test',
            email: 'test@example.com',
          },
          travelers: [{ type: 'adult', firstName: 'Test', lastName: 'User' }],
          travelStartDate: '2026-08-01',
          travelEndDate: '2026-08-07',
          pricing: {
            basePrice: 1000,
            totalPrice: 1000,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('ITINERARY_NOT_FOUND');
    });
  });

  describe('PUT /bookings/:id', () => {
    it('should update booking', async () => {
      const response = await request(app)
        .put(`/bookings/${testBooking1._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          specialRequests: 'Window seat please',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.specialRequests).toBe('Window seat please');
    });

    it('should allow agent to update own booking', async () => {
      const response = await request(app)
        .put(`/bookings/${testBooking1._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          internalNotes: 'Updated notes',
        });

      expect(response.status).toBe(200);
    });

    it('should prevent agent from updating other agent booking', async () => {
      const response = await request(app)
        .put(`/bookings/${testBooking2._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          internalNotes: 'Should not work',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /bookings/:id', () => {
    it('should delete booking (admin only)', async () => {
      const response = await request(app)
        .delete(`/bookings/${testBooking1._id}`)
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      
      const booking = await Booking.findById(testBooking1._id);
      expect(booking).toBeNull();
    });

    it('should prevent agent from deleting booking', async () => {
      const response = await request(app)
        .delete(`/bookings/${testBooking1._id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /bookings/:id/status', () => {
    it('should update booking status', async () => {
      const response = await request(app)
        .patch(`/bookings/${testBooking1._id}/status`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          status: 'confirmed',
          notes: 'Confirmed by customer',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('confirmed');
      expect(response.body.data.confirmedAt).toBeDefined();
      expect(response.body.data.statusHistory).toHaveLength(1);
    });

    it('should prevent agent from updating other agent booking status', async () => {
      const response = await request(app)
        .patch(`/bookings/${testBooking2._id}/status`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          status: 'confirmed',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /bookings/:id/payments', () => {
    it('should add payment to booking', async () => {
      const response = await request(app)
        .post(`/bookings/${testBooking1._id}/payments`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          amount: 500,
          method: 'credit-card',
          status: 'completed',
          transactionId: 'TXN123',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.payments).toHaveLength(1);
      expect(response.body.data.payments[0].amount).toBe(500);
      expect(response.body.data.totalPaid).toBe(500);
      expect(response.body.data.paymentStatus).toBe('partially-paid');
      expect(response.body.data.balanceDue).toBe(1500);
    });

    it('should update payment status to fully-paid', async () => {
      const response = await request(app)
        .post(`/bookings/${testBooking1._id}/payments`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          amount: 2000,
          method: 'bank-transfer',
          status: 'completed',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.paymentStatus).toBe('fully-paid');
      expect(response.body.data.balanceDue).toBe(0);
    });

    it('should prevent agent from adding payment to other agent booking', async () => {
      const response = await request(app)
        .post(`/bookings/${testBooking2._id}/payments`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          amount: 500,
          method: 'cash',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /bookings/:id/payments/:paymentId', () => {
    it('should update payment', async () => {
      // First add a payment
      const addResponse = await request(app)
        .post(`/bookings/${testBooking1._id}/payments`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          amount: 500,
          method: 'credit-card',
          status: 'pending',
        });

      const paymentId = addResponse.body.data.payments[0]._id;

      // Update the payment
      const response = await request(app)
        .put(`/bookings/${testBooking1._id}/payments/${paymentId}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          status: 'completed',
          transactionId: 'TXN456',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.payments[0].status).toBe('completed');
      expect(response.body.data.payments[0].transactionId).toBe('TXN456');
      expect(response.body.data.totalPaid).toBe(500);
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .put(`/bookings/${testBooking1._id}/payments/507f1f77bcf86cd799439011`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          status: 'completed',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /bookings/:id/documents', () => {
    it('should add document to booking', async () => {
      const response = await request(app)
        .post(`/bookings/${testBooking1._id}/documents`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          name: 'Invoice #123',
          type: 'invoice',
          url: 'https://example.com/invoice.pdf',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.documents).toHaveLength(1);
      expect(response.body.data.documents[0].name).toBe('Invoice #123');
      expect(response.body.data.documents[0].type).toBe('invoice');
    });

    it('should prevent agent from adding document to other agent booking', async () => {
      const response = await request(app)
        .post(`/bookings/${testBooking2._id}/documents`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          name: 'Document',
          type: 'contract',
          url: 'https://example.com/doc.pdf',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /bookings/stats', () => {
    it('should get admin statistics', async () => {
      const response = await request(app)
        .get('/bookings/stats')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.byStatus.pending).toBe(2);
      expect(response.body.data.byPaymentStatus['not-paid']).toBe(2);
    });

    it('should get agent-specific statistics', async () => {
      const response = await request(app)
        .get('/bookings/stats')
        .set('Authorization', `Bearer ${agent1Token}`)
        .set('X-Tenant-Slug', testTenant.slug);

      expect(response.status).toBe(200);
      expect(response.body.data.byStatus.pending).toBe(1);
    });
  });
});
