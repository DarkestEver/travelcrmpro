/**
 * Invoice Model Test Suite
 * Tests for Invoice model methods and statics
 */

const mongoose = require('mongoose');
const Invoice = require('../src/models/Invoice');

describe('Invoice Model Tests', () => {
  
  // Test invoice number generation
  describe('generateInvoiceNumber', () => {
    test('should generate invoice number with correct format', async () => {
      const tenantId = new mongoose.Types.ObjectId();
      const invoiceNumber = await Invoice.generateInvoiceNumber(tenantId);
      
      // Format: INV-YYYYMM-0001
      const regex = /^INV-\d{6}-\d{4}$/;
      expect(invoiceNumber).toMatch(regex);
    });
    
    test('should increment sequence number', async () => {
      const tenantId = new mongoose.Types.ObjectId();
      
      // Create first invoice
      const invoice1 = await Invoice.create({
        tenantId,
        agentId: new mongoose.Types.ObjectId(),
        bookingId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        invoiceNumber: await Invoice.generateInvoiceNumber(tenantId),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [{
          description: 'Test Item',
          quantity: 1,
          unitPrice: 100,
          amount: 100
        }]
      });
      
      // Generate next number
      const nextNumber = await Invoice.generateInvoiceNumber(tenantId);
      
      // Extract sequence numbers
      const seq1 = parseInt(invoice1.invoiceNumber.split('-')[2]);
      const seq2 = parseInt(nextNumber.split('-')[2]);
      
      expect(seq2).toBe(seq1 + 1);
    });
  });
  
  // Test total calculation
  describe('calculateTotals', () => {
    test('should correctly calculate subtotal from items', () => {
      const invoice = new Invoice({
        tenantId: new mongoose.Types.ObjectId(),
        agentId: new mongoose.Types.ObjectId(),
        bookingId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        invoiceNumber: 'TEST-001',
        dueDate: new Date(),
        items: [
          { description: 'Item 1', quantity: 2, unitPrice: 50, amount: 100 },
          { description: 'Item 2', quantity: 1, unitPrice: 75, amount: 75 }
        ],
        tax: 0,
        discount: 0
      });
      
      invoice.calculateTotals();
      
      expect(invoice.subtotal).toBe(175);
      expect(invoice.total).toBe(175);
      expect(invoice.amountDue).toBe(175);
    });
    
    test('should apply tax and discount correctly', () => {
      const invoice = new Invoice({
        tenantId: new mongoose.Types.ObjectId(),
        agentId: new mongoose.Types.ObjectId(),
        bookingId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        invoiceNumber: 'TEST-002',
        dueDate: new Date(),
        items: [
          { description: 'Item 1', quantity: 1, unitPrice: 100, amount: 100 }
        ],
        tax: 10,
        discount: 5
      });
      
      invoice.calculateTotals();
      
      expect(invoice.subtotal).toBe(100);
      expect(invoice.total).toBe(105); // 100 + 10 - 5
      expect(invoice.amountDue).toBe(105);
    });
  });
  
  // Test payment recording
  describe('recordPayment', () => {
    test('should update status to partially_paid for partial payment', async () => {
      const invoice = new Invoice({
        tenantId: new mongoose.Types.ObjectId(),
        agentId: new mongoose.Types.ObjectId(),
        bookingId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        invoiceNumber: 'TEST-003',
        dueDate: new Date(),
        status: 'sent',
        items: [
          { description: 'Item 1', quantity: 1, unitPrice: 100, amount: 100 }
        ],
        tax: 0,
        discount: 0
      });
      
      invoice.calculateTotals();
      const saved = await invoice.save();
      
      await saved.recordPayment(50);
      
      expect(saved.amountPaid).toBe(50);
      expect(saved.amountDue).toBe(50);
      expect(saved.status).toBe('partially_paid');
    });
    
    test('should update status to paid for full payment', async () => {
      const invoice = new Invoice({
        tenantId: new mongoose.Types.ObjectId(),
        agentId: new mongoose.Types.ObjectId(),
        bookingId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        invoiceNumber: 'TEST-004',
        dueDate: new Date(),
        status: 'sent',
        items: [
          { description: 'Item 1', quantity: 1, unitPrice: 100, amount: 100 }
        ],
        tax: 0,
        discount: 0
      });
      
      invoice.calculateTotals();
      const saved = await invoice.save();
      
      await saved.recordPayment(100);
      
      expect(saved.amountPaid).toBe(100);
      expect(saved.amountDue).toBe(0);
      expect(saved.status).toBe('paid');
      expect(saved.paidAt).toBeDefined();
    });
  });
  
  // Test status changes
  describe('Status Management', () => {
    test('markAsSent should update status and sentAt', async () => {
      const invoice = new Invoice({
        tenantId: new mongoose.Types.ObjectId(),
        agentId: new mongoose.Types.ObjectId(),
        bookingId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        invoiceNumber: 'TEST-005',
        dueDate: new Date(),
        status: 'draft',
        items: [
          { description: 'Item 1', quantity: 1, unitPrice: 100, amount: 100 }
        ]
      });
      
      const saved = await invoice.save();
      await saved.markAsSent();
      
      expect(saved.status).toBe('sent');
      expect(saved.sentAt).toBeDefined();
    });
    
    test('cancel should update status', async () => {
      const invoice = new Invoice({
        tenantId: new mongoose.Types.ObjectId(),
        agentId: new mongoose.Types.ObjectId(),
        bookingId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        invoiceNumber: 'TEST-006',
        dueDate: new Date(),
        status: 'sent',
        items: [
          { description: 'Item 1', quantity: 1, unitPrice: 100, amount: 100 }
        ]
      });
      
      const saved = await invoice.save();
      await saved.cancel();
      
      expect(saved.status).toBe('cancelled');
    });
  });
  
  // Test summary aggregation
  describe('getAgentInvoicesSummary', () => {
    test('should return correct summary with default values', async () => {
      const tenantId = new mongoose.Types.ObjectId();
      const agentId = new mongoose.Types.ObjectId();
      
      const summary = await Invoice.getAgentInvoicesSummary(tenantId, agentId);
      
      expect(summary).toHaveProperty('totalInvoices');
      expect(summary).toHaveProperty('totalAmount');
      expect(summary).toHaveProperty('totalPaid');
      expect(summary).toHaveProperty('totalDue');
      expect(summary).toHaveProperty('draftCount');
      expect(summary).toHaveProperty('sentCount');
      expect(summary).toHaveProperty('paidCount');
      expect(summary).toHaveProperty('overdueCount');
      
      // All should be 0 for new agent
      expect(summary.totalInvoices).toBe(0);
      expect(summary.totalAmount).toBe(0);
    });
  });
  
});

module.exports = {
  testInvoiceNumberGeneration: async (tenantId) => {
    return await Invoice.generateInvoiceNumber(tenantId);
  },
  
  testInvoiceCalculations: (items, tax, discount) => {
    const invoice = new Invoice({
      tenantId: new mongoose.Types.ObjectId(),
      agentId: new mongoose.Types.ObjectId(),
      bookingId: new mongoose.Types.ObjectId(),
      customerId: new mongoose.Types.ObjectId(),
      invoiceNumber: 'TEST',
      dueDate: new Date(),
      items,
      tax,
      discount
    });
    
    invoice.calculateTotals();
    
    return {
      subtotal: invoice.subtotal,
      total: invoice.total,
      amountDue: invoice.amountDue
    };
  }
};
