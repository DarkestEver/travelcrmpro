/**
 * Commission Service Test Suite
 * Tests for commission calculation and workflow integration
 */

const mongoose = require('mongoose');
const Commission = require('../src/models/Commission');
const Booking = require('../src/models/Booking');
const commissionService = require('../src/services/commissionService');

describe('Commission Service Tests', () => {
  
  // Test commission creation for booking
  describe('createCommissionForBooking', () => {
    test('should create commission when booking is completed', async () => {
      const tenantId = new mongoose.Types.ObjectId();
      const agentId = new mongoose.Types.ObjectId();
      
      const booking = await Booking.create({
        tenantId,
        agentId,
        customerId: new mongoose.Types.ObjectId(),
        bookingNumber: 'BK-TEST-001',
        destination: 'Test Destination',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: 1000,
        status: 'completed'
      });
      
      const commission = await commissionService.createCommissionForBooking(booking);
      
      expect(commission).toBeDefined();
      expect(commission.bookingId.toString()).toBe(booking._id.toString());
      expect(commission.bookingAmount).toBe(1000);
      expect(commission.status).toBe('pending');
    });
    
    test('should calculate correct commission amount', async () => {
      const booking = {
        _id: new mongoose.Types.ObjectId(),
        tenantId: new mongoose.Types.ObjectId(),
        agentId: new mongoose.Types.ObjectId(),
        totalPrice: 2000,
        status: 'completed'
      };
      
      // Assuming default commission rate is 10%
      const commission = await commissionService.createCommissionForBooking(booking);
      
      expect(commission.commissionAmount).toBe(200); // 10% of 2000
    });
  });
  
  // Test commission cancellation
  describe('cancelCommission', () => {
    test('should cancel commission when booking is cancelled', async () => {
      const commission = await Commission.create({
        tenantId: new mongoose.Types.ObjectId(),
        agentId: new mongoose.Types.ObjectId(),
        bookingId: new mongoose.Types.ObjectId(),
        bookingAmount: 1000,
        commissionRate: 10,
        commissionAmount: 100,
        status: 'pending'
      });
      
      await commissionService.cancelCommission(commission._id);
      
      const updated = await Commission.findById(commission._id);
      expect(updated.status).toBe('cancelled');
    });
    
    test('should not cancel already paid commission', async () => {
      const commission = await Commission.create({
        tenantId: new mongoose.Types.ObjectId(),
        agentId: new mongoose.Types.ObjectId(),
        bookingId: new mongoose.Types.ObjectId(),
        bookingAmount: 1000,
        commissionRate: 10,
        commissionAmount: 100,
        status: 'paid'
      });
      
      await expect(
        commissionService.cancelCommission(commission._id)
      ).rejects.toThrow();
    });
  });
  
  // Test commission recalculation
  describe('recalculateCommission', () => {
    test('should recalculate when booking amount changes', async () => {
      const commission = await Commission.create({
        tenantId: new mongoose.Types.ObjectId(),
        agentId: new mongoose.Types.ObjectId(),
        bookingId: new mongoose.Types.ObjectId(),
        bookingAmount: 1000,
        commissionRate: 10,
        commissionAmount: 100,
        status: 'pending'
      });
      
      const newBookingAmount = 1500;
      await commissionService.recalculateCommission(commission._id, newBookingAmount);
      
      const updated = await Commission.findById(commission._id);
      expect(updated.bookingAmount).toBe(1500);
      expect(updated.commissionAmount).toBe(150); // 10% of 1500
    });
  });
  
  // Test commission summary
  describe('getAgentCommissionSummary', () => {
    test('should calculate correct totals', async () => {
      const tenantId = new mongoose.Types.ObjectId();
      const agentId = new mongoose.Types.ObjectId();
      
      // Create test commissions
      await Commission.create([
        {
          tenantId,
          agentId,
          bookingId: new mongoose.Types.ObjectId(),
          bookingAmount: 1000,
          commissionRate: 10,
          commissionAmount: 100,
          status: 'pending'
        },
        {
          tenantId,
          agentId,
          bookingId: new mongoose.Types.ObjectId(),
          bookingAmount: 2000,
          commissionRate: 10,
          commissionAmount: 200,
          status: 'approved'
        },
        {
          tenantId,
          agentId,
          bookingId: new mongoose.Types.ObjectId(),
          bookingAmount: 1500,
          commissionRate: 10,
          commissionAmount: 150,
          status: 'paid'
        }
      ]);
      
      const summary = await Commission.getAgentTotalCommission(tenantId, agentId);
      
      expect(summary.total).toBe(450); // 100 + 200 + 150
      expect(summary.pending).toBe(100);
      expect(summary.approved).toBe(200);
      expect(summary.paid).toBe(150);
    });
  });
});

module.exports = {
  testCommissionCreation: async (booking) => {
    return await commissionService.createCommissionForBooking(booking);
  },
  
  testCommissionCancellation: async (commissionId) => {
    return await commissionService.cancelCommission(commissionId);
  },
  
  testCommissionRecalculation: async (commissionId, newAmount) => {
    return await commissionService.recalculateCommission(commissionId, newAmount);
  }
};
