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
const Itinerary = require('../../src/models/Itinerary');

// Helper functions to create test fixtures with all required fields
async function createTestItinerary(tenant, admin, options = {}) {
  return await Itinerary.create({
    tenant: tenant._id,
    title: options.title || 'Test Itinerary',
    destination: options.destination || 'Paris',
    startDate: options.startDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    endDate: options.endDate || new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
    duration: options.duration || 7,
    days: options.days || [{
      dayNumber: 1,
      title: 'Day 1',
      activities: [{ title: 'Arrival' }]
    }],
    createdBy: admin._id
  });
}

async function createTestBooking(tenant, customer, admin, options = {}) {
  const itinerary = await createTestItinerary(tenant, admin, options);
  return await Booking.create({
    tenant: tenant._id,
    itinerary: itinerary._id,
    bookingNumber: options.bookingNumber || 'BKG-' + Date.now(),
    status: options.status || 'confirmed',
    customer: {
      name: options.customerName || (customer.firstName + ' ' + customer.lastName),
      email: options.customerEmail || customer.email,
      phone: options.customerPhone || customer.phone
    },
    travelStartDate: options.travelStartDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    travelEndDate: options.travelEndDate || new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
    pricing: {
      basePrice: options.basePrice || 100000,
      totalPrice: options.totalPrice || 100000,
      currency: options.currency || 'INR'
    },
    createdBy: admin._id
  });
}

async function createTestQuote(tenant, customer, admin, options = {}) {
  // Create itinerary if not provided
  let itinerary = options.itinerary;
  if (!itinerary) {
    itinerary = await createTestItinerary(tenant, admin, {
      title: options.title || 'Paris Package',
      destination: options.destination || 'Paris'
    });
  }

  return await Quote.create({
    tenant: tenant._id,
    quoteNumber: options.quoteNumber || 'QT-' + Date.now(),
    itinerary: itinerary._id,
    title: options.title || 'Paris Package',
    customer: {
      name: options.customerName || (customer.firstName + ' ' + customer.lastName),
      email: options.customerEmail || customer.email,
      phone: options.customerPhone || customer.phone
    },
    destination: options.destination || 'Paris', // String, not object
    travelDates: {
      startDate: options.startDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      endDate: options.endDate || new Date(Date.now() + 67 * 24 * 60 * 60 * 1000),
    },
    travelers: {
      adults: options.adults || 2,
      children: options.children || 0,
      infants: options.infants || 0
    },
    pricing: {
      subtotal: options.subtotal || 80000,
      grandTotal: options.grandTotal || options.subtotal || 80000, // Required field
      currency: options.currency || 'INR'
    },
    status: options.status || 'sent',
    validUntil: options.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdBy: admin._id
  });
}

async function createTestPayment(tenant, customer, booking, admin, options = {}) {
  return await Payment.create({
    tenant: tenant._id,
    transactionId: options.transactionId || ('TXN-' + Date.now()),
    booking: booking._id,
    customer: {
      name: options.customerName || (customer.firstName + ' ' + customer.lastName),
      email: options.customerEmail || customer.email
    },
    amount: options.amount || 30000,
    currency: options.currency || 'INR',
    method: options.method || 'bank-transfer',
    status: options.status || 'pending',
    processedBy: options.processedBy || admin._id, // Required field
    createdBy: admin._id
  });
}

describe('Customer Portal API', () => {
  let tenant, tenantSlug, customer, customerToken, admin, adminToken;
  let otherCustomer, otherCustomerToken;

  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.disconnect();
  });

  afterEach(async () => {
    await Review.deleteMany({});
    await Document.deleteMany({});
    await Payment.deleteMany({});
    await Booking.deleteMany({});
    await Itinerary.deleteMany({});
    await Quote.deleteMany({});
    await Query.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});
  });

  beforeEach(async () => {
    // Create tenant
    tenant = await Tenant.create({
      name: 'Test Travel Agency',
      slug: 'test-travel-' + Date.now(),
      subdomain: 'test-travel',
      email: 'admin@testtravel.com',
      status: 'active', // Required for tenant middleware to find it
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });
    tenantSlug = tenant.slug;

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
      .set('X-Tenant-Slug', tenantSlug)
      .send({
        email: 'customer@test.com',
        password: 'password123',
      });
    customerToken = customerLoginRes.body?.data?.accessToken || '';

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
      .set('X-Tenant-Slug', tenantSlug)
      .send({
        email: 'other@test.com',
        password: 'password123',
      });
    otherCustomerToken = otherLoginRes.body?.data?.accessToken || '';

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
      .set('X-Tenant-Slug', tenantSlug)
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });
    adminToken = adminLoginRes.body?.data?.accessToken || '';
  });

  describe('GET /customer/dashboard', () => {
    it('should return customer dashboard with aggregated data', async () => {
      // Create test data using helpers
      const booking = await createTestBooking(tenant, customer, admin, {
        bookingNumber: 'BKG-001',
        title: 'Paris Adventure',
        destination: 'Paris'
      });

      await createTestQuote(tenant, customer, admin, {
        quoteNumber: 'QT-001',
        title: 'London Package',
        destination: 'London'
      });

      await createTestPayment(tenant, customer, booking, admin, {
        amount: 30000
      });

      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        uploadedBy: admin._id, // Required field
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
      await createTestBooking(tenant, otherCustomer, admin, {
        bookingNumber: 'BKG-002',
        customerName: otherCustomer.firstName + ' ' + otherCustomer.lastName,
        customerEmail: otherCustomer.email,
        customerPhone: otherCustomer.phone,
        destination: 'Rome'
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
      expect(res.body.data.tripDetails.destination).toBe('Switzerland');
      expect(res.body.data.status).toBe('draft'); // Default status from Query model
      expect(res.body.data).toHaveProperty('sla');
    });

    it('should get customer queries', async () => {
      await Query.create({
        tenant: tenant._id,
        queryNumber: 'QRY-202401-0001',
        source: 'website',
        customer: {
          name: 'John Doe',
          email: 'customer@test.com',
          phone: '9876543210',
        },
        tripDetails: {
          destination: 'Paris',
        },
        message: 'Test query',
        status: 'pending',
        priority: 'medium',
      });

      const res = await request(app)
        .get('/customer/queries')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.queries.length).toBeGreaterThan(0);
      expect(res.body.data.queries[0].customer.email).toBe('customer@test.com');
    });

    it('should filter queries by status', async () => {
      await Query.create({
        tenant: tenant._id,
        queryNumber: 'QRY-202401-0002',
        source: 'website',
        customer: {
          name: 'John Doe',
          email: 'customer@test.com',
          phone: '9876543210',
        },
        tripDetails: {
          destination: 'London',
        },
        message: 'Test query',
        status: 'won',
        priority: 'medium',
      });

      const res = await request(app)
        .get('/customer/queries?status=won')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.queries.every(q => q.status === 'won')).toBe(true);
    });

    it('should not show other customers queries', async () => {
      await Query.create({
        tenant: tenant._id,
        queryNumber: 'QRY-202401-0003',
        source: 'website',
        customer: {
          name: 'Jane Smith',
          email: 'other@test.com',
          phone: '9876543211',
        },
        tripDetails: {
          destination: 'Tokyo',
        },
        message: 'Test query',
        status: 'pending',
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
      await createTestQuote(tenant, customer, admin, {
        quoteNumber: 'QT-002',
        title: 'Dubai Package',
        destination: 'Dubai',
        subtotal: 75000
      });

      const res = await request(app)
        .get('/customer/quotes')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quotes.length).toBeGreaterThan(0);
    });

    it('should get quote by ID', async () => {
      const quote = await createTestQuote(tenant, customer, admin, {
        quoteNumber: 'QT-003',
        title: 'Maldives Package',
        destination: 'Maldives',
        subtotal: 120000
      });

      const res = await request(app)
        .get(`/customer/quotes/${quote._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.quoteNumber).toBe('QT-003');
    });

    it('should not allow access to other customers quotes', async () => {
      const quote = await createTestQuote(tenant, otherCustomer, admin, {
        quoteNumber: 'QT-004',
        title: 'Bali Package',
        destination: 'Bali',
        customerName: otherCustomer.firstName + ' ' + otherCustomer.lastName,
        customerEmail: otherCustomer.email,
        customerPhone: otherCustomer.phone,
        subtotal: 90000
      });

      const res = await request(app)
        .get(`/customer/quotes/${quote._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Booking Management', () => {
    it('should get customer bookings', async () => {
      await createTestBooking(tenant, customer, admin, {
        bookingNumber: 'BKG-003',
        destination: 'Singapore',
        totalPrice: 85000
      });

      const res = await request(app)
        .get('/customer/bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.length).toBeGreaterThan(0);
    });

    it('should filter upcoming bookings', async () => {
      await createTestBooking(tenant, customer, admin, {
        bookingNumber: 'BKG-004',
        destination: 'Thailand',
        travelStartDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        travelEndDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        totalPrice: 65000
      });

      const res = await request(app)
        .get('/customer/bookings?upcoming=true')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.every(b => new Date(b.travelStartDate) > new Date())).toBe(true);
    });

    it('should filter past bookings', async () => {
      await createTestBooking(tenant, customer, admin, {
        bookingNumber: 'BKG-005',
        status: 'completed',
        destination: 'Dubai',
        travelStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        travelEndDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        totalPrice: 70000
      });

      const res = await request(app)
        .get('/customer/bookings?past=true')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.every(b => new Date(b.travelEndDate) < new Date())).toBe(true);
    });
  });

  describe('Payment Management', () => {
    it('should get customer payments', async () => {
      const booking = await createTestBooking(tenant, customer, admin, {
        bookingNumber: 'BKG-006',
        destination: 'Europe',
        travelStartDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        travelEndDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
        totalPrice: 200000
      });

      await createTestPayment(tenant, customer, booking, admin, {
        amount: 50000,
        status: 'completed',
        method: 'credit-card'
      });

      const res = await request(app)
        .get('/customer/payments')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.payments.length).toBeGreaterThan(0);
    });

    it('should get booking payments', async () => {
      const booking = await createTestBooking(tenant, customer, admin, {
        bookingNumber: 'BKG-007',
        destination: 'Asia',
        travelStartDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        travelEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        totalPrice: 150000
      });

      await createTestPayment(tenant, customer, booking, admin, {
        amount: 50000,
        status: 'completed'
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
        uploadedBy: admin._id, // Required field
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
        uploadedBy: admin._id, // Required field
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
        uploadedBy: admin._id, // Required field
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
      const booking = await createTestBooking(tenant, customer, admin, {
        bookingNumber: 'BKG-008',
        status: 'completed',
        destination: 'Paris',
        travelStartDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        travelEndDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        totalPrice: 150000
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
      const booking = await createTestBooking(tenant, customer, admin, {
        bookingNumber: 'BKG-009',
        status: 'completed',
        destination: 'London',
        travelStartDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        travelEndDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        totalPrice: 180000
      });

      await Review.create({
        tenant: tenant._id,
        customer: customer._id,
        booking: booking._id,
        overallRating: 4,
        reviewText: 'Great trip',
        status: 'approved',
        createdBy: customer._id
      });

      const res = await request(app)
        .post('/customer/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id,
          overallRating: 5,
          reviewText: 'Updated review',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('already submitted');
    });

    it('should not allow review for non-completed booking', async () => {
      const booking = await createTestBooking(tenant, customer, admin, {
        bookingNumber: 'BKG-010',
        status: 'confirmed',
        destination: 'Dubai',
        travelStartDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        travelEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        totalPrice: 100000
      });

      const res = await request(app)
        .post('/customer/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id,
          overallRating: 5,
          reviewText: 'Premature review',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('completed');
    });

    it('should get customer reviews', async () => {
      const booking = await createTestBooking(tenant, customer, admin, {
        bookingNumber: 'BKG-011',
        status: 'completed',
        destination: 'Singapore',
        travelStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        travelEndDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        totalPrice: 95000
      });

      await Review.create({
        tenant: tenant._id,
        customer: customer._id,
        booking: booking._id,
        overallRating: 4,
        reviewText: 'Nice experience',
        status: 'approved',
        createdBy: customer._id
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
