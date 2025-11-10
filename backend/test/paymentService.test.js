/**
 * Payment Service Tests
 * Tests for payment business logic
 */

const paymentService = require('../src/services/paymentService');
const StripePayment = require('../src/models/StripePayment');
const Invoice = require('../src/models/Invoice');
const { stripe } = require('../src/config/stripe');

// Mock dependencies
jest.mock('../src/config/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: jest.fn(),
    },
  },
  convertToStripeAmount: jest.fn((amount) => amount * 100),
  validateAmount: jest.fn(),
  validateCurrency: jest.fn(),
}));

jest.mock('../src/models/StripePayment');
jest.mock('../src/models/Invoice');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      // Mock invoice
      const mockInvoice = {
        _id: 'invoice123',
        invoiceNumber: 'INV-001',
        customerId: 'customer123',
        tenantId: 'tenant123',
        bookingId: 'booking123',
        total: 1000,
        amountPaid: 0,
        balance: 1000,
      };

      // Mock payment intent from Stripe
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 100000,
        currency: 'inr',
      };

      // Mock payment record
      const mockPayment = {
        _id: 'payment123',
        amount: 1000,
        currency: 'INR',
        status: 'pending',
      };

      // Setup mocks
      Invoice.findById = jest.fn().mockResolvedValue(mockInvoice);
      stripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);
      StripePayment.create = jest.fn().mockResolvedValue(mockPayment);

      // Execute
      const result = await paymentService.createPaymentIntent({
        invoiceId: 'invoice123',
        amount: 1000,
        currency: 'INR',
        customerId: 'customer123',
        tenantId: 'tenant123',
        saveCard: false,
        metadata: {},
      });

      // Assertions
      expect(Invoice.findById).toHaveBeenCalledWith('invoice123');
      expect(stripe.paymentIntents.create).toHaveBeenCalled();
      expect(StripePayment.create).toHaveBeenCalled();
      expect(result.payment).toEqual(mockPayment);
      expect(result.clientSecret).toBe('pi_test_123_secret');
    });

    it('should reject payment amount exceeding invoice balance', async () => {
      const mockInvoice = {
        _id: 'invoice123',
        customerId: 'customer123',
        tenantId: 'tenant123',
        total: 1000,
        amountPaid: 600,
        balance: 400,
      };

      Invoice.findById = jest.fn().mockResolvedValue(mockInvoice);

      await expect(
        paymentService.createPaymentIntent({
          invoiceId: 'invoice123',
          amount: 500, // More than balance
          currency: 'INR',
          customerId: 'customer123',
          tenantId: 'tenant123',
        })
      ).rejects.toThrow('exceeds outstanding balance');
    });

    it('should reject unauthorized customer access', async () => {
      const mockInvoice = {
        _id: 'invoice123',
        customerId: 'customer123',
        tenantId: 'tenant123',
        balance: 1000,
      };

      Invoice.findById = jest.fn().mockResolvedValue(mockInvoice);

      await expect(
        paymentService.createPaymentIntent({
          invoiceId: 'invoice123',
          amount: 500,
          currency: 'INR',
          customerId: 'different_customer',
          tenantId: 'tenant123',
        })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateInvoiceAfterPayment', () => {
    it('should update invoice to paid status when fully paid', async () => {
      const mockPayment = {
        _id: 'payment123',
        invoiceId: 'invoice123',
        amount: 1000,
        paidAt: new Date(),
        stripeChargeId: 'ch_123',
        receiptNumber: 'RCP-001',
        paymentMethod: {
          type: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
      };

      const mockInvoice = {
        _id: 'invoice123',
        total: 1000,
        amountPaid: 0,
        balance: 1000,
        status: 'pending',
        payments: [],
        save: jest.fn(),
      };

      Invoice.findById = jest.fn().mockResolvedValue(mockInvoice);

      await paymentService.updateInvoiceAfterPayment(mockPayment);

      expect(mockInvoice.amountPaid).toBe(1000);
      expect(mockInvoice.balance).toBe(0);
      expect(mockInvoice.status).toBe('paid');
      expect(mockInvoice.payments.length).toBe(1);
      expect(mockInvoice.save).toHaveBeenCalled();
    });

    it('should update invoice to partial status when partially paid', async () => {
      const mockPayment = {
        _id: 'payment123',
        invoiceId: 'invoice123',
        amount: 500,
        paidAt: new Date(),
        stripeChargeId: 'ch_123',
        receiptNumber: 'RCP-001',
        paymentMethod: {
          type: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
      };

      const mockInvoice = {
        _id: 'invoice123',
        total: 1000,
        amountPaid: 0,
        balance: 1000,
        status: 'pending',
        payments: [],
        save: jest.fn(),
      };

      Invoice.findById = jest.fn().mockResolvedValue(mockInvoice);

      await paymentService.updateInvoiceAfterPayment(mockPayment);

      expect(mockInvoice.amountPaid).toBe(500);
      expect(mockInvoice.balance).toBe(500);
      expect(mockInvoice.status).toBe('partial');
      expect(mockInvoice.save).toHaveBeenCalled();
    });
  });
});
