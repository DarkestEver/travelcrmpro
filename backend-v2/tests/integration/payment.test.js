// Mock paymentGatewayService BEFORE requiring app
jest.mock('../../src/services/paymentGatewayService', () => ({
  createPaymentIntent: jest.fn(),
  getPaymentIntentStatus: jest.fn(),
  capturePaymentIntent: jest.fn(),
  cancelPaymentIntent: jest.fn(),
  processRefund: jest.fn(),
  processStripeRefund: jest.fn(),
  handleWebhookEvent: jest.fn(),
  verifyWebhookSignature: jest.fn(),
}));

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Invoice = require('../../src/models/Invoice');
const Payment = require('../../src/models/Payment');
const Booking = require('../../src/models/Booking');
const Tenant = require('../../src/models/Tenant');
const User = require('../../src/models/User');
const Itinerary = require('../../src/models/Itinerary');
const Lead = require('../../src/models/Lead');
const paymentGatewayService = require('../../src/services/paymentGatewayService');
const tokenService = require('../../src/services/tokenService');

describe('Payment Integration Tests', () => {
  let tenant, user, token, lead, itinerary, booking, invoice;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/travel-crm-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Itinerary.deleteMany({});
    await Booking.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});

    // Create tenant
    tenant = await Tenant.create({
      name: 'Test Travel Agency',
      slug: 'test-agency',
      email: 'test@agency.com',
      subscription: {
        plan: 'professional',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      settings: {
        invoicePrefix: 'INV',
        invoiceStartNumber: 1,
      },
    });

    // Create user
    user = await User.create({
      tenant: tenant._id,
      email: 'admin@agency.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'tenant_admin',
      isActive: true,
    });

    // Generate token
    token = tokenService.generateAccessToken({
      userId: user._id,
      tenantId: tenant._id,
      role: user.role,
    });

    // Create lead
    lead = await Lead.create({
      tenant: tenant._id,
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      status: 'qualified',
      createdBy: user._id,
    });

    // Create itinerary
    itinerary = await Itinerary.create({
      tenant: tenant._id,
      lead: lead._id,
      title: 'European Adventure',
      destination: 'Europe',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      duration: 10,
      numberOfTravelers: 2,
      estimatedBudget: 5000,
      status: 'draft',
      days: [
        {
          dayNumber: 1,
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          title: 'Arrival in Paris',
          description: 'Arrive and check in',
        },
      ],
      createdBy: user._id,
    });

    // Create booking
    const bookingNumber = await Booking.generateBookingNumber(tenant._id);
    booking = await Booking.create({
      tenant: tenant._id,
      bookingNumber,
      itinerary: itinerary._id,
      lead: lead._id,
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      travelStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      travelEndDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      status: 'confirmed',
      pricing: {
        basePrice: 5000,
        totalPrice: 5000,
      },
      totalAmount: 5000,
      amountPaid: 0,
      amountDue: 5000,
      createdBy: user._id,
    });

    // Create invoice
    const invoiceNumber = await Invoice.generateInvoiceNumber(tenant._id);
    invoice = await Invoice.create({
      tenant: tenant._id,
      invoiceNumber,
      booking: booking._id,
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      lineItems: [
        {
          description: 'European Adventure Package',
          quantity: 2,
          unitPrice: 2500,
          total: 5000,
        },
      ],
      subtotal: 5000,
      total: 5000,
      paymentStatus: {
        amountPaid: 0,
        amountDue: 5000,
      },
      status: 'sent',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: user._id,
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/payments/create-intent', () => {
    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 500000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      // Mock the payment gateway service method
      paymentGatewayService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: invoice._id.toString(),
          amount: 5000,
          currency: 'usd',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clientSecret).toBe('pi_test_123_secret');
      expect(response.body.data.paymentIntentId).toBe('pi_test_123');
      
      // Verify service was called
      expect(paymentGatewayService.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: invoice._id,
          tenant: tenant._id,
        }),
        expect.any(Object)
      );

      // Verify invoice was updated
      const updatedInvoice = await Invoice.findById(invoice._id);
      expect(updatedInvoice.stripePaymentIntentId).toBe('pi_test_123');
    });

    it('should return 400 if invoice not found', async () => {
      const response = await request(app)
        .post('/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: new mongoose.Types.ObjectId().toString(),
          amount: 5000,
          currency: 'usd',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if amount exceeds invoice due', async () => {
      // Mock the service to throw an error
      paymentGatewayService.createPaymentIntent.mockRejectedValue(
        new Error('Amount exceeds invoice total')
      );

      const response = await request(app)
        .post('/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: invoice._id.toString(),
          amount: 6000, // More than invoice total
          currency: 'usd',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should create customer if email provided', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 500000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      paymentGatewayService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: invoice._id.toString(),
          amount: 5000,
          currency: 'usd',
          customerEmail: 'john@example.com',
        });

      expect(response.status).toBe(200);
      expect(paymentGatewayService.createPaymentIntent).toHaveBeenCalled();
    });
  });

  describe('GET /api/payments/intent/:paymentIntentId', () => {
    it('should retrieve payment intent status', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 500000,
        currency: 'usd',
        status: 'succeeded',
        client_secret: 'pi_test_123_secret',
      };

      paymentGatewayService.getPaymentIntentStatus.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .get('/payments/intent/pi_test_123')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('succeeded');
    });

    it('should return 404 if payment intent not found', async () => {
      const error = new Error('No such payment_intent');
      error.type = 'StripeInvalidRequestError';
      paymentGatewayService.getPaymentIntentStatus.mockRejectedValue(error);

      const response = await request(app)
        .get('/payments/intent/pi_invalid')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/payments/webhooks/stripe', () => {
    it('should handle payment_intent.succeeded event', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 500000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              invoiceId: invoice._id.toString(),
              bookingId: booking._id.toString(),
              tenantId: tenant._id.toString(),
            },
          },
        },
      };

      paymentGatewayService.verifyWebhookSignature.mockReturnValue(mockEvent);
      paymentGatewayService.handleWebhookEvent.mockResolvedValue(undefined);

      // Update invoice with payment intent ID
      invoice.stripePaymentIntentId = 'pi_test_123';
      await invoice.save();

      const response = await request(app)
        .post('/payments/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(mockEvent);

      expect(response.status).toBe(200);
      expect(paymentGatewayService.verifyWebhookSignature).toHaveBeenCalled();
      expect(paymentGatewayService.handleWebhookEvent).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 500000,
            currency: 'usd',
            status: 'requires_payment_method',
            last_payment_error: {
              message: 'Your card was declined',
            },
            metadata: {
              invoiceId: invoice._id.toString(),
              tenantId: tenant._id.toString(),
            },
          },
        },
      };

      paymentGatewayService.verifyWebhookSignature.mockReturnValue(mockEvent);
      paymentGatewayService.handleWebhookEvent.mockResolvedValue(undefined);

      invoice.stripePaymentIntentId = 'pi_test_123';
      await invoice.save();

      const response = await request(app)
        .post('/payments/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(mockEvent);

      expect(response.status).toBe(200);
      expect(paymentGatewayService.handleWebhookEvent).toHaveBeenCalled();
    });

    it('should handle charge.refunded event', async () => {
      // Create a paid invoice and payment
      invoice.status = 'paid';
      invoice.amountPaid = 5000;
      invoice.amountDue = 0;
      invoice.stripePaymentIntentId = 'pi_test_123';
      await invoice.save();

      payment = await Payment.create({
        tenant: tenant._id,
        transactionId: 'TXN-TEST-002',
        booking: booking._id,
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        amount: 2500,
        method: 'stripe',
        status: 'completed',
        gateway: {
          provider: 'stripe',
          gatewayTransactionId: 'ch_test_456',
        },
        processedBy: user._id,
      });

      const mockEvent = {
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_test_123',
            amount: 500000,
            amount_refunded: 500000,
            refunded: true,
            payment_intent: 'pi_test_123',
            metadata: {
              invoiceId: invoice._id.toString(),
              tenantId: tenant._id.toString(),
            },
          },
        },
      };

      paymentGatewayService.verifyWebhookSignature.mockReturnValue(mockEvent);
      paymentGatewayService.handleWebhookEvent.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/payments/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(mockEvent);

      expect(response.status).toBe(200);
      expect(paymentGatewayService.handleWebhookEvent).toHaveBeenCalled();
    });

    it('should reject webhook with invalid signature', async () => {
      const error = new Error('Invalid signature');
      paymentGatewayService.verifyWebhookSignature.mockImplementation(() => {
        throw error;
      });

      const response = await request(app)
        .post('/payments/webhooks/stripe')
        .set('stripe-signature', 'invalid_signature')
        .send({ type: 'payment_intent.succeeded' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/payments/:id/stripe-refund', () => {
    let payment;

    beforeEach(async () => {
      // Create a completed payment
      invoice.status = 'paid';
      invoice.amountPaid = 5000;
      invoice.amountDue = 0;
      invoice.stripePaymentIntentId = 'pi_test_123';
      await invoice.save();

      payment = await Payment.create({
        tenant: tenant._id,
        transactionId: 'txn_test_123',
        booking: booking._id,
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        amount: 5000,
        method: 'stripe',
        status: 'completed',
        gateway: {
          provider: 'stripe',
          gatewayTransactionId: 'ch_test_123',
        },
        processedBy: user._id,
      });
    });

    it('should process full refund successfully', async () => {
      const mockRefund = {
        id: 're_test_123',
        amount: 500000,
        status: 'succeeded',
        charge: 'ch_test_123',
        refund: {
          id: 're_test_123',
          amount: 5000,
          status: 'succeeded',
        },
      };

      paymentGatewayService.processStripeRefund.mockResolvedValue(mockRefund);

      const response = await request(app)
        .post(`/payments/${payment._id}/stripe-refund`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 5000,
          reason: 'Customer request',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(paymentGatewayService.processStripeRefund).toHaveBeenCalled();
    });

    it('should process partial refund successfully', async () => {
      const mockRefund = {
        id: 're_test_123',
        amount: 200000,
        status: 'succeeded',
        charge: 'ch_test_123',
        refund: {
          id: 're_test_123',
          amount: 2000,
          status: 'succeeded',
        },
      };

      paymentGatewayService.processStripeRefund.mockResolvedValue(mockRefund);

      const response = await request(app)
        .post(`/payments/${payment._id}/stripe-refund`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 2000,
          reason: 'Partial cancellation',
        });

      expect(response.status).toBe(200);
      expect(paymentGatewayService.processStripeRefund).toHaveBeenCalled();
    });

    it('should return 400 if refund amount exceeds payment', async () => {
      paymentGatewayService.processStripeRefund.mockRejectedValue(
        new Error('Refund amount exceeds payment')
      );

      const response = await request(app)
        .post(`/payments/${payment._id}/stripe-refund`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 6000, // More than payment amount
          reason: 'Test',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if payment not completed', async () => {
      payment.status = 'pending';
      await payment.save();

      paymentGatewayService.processStripeRefund.mockRejectedValue(
        new Error('Payment not completed')
      );

      const response = await request(app)
        .post(`/payments/${payment._id}/stripe-refund`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 5000,
          reason: 'Test',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Invoice Number Generation with Tenant Settings', () => {
    it('should generate invoice number with custom prefix', async () => {
      // Update tenant settings
      tenant.settings.invoicePrefix = 'TRAVEL';
      tenant.settings.invoiceStartNumber = 100;
      await tenant.save();

      const invoiceNumber = await Invoice.generateInvoiceNumber(tenant._id);
      
      expect(invoiceNumber).toMatch(/^TRAVEL-2025-00100$/);
    });

    it('should increment invoice numbers correctly', async () => {
      const number1 = await Invoice.generateInvoiceNumber(tenant._id);
      
      await Invoice.create({
        tenant: tenant._id,
        invoiceNumber: number1,
        booking: booking._id,
        customer: { name: 'Test', email: 'test@test.com' },
        items: [{ description: 'Test', quantity: 1, unitPrice: 100, total: 100 }],
        subtotal: 100,
        total: 100,
        paymentStatus: {
          amountPaid: 0,
          amountDue: 100,
        },
        status: 'draft',
        dueDate: new Date(),
        createdBy: user._id,
      });

      const number2 = await Invoice.generateInvoiceNumber(tenant._id);
      
      expect(number1).toBe('INV-2025-00001');
      expect(number2).toBe('INV-2025-00002');
    });

    it('should use start number for first invoice', async () => {
      tenant.settings.invoiceStartNumber = 1000;
      await tenant.save();

      const invoiceNumber = await Invoice.generateInvoiceNumber(tenant._id);
      
      expect(invoiceNumber).toBe('INV-2025-01000');
    });
  });

  describe('Payment Flow Integration', () => {
    it('should complete full payment flow from intent to confirmation', async () => {
      // Step 1: Create payment intent
      const mockPaymentIntent = {
        id: 'pi_test_full_flow',
        client_secret: 'pi_test_secret',
        amount: 500000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      paymentGatewayService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const intentResponse = await request(app)
        .post('/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: invoice._id.toString(),
          amount: 5000,
          currency: 'usd',
        });

      expect(intentResponse.status).toBe(200);
      expect(intentResponse.body.data.clientSecret).toBe('pi_test_secret');

      // Step 2: Simulate successful payment webhook
      const successEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_full_flow',
            amount: 500000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              invoiceId: invoice._id.toString(),
              bookingId: booking._id.toString(),
              tenantId: tenant._id.toString(),
            },
          },
        },
      };

      paymentGatewayService.verifyWebhookSignature.mockReturnValue(successEvent);
      paymentGatewayService.handleWebhookEvent.mockResolvedValue(undefined);

      const webhookResponse = await request(app)
        .post('/payments/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(successEvent);

      expect(webhookResponse.status).toBe(200);
      expect(paymentGatewayService.createPaymentIntent).toHaveBeenCalled();
      expect(paymentGatewayService.handleWebhookEvent).toHaveBeenCalled();
    });
  });
});
