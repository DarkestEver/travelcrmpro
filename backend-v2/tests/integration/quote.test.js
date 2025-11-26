const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Tenant = require('../../src/models/Tenant');
const User = require('../../src/models/User');
const Lead = require('../../src/models/Lead');
const Itinerary = require('../../src/models/Itinerary');
const Quote = require('../../src/models/Quote');
const Booking = require('../../src/models/Booking');
const tokenService = require('../../src/services/tokenService');

/**
 * Quote System Integration Tests
 * Tests all quote functionality including PDF generation and workflow
 */

describe('Quote System Integration Tests', () => {
  let authToken;
  let tenant;
  let user;
  let lead;
  let itinerary;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Itinerary.deleteMany({});
    await Quote.deleteMany({});
    await Booking.deleteMany({});

    // Create test tenant
    tenant = await Tenant.create({
      name: 'Test Travel Agency',
      code: 'TEST',
      slug: 'test-travel-agency',
      email: 'test@travelagency.com',
      phone: '+1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
      },
      settings: {
        currency: 'USD',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        language: 'en',
      },
      branding: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
      },
      status: 'active',
    });

    // Create test user
    user = await User.create({
      tenant: tenant._id,
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@travelagency.com',
      password: 'password123',
      role: 'tenant_admin',
      status: 'active',
    });

    // Generate auth token
    authToken = tokenService.generateAccessToken({
      userId: user._id,
      tenantId: tenant._id,
      role: user.role,
    });

    // Create test lead
    lead = await Lead.create({
      tenant: tenant._id,
      customer: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1987654321',
      },
      destination: 'Bali, Indonesia',
      travelDates: {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-10'),
        isFlexible: false,
      },
      travelers: {
        adults: 2,
        children: 1,
        infants: 0,
      },
      budget: {
        min: 3000,
        max: 5000,
        currency: 'USD',
      },
      interests: ['beach', 'culture', 'adventure'],
      source: 'website',
      status: 'qualified',
      priority: 'high',
      assignedTo: user._id,
    });

    // Create test itinerary
    itinerary = await Itinerary.create({
      tenant: tenant._id,
      lead: lead._id,
      title: 'Amazing Bali Adventure',
      destination: 'Bali, Indonesia',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-10'),
      duration: 9,
      travelers: {
        adults: 2,
        children: 1,
        infants: 0,
      },
      currency: 'USD',
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Bali',
          date: new Date('2024-07-01'),
          accommodation: {
            name: 'Beach Resort Bali',
            type: 'hotel',
            roomType: 'Deluxe Ocean View',
            numberOfRooms: 1,
            checkIn: new Date('2024-07-01T14:00:00Z'),
            checkOut: new Date('2024-07-02T12:00:00Z'),
            cost: {
              amount: 150,
              currency: 'USD',
            },
            address: 'Seminyak, Bali, Indonesia',
          },
          activities: [
            {
              title: 'Airport Transfer',
              time: '10:00',
              duration: 60,
              cost: {
                amount: 30,
                currency: 'USD',
                includedInPackage: false,
              },
              description: 'Private transfer from airport to hotel',
            },
          ],
          transport: [
            {
              type: 'car',
              from: 'Ngurah Rai International Airport',
              to: 'Beach Resort Bali',
              departureTime: new Date('2024-07-01T10:00:00Z'),
              arrivalTime: new Date('2024-07-01T11:00:00Z'),
              cost: {
                amount: 30,
                currency: 'USD',
              },
            },
          ],
          meals: [
            {
              type: 'dinner',
              restaurant: 'Hotel Restaurant',
              cost: {
                amount: 50,
                currency: 'USD',
                includedInPackage: false,
              },
            },
          ],
        },
        {
          dayNumber: 2,
          title: 'Beach and Culture',
          date: new Date('2024-07-02'),
          accommodation: {
            name: 'Beach Resort Bali',
            type: 'hotel',
            roomType: 'Deluxe Ocean View',
            numberOfRooms: 1,
            cost: {
              amount: 150,
              currency: 'USD',
            },
            address: 'Seminyak, Bali, Indonesia',
          },
          activities: [
            {
              title: 'Tanah Lot Temple Visit',
              time: '14:00',
              duration: 180,
              cost: {
                amount: 80,
                currency: 'USD',
                includedInPackage: false,
              },
              description: 'Sunset tour to Tanah Lot Temple',
            },
          ],
        },
      ],
      status: 'draft',
      createdBy: user._id,
    });
  });

  describe('POST /quotes - Create Quote', () => {
    it('should create a quote from itinerary successfully', async () => {
      const res = await request(app)
        .post('/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itineraryId: itinerary._id.toString(),
          leadId: lead._id.toString(),
          title: 'Bali Adventure Quote',
          validityDays: 7,
          discounts: [
            {
              name: 'Early Bird Discount',
              type: 'percentage',
              value: 10,
            },
          ],
          taxes: [
            {
              name: 'Service Tax',
              type: 'percentage',
              value: 8,
            },
          ],
          paymentSchedule: [
            {
              milestone: 'Deposit',
              dueDate: new Date('2024-06-01'),
              amount: 200,
            },
          ],
          inclusions: [
            '9 nights accommodation',
            'Airport transfers',
            'All activities as mentioned',
          ],
          exclusions: [
            'International flights',
            'Travel insurance',
            'Personal expenses',
          ],
          termsAndConditions: 'Standard terms apply',
          cancellationPolicy: 'Free cancellation up to 30 days before travel',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('quoteNumber');
      expect(res.body.data.quoteNumber).toMatch(/^QT-\d{4}-\d{4}$/);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.lineItems.length).toBeGreaterThan(0);
      expect(res.body.data.pricing).toHaveProperty('subtotal');
      expect(res.body.data.pricing).toHaveProperty('grandTotal');
      expect(res.body.data.pricing.discounts).toHaveLength(1);
      expect(res.body.data.pricing.taxes).toHaveLength(1);
    });

    it('should generate unique quote numbers', async () => {
      const res1 = await request(app)
        .post('/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itineraryId: itinerary._id.toString(),
          leadId: lead._id.toString(),
          title: 'Quote 1',
        });

      const res2 = await request(app)
        .post('/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itineraryId: itinerary._id.toString(),
          leadId: lead._id.toString(),
          title: 'Quote 2',
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.quoteNumber).not.toBe(res2.body.data.quoteNumber);
    });

    it('should extract line items from itinerary correctly', async () => {
      const res = await request(app)
        .post('/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itineraryId: itinerary._id.toString(),
          leadId: lead._id.toString(),
          title: 'Test Quote',
        });

      expect(res.status).toBe(201);
      const lineItems = res.body.data.lineItems;
      
      // Should have accommodation, activities, transport, and meals
      expect(lineItems.some(item => item.itemType === 'accommodation')).toBe(true);
      expect(lineItems.some(item => item.itemType === 'activity')).toBe(true);
      expect(lineItems.some(item => item.itemType === 'transport')).toBe(true);
      expect(lineItems.some(item => item.itemType === 'meal')).toBe(true);
    });

    it('should calculate pricing correctly', async () => {
      const res = await request(app)
        .post('/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itineraryId: itinerary._id.toString(),
          leadId: lead._id.toString(),
          discounts: [
            {
              name: '10% Discount',
              type: 'percentage',
              value: 10,
            },
          ],
          taxes: [
            {
              name: '5% Tax',
              type: 'percentage',
              value: 5,
            },
          ],
        });

      expect(res.status).toBe(201);
      const pricing = res.body.data.pricing;
      
      const subtotal = pricing.subtotal;
      const expectedDiscount = subtotal * 0.1;
      const expectedTax = (subtotal - expectedDiscount) * 0.05;
      const expectedGrandTotal = subtotal - expectedDiscount + expectedTax;

      expect(Math.abs(pricing.discountTotal - expectedDiscount)).toBeLessThan(0.01);
      expect(Math.abs(pricing.taxTotal - expectedTax)).toBeLessThan(0.01);
      expect(Math.abs(pricing.grandTotal - expectedGrandTotal)).toBeLessThan(0.01);
    });

    it('should fail without itinerary ID', async () => {
      const res = await request(app)
        .post('/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Quote',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /quotes - List Quotes', () => {
    beforeEach(async () => {
      // Create test quotes sequentially to avoid duplicate quoteNumber
      await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0001',
        title: 'Quote 1',
        destination: 'Bali',
        status: 'draft',
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });

      await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0002',
        title: 'Quote 2',
        destination: 'Bali',
        status: 'sent',
        pricing: {
          subtotal: 2000,
          grandTotal: 2000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });
    });

    it('should list all quotes', async () => {
      const res = await request(app)
        .get('/quotes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should filter quotes by status', async () => {
      const res = await request(app)
        .get('/quotes?status=sent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('sent');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/quotes?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.pages).toBe(2);
    });
  });

  describe('GET /quotes/:id - Get Quote', () => {
    let quote;

    beforeEach(async () => {
      quote = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0003',
        title: 'Test Quote',
        destination: 'Bali',
        status: 'draft',
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });
    });

    it('should get quote by ID', async () => {
      const res = await request(app)
        .get(`/quotes/${quote._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quoteNumber).toBe('QT-TEST-0003');
    });

    it('should return 404 for non-existent quote', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/quotes/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /quotes/:id - Update Quote', () => {
    let quote;

    beforeEach(async () => {
      quote = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0004',
        title: 'Original Title',
        destination: 'Bali',
        status: 'draft',
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });
    });

    it('should update draft quote', async () => {
      const res = await request(app)
        .patch(`/quotes/${quote._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          internalNotes: 'Updated notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.internalNotes).toBe('Updated notes');
    });

    it('should not update non-draft quote', async () => {
      quote.status = 'sent';
      await quote.save();

      const res = await request(app)
        .patch(`/quotes/${quote._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /quotes/:id - Delete Quote', () => {
    let quote;

    beforeEach(async () => {
      quote = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0005',
        title: 'Test Quote',
        destination: 'Bali',
        status: 'draft',
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });
    });

    it('should delete draft quote', async () => {
      const res = await request(app)
        .delete(`/quotes/${quote._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deletedQuote = await Quote.findById(quote._id);
      expect(deletedQuote).toBeNull();
    });

    it('should not delete non-draft quote', async () => {
      quote.status = 'sent';
      await quote.save();

      const res = await request(app)
        .delete(`/quotes/${quote._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /quotes/:id/send - Send Quote', () => {
    let quote;

    beforeEach(async () => {
      quote = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0006',
        title: 'Test Quote',
        destination: 'Bali',
        status: 'draft',
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });
    });

    it('should send quote successfully', async () => {
      const res = await request(app)
        .post(`/quotes/${quote._id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Here is your quote',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('sent');
      expect(res.body.data.sentAt).toBeTruthy();
      expect(res.body.data.sentBy).toBe(user._id.toString());
    });
  });

  describe('POST /quotes/:id/approve - Approve Quote', () => {
    let quote;

    beforeEach(async () => {
      quote = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0007',
        title: 'Test Quote',
        destination: 'Bali',
        status: 'sent',
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sentAt: new Date(),
        sentBy: user._id,
        createdBy: user._id,
      });
    });

    it('should approve quote successfully (public endpoint)', async () => {
      const res = await request(app)
        .post(`/quotes/${quote._id}/approve`)
        .send({
          customerName: 'John Doe',
          notes: 'Looks great!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.approvedAt).toBeTruthy();
    });

    it('should not approve draft quote', async () => {
      quote.status = 'draft';
      await quote.save();

      const res = await request(app)
        .post(`/quotes/${quote._id}/approve`)
        .send({
          customerName: 'John Doe',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /quotes/:id/reject - Reject Quote', () => {
    let quote;

    beforeEach(async () => {
      quote = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0008',
        title: 'Test Quote',
        destination: 'Bali',
        status: 'sent',
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sentAt: new Date(),
        sentBy: user._id,
        createdBy: user._id,
      });
    });

    it('should reject quote successfully (public endpoint)', async () => {
      const res = await request(app)
        .post(`/quotes/${quote._id}/reject`)
        .send({
          reason: 'Too expensive',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.rejectedAt).toBeTruthy();
      expect(res.body.data.rejectionReason).toBe('Too expensive');
    });
  });

  describe('POST /quotes/:id/revise - Revise Quote', () => {
    let quote;

    beforeEach(async () => {
      quote = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0010',
        title: 'Test Quote',
        destination: 'Bali',
        status: 'sent',
        version: 1,
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });
    });

    it('should create quote revision', async () => {
      const res = await request(app)
        .post(`/quotes/${quote._id}/revise`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Revised Quote',
          validityDays: 14,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe(2);
      expect(res.body.data.parentQuote).toBe(quote._id.toString());
      expect(res.body.data.title).toBe('Revised Quote');
      expect(res.body.data.status).toBe('draft');
    });
  });

  describe('POST /quotes/:id/convert - Convert to Booking', () => {
    let quote;

    beforeEach(async () => {
      quote = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0009',
        title: 'Test Quote',
        destination: 'Bali',
        status: 'approved',
        travelers: {
          adults: 2,
          children: 1,
        },
        travelDates: {
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-07-10'),
        },
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        paymentSchedule: [
          {
            milestone: 'Deposit',
            dueDate: new Date('2024-06-01'),
            amount: 500,
          },
        ],
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(),
        createdBy: user._id,
      });
    });

    it('should convert approved quote to booking', async () => {
      const res = await request(app)
        .post(`/quotes/${quote._id}/convert`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking).toHaveProperty('bookingNumber');
      expect(res.body.data.booking.bookingNumber).toMatch(/^BK-\d{4}-\d{5}$/);
      expect(res.body.data.quote.status).toBe('converted');
      expect(res.body.data.quote.convertedAt).toBeTruthy();
    });

    it('should not convert non-approved quote', async () => {
      // Create a new quote with 'sent' status (not approved)
      const sentQuote = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0099',
        title: 'Sent Quote',
        destination: 'Bali',
        status: 'sent',
        travelers: {
          adults: 2,
          children: 1,
        },
        travelDates: {
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-07-10'),
        },
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });

      const res = await request(app)
        .post(`/quotes/${sentQuote._id}/convert`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /quotes/:id/versions - Get Versions', () => {
    let parentQuote;
    let revision1;
    let revision2;

    beforeEach(async () => {
      parentQuote = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0011',
        title: 'Original Quote',
        destination: 'Bali',
        status: 'sent',
        version: 1,
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });

      revision1 = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0012',
        title: 'Revision 1',
        destination: 'Bali',
        status: 'sent',
        version: 2,
        parentQuote: parentQuote._id,
        pricing: {
          subtotal: 1100,
          grandTotal: 1100,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });

      revision2 = await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0013',
        title: 'Revision 2',
        destination: 'Bali',
        status: 'approved',
        version: 3,
        parentQuote: parentQuote._id,
        pricing: {
          subtotal: 1200,
          grandTotal: 1200,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });
    });

    it('should get all versions of a quote', async () => {
      const res = await request(app)
        .get(`/quotes/${parentQuote._id}/versions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].version).toBe(1);
      expect(res.body.data[1].version).toBe(2);
      expect(res.body.data[2].version).toBe(3);
    });
  });

  describe('GET /quotes/stats/overview - Quote Statistics', () => {
    beforeEach(async () => {
      // Create quotes sequentially to avoid duplicate quoteNumber
      await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0014',
        title: 'Quote 1',
        destination: 'Bali',
        status: 'draft',
        pricing: {
          subtotal: 1000,
          grandTotal: 1000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user._id,
      });

      await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0015',
        title: 'Quote 2',
        destination: 'Bali',
        status: 'approved',
        pricing: {
          subtotal: 2000,
          grandTotal: 2000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(),
        createdBy: user._id,
      });

      await Quote.create({
        tenant: tenant._id,
        lead: lead._id,
        itinerary: itinerary._id,
        customer: lead.customer,
        quoteNumber: 'QT-TEST-0016',
        title: 'Quote 3',
        destination: 'Bali',
        status: 'converted',
        pricing: {
          subtotal: 3000,
          grandTotal: 3000,
          currency: 'USD',
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        convertedAt: new Date(),
        createdBy: user._id,
      });
    });

    it('should get quote statistics', async () => {
      const res = await request(app)
        .get('/quotes/stats/overview')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalQuotes');
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('totalValue');
      expect(res.body.data.totalQuotes).toBe(3);
    });
  });
});
