// Mock Redis and nodemailer for testing
jest.mock('../../src/lib/redis', () => ({
  healthCheck: jest.fn().mockResolvedValue({ status: 'connected', healthy: true }),
  get: jest.fn().mockImplementation((key) => {
    if (key && key.startsWith('refresh_token:')) {
      return Promise.resolve(JSON.stringify({
        userId: 'mock-user-id',
        tenantId: 'mock-tenant-id',
        createdAt: new Date().toISOString(),
      }));
    }
    return Promise.resolve(null);
  }),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  setex: jest.fn().mockResolvedValue('OK'),
}));

jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
    }),
  }),
}));

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const database = require('../../src/lib/database');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const Query = require('../../src/models/Query');
const Quote = require('../../src/models/Quote');
const Booking = require('../../src/models/Booking');
const Payment = require('../../src/models/Payment');
const Document = require('../../src/models/Document');
const Review = require('../../src/models/Review');

describe('Customer Portal API', () => {
  let tenant, customer, customerToken, admin, adminToken;
  let otherCustomer, otherCustomerToken;

  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.disconnect();
  });

  beforeEach(async () => {
    // Create tenant
    tenant = await Tenant.create({
      name: 'Test Travel Agency',
      slug: 'test-travel-' + Date.now(),
      subdomain: 'test-travel',
      email: 'admin@testtravel.com',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });

    // Create customer user
    customer = await User.create({
      tenant: tenant._id,
      email: 'customer@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '9876543210',
      role: 'customer',
      isActive: true,
    });

    // Get customer token
    const customerLoginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'password123',
      });
    customerToken = customerLoginRes.body.data.token;

    // Create another customer for isolation tests
    otherCustomer = await User.create({
      tenant: tenant._id,
      email: 'other@test.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '9876543211',
      role: 'customer',
      isActive: true,
    });

    const otherLoginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'other@test.com',
        password: 'password123',
      });
    otherCustomerToken = otherLoginRes.body.data.token;

    // Create admin user
    admin = await User.create({
      tenant: tenant._id,
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      phone: '9876543212',
      role: 'tenant_admin',
      isActive: true,
    });

    const adminLoginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });
    adminToken = adminLoginRes.body.data.token;
  });

  describe('GET /customer/dashboard', () => {
    it('should return customer dashboard with aggregated data', async () => {
      // Create test data
      const booking = await Booking.create({
        tenant: tenant._id,
        customer: customer._id,
        bookingNumber: 'BKG-001',
        status: 'confirmed',
        destination: 'Paris',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
        totalAmount: 100000,
      });

      await Quote.create({
        tenant: tenant._id,
        customer: customer._id,
        quoteNumber: 'QT-001',
        status: 'sent',
        destination: 'London',
        totalAmount: 80000,
      });

      await Payment.create({
        tenant: tenant._id,
        customer: customer._id,
        booking: booking._id,
        amount: 30000,
        status: 'pending',
        paymentMethod: 'bank_transfer',
      });

      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      });

      const res = await request(app)
        .get('/customer/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('upcomingBookings');
      expect(res.body.data).toHaveProperty('recentQuotes');
      expect(res.body.data).toHaveProperty('pendingPayments');
      expect(res.body.data).toHaveProperty('expiringDocuments');
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data.upcomingBookings.length).toBe(1);
      expect(res.body.data.stats.totalBookings).toBe(1);
      expect(res.body.data.stats.totalSpent).toBe(0); // No completed payments
      expect(res.body.data.stats.documentsCount).toBe(1);
    });

    it('should only show authenticated customer data', async () => {
      // Create data for other customer
      await Booking.create({
        tenant: tenant._id,
        customer: otherCustomer._id,
        bookingNumber: 'BKG-002',
        status: 'confirmed',
        destination: 'Rome',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
        totalAmount: 120000,
      });

      const res = await request(app)
        .get('/customer/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.upcomingBookings.length).toBe(0); // Should not see other customer's bookings
    });
  });

  describe('Query Management', () => {
    it('should create a new query', async () => {
      const res = await request(app)
        .post('/customer/queries')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'customer@test.com',
          phone: '9876543210',
          destination: 'Switzerland',
          travelDates: {
            startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
          },
          numberOfTravelers: 2,
          budget: {
            min: 100000,
            max: 150000,
            currency: 'INR',
          },
          message: 'Looking for a honeymoon package to Switzerland',
          source: 'website',
          priority: 'medium',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('queryNumber');
      expect(res.body.data.queryNumber).toMatch(/^QRY-/);
      expect(res.body.data.destination).toBe('Switzerland');
      expect(res.body.data.status).toBe('new');
      expect(res.body.data).toHaveProperty('sla');
    });

    it('should get customer queries', async () => {
      await Query.create({
        tenant: tenant._id,
        queryNumber: 'QRY-202401-0001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'customer@test.com',
        phone: '9876543210',
        destination: 'Paris',
        message: 'Test query',
        status: 'new',
        priority: 'medium',
      });

      const res = await request(app)
        .get('/customer/queries')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.queries.length).toBeGreaterThan(0);
      expect(res.body.data.queries[0].email).toBe('customer@test.com');
    });

    it('should filter queries by status', async () => {
      await Query.create({
        tenant: tenant._id,
        queryNumber: 'QRY-202401-0002',
        firstName: 'John',
        lastName: 'Doe',
        email: 'customer@test.com',
        phone: '9876543210',
        destination: 'London',
        message: 'Test query',
        status: 'resolved',
        priority: 'medium',
      });

      const res = await request(app)
        .get('/customer/queries?status=resolved')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.queries.every(q => q.status === 'resolved')).toBe(true);
    });

    it('should not show other customers queries', async () => {
      await Query.create({
        tenant: tenant._id,
        queryNumber: 'QRY-202401-0003',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'other@test.com',
        phone: '9876543211',
        destination: 'Tokyo',
        message: 'Test query',
        status: 'new',
        priority: 'medium',
      });

      const res = await request(app)
        .get('/customer/queries')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.queries.every(q => q.email === 'customer@test.com')).toBe(true);
    });
  });

  describe('Quote Management', () => {
    it('should get customer quotes', async () => {
      await Quote.create({
        tenant: tenant._id,
        customer: customer._id,
        quoteNumber: 'QT-002',
        status: 'sent',
        destination: 'Dubai',
        totalAmount: 75000,
      });

      const res = await request(app)
        .get('/customer/quotes')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quotes.length).toBeGreaterThan(0);
    });

    it('should get quote by ID', async () => {
      const quote = await Quote.create({
        tenant: tenant._id,
        customer: customer._id,
        quoteNumber: 'QT-003',
        status: 'sent',
        destination: 'Maldives',
        totalAmount: 120000,
      });

      const res = await request(app)
        .get(`/customer/quotes/${quote._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.quoteNumber).toBe('QT-003');
    });

    it('should not allow access to other customers quotes', async () => {
      const quote = await Quote.create({
        tenant: tenant._id,
        customer: otherCustomer._id,
        quoteNumber: 'QT-004',
        status: 'sent',
        destination: 'Bali',
        totalAmount: 90000,
      });

      const res = await request(app)
        .get(`/customer/quotes/${quote._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Booking Management', () => {
    it('should get customer bookings', async () => {
      await Booking.create({
        tenant: tenant._id,
        customer: customer._id,
        bookingNumber: 'BKG-003',
        status: 'confirmed',
        destination: 'Singapore',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        totalAmount: 85000,
      });

      const res = await request(app)
        .get('/customer/bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.length).toBeGreaterThan(0);
    });

    it('should filter upcoming bookings', async () => {
      await Booking.create({
        tenant: tenant._id,
        customer: customer._id,
        bookingNumber: 'BKG-004',
        status: 'confirmed',
        destination: 'Thailand',
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        totalAmount: 65000,
      });

      const res = await request(app)
        .get('/customer/bookings?upcoming=true')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.every(b => new Date(b.startDate) > new Date())).toBe(true);
    });

    it('should filter past bookings', async () => {
      await Booking.create({
        tenant: tenant._id,
        customer: customer._id,
        bookingNumber: 'BKG-005',
        status: 'completed',
        destination: 'Dubai',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        totalAmount: 70000,
      });

      const res = await request(app)
        .get('/customer/bookings?past=true')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.every(b => new Date(b.endDate) < new Date())).toBe(true);
    });
  });

  describe('Payment Management', () => {
    it('should get customer payments', async () => {
      const booking = await Booking.create({
        tenant: tenant._id,
        customer: customer._id,
        bookingNumber: 'BKG-006',
        status: 'confirmed',
        destination: 'Europe',
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
        totalAmount: 200000,
      });

      await Payment.create({
        tenant: tenant._id,
        customer: customer._id,
        booking: booking._id,
        amount: 50000,
        status: 'completed',
        paymentMethod: 'credit_card',
      });

      const res = await request(app)
        .get('/customer/payments')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.payments.length).toBeGreaterThan(0);
    });

    it('should get booking payments', async () => {
      const booking = await Booking.create({
        tenant: tenant._id,
        customer: customer._id,
        bookingNumber: 'BKG-007',
        status: 'confirmed',
        destination: 'Australia',
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
        totalAmount: 300000,
      });

      await Payment.create({
        tenant: tenant._id,
        customer: customer._id,
        booking: booking._id,
        amount: 100000,
        status: 'completed',
        paymentMethod: 'bank_transfer',
      });

      const res = await request(app)
        .get(`/customer/bookings/${booking._id}/payments`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].booking.toString()).toBe(booking._id.toString());
    });
  });

  describe('Document Management', () => {
    it('should get customer documents', async () => {
      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        verificationStatus: 'verified',
      });

      const res = await request(app)
        .get('/customer/documents')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.documents.length).toBeGreaterThan(0);
    });

    it('should filter documents by type', async () => {
      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'visa',
        fileName: 'visa.pdf',
        fileUrl: 'https://example.com/visa.pdf',
      });

      const res = await request(app)
        .get('/customer/documents?documentType=visa')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.documents.every(d => d.documentType === 'visa')).toBe(true);
    });

    it('should get expiring documents', async () => {
      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      });

      const res = await request(app)
        .get('/customer/documents/expiring?days=90')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Review Management', () => {
    it('should submit a review for completed booking', async () => {
      const booking = await Booking.create({
        tenant: tenant._id,
        customer: customer._id,
        bookingNumber: 'BKG-008',
        status: 'completed',
        destination: 'Paris',
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        totalAmount: 150000,
      });

      const res = await request(app)
        .post('/customer/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id,
          overallRating: 5,
          ratings: {
            serviceQuality: 5,
            valueForMoney: 4,
            communication: 5,
          },
          reviewText: 'Amazing trip! Everything was perfectly organized.',
          wouldRecommend: true,
          traveledWith: 'couple',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallRating).toBe(5);
      expect(res.body.data.status).toBe('pending');
    });

    it('should not allow duplicate reviews for same booking', async () => {
      const booking = await Booking.create({
        tenant: tenant._id,
        customer: customer._id,
        bookingNumber: 'BKG-009',
        status: 'completed',
        destination: 'London',
        startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        totalAmount: 180000,
      });

      await Review.create({
        tenant: tenant._id,
        customer: customer._id,
        booking: booking._id,
        overallRating: 4,
        reviewText: 'Great trip',
        status: 'approved',
      });

      const res = await request(app)
        .post('/customer/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id,
          overallRating: 5,
          reviewText: 'Updated review',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('already submitted');
    });

    it('should not allow review for non-completed booking', async () => {
      const booking = await Booking.create({
        tenant: tenant._id,
        customer: customer._id,
        bookingNumber: 'BKG-010',
        status: 'confirmed',
        destination: 'Dubai',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        totalAmount: 100000,
      });

      const res = await request(app)
        .post('/customer/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id,
          overallRating: 5,
          reviewText: 'Premature review',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('completed');
    });

    it('should get customer reviews', async () => {
      const booking = await Booking.create({
        tenant: tenant._id,
        customer: customer._id,
        bookingNumber: 'BKG-011',
        status: 'completed',
        destination: 'Singapore',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        totalAmount: 95000,
      });

      await Review.create({
        tenant: tenant._id,
        customer: customer._id,
        booking: booking._id,
        overallRating: 4,
        reviewText: 'Nice experience',
        status: 'approved',
      });

      const res = await request(app)
        .get('/customer/reviews')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Authorization', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/customer/dashboard');

      expect(res.status).toBe(401);
    });

    it('should not allow admin to access customer portal', async () => {
      const res = await request(app)
        .get('/customer/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });
});
